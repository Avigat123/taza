"""
TAZA AI Service - AI service entrypoint.

Run with:
uvicorn ai.main:app --reload
or:
python -m ai.main
"""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

# --------------------------------------------------
# Load ai/.env BEFORE importing application modules
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE, override=True)

print(">>> ENV FILE:", ENV_FILE)
print(">>> AI_PROVIDER:", os.getenv("AI_PROVIDER"))
print(">>> GEMINI KEY PRESENT:", bool(os.getenv("GEMINI_API_KEY")))

# --------------------------------------------------
# Now import application modules
# --------------------------------------------------

from fastapi import FastAPI
from ai.api.routes import router
from ai.api.analyze import router as analyze_router
from ai.decision.routes import router as decision_router
logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="TAZA AI Service",
    description=(
        "Layer 1: CV freshness classification | "
        "Layer 2: RAG-grounded shelf-life & spoilage-risk assessment | "
        "Layer 3: deterministic decision engine + optional AI explanation"
    ),
    version="0.1.0",
)

app.include_router(router)
app.include_router(analyze_router)
app.include_router(decision_router)

@app.get("/")
def root():
    return {
        "service": "TAZA AI Service",
        "endpoints": [
            "/analyze-batch (POST) - full pipeline: CV -> shelf life -> decision",
            "/assess-shelf-life (POST) - Layer 2 only",
            "/decision (POST) - Layer 3 deterministic",
            "/decision/agent (POST) - Layer 3 + AI explanation",
            "/health (GET)",
            "/docs",
        ],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai.main:app", host="0.0.0.0", port=8000, reload=True)
