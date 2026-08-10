"""
FreshFlow OS - Vector store (FAISS).

Kept intentionally simple: a flat FAISS index (exact search) is more than
sufficient for a knowledge base of dozens-to-low-hundreds of chunks. No need
for approximate-nearest-neighbor indexes at this scale - correctness and
simplicity matter more than the marginal speed a heavier vector DB would add.

Chunk metadata is stored alongside the index (parallel list) so retrieval
results always come back with full source attribution.
"""
import pickle
from pathlib import Path
from typing import List, Tuple

import numpy as np

from ai.rag.ingest import KnowledgeChunk


class FAISSVectorStore:
    def __init__(self, dim: int):
        import faiss
        self.dim = dim
        self.index = faiss.IndexFlatIP(dim)  # inner product on normalized vectors = cosine similarity
        self.chunks: List[KnowledgeChunk] = []

    def add(self, embeddings: np.ndarray, chunks: List[KnowledgeChunk]):
        if embeddings.shape[0] != len(chunks):
            raise ValueError("embeddings/chunks length mismatch")
        self.index.add(embeddings.astype(np.float32))
        self.chunks.extend(chunks)

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Tuple[KnowledgeChunk, float]]:
        if self.index.ntotal == 0:
            return []
        query = query_embedding.astype(np.float32).reshape(1, -1)
        scores, indices = self.index.search(query, min(top_k, self.index.ntotal))
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append((self.chunks[idx], float(score)))
        return results

    def save(self, path: str):
        import faiss
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(path / "index.faiss"))
        with open(path / "chunks.pkl", "wb") as f:
            pickle.dump(self.chunks, f)

    @classmethod
    def load(cls, path: str) -> "FAISSVectorStore":
        import faiss
        path = Path(path)
        index = faiss.read_index(str(path / "index.faiss"))
        with open(path / "chunks.pkl", "rb") as f:
            chunks = pickle.load(f)
        store = cls.__new__(cls)
        store.dim = index.d
        store.index = index
        store.chunks = chunks
        return store
