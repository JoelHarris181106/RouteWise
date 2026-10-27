from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field

# --- Transit Network Models ---

class Stop(BaseModel):
    id: str
    name: str
    zone: int
    x: int
    y: int
    lines: List[str]
    is_transfer_station: bool = False
    status: str = "ON_TIME"

class Edge(BaseModel):
    id: str
    source: str
    target: str
    mode: Literal["metro", "bus"]
    line_name: str
    travel_time: int = Field(ge=0, description="Travel time in minutes, must be non-negative")
    fare: float = Field(ge=0.0, description="Fare in currency units, must be non-negative")
    distance_km: float = Field(ge=0.0, description="Distance in kilometers")
    status: str = "ON_TIME"
    is_active: bool = True

class TransportNetwork(BaseModel):
    network_name: str
    version: str
    description: str
    stops: List[Stop]
    edges: List[Edge]

# --- Disruption Models ---

class Disruption(BaseModel):
    id: str
    title: str
    description: str
    affected_edges: List[str] = []
    affected_stops: List[str] = []
    status_code: str = "CANCELLED"
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "HIGH"
    is_active: bool = False

class DisruptionToggleRequest(BaseModel):
    disruption_id: str
    activate: bool

class CustomEdgeDisruptionRequest(BaseModel):
    edge_id: str
    is_active: bool
    status_code: Optional[str] = "DELAYED"

# --- Route Planning Models ---

class RoutePlanRequest(BaseModel):
    origin: str
    destination: str
    transport_mode: Literal["all", "metro", "bus"] = "all"
    preference: Literal["fastest", "cheapest", "fewest_transfers", "balanced"] = "balanced"

class JourneySegment(BaseModel):
    segment_index: int
    from_stop_id: str
    from_stop_name: str
    to_stop_id: str
    to_stop_name: str
    mode: str
    line_name: str
    travel_time: int
    fare: float
    distance_km: float

class RouteOption(BaseModel):
    category: Literal["fastest", "cheapest", "fewest_transfers", "balanced"]
    title: str
    total_time_mins: int
    total_fare: float
    transfers_count: int
    total_distance_km: float
    stops_sequence: List[str]
    stops_names: List[str]
    segments: List[JourneySegment]
    lines_used: List[str]
    explanation: str
    is_feasible: bool = True
    coincides_with: List[str] = []

class RoutePlanResponse(BaseModel):
    origin: str
    origin_name: str
    destination: str
    destination_name: str
    transport_mode_filter: str
    routes: Dict[str, Optional[RouteOption]]
    active_disruptions_count: int
    notice: str = "Simulated synthetic transit data. Values are algorithmic estimates."

# --- DFA Models ---

class DfaValidationRequest(BaseModel):
    status_code: str

class DfaStepTrace(BaseModel):
    step: int
    character: str
    from_state: str
    to_state: str
    valid_step: bool

class DfaValidationResult(BaseModel):
    input_code: str
    is_accepted: bool
    final_state: str
    visited_states: List[str]
    trace: List[DfaStepTrace]
    explanation: str
    error_position: Optional[int] = None
    language_spec: str = "L = { ON_TIME, DELAYED, CANCELLED, MAINTENANCE, DIVERTED }"

class DfaSpecResponse(BaseModel):
    alphabet: List[str]
    states: List[str]
    initial_state: str
    accepting_states: List[str]
    transition_table: Dict[str, Dict[str, str]]
    language_description: str

# --- Pipeline Simulator Models ---

class PipelineSimRequest(BaseModel):
    num_requests: int = Field(ge=1, le=50, default=10, description="Workload batch size (1-50)")
    stage_durations: Dict[str, int] = Field(
        default={
            "IF_PREP": 1,
            "VAL": 1,
            "ROUTE": 3,
            "WB_RES": 1
        },
        description="Duration in simulated clock cycles for each pipeline stage"
    )

class PipelineGanttBlock(BaseModel):
    request_id: int
    stage: str
    stage_name: str
    start_cycle: int
    end_cycle: int
    is_pipelined: bool

class PipelineSimResult(BaseModel):
    num_requests: int
    stage_durations: Dict[str, int]
    sequential_cycles: int
    pipelined_cycles: int
    speedup: float
    theoretical_max_speedup: float
    sequential_throughput: float
    pipelined_throughput: float
    pipeline_efficiency_percent: float
    timeline_sequential: List[PipelineGanttBlock]
    timeline_pipelined: List[PipelineGanttBlock]
    pipeline_fill_cycles: int
    bottleneck_stage: str
    bottleneck_duration: int
    analysis: str
