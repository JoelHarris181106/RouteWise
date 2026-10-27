from typing import Dict, List, Optional, Set
from ..models.schemas import Stop, Edge, TransportNetwork

class TransitGraph:
    """
    Graph representation of the public transit network.
    Vertices correspond to transit stops.
    Edges correspond to directed transit connections with attributes:
    mode (metro/bus), line name, travel time (mins), fare, and availability status.
    """
    def __init__(self, network: TransportNetwork, active_disruptions_edges: Optional[Set[str]] = None, active_disrupted_stops: Optional[Set[str]] = None):
        self.stops: Dict[str, Stop] = {stop.id: stop for stop in network.stops}
        self.edges: Dict[str, Edge] = {edge.id: edge for edge in network.edges}
        self.adjacency: Dict[str, List[Edge]] = {stop_id: [] for stop_id in self.stops}
        
        self.disrupted_edges: Set[str] = active_disruptions_edges or set()
        self.disrupted_stops: Set[str] = active_disrupted_stops or set()
        
        self._build_adjacency()

    def _build_adjacency(self):
        """Populate adjacency list excluding disrupted or inactive elements."""
        for edge in self.edges.values():
            # Validate non-negativity of weights
            if edge.travel_time < 0 or edge.fare < 0:
                raise ValueError(f"Edge {edge.id} contains negative weight: time={edge.travel_time}, fare={edge.fare}")

            # Exclude if edge is inactive or explicitly disrupted
            if not edge.is_active or edge.id in self.disrupted_edges:
                continue

            # Exclude if source or target station is disrupted
            if edge.source in self.disrupted_stops or edge.target in self.disrupted_stops:
                continue

            # Ensure valid stops
            if edge.source in self.adjacency and edge.target in self.stops:
                self.adjacency[edge.source].append(edge)

    def get_neighbors(self, stop_id: str, mode_filter: str = "all") -> List[Edge]:
        """Return available outgoing edges for a stop filtered by mode."""
        if stop_id not in self.adjacency:
            return []
        
        edges = self.adjacency[stop_id]
        if mode_filter == "all":
            return edges
        elif mode_filter == "metro":
            return [e for e in edges if e.mode == "metro"]
        elif mode_filter == "bus":
            return [e for e in edges if e.mode == "bus"]
        return edges

    def get_stop(self, stop_id: str) -> Optional[Stop]:
        return self.stops.get(stop_id)

    def get_edge(self, edge_id: str) -> Optional[Edge]:
        return self.edges.get(edge_id)

    def is_stop_available(self, stop_id: str) -> bool:
        return stop_id in self.stops and stop_id not in self.disrupted_stops

    def get_all_active_edges(self) -> List[Edge]:
        active = []
        for edges in self.adjacency.values():
            active.extend(edges)
        return active
