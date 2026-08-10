"""
TAZA AI Service - API routes.
"""
import logging

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from ai.shelf_life.assessment import ShelfLifeService
from ai.shelf_life.schema import AssessmentError, ShelfLifeAssessment, ShelfLifeRequest

logger = logging.getLogger("taza.api")

router = APIRouter()

# Built once at import time (loads embedding model + FAISS index + provider).
# In a larger app this would be dependency-injected; kept simple for the MVP.
_service: ShelfLifeService = None


def get_service() -> ShelfLifeService:
    global _service
    if _service is None:
        _service = ShelfLifeService.build()
    return _service


@router.post(
    "/assess-shelf-life",
    response_model=ShelfLifeAssessment,
    responses={422: {"model": AssessmentError}, 502: {"model": AssessmentError}},
)
def assess_shelf_life(request: ShelfLifeRequest):
    service = get_service()
    result = service.assess(request)

    if isinstance(result, AssessmentError):
        status_code = 422 if result.stage in ("input_validation", "output_validation") else 502
        raise HTTPException(status_code=status_code, detail=result.model_dump())

    return result


@router.get("/health")
def health():
    service = get_service()
    return {
        "status": "ok",
        "provider": service.provider.provider_name,
        "retriever_loaded": service.retriever is not None,
    }
