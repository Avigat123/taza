"""
FreshFlow OS - Build the vector index from ai/knowledge/.

Run this once (and again whenever knowledge/*.md files change):
    python -m ai.rag.build_index
"""
import argparse

from ai.rag.embeddings import EmbeddingModel
from ai.rag.ingest import load_knowledge_base
from ai.rag.vector_store import FAISSVectorStore


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--knowledge-root", default="ai/knowledge")
    parser.add_argument("--output", default="ai/rag/index_store")
    args = parser.parse_args()

    print(f"Loading knowledge base from {args.knowledge_root}...")
    chunks = load_knowledge_base(args.knowledge_root)
    print(f"Loaded {len(chunks)} chunks")
    for c in chunks:
        print(f"  [{c.produce}/{c.topic}] {c.chunk_id} ({len(c.text)} chars)")

    if not chunks:
        raise SystemExit("No chunks found - check knowledge_root path")

    print("\nEmbedding chunks...")
    embedder = EmbeddingModel()
    texts = [c.text for c in chunks]
    embeddings = embedder.embed(texts)
    print(f"Embeddings shape: {embeddings.shape}")

    store = FAISSVectorStore(dim=embeddings.shape[1])
    store.add(embeddings, chunks)
    store.save(args.output)
    print(f"\nIndex saved to {args.output} ({store.index.ntotal} vectors)")


if __name__ == "__main__":
    main()
