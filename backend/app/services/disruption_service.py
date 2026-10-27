import json
from pathlib import Path
from typing import Dict, List, Set, Optional
from ..config import DISRUPTIONS_SEED_PATH
from ..models.schemas import Disruption
from ..dfa.automaton import dfa_instance

class DisruptionService:
    def __init__(self, seed_path: Path = DISRUPTIONS_SEED_PATH):
        self.seed_path = seed_path
        self.disruptions: Dict[str, Disruption] = {}
        self.active_disrupted_edges: Set[str] = set()
        self.active_disrupted_stops: Set[str] = set()
        self.load_seed_disruptions()

    def load_seed_disruptions(self):
        self.disruptions.clear()
        self.active_disrupted_edges.clear()
        self.active_disrupted_stops.clear()

        if self.seed_path.exists():
            with open(self.seed_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    disrupt = Disruption(**item)
                    # Validate status code using DFA
                    dfa_result = dfa_instance.validate(disrupt.status_code)
                    if not dfa_result.is_accepted:
                        print(f"Warning: Disruption {disrupt.id} has invalid status code '{disrupt.status_code}'")
                    self.disruptions[disrupt.id] = disrupt

    def get_all_disruptions(self) -> List[Disruption]:
        return list(self.disruptions.values())

    def get_disruption(self, disruption_id: str) -> Optional[Disruption]:
        return self.disruptions.get(disruption_id)

    def set_disruption_state(self, disruption_id: str, activate: bool) -> Disruption:
        disrupt = self.get_disruption(disruption_id)
        if not disrupt:
            raise ValueError(f"Disruption scenario '{disruption_id}' not found.")
        
        disrupt.is_active = activate
        self._recompute_active_sets()
        return disrupt

    def toggle_custom_edge(self, edge_id: str, is_active: bool, status_code: str = "DELAYED") -> Dict:
        """Allow manually disrupting or restoring a specific edge connection."""
        # Validate status_code with DFA
        dfa_res = dfa_instance.validate(status_code)
        if not dfa_res.is_accepted:
            raise ValueError(f"Status code '{status_code}' rejected by DFA: {dfa_res.explanation}")

        if not is_active:
            self.active_disrupted_edges.add(edge_id)
        else:
            self.active_disrupted_edges.discard(edge_id)
        return {
            "edge_id": edge_id,
            "is_active": is_active,
            "status_code": status_code,
            "dfa_validation": dfa_res.model_dump()
        }

    def reset_all_disruptions(self):
        """Clears all active simulated disruptions across the entire network."""
        for disrupt in self.disruptions.values():
            disrupt.is_active = False
        self.active_disrupted_edges.clear()
        self.active_disrupted_stops.clear()

    def _recompute_active_sets(self):
        self.active_disrupted_edges.clear()
        self.active_disrupted_stops.clear()
        for disrupt in self.disruptions.values():
            if disrupt.is_active:
                for e in disrupt.affected_edges:
                    self.active_disrupted_edges.add(e)
                for s in disrupt.affected_stops:
                    self.active_disrupted_stops.add(s)

    def get_active_disrupted_edges(self) -> Set[str]:
        return set(self.active_disrupted_edges)

    def get_active_disrupted_stops(self) -> Set[str]:
        return set(self.active_disrupted_stops)

disruption_service_instance = DisruptionService()
