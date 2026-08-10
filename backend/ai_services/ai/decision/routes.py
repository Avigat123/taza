"""
FreshFlow OS - Layer 3 API routes.

Mirrors the style of ai/api/routes.py. Kept as its own APIRouter so it can
be mounted into the existing FastAPI app in ai/main.py with one added
import + include_router call (see integration notes / README).
"""
import logging

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from ai.agent.agent import run_agent
from ai.decision.engine import decide
from ai.decision.schema import (
    AgentDecisionResult,
    DecisionEngineError,
    DecisionRequest,
    DecisionResult,
)
from ai.providers import get_provider
from ai.providers.base import ProviderError

logger = logging.getLogger("freshflow.decision")

router = APIRouter()


@router.post(
    "/decision",
    response_model=DecisionResult,
    responses={422: {"model": DecisionEngineError}},
)
def post_decision(request: DecisionRequest):
    """
    Deterministic decision endpoint. No LLM involved - same input always
    produces the same output. Safe to call directly from Express/Node
    without any AI provider configured.
    """
    try:
        return decide(request)
    except Exception as e:  # noqa: BLE001 - convert any engine failure into a clean 422
        logger.exception("Decision engine failed")
        raise HTTPException(
            status_code=422,
            detail=DecisionEngineError(
                error="engine_error",
                detail=str(e),
                stage="engine",
            ).model_dump(),
        )


@router.post(
    "/decision/agent",
    response_model=AgentDecisionResult,
    responses={422: {"model": DecisionEngineError}, 502: {"model": DecisionEngineError}},
)
def post_decision_agent(request: DecisionRequest):
    """
    AI-agent-powered explanation endpoint. Runs the same deterministic
    engine as POST /decision, then asks the configured AI provider
    (reused from Layer 2's ai.providers.get_provider, AI_PROVIDER env var)
    to explain the result in operational language. The numeric result is
    identical to what POST /decision would return for the same input;
    only agent_explanation/agent_notes are added.
    """
    try:
        provider = get_provider()
    except ProviderError as e:
        raise HTTPException(
            status_code=502,
            detail=DecisionEngineError(
                error="provider_error",
                detail=str(e),
                stage="agent_call",
            ).model_dump(),
        )

    try:
        return run_agent(request, provider)
    except Exception as e:  # noqa: BLE001
        logger.exception("Agent pipeline failed")
        raise HTTPException(
            status_code=422,
            detail=DecisionEngineError(
                error="agent_error",
                detail=str(e),
                stage="engine",
            ).model_dump(),
        )
