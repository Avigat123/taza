"""
TAZA AI Service - Layer 3 AI operations agent.

Orchestration order (per spec, deterministic engine stays independent of
the LLM):

    DecisionRequest
        -> tools.get_batch_assessment / get_market_demand / get_routes
        -> tools.calculate_action_options (deterministic engine, ai.decision.engine.decide)
        -> tools.calculate_waste_avoided / calculate_recovered_value
        -> LLM (via ai.providers, same abstraction as Layer 2) explains the
           already-final numbers
        -> AgentDecisionResult (DecisionResult + agent_explanation/agent_notes)

The LLM call is wrapped in a try/except and validated with Pydantic-free
manual checks (only two keys expected); on any failure the agent still
returns a valid AgentDecisionResult with a fallback explanation built from
the engine's own `reasoning` field, rather than failing the whole request -
the deterministic numbers are always usable even if the LLM is unavailable.
"""
import json
import logging
from typing import Optional

from ai.decision.schema import AgentDecisionResult, DecisionRequest, DecisionResult
from ai.providers.base import AIProvider, ProviderError
from ai.agent import tools
from ai.agent.prompts import AGENT_SYSTEM_PROMPT, build_agent_user_prompt

logger = logging.getLogger("taza.agent")


def _parse_agent_output(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()
    data = json.loads(cleaned)
    if "agent_explanation" not in data or not isinstance(data["agent_explanation"], str):
        raise ValueError("agent output missing string 'agent_explanation'")
    notes = data.get("agent_notes", [])
    if not isinstance(notes, list):
        raise ValueError("agent output 'agent_notes' must be a list")
    return {"agent_explanation": data["agent_explanation"], "agent_notes": [str(n) for n in notes]}


def _fallback_explanation(decision_result: DecisionResult) -> dict:
    notes = []
    if decision_result.missing_information:
        notes.append(
            "LLM explanation unavailable; missing information reported by the engine: "
            + "; ".join(decision_result.missing_information)
        )
    return {"agent_explanation": decision_result.reasoning, "agent_notes": notes}


def run_agent(request: DecisionRequest, provider: AIProvider) -> AgentDecisionResult:
    """
    Runs the full Layer 3 agent pipeline. `provider` should come from
    ai.providers.get_provider() (or a MockProvider in tests) - this
    function never constructs its own provider, so callers/tests control
    which one is used.
    """
    # ---- Step 1-3: gather grounded data via tools (no LLM yet) ----
    _ = tools.get_batch_assessment(request)
    _ = tools.get_market_demand(request)
    _ = tools.get_routes(request)

    # ---- Step 4: deterministic engine (source of truth for all numbers) ----
    decision_result: DecisionResult = tools.calculate_action_options(request)

    # ---- Step 5: derived figures already computed by the engine, exposed via tools ----
    _ = tools.calculate_waste_avoided(decision_result)
    _ = tools.calculate_recovered_value(decision_result)

    decision_dict = decision_result.model_dump(mode="json")

    # ---- Step 6: LLM explains the (already final) numbers ----
    agent_provider_name: Optional[str] = None
    agent_model_name: Optional[str] = None
    try:
        response = provider.generate_json(
            AGENT_SYSTEM_PROMPT,
            build_agent_user_prompt(decision_dict),
        )
        parsed = _parse_agent_output(response.raw_text)
        agent_provider_name = response.provider_name
        agent_model_name = response.model_name
    except (ProviderError, json.JSONDecodeError, ValueError) as e:
        logger.warning(f"Agent LLM explanation failed, falling back to engine reasoning: {e}")
        parsed = _fallback_explanation(decision_result)

    return AgentDecisionResult(
        **decision_result.model_dump(),
        agent_explanation=parsed["agent_explanation"],
        agent_notes=parsed["agent_notes"],
        agent_provider=agent_provider_name,
        agent_model=agent_model_name,
    )
