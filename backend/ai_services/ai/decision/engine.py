"""
FreshFlow OS - Layer 3 deterministic decision engine.

This module contains ZERO LLM calls. Given a validated DecisionRequest it
always returns the same DecisionResult for the same input - this is what
makes POST /decision independently testable and what the agent (Layer 3b)
is required to build its explanation on top of, rather than inventing its
own numbers.

Hard safety rule enforced here (not by the agent/LLM):
  - POOR batch_condition (majority of sampled units rotten) is NEVER
    eligible for SELL, DISCOUNT, or REDISTRIBUTE - only RESCUE (e.g.
    processing/animal feed/disposal - never human consumption via normal
    sale or donation of produce classified unsafe).
"""
from typing import List

from ai.decision.calculations import discount_price
from ai.decision.optimizer import allocate
from ai.decision.schema import (
    ActionType,
    BatchCondition,
    DecisionConfidenceBasis,
    DecisionRecommendation,
    DecisionRequest,
    DecisionResult,
    ImpactSummary,
    UnallocatedInfo,
    Urgency,
)

DISCOUNT_FRACTION = 0.35


def _confidence_basis(request: DecisionRequest, missing_information: List[str]) -> DecisionConfidenceBasis:
    sla = request.shelf_life_assessment
    if sla.data_quality == "INSUFFICIENT" or sla.estimate_range_days is None and sla.estimated_remaining_shelf_life_days is None:
        return DecisionConfidenceBasis.INSUFFICIENT_DATA
    if missing_information or sla.batch_condition == BatchCondition.MIXED or sla.confidence < 0.5:
        return DecisionConfidenceBasis.PARTIAL_DATA
    return DecisionConfidenceBasis.FULL_DATA


def _engine_confidence(request: DecisionRequest, basis: DecisionConfidenceBasis) -> float:
    """
    A conservative, transparent confidence score - NOT the same number as
    Layer 2's LLM confidence. Starts from Layer 2's confidence and is
    further reduced by data completeness/basis, never increased.
    """
    base = request.shelf_life_assessment.confidence
    if basis == DecisionConfidenceBasis.INSUFFICIENT_DATA:
        return 0.0
    if basis == DecisionConfidenceBasis.PARTIAL_DATA:
        return round(min(base, 0.6), 2)
    return round(base, 2)


def _determine_primary_action(
    request: DecisionRequest,
    allocated_kg: float,
    unallocated_kg: float,
    window_hours,
) -> ActionType:
    sla = request.shelf_life_assessment

    # Hard safety rule - Python-enforced, not LLM-overridable.
    if sla.batch_condition == BatchCondition.POOR:
        return ActionType.RESCUE

    total_kg = request.batch.quantity_kg
    if total_kg <= 0:
        return ActionType.RESCUE

    allocated_fraction = allocated_kg / total_kg

    if allocated_fraction >= 0.999:
        # Fully absorbed by demand.
        return ActionType.SELL

    if sla.urgency in (Urgency.HIGH, Urgency.UNKNOWN) and unallocated_kg > 0:
        # Meaningful unsold quantity under time pressure - engine should
        # not silently strand it as SELL; DISCOUNT/RESCUE is the honest
        # headline when a large fraction is unallocated.
        if allocated_fraction < 0.5:
            return ActionType.DISCOUNT
        return ActionType.REDISTRIBUTE if allocated_kg > 0 else ActionType.DISCOUNT

    if allocated_kg > 0:
        return ActionType.REDISTRIBUTE
    return ActionType.DISCOUNT


def decide(request: DecisionRequest) -> DecisionResult:
    sla = request.shelf_life_assessment
    total_kg = request.batch.quantity_kg

    constraints: List[str] = []
    missing_information: List[str] = []

    # ------------------------------------------------------------------
    # Hard safety rule: POOR condition -> RESCUE only, skip market
    # allocation entirely. Never sell/discount/redistribute unsafe produce.
    # ------------------------------------------------------------------
    if sla.batch_condition == BatchCondition.POOR:
        constraints.append(
            "Batch condition is POOR (majority spoiled per CV analysis) - "
            "normal sale, discount, and redistribution are disallowed for food-safety reasons."
        )
        impact = ImpactSummary(
            total_batch_kg=total_kg,
            allocated_kg=0.0,
            expected_waste_kg=0.0,
            waste_prevented_kg=None,
            estimated_recovered_value=0.0,
            estimated_transport_cost=0.0,
        )
        recommendation = DecisionRecommendation(
            primary_action=ActionType.RESCUE,
            urgency=sla.urgency,
            confidence=0.9 if sla.confidence > 0 else 0.5,
            confidence_basis=DecisionConfidenceBasis.FULL_DATA,
        )
        return DecisionResult(
            batch_id=request.batch.batch_id,
            recommendation=recommendation,
            allocations=[],
            unallocated=UnallocatedInfo(
                quantity_kg=total_kg,
                recommended_action=ActionType.RESCUE,
                reason="Batch is classified POOR/unsafe for normal sale; route entire batch to rescue "
                "(e.g. processing, animal feed, or disposal per applicable safety rules) rather than "
                "sale, discount, or redistribution.",
            ),
            impact=impact,
            reasoning=(
                "Batch condition is POOR. Per food-safety policy, produce in this condition is never "
                "recommended for sale, discount, or redistribution regardless of market demand or price - "
                "the entire batch is routed to RESCUE."
            ),
            constraints=constraints,
            missing_information=missing_information,
            calculation_details={"skipped_allocation": True, "reason": "batch_condition=POOR"},
        )

    # ------------------------------------------------------------------
    # Normal path: run the allocator.
    # ------------------------------------------------------------------
    result = allocate(request)
    allocations = result["allocations"]
    unallocated_kg = result["unallocated_kg"]
    window_hours = result["window_hours"]
    constraints.extend(result["constraints"])
    missing_information.extend(result["missing_information"])

    allocated_kg = round(total_kg - unallocated_kg, 2)

    primary_action = _determine_primary_action(request, allocated_kg, unallocated_kg, window_hours)

    unallocated_info = None
    if unallocated_kg > 0.001:
        if sla.urgency == Urgency.HIGH:
            recommended = ActionType.DISCOUNT
            reason = (
                "Remaining quantity has no feasible full-price market within the safe shelf-life window "
                "and urgency is HIGH; discounting increases the chance of selling before spoilage."
            )
        else:
            recommended = ActionType.DISCOUNT
            reason = (
                "Remaining quantity exceeds current feasible demand across all evaluated markets; "
                "discounting is recommended to move it before the shelf-life window closes."
            )
        unallocated_info = UnallocatedInfo(
            quantity_kg=unallocated_kg,
            recommended_action=recommended,
            reason=reason,
        )

    # ------------------------------------------------------------------
    # Impact summary (transparent, no fabricated baseline).
    # ------------------------------------------------------------------
    total_revenue = round(sum(a.gross_revenue or 0 for a in allocations), 2)
    total_transport_cost = round(sum(a.transport_cost or 0 for a in allocations), 2)
    estimated_recovered_value = round(total_revenue - total_transport_cost, 2)

    # Discounted-value estimate for the unallocated portion, added to
    # recovered value ONLY as an illustrative "if discounted and sold"
    # figure - kept separate and clearly labeled in calculation_details,
    # never merged into the headline recovered value silently.
    discount_illustrative_value = None
    if unallocated_info and unallocated_info.recommended_action == ActionType.DISCOUNT:
        best_local_price = request.local_market.price_per_kg if request.local_market else (
            max((m.price_per_kg for m in request.markets), default=None)
        )
        if best_local_price is not None:
            discount_illustrative_value = round(
                unallocated_kg * discount_price(best_local_price, DISCOUNT_FRACTION), 2
            )

    expected_waste_kg = unallocated_kg if primary_action != ActionType.RESCUE else 0.0

    impact = ImpactSummary(
        total_batch_kg=total_kg,
        allocated_kg=allocated_kg,
        expected_waste_kg=expected_waste_kg,
        waste_prevented_kg=None,  # no historical baseline supplied - never fabricate
        estimated_recovered_value=estimated_recovered_value,
        estimated_transport_cost=total_transport_cost,
    )

    basis = _confidence_basis(request, missing_information)
    confidence = _engine_confidence(request, basis)

    recommendation = DecisionRecommendation(
        primary_action=primary_action,
        urgency=sla.urgency,
        confidence=confidence,
        confidence_basis=basis,
    )

    reasoning_parts = []
    if allocations:
        dest_summary = ", ".join(f"{a.quantity_kg:g}kg -> {a.destination} ({a.action.value})" for a in allocations)
        reasoning_parts.append(f"Allocated: {dest_summary}.")
    else:
        reasoning_parts.append("No quantity could be allocated to any feasible market.")
    if unallocated_info:
        reasoning_parts.append(
            f"{unallocated_kg:g}kg remains unallocated; recommended action: "
            f"{unallocated_info.recommended_action.value} ({unallocated_info.reason})"
        )
    if window_hours is not None:
        reasoning_parts.append(f"Safe transport window used for feasibility checks: {window_hours:.1f}h.")
    reasoning_parts.append(
        f"Primary recommended action is {primary_action.value} based on allocated fraction "
        f"({allocated_kg:g}/{total_kg:g}kg = {(allocated_kg/total_kg*100 if total_kg else 0):.1f}%), "
        f"spoilage risk ({sla.spoilage_risk.value}), and urgency ({sla.urgency.value})."
    )

    calculation_details = {
        "window_hours": window_hours,
        "ranked_markets": [
            {
                "location": r["location"],
                "demand_kg": r["demand_kg"],
                "price_per_kg": r["price_per_kg"],
                "transport_hours": r["transport_hours"],
                "net_value_per_kg": r["net_value_per_kg"],
                "feasible": r["feasible"],
                "infeasible_reason": r["infeasible_reason"],
            }
            for r in result["ranked_markets"]
        ],
        "discount_fraction_used": DISCOUNT_FRACTION if unallocated_info and unallocated_info.recommended_action == ActionType.DISCOUNT else None,
        "discount_illustrative_recovered_value": discount_illustrative_value,
        "allocated_fraction": round(allocated_kg / total_kg, 4) if total_kg else 0.0,
    }

    return DecisionResult(
        batch_id=request.batch.batch_id,
        recommendation=recommendation,
        allocations=allocations,
        unallocated=unallocated_info,
        impact=impact,
        reasoning=" ".join(reasoning_parts),
        constraints=constraints,
        missing_information=missing_information,
        calculation_details=calculation_details,
    )
