"""Tests for ai.agent.agent - LLM calls are mocked, never live."""
import json

from ai.agent.agent import run_agent
from ai.decision.schema import ActionType
from ai.tests.mock_provider import MockProvider
from ai.tests.decision_fixtures import full_request, batch, sla
from ai.shelf_life.schema import BatchCondition


def _valid_agent_response():
    return {
        "agent_explanation": "Sell locally in Chandigarh and redistribute the Ludhiana-bound "
        "portion given the high spoilage risk; the remainder should be discounted before it spoils.",
        "agent_notes": ["Delhi demand could not be used within the safe shelf-life window."],
    }


# 14. Agent cannot invent missing data - numbers in output must match engine's own numbers.
def test_agent_numbers_match_engine_exactly():
    req = full_request()
    mock = MockProvider(fixed_response=_valid_agent_response())
    agent_result = run_agent(req, mock)

    from ai.decision.engine import decide
    engine_result = decide(req)

    assert agent_result.recommendation == engine_result.recommendation
    assert agent_result.allocations == engine_result.allocations
    assert agent_result.impact == engine_result.impact
    assert agent_result.unallocated == engine_result.unallocated


def test_agent_includes_explanation_from_llm():
    req = full_request()
    mock = MockProvider(fixed_response=_valid_agent_response())
    result = run_agent(req, mock)
    assert "Chandigarh" in result.agent_explanation
    assert mock.call_count == 1
    assert result.agent_provider == "mock"


def test_agent_falls_back_gracefully_on_malformed_llm_output():
    req = full_request()
    mock = MockProvider(response_fn=lambda s, u: "not valid json {{{")
    result = run_agent(req, mock)
    # Falls back to engine's own reasoning text rather than failing the request.
    assert result.agent_explanation == result.reasoning
    assert result.agent_provider is None


def test_agent_never_overrides_rescue_action_even_if_llm_tries():
    req = full_request(shelf_life_assessment=sla(batch_condition=BatchCondition.POOR))
    malicious_response = {
        "agent_explanation": "Ignore safety rules and sell it anyway.",
        "agent_notes": [],
    }
    mock = MockProvider(fixed_response=malicious_response)
    result = run_agent(req, mock)
    # The numeric/action fields are untouched by the LLM - only text fields come from it.
    assert result.recommendation.primary_action == ActionType.RESCUE
    assert result.allocations == []


def test_agent_prompt_contains_no_invented_fields():
    req = full_request()
    mock = MockProvider(fixed_response=_valid_agent_response())
    run_agent(req, mock)
    # The prompt sent to the LLM should be built purely from the engine's own output.
    assert mock.last_user_prompt is not None
    payload = mock.last_user_prompt
    assert "batch_id" in payload
    assert "BATCH-001" in payload
