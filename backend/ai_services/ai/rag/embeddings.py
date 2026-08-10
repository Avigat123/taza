"""
TAZA AI Service - Embeddings.

Thin wrapper around sentence-transformers so the rest of the RAG layer
doesn't depend on a specific embedding library directly (swap model here
if needed without touching vector_store.py or retriever.py).

Default model: all-MiniLM-L6-v2 - small (~80MB), fast on CPU, good enough
quality for a hackathon-scale knowledge base of a few dozen chunks.
"""
import os
from typing import List

import numpy as np


class EmbeddingModel:
    def __init__(self, model_name: str = None):
        self.model_name = model_name or os.environ.get(
            "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
        )
        self._model = None  # lazy-loaded, sentence-transformers import is slow

    def _load(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def embed(self, texts: List[str]) -> np.ndarray:
        model = self._load()
        embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings

    def embed_one(self, text: str) -> np.ndarray:
        return self.embed([text])[0]
