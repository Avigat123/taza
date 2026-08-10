"""DEMO DATA - fixtures for Layer 3 decision engine / agent tests only.
Never present these numbers as real market/route data."""
from ai.decision.schema import (
    BatchInfo,
    DecisionRequest,
    MarketInfo,
    RouteInfo,
    ShelfLifeInput,
)
from ai.shelf_life.schema import BatchCondition, SpoilageRisk, Urgency


def sla(**overrides) -> ShelfLifeInput:
    base = dict(
        estimated_remaining_shelf_life_days=3.5,
        estimate_range_days=[2.0, 5.0],
        spoilage_risk=SpoilageRisk.HIGH,
        confidence=0.65,
        urgency=Urgency.HIGH,
        batch_condition=BatchCondition.GOOD,
        data_quality="PARTIAL",
    )
    base.update(overrides)
    return ShelfLifeInput(**base)


def batch(**overrides) -> BatchInfo:
    base = dict(batch_id="BATCH-001", produce="banana", quantity_kg=500)
    base.update(overrides)
    return BatchInfo(**base)


def full_request(**overrides) -> DecisionRequest:
    """The scenario from the spec: 500kg banana, local + Ludhiana + Delhi markets."""
    base = dict(
        batch=batch(),
        shelf_life_assessment=sla(),
        local_market=MarketInfo(location="Chandigarh", demand_kg=100, price_per_kg=45),
        markets=[
            MarketInfo(location="Delhi", demand_kg=1000, price_per_kg=42),
            MarketInfo(location="Ludhiana", demand_kg=350, price_per_kg=44),
        ],
        routes=[
            RouteInfo(destination="Chandigarh", transport_hours=2, transport_cost=1000),
            RouteInfo(destination="Delhi", transport_hours=6, transport_cost=4000),
            RouteInfo(destination="Ludhiana", transport_hours=3, transport_cost=1500),
        ],
    )
    base.update(overrides)
    return DecisionRequest(**base)
