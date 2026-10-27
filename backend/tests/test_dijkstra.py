import pytest
from backend.app.services.network_service import network_service_instance
from backend.app.algorithms.graph import TransitGraph
from backend.app.algorithms.routing import RoutePlanner
from backend.app.algorithms.dijkstra import dijkstra_standard, dijkstra_fewest_transfers

@pytest.fixture
def base_graph():
    net = network_service_instance.get_network()
    return TransitGraph(net)

def test_fastest_vs_cheapest_tradeoff(base_graph):
    planner = RoutePlanner(base_graph)
    # Between Central and Tech Park:
    # Metro Red: 6 min, fare 20
    # Bus 101: 15 min, fare 7
    res = planner.plan_journey("STN_CENTRAL", "STN_TECH_PARK", mode_filter="all")
    
    fastest = res.routes["fastest"]
    cheapest = res.routes["cheapest"]

    assert fastest is not None
    assert cheapest is not None

    # Fastest must take <= time than cheapest
    assert fastest.total_time_mins <= cheapest.total_time_mins
    # Cheapest must cost <= fare than fastest
    assert cheapest.total_fare <= fastest.total_fare

    # In our synthetic dataset, Metro Red is 6 mins (fare 20), Bus is 15 mins (fare 7)
    assert fastest.total_time_mins == 6
    assert cheapest.total_fare == 7.0

def test_fewest_transfers_objective(base_graph):
    # From West Hills to Innovation Campus:
    # Direct Metro Red line: 0 transfers
    planner = RoutePlanner(base_graph)
    res = planner.plan_journey("STN_WEST_HILLS", "STN_INNOVATION", mode_filter="all")
    fewest = res.routes["fewest_transfers"]
    
    assert fewest is not None
    assert fewest.transfers_count == 0
    assert fewest.lines_used == ["Metro Red (M1)"]

def test_disruption_rerouting():
    net = network_service_instance.get_network()
    # Disrupt direct Metro Red connection between Central and Tech Park
    graph_disrupted = TransitGraph(net, active_disruptions_edges={"EDGE_M1_03", "EDGE_M1_03_REV"})
    planner = RoutePlanner(graph_disrupted)
    
    res = planner.plan_journey("STN_CENTRAL", "STN_TECH_PARK", mode_filter="all")
    fastest = res.routes["fastest"]
    
    assert fastest is not None
    # Cannot use disrupted edge EDGE_M1_03
    for seg in fastest.segments:
        assert not (seg.from_stop_id == "STN_CENTRAL" and seg.to_stop_id == "STN_TECH_PARK" and seg.mode == "metro")
    # It must reroute via Bus 101 or alternate transfers
    assert "Route 101" in fastest.lines_used or len(fastest.segments) > 1

def test_unreachable_destination_when_isolated():
    net = network_service_instance.get_network()
    # Disrupt the single bridge to Port Terminal
    graph_disrupted = TransitGraph(net, active_disruptions_edges={"EDGE_M3_01", "EDGE_M3_01_REV"})
    planner = RoutePlanner(graph_disrupted)
    
    res = planner.plan_journey("STN_CENTRAL", "STN_PORT_TERMINAL", mode_filter="all")
    # All route options should be marked infeasible or None
    for cat, opt in res.routes.items():
        assert opt is None or opt.is_feasible is False

def test_origin_equals_destination(base_graph):
    planner = RoutePlanner(base_graph)
    with pytest.raises(ValueError, match="cannot be identical"):
        planner.plan_journey("STN_CENTRAL", "STN_CENTRAL")

def test_invalid_stop_identifiers(base_graph):
    planner = RoutePlanner(base_graph)
    with pytest.raises(ValueError, match="not recognized"):
        planner.plan_journey("NON_EXISTENT_STATION", "STN_CENTRAL")
