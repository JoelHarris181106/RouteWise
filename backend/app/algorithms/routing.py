from typing import Dict, Optional, List
from .graph import TransitGraph
from .dijkstra import (
    dijkstra_standard,
    dijkstra_fewest_transfers,
    dijkstra_balanced_composite,
    build_route_option,
    calculate_transfers
)
from ..models.schemas import RouteOption, RoutePlanResponse, Stop

def are_routes_identical(r1: Optional[RouteOption], r2: Optional[RouteOption]) -> bool:
    if not r1 or not r2:
        return False
    if not r1.is_feasible or not r2.is_feasible:
        return False
    return r1.stops_sequence == r2.stops_sequence and r1.lines_used == r2.lines_used

def evaluate_multi_criteria_score(
    route: RouteOption,
    t_min: float, t_max: float,
    c_min: float, c_max: float,
    tr_min: float, tr_max: float,
    wt: float = 0.45, wc: float = 0.35, wtr: float = 0.20
) -> float:
    """
    Normalized multi-criteria score in [0, 1].
    Lower score represents a better balanced compromise.
    """
    norm_t = (route.total_time_mins - t_min) / (t_max - t_min) if t_max > t_min else 0.0
    norm_c = (route.total_fare - c_min) / (c_max - c_min) if c_max > c_min else 0.0
    norm_tr = (route.transfers_count - tr_min) / (tr_max - tr_min) if tr_max > tr_min else 0.0
    return (wt * norm_t) + (wc * norm_c) + (wtr * norm_tr)

class RoutePlanner:
    def __init__(self, graph: TransitGraph):
        self.graph = graph

    def plan_journey(
        self,
        origin: str,
        destination: str,
        mode_filter: str = "all",
        preference: str = "balanced"
    ) -> RoutePlanResponse:
        origin_stop = self.graph.get_stop(origin)
        dest_stop = self.graph.get_stop(destination)

        if not origin_stop:
            raise ValueError(f"Origin stop ID '{origin}' is not recognized in the network.")
        if not dest_stop:
            raise ValueError(f"Destination stop ID '{destination}' is not recognized in the network.")

        if not self.graph.is_stop_available(origin):
            raise ValueError(f"Origin stop '{origin_stop.name}' is currently unavailable due to active disruptions.")
        if not self.graph.is_stop_available(destination):
            raise ValueError(f"Destination stop '{dest_stop.name}' is currently unavailable due to active disruptions.")

        if origin == destination:
            raise ValueError("Origin and destination stops cannot be identical.")

        # 1. Calculate Fastest Route (Dijkstra on travel time)
        fastest_edges = dijkstra_standard(self.graph, origin, destination, mode_filter=mode_filter, weight_type="time")
        fastest_opt = None
        if fastest_edges is not None:
            fastest_opt = build_route_option(
                category="fastest",
                title="Fastest Journey",
                edges=fastest_edges,
                graph=self.graph,
                origin=origin,
                destination=destination,
                explanation="Calculated using Dijkstra's algorithm with travel time edge weights. Minimizes total transit and in-vehicle duration."
            )

        # 2. Calculate Cheapest Route (Dijkstra on fare)
        cheapest_edges = dijkstra_standard(self.graph, origin, destination, mode_filter=mode_filter, weight_type="fare")
        cheapest_opt = None
        if cheapest_edges is not None:
            cheapest_opt = build_route_option(
                category="cheapest",
                title="Cheapest Journey",
                edges=cheapest_edges,
                graph=self.graph,
                origin=origin,
                destination=destination,
                explanation="Calculated using Dijkstra's algorithm with fare weights. Identifies the most economical path across available transit modes."
            )

        # 3. Calculate Fewest-Transfers Route (State-expanded Dijkstra)
        fewest_transfers_edges = dijkstra_fewest_transfers(self.graph, origin, destination, mode_filter=mode_filter)
        fewest_transfers_opt = None
        if fewest_transfers_edges is not None:
            fewest_transfers_opt = build_route_option(
                category="fewest_transfers",
                title="Fewest Transfers",
                edges=fewest_transfers_edges,
                graph=self.graph,
                origin=origin,
                destination=destination,
                explanation="Calculated using a state-expanded transit graph (stop, line) with transfer penalties. Minimizes physical modal and line changes."
            )

        # 4. Calculate Balanced Route
        # Candidate pool includes composite Dijkstra plus existing candidate routes
        composite_edges = dijkstra_balanced_composite(self.graph, origin, destination, mode_filter=mode_filter)
        composite_opt = None
        if composite_edges is not None:
            composite_opt = build_route_option(
                category="balanced",
                title="Balanced Journey",
                edges=composite_edges,
                graph=self.graph,
                origin=origin,
                destination=destination,
                explanation="Calculated using normalized composite objective weighting travel time (45%), fare (35%), and transfers (20%)."
            )

        candidates: List[RouteOption] = [r for r in [fastest_opt, cheapest_opt, fewest_transfers_opt, composite_opt] if r and r.is_feasible]
        
        balanced_opt: Optional[RouteOption] = None
        if candidates:
            t_vals = [c.total_time_mins for c in candidates]
            c_vals = [c.total_fare for c in candidates]
            tr_vals = [c.transfers_count for c in candidates]

            t_min, t_max = min(t_vals), max(t_vals)
            c_min, c_max = min(c_vals), max(c_vals)
            tr_min, tr_max = min(tr_vals), max(tr_vals)

            best_candidate = min(
                candidates,
                key=lambda r: evaluate_multi_criteria_score(r, t_min, t_max, c_min, c_max, tr_min, tr_max)
            )

            # Re-clone best candidate as balanced option with explanation
            balanced_opt = RouteOption(
                category="balanced",
                title="Balanced Journey",
                total_time_mins=best_candidate.total_time_mins,
                total_fare=best_candidate.total_fare,
                transfers_count=best_candidate.transfers_count,
                total_distance_km=best_candidate.total_distance_km,
                stops_sequence=best_candidate.stops_sequence,
                stops_names=best_candidate.stops_names,
                segments=best_candidate.segments,
                lines_used=best_candidate.lines_used,
                explanation="Optimized trade-off balancing travel time (45%), fare cost (35%), and line transfer convenience (20%).",
                is_feasible=True
            )

        # Annotate coincidences
        routes_map = {
            "fastest": fastest_opt,
            "cheapest": cheapest_opt,
            "fewest_transfers": fewest_transfers_opt,
            "balanced": balanced_opt
        }

        # Check overlapping categories
        for cat_name, route in routes_map.items():
            if not route or not route.is_feasible:
                continue
            coincides = []
            for other_name, other_route in routes_map.items():
                if other_name != cat_name and are_routes_identical(route, other_route):
                    coincides.append(other_name)
            route.coincides_with = coincides
            if coincides:
                matched_str = ", ".join([c.replace("_", " ").title() for c in coincides])
                route.explanation += f" Note: This journey also satisfies the criteria for {matched_str}."

        return RoutePlanResponse(
            origin=origin,
            origin_name=origin_stop.name,
            destination=destination,
            destination_name=dest_stop.name,
            transport_mode_filter=mode_filter,
            routes=routes_map,
            active_disruptions_count=len(self.graph.disrupted_edges) + len(self.graph.disrupted_stops)
        )
