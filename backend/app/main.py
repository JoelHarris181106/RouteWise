from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any

from .config import API_TITLE, API_VERSION, API_DESCRIPTION, CORS_ORIGINS
from .models.schemas import (
    TransportNetwork,
    Stop,
    Edge,
    Disruption,
    DisruptionToggleRequest,
    CustomEdgeDisruptionRequest,
    RoutePlanRequest,
    RoutePlanResponse,
    DfaValidationRequest,
    DfaValidationResult,
    DfaSpecResponse,
    PipelineSimRequest,
    PipelineSimResult,
)
from .services.network_service import network_service_instance
from .services.disruption_service import disruption_service_instance
from .algorithms.graph import TransitGraph
from .algorithms.routing import RoutePlanner
from .dfa.automaton import dfa_instance
from .pipeline.simulator import pipeline_simulator_instance

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handling
@app.exception_handler(ValueError)
async def value_error_handler(request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": "Bad Request", "detail": str(exc)}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal Server Error", "detail": str(exc)}
    )

# --- Health & Diagnostic Endpoints ---

@app.get("/api/health", tags=["System"])
def get_health() -> Dict[str, Any]:
    network = network_service_instance.get_network()
    active_edges = disruption_service_instance.get_active_disrupted_edges()
    active_stops = disruption_service_instance.get_active_disrupted_stops()
    return {
        "status": "HEALTHY",
        "service": "RouteWise Multi-Modal Transit Engine",
        "version": API_VERSION,
        "total_stops": len(network.stops),
        "total_edges": len(network.edges),
        "active_disrupted_edges": len(active_edges),
        "active_disrupted_stops": len(active_stops),
        "dataset_name": network.network_name
    }

# --- Transport Network Endpoints ---

@app.get("/api/stops", response_model=List[Stop], tags=["Network"])
def get_stops():
    return network_service_instance.get_stops()

@app.get("/api/network", response_model=TransportNetwork, tags=["Network"])
def get_network():
    """Returns the transport network annotated with live disruption status."""
    raw_net = network_service_instance.get_network()
    disrupted_edges = disruption_service_instance.get_active_disrupted_edges()
    disrupted_stops = disruption_service_instance.get_active_disrupted_stops()

    # Annotate stops
    stops_copy = []
    for s in raw_net.stops:
        s_dict = s.model_dump()
        if s.id in disrupted_stops:
            s_dict["status"] = "CANCELLED"
        stops_copy.append(Stop(**s_dict))

    # Annotate edges
    edges_copy = []
    for e in raw_net.edges:
        e_dict = e.model_dump()
        if e.id in disrupted_edges:
            e_dict["is_active"] = False
            e_dict["status"] = "CANCELLED"
        edges_copy.append(Edge(**e_dict))

    return TransportNetwork(
        network_name=raw_net.network_name,
        version=raw_net.version,
        description=raw_net.description,
        stops=stops_copy,
        edges=edges_copy
    )

# --- Disruption Management Endpoints ---

@app.get("/api/disruptions", response_model=List[Disruption], tags=["Disruptions"])
def list_disruptions():
    return disruption_service_instance.get_all_disruptions()

@app.post("/api/disruptions", response_model=Disruption, tags=["Disruptions"])
def toggle_disruption(payload: DisruptionToggleRequest):
    return disruption_service_instance.set_disruption_state(payload.disruption_id, payload.activate)

@app.delete("/api/disruptions/{disruption_id}", response_model=Disruption, tags=["Disruptions"])
def deactivate_disruption(disruption_id: str):
    return disruption_service_instance.set_disruption_state(disruption_id, False)

@app.post("/api/disruptions/custom", tags=["Disruptions"])
def toggle_custom_edge(payload: CustomEdgeDisruptionRequest):
    return disruption_service_instance.toggle_custom_edge(
        edge_id=payload.edge_id,
        is_active=payload.is_active,
        status_code=payload.status_code or "DELAYED"
    )

@app.post("/api/disruptions/reset", tags=["Disruptions"])
def reset_all_disruptions():
    disruption_service_instance.reset_all_disruptions()
    return {"message": "All simulated disruptions cleared successfully. Network restored to normal."}

# --- Route Planning Endpoints (DAA Dijkstra) ---

@app.post("/api/routes/plan", response_model=RoutePlanResponse, tags=["DAA Routing"])
def plan_journey(payload: RoutePlanRequest):
    network = network_service_instance.get_network()
    active_disrupted_edges = disruption_service_instance.get_active_disrupted_edges()
    active_disrupted_stops = disruption_service_instance.get_active_disrupted_stops()

    # Build graph with live disruptions excluded
    graph = TransitGraph(
        network=network,
        active_disruptions_edges=active_disrupted_edges,
        active_disrupted_stops=active_disrupted_stops
    )

    planner = RoutePlanner(graph)
    return planner.plan_journey(
        origin=payload.origin,
        destination=payload.destination,
        mode_filter=payload.transport_mode,
        preference=payload.preference
    )

# --- DFA Status Code Validation Endpoints (FLAT Automata) ---

@app.post("/api/dfa/validate", response_model=DfaValidationResult, tags=["FLAT Automata"])
def validate_status_code(payload: DfaValidationRequest):
    return dfa_instance.validate(payload.status_code)

@app.get("/api/dfa/spec", response_model=DfaSpecResponse, tags=["FLAT Automata"])
def get_dfa_specification():
    return dfa_instance.get_specification()

# --- CPU Pipeline Simulation Endpoints (COA Pipelining) ---

@app.post("/api/pipeline/simulate", response_model=PipelineSimResult, tags=["COA Pipelining"])
def simulate_pipeline(payload: PipelineSimRequest):
    return pipeline_simulator_instance.simulate(
        num_requests=payload.num_requests,
        stage_durations=payload.stage_durations
    )
