import json
from pathlib import Path
from typing import Dict, List, Optional, Set
from ..config import TRANSIT_DATA_PATH
from ..models.schemas import TransportNetwork, Stop, Edge

class NetworkService:
    def __init__(self, data_path: Path = TRANSIT_DATA_PATH):
        self.data_path = data_path
        self._network: Optional[TransportNetwork] = None
        self.load_network()

    def load_network(self) -> TransportNetwork:
        if not self.data_path.exists():
            raise FileNotFoundError(f"Synthetic transit dataset not found at {self.data_path}")
        
        with open(self.data_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        self._network = TransportNetwork(**raw_data)
        self._validate_network_integrity()
        return self._network

    def _validate_network_integrity(self):
        """Validates that all edges reference existing stops and have valid non-negative parameters."""
        if not self._network:
            raise ValueError("Network data is uninitialized.")

        stop_ids = {stop.id for stop in self._network.stops}
        if len(stop_ids) != len(self._network.stops):
            raise ValueError("Duplicate stop IDs found in synthetic transport dataset.")

        for edge in self._network.edges:
            if edge.source not in stop_ids:
                raise ValueError(f"Edge {edge.id} references non-existent source stop '{edge.source}'")
            if edge.target not in stop_ids:
                raise ValueError(f"Edge {edge.id} references non-existent target stop '{edge.target}'")
            if edge.travel_time < 0:
                raise ValueError(f"Edge {edge.id} has negative travel time: {edge.travel_time}")
            if edge.fare < 0:
                raise ValueError(f"Edge {edge.id} has negative fare: {edge.fare}")

    def get_network(self) -> TransportNetwork:
        if not self._network:
            return self.load_network()
        return self._network

    def get_stops(self) -> List[Stop]:
        return self.get_network().stops

    def get_stop(self, stop_id: str) -> Optional[Stop]:
        for s in self.get_network().stops:
            if s.id == stop_id:
                return s
        return None

    def get_edges(self) -> List[Edge]:
        return self.get_network().edges

    def get_edge(self, edge_id: str) -> Optional[Edge]:
        for e in self.get_network().edges:
            if e.id == edge_id:
                return e
        return None

network_service_instance = NetworkService()
