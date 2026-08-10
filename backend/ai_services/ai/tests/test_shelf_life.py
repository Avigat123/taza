"""
FreshFlow OS - Shelf-life layer tests.

Covers the 12 required scenarios:
 1. Normal banana assessment
 2. Missing temperature
 3. Missing age
 4. Missing humidity
 5. Mixed-quality batch
 6. High CV disagreement
 7. Invalid CV confidence
 8. Invalid freshness score
 9. Invalid LLM JSON
 10. Missing RAG evidence
 11. Conflicting RAG sources
 12. Insufficient evidence

Uses MockProvider throughout - no live LLM or network calls required to run
this suite, which keeps it fast and deterministic.
"""
import copy

import pytest
from pydantic import ValidationError

from ai.rag.ingest import KnowledgeChunk
from ai.rag.retriever import RetrievedEvidence
from ai.shelf_life.assessment import ShelfLifeService, determine_batch_condition
from ai.shelf_life.schema import (
    AssessmentError,
    BatchCondition,
    CVAnalysis,
    ShelfLifeRequest,
)
from ai.tests.fixtures import (
    INSUFFICIENT_DATA_RESPONSE,
    VALID_BANANA_ASSESSMENT_RESPONSE,
    sample_request,
)
from ai.tests.mock_provider import MockProvider


def make_service(provider, retriever=None):
    return ShelfLifeService(provider=provider, retriever=retriever, max_retries=1)


def make_evidence(produce="banana", n=1, score=0.5):
    out = []
    for i in range(n):
        chunk = KnowledgeChunk(
            chunk_id=f"{produce}:test:{i}",
            text=f"Test evidence chunk {i} for {produce}.",
            source=f"Test Source {i}",
            title=f"Test Title {i}",
            url=None,
            produce=produce,
            topic="test",
            file_path="test.md",
        )
        out.append(RetrievedEvidence(chunk=chunk, score=score))
    return out


# ---------------------------------------------------------------------------
# 1. Normal banana assessment
# ---------------------------------------------------------------------------

def test_normal_banana_assessment():
    provider = MockProvider(fixed_response=VALID_BANANA_ASSESSMENT_RESPONSE)
    service = make_service(provider)
    request = ShelfLifeRequest.model_validate(sample_request())

    result = service.assess(request)

    assert not isinstance(result, AssessmentError)
    assert result.produce == "banana"
    assert result.assessment.estimate_range_days == [1.8, 3.2]
    assert result.data_quality.value == "GOOD"
    assert result.ai_provider == "mock"
    assert len(result.evidence) == 1
    assert provider.call_count == 1


# ---------------------------------------------------------------------------
# 2-4. Missing fields (temperature / age / humidity)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("missing_field", ["temperature_c", "harvest_age_days", "humidity_percent"])
def test_missing_storage_field_is_tracked_not_guessed(missing_field):
    provider = MockProvider(fixed_response=VALID_BANANA_ASSESSMENT_RESPONSE)
    service = make_service(provider)

    req_dict = sample_request()
    req_dict["storage"][missing_field] = None
    request = ShelfLifeRequest.model_validate(req_dict)

    # Confirm the field really is None on the validated request (Pydantic didn't invent a default)
    assert getattr(request.storage, missing_field) is None

    result = service.assess(request)
    assert not isinstance(result, AssessmentError)

    # The user prompt sent to the LLM must explicitly list this field as missing,
    # proving we don't silently drop the gap.
    assert missing_field in provider.last_user_prompt


# ---------------------------------------------------------------------------
# 5. Mixed-quality batch
# ---------------------------------------------------------------------------

def test_mixed_quality_batch_flagged():
    req_dict = sample_request()
    req_dict["cv_analysis"]["class_distribution"] = {"freshbanana": 0.6, "rottenbanana": 0.4}
    req_dict["cv_analysis"]["high_disagreement"] = False
    request = ShelfLifeRequest.model_validate(req_dict)

    condition = determine_batch_condition(request)
    assert condition == BatchCondition.MIXED


def test_batch_condition_overrides_llm_claim():
    """Even if the LLM claims GOOD, our deterministic computation wins."""
    llm_response = copy.deepcopy(VALID_BANANA_ASSESSMENT_RESPONSE)
    llm_response["condition"]["batch_condition"] = "GOOD"  # LLM says GOOD

    provider = MockProvider(fixed_response=llm_response)
    service = make_service(provider)

    req_dict = sample_request()
    req_dict["cv_analysis"]["class_distribution"] = {"freshbanana": 0.6, "rottenbanana": 0.4}  # actually MIXED
    request = ShelfLifeRequest.model_validate(req_dict)

    result = service.assess(request)
    assert not isinstance(result, AssessmentError)
    assert result.condition.batch_condition.value == "MIXED"  # overridden, not LLM's GOOD


# ---------------------------------------------------------------------------
# 6. High CV disagreement
# ---------------------------------------------------------------------------

def test_high_disagreement_flag_forces_mixed():
    req_dict = sample_request()
    req_dict["cv_analysis"]["class_distribution"] = {"freshbanana": 0.9, "rottenbanana": 0.1}
    req_dict["cv_analysis"]["high_disagreement"] = True
    request = ShelfLifeRequest.model_validate(req_dict)

    condition = determine_batch_condition(request)
    assert condition == BatchCondition.MIXED


# ---------------------------------------------------------------------------
# 7. Invalid CV confidence
# ---------------------------------------------------------------------------

def test_invalid_cv_confidence_rejected():
    req_dict = sample_request()
    req_dict["cv_analysis"]["confidence"] = -0.2
    with pytest.raises(ValidationError):
        ShelfLifeRequest.model_validate(req_dict)


def test_cv_confidence_above_one_rejected():
    req_dict = sample_request()
    req_dict["cv_analysis"]["confidence"] = 1.5
    with pytest.raises(ValidationError):
        ShelfLifeRequest.model_validate(req_dict)


# ---------------------------------------------------------------------------
# 8. Invalid freshness score
# ---------------------------------------------------------------------------

def test_invalid_freshness_score_rejected():
    req_dict = sample_request()
    req_dict["cv_analysis"]["freshness_score"] = 150
    with pytest.raises(ValidationError):
        ShelfLifeRequest.model_validate(req_dict)


def test_negative_freshness_score_rejected():
    req_dict = sample_request()
    req_dict["cv_analysis"]["freshness_score"] = -5
    with pytest.raises(ValidationError):
        ShelfLifeRequest.model_validate(req_dict)


def test_other_impossible_values_rejected():
    # temperature = -999
    req = sample_request()
    req["storage"]["temperature_c"] = -999
    with pytest.raises(ValidationError):
        ShelfLifeRequest.model_validate(req)

    # humidity = 500
    req = sample_request()
    req["storage"]["humidity_percent"] = 500
    with pytest.raises(ValidationError):
        ShelfLifeRequest.model_validate(req)

    # batch_size negative
    req = sample_request()
    req["batch_size_kg"] = -100
    with pytest.raises(ValidationError):
        ShelfLifeRequest.model_validate(req)


# ---------------------------------------------------------------------------
# 9. Invalid LLM JSON
# ---------------------------------------------------------------------------

def test_invalid_llm_json_returns_error_after_retry():
    provider = MockProvider(response_fn=lambda s, u: "this is not valid json {{{")
    service = make_service(provider)
    request = ShelfLifeRequest.model_validate(sample_request())

    result = service.assess(request)

    assert isinstance(result, AssessmentError)
    assert result.stage == "output_validation"
    assert provider.call_count == 2  # initial + 1 retry


def test_llm_json_missing_required_field_rejected():
    bad_response = copy.deepcopy(VALID_BANANA_ASSESSMENT_RESPONSE)
    del bad_response["reasoning_summary"]  # required field

    provider = MockProvider(fixed_response=bad_response)
    service = make_service(provider)
    request = ShelfLifeRequest.model_validate(sample_request())

    result = service.assess(request)
    assert isinstance(result, AssessmentError)
    assert result.stage == "output_validation"


def test_llm_range_low_greater_than_high_rejected():
    bad_response = copy.deepcopy(VALID_BANANA_ASSESSMENT_RESPONSE)
    bad_response["assessment"]["estimate_range_days"] = [5.0, 1.0]  # low > high

    provider = MockProvider(fixed_response=bad_response)
    service = make_service(provider)
    request = ShelfLifeRequest.model_validate(sample_request())

    result = service.assess(request)
    assert isinstance(result, AssessmentError)


def test_llm_contradictory_insufficient_data_rejected():
    """LLM says INSUFFICIENT but still provides a number - must be rejected."""
    bad_response = copy.deepcopy(INSUFFICIENT_DATA_RESPONSE)
    bad_response["assessment"]["estimated_remaining_shelf_life_days"] = 3.0  # contradiction

    provider = MockProvider(fixed_response=bad_response)
    service = make_service(provider)
    request = ShelfLifeRequest.model_validate(sample_request())

    result = service.assess(request)
    assert isinstance(result, AssessmentError)


def test_llm_recovers_on_retry():
    """First call returns garbage, second call (retry) returns valid JSON."""
    responses = iter(["not json", None])  # second value unused; response_fn below handles it

    call_log = []

    def response_fn(system_prompt, user_prompt):
        call_log.append(1)
        if len(call_log) == 1:
            return "not valid json"
        import json
        return json.dumps(VALID_BANANA_ASSESSMENT_RESPONSE)

    provider = MockProvider(response_fn=response_fn)
    service = make_service(provider)
    request = ShelfLifeRequest.model_validate(sample_request())

    result = service.assess(request)
    assert not isinstance(result, AssessmentError)
    assert provider.call_count == 2


# ---------------------------------------------------------------------------
# 10. Missing RAG evidence (no retriever configured / nothing retrieved)
# ---------------------------------------------------------------------------

def test_no_retriever_configured_still_produces_result_with_empty_evidence():
    provider = MockProvider(fixed_response=VALID_BANANA_ASSESSMENT_RESPONSE)
    service = make_service(provider, retriever=None)
    request = ShelfLifeRequest.model_validate(sample_request())

    result = service.assess(request)
    assert not isinstance(result, AssessmentError)
    # prompt should explicitly say no evidence was retrieved
    assert "No relevant agricultural evidence was retrieved" in provider.last_user_prompt


class _EmptyRetriever:
    def retrieve(self, produce, query, top_k=5, min_score=0.15):
        return []


def test_retriever_returns_empty_list_reflected_in_prompt():
    provider = MockProvider(fixed_response=INSUFFICIENT_DATA_RESPONSE)
    service = make_service(provider, retriever=_EmptyRetriever())
    request = ShelfLifeRequest.model_validate(sample_request())

    result = service.assess(request)
    assert not isinstance(result, AssessmentError)
    assert "No relevant agricultural evidence was retrieved" in provider.last_user_prompt
    assert result.data_quality.value == "INSUFFICIENT"


# ---------------------------------------------------------------------------
# 11. Conflicting RAG sources
# ---------------------------------------------------------------------------

class _ConflictingRetriever:
    """Returns two chunks with contradictory storage temperature guidance."""
    def retrieve(self, produce, query, top_k=5, min_score=0.15):
        chunk_a = KnowledgeChunk(
            chunk_id="banana:storage:0", text="Store bananas at 13-14C.",
            source="Source A", title="Banana Storage A", url=None,
            produce="banana", topic="storage", file_path="a.md",
        )
        chunk_b = KnowledgeChunk(
            chunk_id="banana:storage:1", text="Store bananas at 4-6C for maximum firmness.",
            source="Source B", title="Banana Storage B", url=None,
            produce="banana", topic="storage", file_path="b.md",
        )
        return [RetrievedEvidence(chunk=chunk_a, score=0.6), RetrievedEvidence(chunk=chunk_b, score=0.55)]


def test_conflicting_sources_both_passed_to_llm():
    provider = MockProvider(fixed_response=VALID_BANANA_ASSESSMENT_RESPONSE)
    service = make_service(provider, retriever=_ConflictingRetriever())
    request = ShelfLifeRequest.model_validate(sample_request())

    result = service.assess(request)
    assert not isinstance(result, AssessmentError)
    # both conflicting chunks must appear in what the LLM saw, so it can
    # reason about / report the disagreement itself
    assert "Source A" in provider.last_user_prompt
    assert "Source B" in provider.last_user_prompt
    assert "13-14C" in provider.last_user_prompt
    assert "4-6C" in provider.last_user_prompt


# ---------------------------------------------------------------------------
# 12. Insufficient evidence -> insufficient_data response
# ---------------------------------------------------------------------------

def test_insufficient_evidence_produces_insufficient_data_response():
    provider = MockProvider(fixed_response=INSUFFICIENT_DATA_RESPONSE)
    service = make_service(provider, retriever=_EmptyRetriever())

    req_dict = sample_request()
    req_dict["storage"] = {}  # nothing provided at all
    request = ShelfLifeRequest.model_validate(req_dict)

    result = service.assess(request)
    assert not isinstance(result, AssessmentError)
    assert result.data_quality.value == "INSUFFICIENT"
    assert result.assessment.estimated_remaining_shelf_life_days is None
    assert result.assessment.estimate_range_days is None
    assert result.assessment.spoilage_risk.value == "UNKNOWN"
    assert len(result.missing_information) > 0


# ---------------------------------------------------------------------------
# Extra: schema-level guards worth having explicit coverage for
# ---------------------------------------------------------------------------

def test_unsupported_produce_rejected():
    req = sample_request(produce="dragonfruit")
    with pytest.raises(ValidationError):
        ShelfLifeRequest.model_validate(req)


def test_class_distribution_must_sum_to_one():
    req = sample_request()
    req["cv_analysis"]["class_distribution"] = {"freshbanana": 0.3, "rottenbanana": 0.3}  # sums to 0.6
    with pytest.raises(ValidationError):
        ShelfLifeRequest.model_validate(req)


def test_point_estimate_outside_range_rejected():
    bad_response = copy.deepcopy(VALID_BANANA_ASSESSMENT_RESPONSE)
    bad_response["assessment"]["estimated_remaining_shelf_life_days"] = 99.0  # way outside [1.8, 3.2]

    provider = MockProvider(fixed_response=bad_response)
    service = make_service(provider)
    request = ShelfLifeRequest.model_validate(sample_request())

    result = service.assess(request)
    assert isinstance(result, AssessmentError)
