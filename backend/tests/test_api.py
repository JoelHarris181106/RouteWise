import pytest
from starlette.testclient import TestClient
from backend.app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["total_stops"] >= 15
    assert data["total_edges"] > 20

def test_api_stops(client):
    response = client.get("/api/stops")
    assert response.status_code == 200
    stops = response.json()
    assert len(stops) >= 15
    assert any(s["id"] == "STN_CENTRAL" for s in stops)

def test_api_network(client):
    response = client.get("/api/network")
    assert response.status_code == 200
    net = response.json()
    assert "stops" in net
    assert "edges" in net

def test_api_route_plan(client):
    payload = {
        "origin": "STN_CENTRAL",
        "destination": "STN_TECH_PARK",
        "transport_mode": "all",
        "preference": "fastest"
    }
    response = client.post("/api/routes/plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["origin"] == "STN_CENTRAL"
    assert "fastest" in data["routes"]
    assert data["routes"]["fastest"]["is_feasible"] is True
    assert data["routes"]["fastest"]["total_time_mins"] > 0

def test_api_route_plan_invalid_identical(client):
    payload = {
        "origin": "STN_CENTRAL",
        "destination": "STN_CENTRAL",
        "transport_mode": "all"
    }
    response = client.post("/api/routes/plan", json=payload)
    assert response.status_code == 400
    assert "cannot be identical" in response.json()["detail"]

def test_api_dfa_validate_accepted(client):
    response = client.post("/api/dfa/validate", json={"status_code": "ON_TIME"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_accepted"] is True
    assert len(data["trace"]) == 7

def test_api_dfa_validate_rejected(client):
    response = client.post("/api/dfa/validate", json={"status_code": "INVALID_CODE"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_accepted"] is False
    assert data["error_position"] is not None

def test_api_dfa_spec(client):
    response = client.get("/api/dfa/spec")
    assert response.status_code == 200
    data = response.json()
    assert "alphabet" in data
    assert "transition_table" in data

def test_api_pipeline_simulate(client):
    payload = {
        "num_requests": 6,
        "stage_durations": {
            "IF_PREP": 1,
            "VAL": 1,
            "ROUTE": 3,
            "WB_RES": 1
        }
    }
    response = client.post("/api/pipeline/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["sequential_cycles"] > data["pipelined_cycles"]
    assert data["speedup"] > 1.0
    assert len(data["timeline_pipelined"]) == 6 * 4

def test_api_disruptions_flow(client):
    # 1. List disruptions
    resp = client.get("/api/disruptions")
    assert resp.status_code == 200
    disruptions = resp.json()
    assert len(disruptions) > 0
    test_id = disruptions[0]["id"]

    # 2. Activate disruption
    resp = client.post("/api/disruptions", json={"disruption_id": test_id, "activate": True})
    assert resp.status_code == 200
    assert resp.json()["is_active"] is True

    # 3. Deactivate disruption
    resp = client.delete(f"/api/disruptions/{test_id}")
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False

    # 4. Reset disruptions
    resp = client.post("/api/disruptions/reset")
    assert resp.status_code == 200
