"""
FreshFlow OS - AI service entrypoint.

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
from ai.decision.routes import router as decision_router
logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="FreshFlow OS - AI Shelf-Life Service",
    description="Layer 2: batch quality -> RAG-grounded shelf-life & spoilage-risk assessment",
    version="0.1.0",
)

app.include_router(router)
app.include_router(decision_router)

@app.get("/")
def root():
    return {
        "service": "FreshFlow OS AI Shelf-Life Service",
        "endpoints": ["/assess-shelf-life (POST)", "/health (GET)", "/docs"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai.main:app", host="0.0.0.0", port=8000, reload=True)
