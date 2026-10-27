import heapq
from typing import Dict, List, Optional, Tuple, Set
from .graph import TransitGraph
from ..models.schemas import Edge, JourneySegment, RouteOption

def reconstruct_path(predecessors: Dict[str, Tuple[str, Edge]], origin: str, destination: str) -> List[Edge]:
    """Reconstruct ordered list of edges from origin to destination."""
    edges = []
    curr = destination
    visited_guard = set()
    while curr != origin:
        if curr in visited_guard:
            raise RuntimeError("Cycle detected during path reconstruction")
        visited_guard.add(curr)
        
        if curr not in predecessors:
            return []
        prev_node, edge = predecessors[curr]
        edges.append(edge)
        curr = prev_node
    edges.reverse()
    return edges

def calculate_transfers(edges: List[Edge]) -> int:
    """Calculate number of line changes/transfers in a journey."""
    if len(edges) <= 1:
        return 0
    transfers = 0
    current_line = edges[0].line_name
    for edge in edges[1:]:
        if edge.line_name != current_line:
            transfers += 1
            current_line = edge.line_name
    return transfers

def build_journey_segments(edges: List[Edge], graph: TransitGraph) -> List[JourneySegment]:
    """Convert raw edges into detailed user-facing journey segments."""
    segments = []
    for idx, edge in enumerate(edges):
        src_stop = graph.get_stop(edge.source)
        tgt_stop = graph.get_stop(edge.target)
        src_name = src_stop.name if src_stop else edge.source
        tgt_name = tgt_stop.name if tgt_stop else edge.target
        
        segments.append(JourneySegment(
            segment_index=idx + 1,
            from_stop_id=edge.source,
            from_stop_name=src_name,
            to_stop_id=edge.target,
            to_stop_name=tgt_name,
            mode=edge.mode,
            line_name=edge.line_name,
            travel_time=edge.travel_time,
            fare=edge.fare,
            distance_km=edge.distance_km
        ))
    return segments

def build_route_option(
    category: str,
    title: str,
    edges: List[Edge],
    graph: TransitGraph,
    origin: str,
    destination: str,
    explanation: str
) -> RouteOption:
    """Construct complete RouteOption schema from an edge sequence."""
    if not edges and origin != destination:
        return RouteOption(
            category=category, # type: ignore
            title=title,
            total_time_mins=0,
            total_fare=0.0,
            transfers_count=0,
            total_distance_km=0.0,
            stops_sequence=[],
            stops_names=[],
            segments=[],
            lines_used=[],
            explanation=f"No route found between {origin} and {destination}.",
            is_feasible=False
        )

    stops_seq = [origin]
    lines_used_set = []
    total_time = 0
    total_fare = 0.0
    total_distance = 0.0

    for edge in edges:
        stops_seq.append(edge.target)
        if edge.line_name not in lines_used_set:
            lines_used_set.append(edge.line_name)
        total_time += edge.travel_time
        total_fare += edge.fare
        total_distance += edge.distance_km

    transfers = calculate_transfers(edges)
    stops_names = [graph.get_stop(s).name if graph.get_stop(s) else s for s in stops_seq]
    segments = build_journey_segments(edges, graph)

    return RouteOption(
        category=category, # type: ignore
        title=title,
        total_time_mins=total_time,
        total_fare=round(total_fare, 2),
        transfers_count=transfers,
        total_distance_km=round(total_distance, 2),
        stops_sequence=stops_seq,
        stops_names=stops_names,
        segments=segments,
        lines_used=lines_used_set,
        explanation=explanation,
        is_feasible=True
    )

def dijkstra_standard(
    graph: TransitGraph,
    origin: str,
    destination: str,
    mode_filter: str = "all",
    weight_type: str = "time"
) -> Optional[List[Edge]]:
    """
    Standard Dijkstra's Algorithm with Priority Queue (heapq).
    Weight options: 'time' (fastest route) or 'fare' (cheapest route).
    Guarantees non-negative edge weights.
    Complexity: O((|V| + |E|) log |V|).
    """
    if origin == destination:
        return []

    # Priority queue storing tuples: (cumulative_cost, current_node)
    pq: List[Tuple[float, str]] = []
    heapq.heappush(pq, (0.0, origin))

    distances: Dict[str, float] = {node: float('inf') for node in graph.stops}
    distances[origin] = 0.0

    # predecessor map: target_node -> (prev_node, edge)
    predecessors: Dict[str, Tuple[str, Edge]] = {}
    visited: Set[str] = set()

    while pq:
        curr_dist, u = heapq.heappop(pq)

        if u in visited:
            continue
        visited.add(u)

        if u == destination:
            break

        for edge in graph.get_neighbors(u, mode_filter=mode_filter):
            v = edge.target
            if v in visited:
                continue

            edge_weight = float(edge.travel_time) if weight_type == "time" else float(edge.fare)
            if edge_weight < 0:
                raise ValueError(f"Dijkstra requires non-negative weights; got {edge_weight}")

            new_dist = curr_dist + edge_weight
            if new_dist < distances.get(v, float('inf')):
                distances[v] = new_dist
                predecessors[v] = (u, edge)
                heapq.heappush(pq, (new_dist, v))

    if destination not in predecessors:
        return None

    return reconstruct_path(predecessors, origin, destination)

def dijkstra_fewest_transfers(
    graph: TransitGraph,
    origin: str,
    destination: str,
    mode_filter: str = "all"
) -> Optional[List[Edge]]:
    """
    Fewest-Transfers Route using an expanded state graph.
    State: (stop_id, current_line).
    When transferring from line A to line B (where line A is not None and line A != line B),
    a transfer penalty is assessed.
    Primary objective: Minimize transfer count.
    Secondary tie-breaker: Minimize travel time.
    Composite state weight = transfers * 10,000 + travel_time.
    """
    if origin == destination:
        return []

    # Priority Queue: (cost, stop_id, current_line)
    pq: List[Tuple[float, str, Optional[str]]] = []
    # Initial state has no prior line boarded
    heapq.heappush(pq, (0.0, origin, None))

    best_cost: Dict[Tuple[str, Optional[str]], float] = {(origin, None): 0.0}
    # Predecessor map: (target_stop, target_line) -> ((prev_stop, prev_line), edge)
    predecessors: Dict[Tuple[str, Optional[str]], Tuple[Tuple[str, Optional[str]], Edge]] = {}

    target_state: Optional[Tuple[str, Optional[str]]] = None
    min_dest_cost = float('inf')

    while pq:
        curr_cost, u, curr_line = heapq.heappop(pq)

        if curr_cost > best_cost.get((u, curr_line), float('inf')):
            continue

        if u == destination:
            if curr_cost < min_dest_cost:
                min_dest_cost = curr_cost
                target_state = (u, curr_line)
            continue

        for edge in graph.get_neighbors(u, mode_filter=mode_filter):
            v = edge.target
            next_line = edge.line_name

            # Transfer penalty: 1 transfer if changing lines, 0 if staying on same line or initial board
            is_transfer = (curr_line is not None and curr_line != next_line)
            transfer_penalty = 10000.0 if is_transfer else 0.0
            step_cost = transfer_penalty + edge.travel_time

            new_cost = curr_cost + step_cost
            next_state = (v, next_line)

            if new_cost < best_cost.get(next_state, float('inf')):
                best_cost[next_state] = new_cost
                predecessors[next_state] = ((u, curr_line), edge)
                heapq.heappush(pq, (new_cost, v, next_line))

    if not target_state or target_state not in predecessors:
        return None

    # Reconstruct edges backwards from target_state
    edges = []
    curr = target_state
    while curr[0] != origin or curr[1] is not None:
        if curr not in predecessors:
            break
        prev_state, edge = predecessors[curr]
        edges.append(edge)
        curr = prev_state
    edges.reverse()
    return edges

def dijkstra_balanced_composite(
    graph: TransitGraph,
    origin: str,
    destination: str,
    mode_filter: str = "all",
    time_weight: float = 0.5,
    fare_weight: float = 0.5
) -> Optional[List[Edge]]:
    """
    Balanced Route using normalized composite edge cost:
    weight = time_weight * (edge.travel_time / 10.0) + fare_weight * (edge.fare / 15.0)
    All weights are strictly non-negative.
    """
    if origin == destination:
        return []

    pq: List[Tuple[float, str]] = []
    heapq.heappush(pq, (0.0, origin))

    distances: Dict[str, float] = {node: float('inf') for node in graph.stops}
    distances[origin] = 0.0
    predecessors: Dict[str, Tuple[str, Edge]] = {}
    visited: Set[str] = set()

    while pq:
        curr_dist, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)

        if u == destination:
            break

        for edge in graph.get_neighbors(u, mode_filter=mode_filter):
            v = edge.target
            if v in visited:
                continue

            # Normalized non-negative cost
            norm_time = edge.travel_time / 10.0
            norm_fare = edge.fare / 15.0
            composite_weight = (time_weight * norm_time) + (fare_weight * norm_fare)

            new_dist = curr_dist + composite_weight
            if new_dist < distances.get(v, float('inf')):
                distances[v] = new_dist
                predecessors[v] = (u, edge)
                heapq.heappush(pq, (new_dist, v))

    if destination not in predecessors:
        return None

    return reconstruct_path(predecessors, origin, destination)
