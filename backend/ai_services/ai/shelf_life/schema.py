"""
TAZA AI Service - Shelf-life assessment schemas.

All input and LLM output passes through these Pydantic models. The LLM's
raw JSON is parsed into ShelfLifeAssessment and validated - malformed or
out-of-range values are rejected regardless of what the LLM claims.
"""
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SpoilageRisk(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    UNKNOWN = "UNKNOWN"


class Urgency(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    UNKNOWN = "UNKNOWN"


class BatchCondition(str, Enum):
    GOOD = "GOOD"
    MIXED = "MIXED"
    POOR = "POOR"


class DataQuality(str, Enum):
    GOOD = "GOOD"
    PARTIAL = "PARTIAL"
    INSUFFICIENT = "INSUFFICIENT"


class FactorImpact(str, Enum):
    POSITIVE = "positive"     # extends shelf life
    NEGATIVE = "negative"     # shortens shelf life
    NEUTRAL = "neutral"
    UNKNOWN = "unknown"


class StorageType(str, Enum):
    COLD_STORAGE = "cold_storage"
    AMBIENT = "ambient"
    CONTROLLED_ATMOSPHERE = "controlled_atmosphere"
    REFRIGERATED_TRANSPORT = "refrigerated_transport"
    UNKNOWN = "unknown"


SUPPORTED_PRODUCE = {"banana", "apple", "orange"}


# ---------------------------------------------------------------------------
# Input schemas
# ---------------------------------------------------------------------------

class CVAnalysis(BaseModel):
    """Output from the CV layer, either single-image or already batch-aggregated."""
    visual_class: Optional[str] = Field(
        None, description="Dominant/majority predicted class, e.g. 'freshbanana'"
    )
    freshness_score: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=1)
    class_distribution: Dict[str, float] = Field(
        default_factory=dict,
        description="Fraction of sampled images per class, should sum to ~1.0",
    )
    high_disagreement: Optional[bool] = None

    @field_validator("class_distribution")
    @classmethod
    def validate_distribution(cls, v: Dict[str, float]) -> Dict[str, float]:
        for cls_name, frac in v.items():
            if not (0.0 <= frac <= 1.0):
                raise ValueError(f"class_distribution fraction for '{cls_name}' out of [0,1]: {frac}")
        total = sum(v.values())
        if v and not (0.9 <= total <= 1.1):
            raise ValueError(f"class_distribution fractions sum to {total:.3f}, expected ~1.0")
        return v


class StorageConditions(BaseModel):
    """All optional - missing fields are tracked explicitly, never silently defaulted."""
    harvest_age_days: Optional[float] = Field(None, ge=0, le=365)
    temperature_c: Optional[float] = Field(None, ge=-30, le=60)
    humidity_percent: Optional[float] = Field(None, ge=0, le=100)
    storage_duration_hours: Optional[float] = Field(None, ge=0, le=8760)  # <= 1 year
    transport_duration_hours: Optional[float] = Field(None, ge=0, le=2000)
    storage_type: Optional[StorageType] = None


class ShelfLifeRequest(BaseModel):
    produce: str
    batch_size_kg: Optional[float] = Field(None, gt=0, le=1_000_000)
    cv_analysis: CVAnalysis
    storage: StorageConditions = Field(default_factory=StorageConditions)

    @field_validator("produce")
    @classmethod
    def normalize_produce(cls, v: str) -> str:
        v_norm = v.strip().lower()
        if v_norm not in SUPPORTED_PRODUCE:
            raise ValueError(
                f"Unsupported produce type '{v}'. Supported: {sorted(SUPPORTED_PRODUCE)}. "
                "Add a profile + knowledge base entry to extend."
            )
        return v_norm


# ---------------------------------------------------------------------------
# Output schemas
# ---------------------------------------------------------------------------

class ConditionSummary(BaseModel):
    visual_class: Optional[str] = None
    freshness_score: float = Field(..., ge=0, le=100)
    cv_confidence: float = Field(..., ge=0, le=1)
    batch_condition: BatchCondition


class Assessment(BaseModel):
    estimated_remaining_shelf_life_days: Optional[float] = Field(None, ge=0, le=365)
    estimate_range_days: Optional[List[float]] = Field(
        None, min_length=2, max_length=2,
        description="[low, high] in days, low <= high",
    )
    spoilage_risk: SpoilageRisk
    confidence: float = Field(..., ge=0, le=1)
    urgency: Urgency

    @field_validator("estimate_range_days")
    @classmethod
    def validate_range_order(cls, v: Optional[List[float]]) -> Optional[List[float]]:
        if v is not None:
            if len(v) != 2:
                raise ValueError("estimate_range_days must have exactly 2 values [low, high]")
            low, high = v
            if low < 0 or high < 0:
                raise ValueError("estimate_range_days values must be non-negative")
            if low > high:
                raise ValueError(f"estimate_range_days low ({low}) must be <= high ({high})")
        return v

    @model_validator(mode="after")
    def validate_point_estimate_within_range(self):
        if self.estimated_remaining_shelf_life_days is not None and self.estimate_range_days is not None:
            low, high = self.estimate_range_days
            point = self.estimated_remaining_shelf_life_days
            if not (low - 0.01 <= point <= high + 0.01):
                raise ValueError(
                    f"Point estimate {point} falls outside stated range [{low}, {high}]"
                )
        return self


class Factor(BaseModel):
    factor: str
    impact: FactorImpact
    explanation: str = Field(..., max_length=500)


class Evidence(BaseModel):
    source: str
    title: str
    key_information: str = Field(..., max_length=500)
    relevance: Optional[str] = Field(None, max_length=300)


class ShelfLifeAssessment(BaseModel):
    """Final structured response returned by POST /assess-shelf-life."""
    produce: str
    condition: ConditionSummary
    assessment: Assessment
    factors: List[Factor] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    reasoning_summary: str = Field(..., max_length=2000)
    data_quality: DataQuality
    evidence: List[Evidence] = Field(default_factory=list)

    # metadata, not part of what the LLM produces - filled in by the service
    generated_at: Optional[datetime] = None
    ai_provider: Optional[str] = None
    ai_model: Optional[str] = None

    @model_validator(mode="after")
    def validate_insufficient_data_consistency(self):
        """
        If data_quality is INSUFFICIENT, the numeric estimate must be null -
        the LLM is not allowed to hedge with "INSUFFICIENT" label while
        still sneaking in a confident number.
        """
        if self.data_quality == DataQuality.INSUFFICIENT:
            if self.assessment.estimated_remaining_shelf_life_days is not None:
                raise ValueError(
                    "data_quality=INSUFFICIENT but estimated_remaining_shelf_life_days is set; "
                    "these are contradictory"
                )
            if self.assessment.estimate_range_days is not None:
                raise ValueError(
                    "data_quality=INSUFFICIENT but estimate_range_days is set; "
                    "these are contradictory"
                )
            if self.assessment.spoilage_risk != SpoilageRisk.UNKNOWN:
                raise ValueError(
                    "data_quality=INSUFFICIENT should pair with spoilage_risk=UNKNOWN"
                )
        return self


class AssessmentError(BaseModel):
    """Returned instead of ShelfLifeAssessment when the pipeline cannot produce a valid result."""
    error: str
    detail: str
    stage: str  # "input_validation" | "retrieval" | "llm_call" | "output_validation"
