import pytest
from backend.app.models.schemas import TransportNetwork, Stop, Edge
from backend.app.algorithms.graph import TransitGraph
from backend.app.services.network_service import network_service_instance

def test_graph_construction_from_dataset():
    net = network_service_instance.get_network()
    graph = TransitGraph(net)
    assert len(graph.stops) == len(net.stops)
    assert len(graph.edges) == len(net.edges)
    assert "STN_CENTRAL" in graph.stops
    assert "STN_AIRPORT" in graph.stops

def test_graph_neighbors_and_mode_filtering():
    net = network_service_instance.get_network()
    graph = TransitGraph(net)
    
    all_neighbors = graph.get_neighbors("STN_CENTRAL", mode_filter="all")
    metro_neighbors = graph.get_neighbors("STN_CENTRAL", mode_filter="metro")
    bus_neighbors = graph.get_neighbors("STN_CENTRAL", mode_filter="bus")

    assert len(all_neighbors) == len(metro_neighbors) + len(bus_neighbors)
    assert all(e.mode == "metro" for e in metro_neighbors)
    assert all(e.mode == "bus" for e in bus_neighbors)

def test_graph_disruption_exclusion():
    net = network_service_instance.get_network()
    # Disrupt Metro Red connection Central -> Tech Park
    disrupted_edge = "EDGE_M1_03"
    graph = TransitGraph(net, active_disruptions_edges={disrupted_edge})
    
    central_neighbors = graph.get_neighbors("STN_CENTRAL", mode_filter="all")
    assert not any(e.id == disrupted_edge for e in central_neighbors)

def test_graph_non_negative_weight_validation():
    from pydantic import ValidationError
    with pytest.raises((ValidationError, ValueError)):
        invalid_net = TransportNetwork(
            network_name="Invalid Test Network",
            version="0.1",
            description="Testing negative weights",
            stops=[
                Stop(id="A", name="Stop A", zone=1, x=0, y=0, lines=[]),
                Stop(id="B", name="Stop B", zone=1, x=1, y=1, lines=[])
            ],
            edges=[
                Edge(id="E1", source="A", target="B", mode="metro", line_name="M", travel_time=-5, fare=10.0, distance_km=1.0)
            ]
        )
        TransitGraph(invalid_net)
