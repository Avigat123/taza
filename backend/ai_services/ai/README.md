# FreshFlow OS - AI Layer 2: RAG-Grounded Shelf-Life Assessment

Takes CV batch quality output + storage context, retrieves produce-specific
agricultural evidence, and produces a structured, uncertainty-aware
remaining-shelf-life and spoilage-risk assessment. **Does not make
SELL/DISCOUNT/REDISTRIBUTE/RESCUE decisions** - that's the next layer.

## Architecture

```
CV batch result + storage/context data
        |
        v
Pydantic input validation (ShelfLifeRequest) - rejects impossible values
        |
        v
Deterministic batch-condition classification (GOOD/MIXED/POOR)
   - computed from CV class_distribution, NOT left to the LLM to eyeball
        |
        v
Produce profile lookup (shelf_life/profiles/<produce>.yaml)
   - evidence-backed baseline ranges, not a universal formula
        |
        v
RAG retrieval (rag/retriever.py)
   - query built from produce + visual condition + storage params
   - FAISS similarity search, filtered to that produce's knowledge partition
   - returns [] (not fabricated evidence) if nothing sufficiently relevant
        |
        v
LLM reasoning (providers/*.py, swappable: ollama | gemini | glm)
   - sees ONLY: validated input + profile + retrieved evidence
   - system prompt forbids inventing numbers/sources, requires ranges,
     requires explicit "insufficient_data" when evidence is thin
        |
        v
Output parsing + Pydantic validation (retry once on failure)
   - malformed JSON or out-of-range values are rejected, never passed through
        |
        v
FastAPI JSON response (POST /assess-shelf-life)
```

## Setup

```bash
cd freshflow-ai
pip install -r ai/requirements.txt

cp ai/.env.example ai/.env
# edit ai/.env: set AI_PROVIDER and the relevant model/key

# Option A: Ollama (recommended - free, local, no API key)
ollama pull qwen2.5:7b   # or gemma2:9b, or another instruction-following local model

# Option B: Gemini free tier
# get a key at https://aistudio.google.com/apikey, put it in GEMINI_API_KEY

# Option C: GLM (Zhipu AI, free tier available)
# get a key at https://open.bigmodel.cn, put it in GLM_API_KEY
```

## Build the vector index (run once, and again after editing knowledge/*.md)

```bash
python -m ai.rag.build_index
```

This reads `ai/knowledge/<produce>/*.md`, chunks by heading, embeds with
`sentence-transformers/all-MiniLM-L6-v2`, and saves a FAISS index to
`ai/rag/index_store/`.

## Run the service

```bash
uvicorn ai.main:app --reload
# or: python -m ai.main
```

Then:

```bash
curl -X POST http://localhost:8000/assess-shelf-life \
  -H "Content-Type: application/json" \
  -d '{
    "produce": "banana",
    "batch_size_kg": 500,
    "cv_analysis": {
      "freshness_score": 82,
      "confidence": 0.94,
      "class_distribution": {"freshbanana": 0.8, "rottenbanana": 0.2}
    },
    "storage": {
      "harvest_age_days": 3,
      "temperature_c": 8,
      "humidity_percent": 72,
      "storage_duration_hours": 24
    }
  }'
```

Interactive docs at `http://localhost:8000/docs`.

## Run tests

```bash
pytest ai/tests/ -v
```

24 tests, all using a `MockProvider` - no live LLM or network call required,
fully deterministic. Covers: normal assessment, each missing-field case,
mixed-quality batch, high CV disagreement, invalid CV confidence/freshness
score/temperature/humidity/batch-size, invalid/malformed LLM JSON (with
retry), missing RAG evidence, conflicting RAG sources, and the
insufficient-data path.

## Knowledge base

```
ai/knowledge/
├── banana/{storage,ripening,spoilage,postharvest}.md
├── apple/{storage,ripening,spoilage}.md
└── orange/{storage,ripening,spoilage}.md
```

Each file has YAML frontmatter (`source`, `url`, `produce`, `topic`) that
travels with every chunk through retrieval into the LLM prompt and into the
final `evidence` array in the response - this is what makes citations real
instead of fabricated. Sources are university postharvest research centers
(primarily UC Davis Postharvest Research and Extension Center) and
established agricultural networks (TFNet), not scraped blogs.

**To add a new produce type** (e.g. tomato): add `ai/knowledge/tomato/*.md`
with the same frontmatter format, add `ai/shelf_life/profiles/tomato.yaml`,
add `"tomato"` to `SUPPORTED_PRODUCE` in `shelf_life/schema.py`, rerun
`build_index.py`. No other code changes needed.

## Design decisions worth knowing about

**Why the batch_condition is computed deterministically, not by the LLM:**
It's a computable fact from `class_distribution` (fraction of samples
classified rotten). Letting the LLM eyeball this risks inconsistent
thresholds between calls. The service computes it once
(`determine_batch_condition`) and **overwrites** whatever the LLM claims in
its JSON output - see `ShelfLifeService.assess`.

**Why RAG results are filtered by produce before scoring:** the knowledge
base is small (a few dozen chunks) and cleanly partitioned by produce type,
so a metadata pre-filter is simpler and more reliable than relying on
semantic similarity alone to avoid cross-produce contamination (e.g. an
orange query accidentally surfacing banana chilling-injury thresholds, which
are different).

**Why "insufficient_data" is enforced structurally, not just by prompt
instruction:** `ShelfLifeAssessment` has a Pydantic validator
(`validate_insufficient_data_consistency`) that rejects any LLM response
claiming `data_quality=INSUFFICIENT` while still providing a numeric shelf-life
estimate. Prompt instructions alone are not a hard guarantee against a model
hedging inconsistently - the schema is the actual enforcement point.

**Why retry-once instead of retry-forever:** per spec ("if parsing fails,
retry once; if it still fails, return an explicit error"). Silent infinite
retries would hide a systematically broken prompt/model pairing; failing
loud after one retry surfaces that problem instead.

**Why FAISS flat index instead of a heavier vector DB:** the knowledge base
is dozens-to-low-hundreds of chunks. `IndexFlatIP` (exact cosine similarity
search) is fast enough at this scale and avoids introducing infrastructure
(a running Chroma/Milvus/etc server) for a hackathon MVP where "runs on a
normal laptop with `pip install`" is a hard requirement.

**Why LangChain was NOT used:** the actual retrieval logic here is ~30 lines
(embed query, FAISS search, filter by metadata, sort by score) and the
provider abstraction is ~20 lines per provider. LangChain's abstractions
would add indirection without simplifying anything at this scale. If the
project later needs multi-step agentic tool orchestration (the next layer,
per the task description), that's a more legitimate point to reconsider it -
and even then, `providers/` is isolated behind `AIProvider` specifically so
this decision can be revisited without touching `shelf_life/` or `rag/`.

## What's honestly uncertain / limitations

- Produce profiles do not currently distinguish **cultivar** (e.g. Granny
  Smith vs Golden Delicious apples have meaningfully different chilling
  sensitivity and storage life) - the `apple.yaml` profile documents this
  gap explicitly (`confidence_notes`) rather than silently averaging over it.
- The knowledge base currently covers only banana/apple/orange (as scoped).
  Extending to tomato/potato/mango requires new curated `.md` files - the
  code does not fall back to generic/ungrounded reasoning for unsupported
  produce (`SUPPORTED_PRODUCE` rejects the request at the schema level
  instead).
- RAG retrieval quality depends on the embedding model. `all-MiniLM-L6-v2`
  is a reasonable default for this scale but has not been benchmarked
  against alternatives for this specific domain - if retrieval quality looks
  weak in practice, that's a legitimate place to iterate before blaming the
  LLM reasoning step.
