"""
TAZA AI Service - Knowledge ingestion.

Reads markdown files from ai/knowledge/<produce>/*.md, parses their YAML
frontmatter for source metadata, and chunks the body text. Each chunk
retains full source metadata so retrieval results are always traceable
back to a real document - never a fabricated citation.
"""
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

import yaml


@dataclass
class KnowledgeChunk:
    chunk_id: str
    text: str
    source: str
    title: str
    url: Optional[str]
    produce: str
    topic: str
    file_path: str


def _parse_frontmatter(raw: str) -> tuple[dict, str]:
    """Split '---\\nyaml\\n---\\nbody' into (metadata_dict, body_text)."""
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, re.DOTALL)
    if not match:
        return {}, raw
    fm_text, body = match.groups()
    try:
        meta = yaml.safe_load(fm_text) or {}
    except yaml.YAMLError:
        meta = {}
    return meta, body


def _chunk_by_headings(body: str, max_chunk_chars: int = 900) -> List[str]:
    """
    Split markdown body on '## ' headings first (natural semantic boundaries
    in our knowledge files), then further split any oversized section by
    paragraph so no chunk exceeds max_chunk_chars.
    """
    sections = re.split(r"\n(?=## )", body.strip())
    chunks = []
    for section in sections:
        section = section.strip()
        if not section:
            continue
        if len(section) <= max_chunk_chars:
            chunks.append(section)
        else:
            paragraphs = [p.strip() for p in section.split("\n\n") if p.strip()]
            buf = ""
            for p in paragraphs:
                if len(buf) + len(p) + 2 <= max_chunk_chars:
                    buf = f"{buf}\n\n{p}".strip()
                else:
                    if buf:
                        chunks.append(buf)
                    buf = p
            if buf:
                chunks.append(buf)
    return chunks if chunks else ([body.strip()] if body.strip() else [])


def load_knowledge_base(knowledge_root: str) -> List[KnowledgeChunk]:
    """
    Walk ai/knowledge/<produce>/*.md, parse frontmatter, chunk body text.
    Returns a flat list of KnowledgeChunk ready for embedding.
    """
    root = Path(knowledge_root)
    chunks: List[KnowledgeChunk] = []

    for md_file in sorted(root.glob("*/*.md")):
        produce_from_dir = md_file.parent.name
        raw = md_file.read_text(encoding="utf-8")
        meta, body = _parse_frontmatter(raw)

        # Title = first H1 in body, fallback to filename
        title_match = re.search(r"^#\s+(.+)$", body, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else md_file.stem

        source = meta.get("source", "Unknown source")
        url = meta.get("url")
        produce = meta.get("produce", produce_from_dir)
        topic = meta.get("topic", md_file.stem)

        body_chunks = _chunk_by_headings(body)
        for i, chunk_text in enumerate(body_chunks):
            chunks.append(KnowledgeChunk(
                chunk_id=f"{produce}:{topic}:{i}",
                text=chunk_text,
                source=source,
                title=title,
                url=url,
                produce=produce,
                topic=topic,
                file_path=str(md_file),
            ))

    return chunks


if __name__ == "__main__":
    import sys
    root = sys.argv[1] if len(sys.argv) > 1 else "ai/knowledge"
    chunks = load_knowledge_base(root)
    print(f"Loaded {len(chunks)} chunks from {root}")
    for c in chunks[:3]:
        print(f"\n--- {c.chunk_id} ---")
        print(f"source: {c.source}")
        print(f"title: {c.title}")
        print(f"text preview: {c.text[:150]}...")
