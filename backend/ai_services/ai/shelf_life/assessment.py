"""
TAZA AI Service - Shelf-life assessment orchestration.

This is the service layer that wires everything together:
  input validation -> batch condition reasoning -> produce profile lookup ->
  RAG retrieval -> LLM call -> output parsing/validation (retry once) ->
  final structured result.

The LLM never sees raw batch data without evidence, and its output never
reaches the caller without passing Pydantic validation.
"""
import json
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Union

import yaml
from pydantic import ValidationError

from ai.providers import get_provider
from ai.providers.base import AIProvider, ProviderError
from ai.rag.embeddings import EmbeddingModel
from ai.rag.retriever import Retriever, build_retrieval_query
from ai.rag.vector_store import FAISSVectorStore
from ai.shelf_life.prompts import SYSTEM_PROMPT, build_user_prompt
from ai.shelf_life.schema import (
    AssessmentError,
    BatchCondition,
    ShelfLifeAssessment,
    ShelfLifeRequest,
)

logger = logging.getLogger("taza.shelf_life")


PROFILES_DIR = Path(__file__).parent / "profiles"


def _load_produce_profile(produce: str) -> Optional[dict]:
    profile_path = PROFILES_DIR / f"{produce}.yaml"
    if not profile_path.exists():
        return None
    with open(profile_path) as f:
        return yaml.safe_load(f)


def determine_batch_condition(request: ShelfLifeRequest) -> BatchCondition:
    """
    Deterministic (non-LLM) batch condition classification from CV class
    distribution - per spec, this must not be left to the LLM to eyeball,
    since it's a computable fact from the CV output.

    Logic:
      - No disagreement (single dominant class, no meaningful rotten fraction) -> GOOD
      - Explicit high_disagreement flag from CV layer, or a meaningful but
        minority rotten fraction -> MIXED
      - Majority of samples rotten -> POOR
    """
    cv = request.cv_analysis
    dist = cv.class_distribution

    if dist:
        rotten_fraction = sum(
            frac for cls_name, frac in dist.items()
            if any(k in cls_name.lower() for k in ["rotten", "stale", "spoiled"])
        )
    else:
        rotten_fraction = None

    if rotten_fraction is None:
        # No class distribution available - fall back to whatever
        # high_disagreement flag says, default GOOD if unset.
        return BatchCondition.MIXED if cv.high_disagreement else BatchCondition.GOOD

    if cv.high_disagreement or (0.0 < rotten_fraction < 0.5):
        return BatchCondition.MIXED
    if rotten_fraction >= 0.5:
        return BatchCondition.POOR
    return BatchCondition.GOOD


@dataclass
class ShelfLifeService:
    provider: AIProvider
    retriever: Optional[Retriever]
    max_retries: int = 1

    @classmethod
    def build(cls, index_store_path: str = "ai/rag/index_store", provider_name: str = None) -> "ShelfLifeService":
        provider = get_provider(provider_name)

        retriever = None
        try:
            store = FAISSVectorStore.load(index_store_path)
            embedder = EmbeddingModel()
            retriever = Retriever(store, embedder)
            logger.info(f"Loaded vector store from {index_store_path} ({store.index.ntotal} chunks)")
        except Exception as e:
            logger.warning(
                f"Could not load vector store from {index_store_path}: {e}. "
                "Assessments will proceed with NO retrieved evidence until "
                "`python -m ai.rag.build_index` is run."
            )

        return cls(provider=provider, retriever=retriever)

    def _parse_and_validate(self, raw_text: str) -> ShelfLifeAssessment:
        cleaned = raw_text.strip()
        # defensive strip of markdown code fences, in case a provider adds them
        # despite instructions not to
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()

        data = json.loads(cleaned)  # raises json.JSONDecodeError on failure
        return ShelfLifeAssessment.model_validate(data)  # raises ValidationError on failure

    def assess(self, request: ShelfLifeRequest) -> Union[ShelfLifeAssessment, AssessmentError]:
        t_start = time.time()

        # ---- Deterministic batch condition (not LLM-derived) ----
        batch_condition = determine_batch_condition(request)

        # ---- Produce profile ----
        profile = _load_produce_profile(request.produce)
        if profile is None:
            logger.warning(f"No produce profile found for '{request.produce}'")

        # ---- RAG retrieval ----
        evidence = []
        retrieval_query = build_retrieval_query(
            produce=request.produce,
            visual_class=request.cv_analysis.visual_class,
            temperature_c=request.storage.temperature_c,
            humidity_percent=request.storage.humidity_percent,
            storage_type=request.storage.storage_type.value if request.storage.storage_type else None,
            harvest_age_days=request.storage.harvest_age_days,
        )
        if self.retriever is not None:
            try:
                evidence = self.retriever.retrieve(produce=request.produce, query=retrieval_query, top_k=5)
            except Exception as e:
                logger.error(f"Retrieval failed: {e}")
        else:
            logger.warning("No retriever available; proceeding with zero evidence.")

        logger.info(
            f"Retrieval query: '{retrieval_query}' -> {len(evidence)} chunks "
            f"[{', '.join(e.chunk.chunk_id for e in evidence)}]"
        )

        # ---- LLM call with one retry on parse/validation failure ----
        system_prompt = SYSTEM_PROMPT
        user_prompt = build_user_prompt(request, evidence, profile)

        last_error = None
        for attempt in range(self.max_retries + 1):
            try:
                response = self.provider.generate_json(system_prompt, user_prompt)
            except ProviderError as e:
                logger.error(f"Provider call failed (attempt {attempt+1}): {e}")
                return AssessmentError(
                    error="provider_error",
                    detail=str(e),
                    stage="llm_call",
                )

            try:
                assessment = self._parse_and_validate(response.raw_text)
                assessment.generated_at = datetime.now(timezone.utc)
                assessment.ai_provider = response.provider_name
                assessment.ai_model = response.model_name

                # Ensure batch_condition reflects our deterministic computation,
                # not whatever the LLM guessed - overwrite defensively.
                assessment.condition.batch_condition = batch_condition

                total_latency = time.time() - t_start
                logger.info(
                    f"Assessment succeeded: produce={request.produce} "
                    f"provider={response.provider_name} model={response.model_name} "
                    f"latency={total_latency:.2f}s retrieved_sources={len(evidence)} "
                    f"data_quality={assessment.data_quality}"
                )
                return assessment

            except (json.JSONDecodeError, ValidationError) as e:
                last_error = e
                logger.warning(f"Output validation failed (attempt {attempt+1}/{self.max_retries+1}): {e}")
                continue

        logger.error(f"Output validation failed after all retries: {last_error}")
        return AssessmentError(
            error="output_validation_failed",
            detail=str(last_error),
            stage="output_validation",
        )
