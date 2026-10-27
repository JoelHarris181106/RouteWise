# RouteWise — API Documentation

The RouteWise backend exposes a clean, typed RESTful API built with FastAPI and validated using Pydantic.

- **Base URL:** `http://127.0.0.1:8000`
- **Interactive OpenAPI Documentation (Swagger UI):** `http://127.0.0.1:8000/docs`
- **Alternative ReDoc UI:** `http://127.0.0.1:8000/redoc`

---

## 1. System & Diagnostic Endpoints

### `GET /api/health`
Returns system health, total stops, total edges, and active disruptions count.

**Response `200 OK`:**
```json
{
  "status": "HEALTHY",
  "service": "RouteWise Multi-Modal Transit Engine",
  "version": "1.0.0",
  "total_stops": 20,
  "total_edges": 48,
  "active_disrupted_edges": 0,
  "active_disrupted_stops": 0,
  "dataset_name": "MetroCity Synthetic Transit Network"
}
```

---

## 2. Transport Network Endpoints

### `GET /api/stops`
Returns the list of all 20 transit stops with coordinates, zones, and connecting lines.

### `GET /api/network`
Returns the entire transport network model (stops and edges) dynamically annotated with current disruption statuses.

---

## 3. Disruption Management Endpoints

### `GET /api/disruptions`
Lists all predefined disruption scenarios and their active status.

### `POST /api/disruptions`
Activates or deactivates a predefined disruption scenario.

**Request Body:**
```json
{
  "disruption_id": "DISRUPT_RED_TUNNEL",
  "activate": true
}
```

### `DELETE /api/disruptions/{disruption_id}`
Deactivates a specific disruption scenario.

### `POST /api/disruptions/custom`
Manually suspends or restores an individual transit edge.

**Request Body:**
```json
{
  "edge_id": "EDGE_M1_03",
  "is_active": false,
  "status_code": "CANCELLED"
}
```

### `POST /api/disruptions/reset`
Clears all active disruptions across the network, restoring normal operations.

---

## 4. Route Planning Endpoints (DAA Dijkstra)

### `POST /api/routes/plan`
Executes Dijkstra's algorithm and computes the four recommendation categories: `fastest`, `cheapest`, `fewest_transfers`, and `balanced`.

**Request Body:**
```json
{
  "origin": "STN_CENTRAL",
  "destination": "STN_TECH_PARK",
  "transport_mode": "all",
  "preference": "balanced"
}
```

**Response `200 OK`:**
```json
{
  "origin": "STN_CENTRAL",
  "origin_name": "Central Station",
  "destination": "STN_TECH_PARK",
  "destination_name": "Tech Park Hub",
  "transport_mode_filter": "all",
  "routes": {
    "fastest": {
      "category": "fastest",
      "title": "Fastest Journey",
      "total_time_mins": 6,
      "total_fare": 20.0,
      "transfers_count": 0,
      "total_distance_km": 4.1,
      "stops_sequence": ["STN_CENTRAL", "STN_TECH_PARK"],
      "stops_names": ["Central Station", "Tech Park Hub"],
      "segments": [
        {
          "segment_index": 1,
          "from_stop_id": "STN_CENTRAL",
          "from_stop_name": "Central Station",
          "to_stop_id": "STN_TECH_PARK",
          "to_stop_name": "Tech Park Hub",
          "mode": "metro",
          "line_name": "Metro Red (M1)",
          "travel_time": 6,
          "fare": 20.0,
          "distance_km": 4.1
        }
      ],
      "lines_used": ["Metro Red (M1)"],
      "explanation": "Calculated using Dijkstra's algorithm with travel time edge weights.",
      "is_feasible": true,
      "coincides_with": ["fewest_transfers"]
    },
    "cheapest": {
      "category": "cheapest",
      "title": "Cheapest Journey",
      "total_time_mins": 15,
      "total_fare": 7.0,
      "transfers_count": 0,
      "total_distance_km": 4.4,
      "stops_sequence": ["STN_CENTRAL", "STN_TECH_PARK"],
      "stops_names": ["Central Station", "Tech Park Hub"],
      "segments": [
        {
          "segment_index": 1,
          "from_stop_id": "STN_CENTRAL",
          "from_stop_name": "Central Station",
          "to_stop_id": "STN_TECH_PARK",
          "to_stop_name": "Tech Park Hub",
          "mode": "bus",
          "line_name": "Route 101",
          "travel_time": 15,
          "fare": 7.0,
          "distance_km": 4.4
        }
      ],
      "lines_used": ["Route 101"],
      "explanation": "Calculated using Dijkstra's algorithm with fare weights.",
      "is_feasible": true,
      "coincides_with": []
    },
    "fewest_transfers": { "..." : "..." },
    "balanced": { "..." : "..." }
  },
  "active_disruptions_count": 0,
  "notice": "Simulated synthetic transit data. Values are algorithmic estimates."
}
```

**Error Handling `400 Bad Request`:**
```json
{
  "error": "Bad Request",
  "detail": "Origin and destination stops cannot be identical."
}
```

---

## 5. Formal Automata Endpoints (FLAT DFA)

### `POST /api/dfa/validate`
Validates a status code string character-by-character using the formal DFA.

**Request Body:**
```json
{
  "status_code": "ON_TIME"
}
```

**Response `200 OK` (Accepted):**
```json
{
  "input_code": "ON_TIME",
  "is_accepted": true,
  "final_state": "q_ACC_ON_TIME",
  "visited_states": ["q0", "q_O", "q_ON", "q_ON_", "q_ON_T", "q_ON_TI", "q_ON_TIM", "q_ACC_ON_TIME"],
  "trace": [
    { "step": 1, "character": "O", "from_state": "q0", "to_state": "q_O", "valid_step": true },
    { "step": 2, "character": "N", "from_state": "q_O", "to_state": "q_ON", "valid_step": true },
    { "step": 3, "character": "_", "from_state": "q_ON", "to_state": "q_ON_", "valid_step": true },
    { "step": 4, "character": "T", "from_state": "q_ON_", "to_state": "q_ON_T", "valid_step": true },
    { "step": 5, "character": "I", "from_state": "q_ON_T", "to_state": "q_ON_TI", "valid_step": true },
    { "step": 6, "character": "M", "from_state": "q_ON_TI", "to_state": "q_ON_TIM", "valid_step": true },
    { "step": 7, "character": "E", "from_state": "q_ON_TIM", "to_state": "q_ACC_ON_TIME", "valid_step": true }
  ],
  "explanation": "Accepted: Input 'ON_TIME' completed execution in accepting state 'q_ACC_ON_TIME'. It is a recognized valid transit status code.",
  "error_position": null,
  "language_spec": "L = { ON_TIME, DELAYED, CANCELLED, MAINTENANCE, DIVERTED }"
}
```

### `GET /api/dfa/spec`
Returns the formal 5-tuple specification $M = (Q, \Sigma, \delta, q_0, F)$ and complete transition table.

---

## 6. CPU Pipeline Simulation Endpoints (COA)

### `POST /api/pipeline/simulate`
Simulates sequential and pipelined execution of a query workload.

**Request Body:**
```json
{
  "num_requests": 8,
  "stage_durations": {
    "IF_PREP": 1,
    "VAL": 1,
    "ROUTE": 3,
    "WB_RES": 1
  }
}
```

**Response `200 OK`:**
```json
{
  "num_requests": 8,
  "stage_durations": { "IF_PREP": 1, "VAL": 1, "ROUTE": 3, "WB_RES": 1 },
  "sequential_cycles": 48,
  "pipelined_cycles": 27,
  "speedup": 1.778,
  "theoretical_max_speedup": 2.0,
  "sequential_throughput": 0.1667,
  "pipelined_throughput": 0.2963,
  "pipeline_efficiency_percent": 44.45,
  "pipeline_fill_cycles": 6,
  "bottleneck_stage": "3. Dijkstra Routing",
  "bottleneck_duration": 3,
  "timeline_sequential": [ "..." ],
  "timeline_pipelined": [ "..." ],
  "analysis": "Under sequential processing, 8 requests require 48 cycles..."
}
```
