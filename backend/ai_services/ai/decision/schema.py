"""
TAZA AI Service - Layer 3 decision-engine schemas.

Reuses Layer 2's SpoilageRisk / Urgency / BatchCondition enums from
ai.shelf_life.schema rather than redefining them, so the two layers can
never silently drift apart on vocabulary.
"""
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from ai.shelf_life.schema import BatchCondition, SpoilageRisk, Urgency

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class ActionType(str, Enum):
    SELL = "SELL"
    DISCOUNT = "DISCOUNT"
    REDISTRIBUTE = "REDISTRIBUTE"
    RESCUE = "RESCUE"


class DecisionConfidenceBasis(str, Enum):
    """Why the engine's confidence is what it is - kept separate from the
    LLM's own confidence in Layer 2, since these measure different things."""

    FULL_DATA = "FULL_DATA"
    PARTIAL_DATA = "PARTIAL_DATA"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


# ---------------------------------------------------------------------------
# Input schemas
# ---------------------------------------------------------------------------


class BatchInfo(BaseModel):
    batch_id: str
    produce: str
    quantity_kg: float = Field(..., gt=0, le=1_000_000)

    @field_validator("produce")
    @classmethod
    def normalize_produce(cls, v: str) -> str:
        return v.strip().lower()


class ShelfLifeInput(BaseModel):
    """Mirrors the fields Layer 3 actually needs out of Layer 2's
    ShelfLifeAssessment.assessment + condition. Layer 3 accepts this
    directly (from a MERN backend that already called /assess-shelf-life)
    OR it can be built from a full ShelfLifeAssessment - see
    ShelfLifeInput.from_assessment().
    """

    estimated_remaining_shelf_life_days: Optional[float] = Field(None, ge=0, le=365)
    estimate_range_days: Optional[List[float]] = Field(None, min_length=2, max_length=2)
    spoilage_risk: SpoilageRisk
    confidence: float = Field(..., ge=0, le=1)
    urgency: Urgency
    batch_condition: BatchCondition
    data_quality: Optional[str] = None

    @field_validator("estimate_range_days")
    @classmethod
    def validate_range_order(cls, v: Optional[List[float]]) -> Optional[List[float]]:
        if v is not None:
            low, high = v
            if low < 0 or high < 0:
                raise ValueError("estimate_range_days values must be non-negative")
            if low > high:
                raise ValueError(f"estimate_range_days low ({low}) must be <= high ({high})")
        return v

    @classmethod
    def from_assessment(cls, assessment) -> "ShelfLifeInput":
        """Build directly from a Layer 2 ShelfLifeAssessment object, so a
        caller that already has one doesn't have to hand-flatten it."""
        return cls(
            estimated_remaining_shelf_life_days=assessment.assessment.estimated_remaining_shelf_life_days,
            estimate_range_days=assessment.assessment.estimate_range_days,
            spoilage_risk=assessment.assessment.spoilage_risk,
            confidence=assessment.assessment.confidence,
            urgency=assessment.assessment.urgency,
            batch_condition=assessment.condition.batch_condition,
            data_quality=assessment.data_quality.value if hasattr(assessment.data_quality, "value") else assessment.data_quality,
        )


class MarketInfo(BaseModel):
    location: str
    demand_kg: float = Field(..., ge=0, le=1_000_000)
    price_per_kg: float = Field(..., ge=0, le=100_000)


class RouteInfo(BaseModel):
    destination: str
    transport_hours: float = Field(..., ge=0, le=2000)
    transport_cost: float = Field(..., ge=0, le=10_000_000)


class DecisionRequest(BaseModel):
    batch: BatchInfo
    shelf_life_assessment: ShelfLifeInput
    markets: List[MarketInfo] = Field(default_factory=list)
    routes: List[RouteInfo] = Field(default_factory=list)
    # Local market is implicitly "quantity that can be sold with zero
    # transport", represented as a MarketInfo whose location has no
    # matching RouteInfo (transport_hours=0, transport_cost=0 assumed).
    local_market: Optional[MarketInfo] = None

    @model_validator(mode="after")
    def validate_market_route_pairing(self):
        route_destinations = {r.destination for r in self.routes}
        for m in self.markets:
            if m.location != (self.local_market.location if self.local_market else None):
                if m.location not in route_destinations:
                    # Not fatal - engine will surface this via missing_information,
                    # since a market with no route is simply infeasible for
                    # redistribution rather than an invalid request.
                    pass
        return self


# ---------------------------------------------------------------------------
# Output schemas
# ---------------------------------------------------------------------------


class AllocationCalculation(BaseModel):
    """Transparent numeric breakdown for one allocation - every number here
    is Python-computed, never LLM-generated."""

    quantity_kg: float
    destination: str
    action: ActionType
    unit_price: Optional[float] = None
    gross_revenue: Optional[float] = None
    transport_cost: Optional[float] = None
    net_recovered_value: Optional[float] = None
    transport_hours: Optional[float] = None
    within_shelf_life_window: Optional[bool] = None
    reason: str


class UnallocatedInfo(BaseModel):
    quantity_kg: float
    recommended_action: ActionType
    reason: str


class ImpactSummary(BaseModel):
    total_batch_kg: float
    allocated_kg: float
    expected_waste_kg: float
    waste_prevented_kg: Optional[float] = Field(
        None, description="Only populated if a historical baseline is supplied; null otherwise."
    )
    estimated_recovered_value: float
    estimated_transport_cost: float


class DecisionRecommendation(BaseModel):
    primary_action: ActionType
    urgency: Urgency
    confidence: float = Field(..., ge=0, le=1)
    confidence_basis: DecisionConfidenceBasis


class DecisionResult(BaseModel):
    """Structured output of the deterministic decision engine (POST /decision)."""

    batch_id: str
    recommendation: DecisionRecommendation
    allocations: List[AllocationCalculation] = Field(default_factory=list)
    unallocated: Optional[UnallocatedInfo] = None
    impact: ImpactSummary
    reasoning: str
    constraints: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    calculation_details: Dict = Field(default_factory=dict)


class AgentDecisionResult(DecisionResult):
    """Extends DecisionResult with an LLM-generated natural-language
    explanation layered on top of the same deterministic numbers - the
    agent is never allowed to change the numeric fields above, only add
    to `agent_explanation` / `agent_notes`."""

    agent_explanation: str
    agent_notes: List[str] = Field(default_factory=list)
    agent_provider: Optional[str] = None
    agent_model: Optional[str] = None


class DecisionEngineError(BaseModel):
    error: str
    detail: str
    stage: str  # "input_validation" | "engine" | "agent_call" | "output_validation"
