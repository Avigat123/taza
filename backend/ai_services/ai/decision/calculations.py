"""
FreshFlow OS - Layer 3 deterministic calculations.

Pure functions only. No LLM calls, no I/O. Every number the decision
engine reports back to the caller should be traceable to a function here.
"""
from typing import List, Optional

from ai.decision.schema import MarketInfo, RouteInfo, ShelfLifeInput


def safe_transport_window_hours(shelf_life: ShelfLifeInput) -> Optional[float]:
    """
    The conservative time budget (in hours) available for transport before
    the produce is expected to become unsellable.

    Uses the LOW end of the shelf-life range when available (more
    conservative than the point estimate), falling back to the point
    estimate, then to None if neither is available.

    A safety margin is subtracted so we don't plan a shipment that arrives
    exactly at the edge of spoilage - we reserve time for handling/display
    at the destination.
    """
    HANDLING_BUFFER_HOURS = 12.0

    if shelf_life.estimate_range_days is not None:
        low_days = shelf_life.estimate_range_days[0]
    elif shelf_life.estimated_remaining_shelf_life_days is not None:
        low_days = shelf_life.estimated_remaining_shelf_life_days
    else:
        return None

    window_hours = (low_days * 24.0) - HANDLING_BUFFER_HOURS
    return max(window_hours, 0.0)


def route_is_feasible(route: RouteInfo, window_hours: Optional[float]) -> bool:
    """A route is feasible only if we have a window and transport fits inside it.
    If window_hours is None (no shelf-life data), no route is considered feasible -
    Python must not guess; this forces the engine to report missing_information."""
    if window_hours is None:
        return False
    return route.transport_hours <= window_hours


def compute_allocation_value(
    quantity_kg: float,
    price_per_kg: float,
    transport_cost: float = 0.0,
) -> dict:
    """Deterministic revenue/cost/net-value calculation for one allocation."""
    gross_revenue = round(quantity_kg * price_per_kg, 2)
    net_recovered_value = round(gross_revenue - transport_cost, 2)
    return {
        "gross_revenue": gross_revenue,
        "transport_cost": round(transport_cost, 2),
        "net_recovered_value": net_recovered_value,
    }


def discount_price(base_price: float, discount_fraction: float = 0.35) -> float:
    """Discounted price for the DISCOUNT action. Fraction is a fixed,
    documented business rule (not LLM-chosen) - kept as a named constant
    with a default so it's easy to tune from one place."""
    return round(base_price * (1 - discount_fraction), 2)


def rank_markets_by_recovered_value_per_kg(
    markets: List[MarketInfo],
    routes: List[RouteInfo],
    local_market_location: Optional[str],
) -> List[dict]:
    """
    Rank markets (local + remote) by net recovered value per kg, descending.
    This is the core allocation-priority signal: markets that recover more
    value per kg for the same shelf-life risk are preferred, all else equal.

    Local market (no route needed) always has transport_cost = 0 and
    transport_hours = 0.
    """
    routes_by_dest = {r.destination: r for r in routes}
    ranked = []

    for m in markets:
        is_local = local_market_location is not None and m.location == local_market_location
        if is_local:
            route = None
            transport_hours = 0.0
            transport_cost_per_kg = 0.0
        else:
            route = routes_by_dest.get(m.location)
            if route is None:
                # No route data for this market - cannot compute feasibility.
                ranked.append(
                    {
                        "location": m.location,
                        "demand_kg": m.demand_kg,
                        "price_per_kg": m.price_per_kg,
                        "route": None,
                        "transport_hours": None,
                        "net_value_per_kg": None,
                        "feasible": False,
                        "infeasible_reason": "no_route_data",
                    }
                )
                continue
            transport_hours = route.transport_hours
            transport_cost_per_kg = (route.transport_cost / m.demand_kg) if m.demand_kg > 0 else float("inf")

        net_value_per_kg = m.price_per_kg - transport_cost_per_kg
        ranked.append(
            {
                "location": m.location,
                "demand_kg": m.demand_kg,
                "price_per_kg": m.price_per_kg,
                "route": route,
                "transport_hours": transport_hours,
                "net_value_per_kg": round(net_value_per_kg, 4),
                "feasible": None,  # filled in by caller once shelf-life window is known
                "infeasible_reason": None,
            }
        )

    ranked.sort(
        key=lambda r: (r["net_value_per_kg"] if r["net_value_per_kg"] is not None else float("-inf")),
        reverse=True,
    )
    return ranked
