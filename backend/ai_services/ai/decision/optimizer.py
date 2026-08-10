"""
TAZA AI Service - Layer 3 allocation optimizer.

General-purpose greedy allocator: NOT hard-coded to any specific
produce/quantity/market combination. Given a shelf-life window and a set
of ranked, feasibility-checked markets, it allocates as much of the batch
as possible to the highest-recovered-value feasible markets first, up to
each market's demand, until the batch is exhausted or no feasible market
remains.

Primary objective is waste minimization: every kg allocated to a feasible
market is a kg that does not become expected waste. Ranking by recovered
value per kg is the secondary (economic) objective used to break ties
among waste-equivalent options, per the spec ("both waste prevented AND
economic value, waste is primary").
"""
from typing import List, Optional

from ai.decision.calculations import (
    compute_allocation_value,
    discount_price,
    rank_markets_by_recovered_value_per_kg,
    route_is_feasible,
    safe_transport_window_hours,
)
from ai.decision.schema import (
    ActionType,
    AllocationCalculation,
    DecisionRequest,
)


def allocate(request: DecisionRequest) -> dict:
    """
    Returns a dict with:
      - allocations: List[AllocationCalculation]
      - unallocated_kg: float
      - window_hours: Optional[float]
      - ranked_markets: list (for calculation_details/debugging)
      - constraints: List[str]
      - missing_information: List[str]
    """
    constraints: List[str] = []
    missing_information: List[str] = []

    total_kg = request.batch.quantity_kg
    remaining_kg = total_kg

    window_hours = safe_transport_window_hours(request.shelf_life_assessment)
    if window_hours is None:
        missing_information.append(
            "No usable shelf-life estimate (estimated_remaining_shelf_life_days / "
            "estimate_range_days both missing) - cannot compute a safe transport window. "
            "No redistribution route can be validated as feasible."
        )
    else:
        constraints.append(
            f"Safe transport window computed as {window_hours:.1f}h "
            f"(low end of shelf-life range minus 12h handling buffer)."
        )

    local_location = request.local_market.location if request.local_market else None
    all_markets = list(request.markets)
    if request.local_market and request.local_market not in all_markets:
        all_markets = [request.local_market] + all_markets

    if not all_markets:
        missing_information.append("No market demand data supplied - cannot allocate any quantity.")

    ranked = rank_markets_by_recovered_value_per_kg(all_markets, request.routes, local_location)

    # Resolve feasibility now that we know the shelf-life window.
    for entry in ranked:
        if entry["feasible"] is not None:
            continue  # already marked infeasible (no route data)
        is_local = local_location is not None and entry["location"] == local_location
        if is_local:
            entry["feasible"] = True
        elif entry["route"] is not None:
            entry["feasible"] = route_is_feasible(entry["route"], window_hours)
            if not entry["feasible"]:
                entry["infeasible_reason"] = "shelf_life_window_exceeded"
        else:
            entry["feasible"] = False
            entry["infeasible_reason"] = entry["infeasible_reason"] or "no_route_data"

    allocations: List[AllocationCalculation] = []

    for entry in ranked:
        if remaining_kg <= 0:
            break
        if not entry["feasible"]:
            if entry["infeasible_reason"] == "shelf_life_window_exceeded":
                constraints.append(
                    f"{entry['location']}: transport takes {entry['transport_hours']:.1f}h, "
                    f"exceeding the {window_hours:.1f}h safe window - excluded from SELL/REDISTRIBUTE."
                )
            elif entry["infeasible_reason"] == "no_route_data":
                missing_information.append(
                    f"No route data supplied for market '{entry['location']}' - cannot evaluate feasibility."
                )
            continue

        demand_kg = entry["demand_kg"]
        if demand_kg <= 0:
            continue

        qty = min(remaining_kg, demand_kg)
        is_local = local_location is not None and entry["location"] == local_location
        transport_cost_total = 0.0 if is_local else (
            entry["route"].transport_cost * (qty / demand_kg) if demand_kg > 0 else 0.0
        )

        values = compute_allocation_value(qty, entry["price_per_kg"], transport_cost_total)
        action = ActionType.SELL if is_local else ActionType.REDISTRIBUTE

        allocations.append(
            AllocationCalculation(
                quantity_kg=round(qty, 2),
                destination=entry["location"],
                action=action,
                unit_price=entry["price_per_kg"],
                gross_revenue=values["gross_revenue"],
                transport_cost=values["transport_cost"],
                net_recovered_value=values["net_recovered_value"],
                transport_hours=entry["transport_hours"],
                within_shelf_life_window=True,
                reason=(
                    f"{'Local demand' if is_local else 'Market demand'} of {demand_kg:g}kg at "
                    f"{entry['location']} can absorb up to {qty:g}kg"
                    + ("" if is_local else f", transport ({entry['transport_hours']:.1f}h) fits within the "
                       f"{window_hours:.1f}h safe window")
                    + f"; net recovered value/kg = {entry['net_value_per_kg']:.2f}."
                ),
            )
        )
        remaining_kg -= qty

    return {
        "allocations": allocations,
        "unallocated_kg": round(remaining_kg, 2),
        "window_hours": window_hours,
        "ranked_markets": ranked,
        "constraints": constraints,
        "missing_information": missing_information,
    }
