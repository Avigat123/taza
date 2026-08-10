"""Tests for ai.decision.engine - deterministic, no LLM required."""
import pytest
from pydantic import ValidationError

from ai.decision.engine import decide
from ai.decision.schema import ActionType, DecisionRequest, MarketInfo, RouteInfo
from ai.shelf_life.schema import BatchCondition, SpoilageRisk, Urgency

from ai.tests.decision_fixtures import batch, full_request, sla


# 1. Healthy batch, high demand -> fully allocated, SELL/REDISTRIBUTE, no waste.
def test_healthy_batch_high_demand_fully_allocated():
    req = full_request(
        batch=batch(quantity_kg=100),
        shelf_life_assessment=sla(
            urgency=Urgency.LOW, spoilage_risk=SpoilageRisk.LOW, estimate_range_days=[10, 14]
        ),
    )
    result = decide(req)
    assert result.impact.allocated_kg == 100
    assert result.impact.expected_waste_kg == 0
    assert result.unallocated is None


# 2. High-risk batch with low local demand -> unallocated remainder, DISCOUNT suggested.
def test_high_risk_low_local_demand_leaves_unallocated():
    req = full_request(
        markets=[],  # only local (100kg) available, no redistribution options
        routes=[RouteInfo(destination="Chandigarh", transport_hours=2, transport_cost=1000)],
    )
    result = decide(req)
    assert result.impact.allocated_kg == 100
    assert result.unallocated is not None
    assert result.unallocated.quantity_kg == 400
    assert result.unallocated.recommended_action == ActionType.DISCOUNT


# 3. Redistribution opportunity -> Ludhiana (feasible route) gets allocated.
def test_redistribution_opportunity_used():
    req = full_request()
    result = decide(req)
    destinations = {a.destination for a in result.allocations}
    assert "Ludhiana" in destinations
    ludhiana_alloc = next(a for a in result.allocations if a.destination == "Ludhiana")
    assert ludhiana_alloc.action == ActionType.REDISTRIBUTE
    assert ludhiana_alloc.quantity_kg == 350


# 4. Discount scenario -> large unallocated remainder with HIGH urgency -> DISCOUNT.
def test_discount_scenario():
    req = full_request(
        batch=batch(quantity_kg=2000),  # far exceeds all combined demand (100+350+1000=1450)
    )
    result = decide(req)
    assert result.unallocated is not None
    assert result.unallocated.recommended_action == ActionType.DISCOUNT
    assert result.unallocated.quantity_kg == pytest.approx(2000 - 100 - 350 - 1000, abs=0.01)


# 5. Rescue scenario -> POOR batch_condition always routes to RESCUE, no market allocation.
def test_rescue_scenario_poor_condition():
    req = full_request(shelf_life_assessment=sla(batch_condition=BatchCondition.POOR))
    result = decide(req)
    assert result.recommendation.primary_action == ActionType.RESCUE
    assert result.allocations == []
    assert result.unallocated.quantity_kg == 500
    assert result.unallocated.recommended_action == ActionType.RESCUE
    assert "POOR" in result.constraints[0] or "POOR" in result.reasoning


# 6. Insufficient transport capacity is not really a distinct concept here (routes don't
#    have capacity limits in the spec) - covered instead by demand as the binding constraint;
#    verify partial allocation respects demand_kg caps exactly.
def test_allocation_never_exceeds_market_demand():
    req = full_request()
    result = decide(req)
    for alloc in result.allocations:
        matching_demand = None
        if alloc.destination == "Chandigarh":
            matching_demand = 100
        elif alloc.destination == "Ludhiana":
            matching_demand = 350
        elif alloc.destination == "Delhi":
            matching_demand = 1000
        assert matching_demand is not None
        assert alloc.quantity_kg <= matching_demand


# 7. Insufficient market demand -> no markets at all -> everything unallocated.
def test_no_market_data_all_unallocated():
    req = full_request(markets=[], local_market=None)
    result = decide(req)
    assert result.impact.allocated_kg == 0
    assert result.unallocated.quantity_kg == 500
    assert "No market demand data supplied" in " ".join(result.missing_information)


# 8. Shelf life too short for route -> Delhi (6h) excluded when window is very small.
def test_route_excluded_when_shelf_life_too_short():
    req = full_request(
        shelf_life_assessment=sla(estimate_range_days=[0.3, 0.6]),  # ~7.2h low end - 12h buffer -> 0
    )
    result = decide(req)
    destinations = {a.destination for a in result.allocations}
    assert "Delhi" not in destinations
    assert "Ludhiana" not in destinations  # 3h also exceeds ~0h window
    # Local (0h transport) should still be feasible.
    assert "Chandigarh" in destinations


# 9. Mixed-quality batch -> allocation still proceeds (not blocked like POOR), but
#    confidence basis reflects PARTIAL_DATA.
def test_mixed_condition_reduces_confidence_basis():
    req = full_request(shelf_life_assessment=sla(batch_condition=BatchCondition.MIXED))
    result = decide(req)
    assert result.recommendation.primary_action != ActionType.RESCUE
    from ai.decision.schema import DecisionConfidenceBasis
    assert result.recommendation.confidence_basis == DecisionConfidenceBasis.PARTIAL_DATA


# 10. Missing market data -> flagged in missing_information, not silently ignored.
def test_missing_market_data_flagged():
    req = full_request(markets=[], local_market=None, routes=[])
    result = decide(req)
    assert any("market" in m.lower() for m in result.missing_information)


# 11. Missing route data for a market with demand -> flagged, market excluded from allocation.
def test_missing_route_data_flagged():
    req = full_request(routes=[])  # markets exist but no routes at all (local still works)
    result = decide(req)
    assert any("route" in m.lower() for m in result.missing_information)
    destinations = {a.destination for a in result.allocations}
    assert "Delhi" not in destinations
    assert "Ludhiana" not in destinations


# 12. Invalid quantities -> Pydantic rejects non-positive quantity_kg.
def test_invalid_quantity_rejected():
    with pytest.raises(ValidationError):
        batch(quantity_kg=0)
    with pytest.raises(ValidationError):
        batch(quantity_kg=-10)


# 13. Invalid prices -> Pydantic rejects negative price_per_kg.
def test_invalid_price_rejected():
    with pytest.raises(ValidationError):
        MarketInfo(location="X", demand_kg=10, price_per_kg=-5)


# 15. Decision engine is deterministic - same input, same output, run twice.
def test_engine_is_deterministic():
    req = full_request()
    result1 = decide(req)
    result2 = decide(req)
    assert result1.model_dump() == result2.model_dump()


def test_shelf_life_input_range_order_validation():
    with pytest.raises(ValidationError):
        sla(estimate_range_days=[5.0, 2.0])
