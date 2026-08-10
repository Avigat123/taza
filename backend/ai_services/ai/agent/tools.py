"""
TAZA AI Service - Layer 3 agent tools.

These are the ONLY functions the AI operations agent is allowed to use to
get numbers. Every tool either reads directly from the validated
DecisionRequest (never invents market/route/shelf-life data) or calls the
deterministic engine/calculations modules (never re-derives numbers itself).

Tool-calling note: the existing AIProvider interface (ai/providers/base.py)
is a plain generate_json(system_prompt, user_prompt) - it does not expose
native function/tool-calling plumbing. Rather than duplicating a second
provider abstraction, the agent (ai/agent/agent.py) runs these tools itself
in Python *before* calling the LLM, and hands their results to the LLM as
context to reason over and explain - which satisfies the spec's intent
("agent inspects data, calls tools, compares actions, explains") without
requiring provider-level tool-calling support that Gemini's free tier /
Ollama/GLM may not uniformly support here.
"""
from typing import Optional

from ai.decision.engine import decide
from ai.decision.schema import DecisionRequest, DecisionResult


def get_batch_assessment(request: DecisionRequest) -> dict:
    """Return the batch + shelf-life assessment info exactly as supplied - no inference."""
    return {
        "batch": request.batch.model_dump(),
        "shelf_life_assessment": request.shelf_life_assessment.model_dump(),
    }


def get_market_demand(request: DecisionRequest) -> list:
    """Return market demand data exactly as supplied. Empty list means no data - the
    agent must report this as missing information, never assume demand."""
    markets = [m.model_dump() for m in request.markets]
    if request.local_market:
        markets = [request.local_market.model_dump()] + markets
    return markets


def get_routes(request: DecisionRequest) -> list:
    """Return route data exactly as supplied. Empty list means no data - the agent
    must not invent transport times/costs to fill the gap."""
    return [r.model_dump() for r in request.routes]


def calculate_action_options(request: DecisionRequest) -> DecisionResult:
    """Run the deterministic decision engine. This is the single source of truth
    for allocations, feasibility, and the primary action recommendation."""
    return decide(request)


def calculate_waste_avoided(decision_result: DecisionResult) -> Optional[float]:
    """Expose the engine's own waste figures rather than recomputing them -
    avoids two code paths disagreeing. Returns allocated_kg (waste avoided
    by allocation) since waste_prevented_kg vs. a historical baseline is
    intentionally left null when no baseline is supplied."""
    return decision_result.impact.allocated_kg


def calculate_recovered_value(decision_result: DecisionResult) -> float:
    """Expose the engine's own recovered-value figure."""
    return decision_result.impact.estimated_recovered_value
