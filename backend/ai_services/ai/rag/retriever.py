"""
TAZA AI Service - Retriever.

Builds a retrieval query from produce type + visual condition + storage
context, then searches the vector store, restricted to that produce's
knowledge (metadata pre-filter) since our KB is organized per-produce and
cross-produce results would just be noise.

Returns RetrievedEvidence objects that carry full source metadata forward -
this is what lets the final assessment cite real sources instead of
fabricating them.
"""
from dataclasses import dataclass
from typing import List, Optional

from ai.rag.embeddings import EmbeddingModel
from ai.rag.ingest import KnowledgeChunk
from ai.rag.vector_store import FAISSVectorStore


@dataclass
class RetrievedEvidence:
    chunk: KnowledgeChunk
    score: float


def build_retrieval_query(
    produce: str,
    visual_class: Optional[str] = None,
    temperature_c: Optional[float] = None,
    humidity_percent: Optional[float] = None,
    storage_type: Optional[str] = None,
    harvest_age_days: Optional[float] = None,
) -> str:
    """
    Constructs a natural-language query for semantic search, per the spec
    example: "banana postharvest shelf life storage temperature humidity ripe storage"
    """
    parts = [produce, "postharvest", "shelf life", "storage"]

    if visual_class:
        condition_word = "rotten" if "rotten" in visual_class.lower() or "stale" in visual_class.lower() else "fresh"
        parts.append(condition_word)

    if temperature_c is not None:
        parts.append("temperature")
        if temperature_c < 5:
            parts.append("chilling injury cold")
        elif temperature_c > 25:
            parts.append("warm ambient")

    if humidity_percent is not None:
        parts.append("humidity")
        if humidity_percent < 80:
            parts.append("low humidity moisture loss")

    if storage_type and storage_type != "unknown":
        parts.append(storage_type.replace("_", " "))

    if harvest_age_days is not None and harvest_age_days > 7:
        parts.append("aging storage duration")

    return " ".join(parts)


class Retriever:
    def __init__(self, vector_store: FAISSVectorStore, embedding_model: EmbeddingModel):
        self.vector_store = vector_store
        self.embedding_model = embedding_model

    def retrieve(
        self,
        produce: str,
        query: str,
        top_k: int = 5,
        min_score: float = 0.15,
    ) -> List[RetrievedEvidence]:
        """
        Retrieve top_k chunks for `produce`, filtered to that produce's KB
        partition, above a minimum relevance score. Returns [] (not
        fabricated results) if nothing sufficiently relevant is found -
        this is the mechanism that lets the assessment layer honestly
        report "no evidence retrieved".
        """
        query_embedding = self.embedding_model.embed_one(query)

        # Over-fetch then filter by produce + score, since FAISS doesn't
        # support metadata filtering natively in this simple flat-index setup.
        raw_results = self.vector_store.search(query_embedding, top_k=top_k * 4)

        filtered = [
            RetrievedEvidence(chunk=chunk, score=score)
            for chunk, score in raw_results
            if chunk.produce == produce and score >= min_score
        ]
        filtered.sort(key=lambda r: r.score, reverse=True)
        return filtered[:top_k]
