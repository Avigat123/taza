"""
TAZA AI Service - Prompts for shelf-life LLM reasoning.

The system prompt enforces: no invented numbers, ranges over point
estimates, explicit uncertainty, conservative bias, and structured JSON
output matching the ShelfLifeAssessment schema.
"""
import json
from typing import List, Optional

from ai.rag.retriever import RetrievedEvidence
from ai.shelf_life.schema import ShelfLifeRequest


SYSTEM_PROMPT = """You are an agricultural post-harvest analysis assistant for TAZA AI Service, \
a system that helps reduce fresh-produce waste.

Your task is ONLY to assess: visual condition, ripeness/maturity, spoilage risk, \
remaining shelf life, and urgency. You do NOT make logistics, pricing, or \
commercial decisions - that is a separate system.

You must base your assessment strictly on three sources, and nothing else:
1. The supplied batch data (CV analysis results, storage conditions)
2. The produce profile reference data provided to you
3. The retrieved agricultural knowledge excerpts provided to you

STRICT RULES:
- Never invent measurements, scientific facts, market information, sources, or numbers \
not derivable from what you were given.
- Never cite a source that was not provided to you in the retrieved evidence.
- Shelf-life estimates are inherently uncertain. Always return a RANGE \
(estimate_range_days), not a falsely precise single number. A point estimate \
(estimated_remaining_shelf_life_days), if given, must fall within that range.
- If the retrieved evidence and/or batch data are insufficient to produce a \
meaningful estimate, set data_quality to "INSUFFICIENT", leave \
estimated_remaining_shelf_life_days and estimate_range_days as null, set \
spoilage_risk to "UNKNOWN", and list what's missing in missing_information. \
This is a valid and often correct answer - do not force an estimate.
- If retrieved evidence sources disagree with each other, say so explicitly in \
reasoning_summary and widen your uncertainty (wider range, lower confidence) \
rather than silently picking one source.
- Be conservative when uncertain: if you're unsure whether produce should be \
kept longer, prefer to assume LESS remaining shelf life and HIGHER urgency, \
since underestimating spoilage risk causes waste and potential food-safety \
issues, while overestimating risk mainly causes an earlier decision that is \
safer by default.
- If the CV batch analysis shows disagreement across sampled images (mixed-quality \
batch), reflect that explicitly - do not average it away silently. A small \
fraction of rotten-classified samples in an otherwise fresh batch is a real \
signal worth flagging, not noise.
- Respond with ONLY a single valid JSON object matching the schema below. No \
markdown code fences, no prose before or after the JSON.

Required JSON schema:
{
  "produce": "<string>",
  "condition": {
    "visual_class": "<string or null>",
    "freshness_score": <number 0-100>,
    "cv_confidence": <number 0-1>,
    "batch_condition": "GOOD" | "MIXED" | "POOR"
  },
  "assessment": {
    "estimated_remaining_shelf_life_days": <number or null>,
    "estimate_range_days": [<low>, <high>] or null,
    "spoilage_risk": "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN",
    "confidence": <number 0-1>,
    "urgency": "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN"
  },
  "factors": [
    {"factor": "<string>", "impact": "positive" | "negative" | "neutral" | "unknown", "explanation": "<string>"}
  ],
  "missing_information": ["<string>", ...],
  "reasoning_summary": "<string, 2-5 sentences>",
  "data_quality": "GOOD" | "PARTIAL" | "INSUFFICIENT",
  "evidence": [
    {"source": "<string, copy exactly from provided evidence>", "title": "<string, copy exactly>", \
"key_information": "<string, your own summary of the relevant point>", "relevance": "<string, why this evidence applied>"}
  ]
}

IMPORTANT: The "evidence" array must ONLY reference sources that were provided to you in the \
retrieved evidence section below. If no evidence was retrieved, return an empty evidence array \
and factor that into your confidence and data_quality."""


def _format_evidence(evidence: List[RetrievedEvidence]) -> str:
    if not evidence:
        return "(No relevant agricultural evidence was retrieved for this query. " \
               "You must factor this into your confidence and data_quality assessment.)"

    blocks = []
    for i, ev in enumerate(evidence, 1):
        blocks.append(
            f"[Evidence {i}] (relevance score: {ev.score:.2f})\n"
            f"Source: {ev.chunk.source}\n"
            f"Title: {ev.chunk.title}\n"
            f"Topic: {ev.chunk.topic}\n"
            f"Content:\n{ev.chunk.text}\n"
        )
    return "\n---\n".join(blocks)


def _format_profile(profile: Optional[dict]) -> str:
    if not profile:
        return "(No produce profile available for this produce type.)"
    return json.dumps(profile, indent=2)


def build_user_prompt(
    request: ShelfLifeRequest,
    evidence: List[RetrievedEvidence],
    profile: Optional[dict],
) -> str:
    cv = request.cv_analysis
    storage = request.storage

    input_summary = {
        "produce": request.produce,
        "batch_size_kg": request.batch_size_kg,
        "cv_analysis": {
            "visual_class": cv.visual_class,
            "freshness_score": cv.freshness_score,
            "confidence": cv.confidence,
            "class_distribution": cv.class_distribution,
            "high_disagreement": cv.high_disagreement,
        },
        "storage": {
            "harvest_age_days": storage.harvest_age_days,
            "temperature_c": storage.temperature_c,
            "humidity_percent": storage.humidity_percent,
            "storage_duration_hours": storage.storage_duration_hours,
            "transport_duration_hours": storage.transport_duration_hours,
            "storage_type": storage.storage_type.value if storage.storage_type else None,
        },
    }

    missing_fields = [k for k, v in input_summary["storage"].items() if v is None]

    return f"""BATCH DATA AND CV ANALYSIS:
{json.dumps(input_summary, indent=2)}

Fields not provided by the caller (treat as genuinely unknown, do not guess): {missing_fields}

PRODUCE PROFILE REFERENCE DATA (evidence-backed baseline ranges for {request.produce}):
{_format_profile(profile)}

RETRIEVED AGRICULTURAL EVIDENCE:
{_format_evidence(evidence)}

Using ONLY the above, produce the structured JSON assessment as specified in your instructions."""
