# RouteWise — Testing & Quality Assurance Report

## 1. Executive Summary

- **Total Automated Tests Executed:** 35
  - **Backend Tests (Pytest):** 30 Passed / 0 Failed
  - **Frontend Tests (Vitest):** 5 Passed / 0 Failed
- **Test Pass Rate:** 100%
- **Execution Environments:**
  - Python 3.14.3, Pytest 9.1.1 on Windows
  - Node v22.18.0, Vitest 5.0.5, jsdom, React 19 Testing Library

---

## 2. Backend Test Results (Pytest)

Command executed: `python -m pytest backend/tests -v`

| Test Suite | Test Identifier | Purpose & Verification | Result |
|---|---|---|---|
| `test_graph.py` | `test_graph_construction_from_dataset` | Verifies all 20 stations and 48 edges are loaded from JSON | **PASSED** |
| `test_graph.py` | `test_graph_neighbors_and_mode_filtering` | Verifies edge retrieval and strict separation of bus and metro lines | **PASSED** |
| `test_graph.py` | `test_graph_disruption_exclusion` | Verifies disrupted edges are dynamically omitted from adjacency lists | **PASSED** |
| `test_graph.py` | `test_graph_non_negative_weight_validation` | Verifies non-negative constraints on edge travel time and fares | **PASSED** |
| `test_dijkstra.py` | `test_fastest_vs_cheapest_tradeoff` | Proves trade-off between Metro Red (6 min, $20) and Bus 101 (15 min, $7) | **PASSED** |
| `test_dijkstra.py` | `test_fewest_transfers_objective` | Verifies state-expanded graph prioritizes 0-transfer direct lines | **PASSED** |
| `test_dijkstra.py` | `test_disruption_rerouting` | Verifies algorithmic rerouting when Central-Tech metro tunnel is closed | **PASSED** |
| `test_dijkstra.py` | `test_unreachable_destination_when_isolated`| Verifies safe `is_feasible=False` handling for isolated Port Terminal | **PASSED** |
| `test_dijkstra.py` | `test_origin_equals_destination` | Verifies 400 rejection when origin and destination are identical | **PASSED** |
| `test_dijkstra.py` | `test_invalid_stop_identifiers` | Verifies graceful error when querying non-existent stations | **PASSED** |
| `test_dfa.py` | `test_dfa_accepts_valid_keywords` | Verifies acceptance of `ON_TIME`, `DELAYED`, `CANCELLED`, `MAINTENANCE`, `DIVERTED` | **PASSED** |
| `test_dfa.py` | `test_dfa_rejects_empty_string` | Verifies $\epsilon$ empty string halts in non-accepting $q_0$ | **PASSED** |
| `test_dfa.py` | `test_dfa_rejects_case_sensitivity` | Verifies lowercase characters transition to $q_{\text{trap}}$ | **PASSED** |
| `test_dfa.py` | `test_dfa_rejects_incomplete_prefixes` | Verifies incomplete prefix `'DELAY'` halts in non-accepting intermediate state | **PASSED** |
| `test_dfa.py` | `test_dfa_pinpoints_rejection_character` | Verifies error index localization for illegal characters | **PASSED** |
| `test_dfa.py` | `test_dfa_specification_and_table` | Verifies complete 5-tuple export and non-empty transition table | **PASSED** |
| `test_pipeline.py`| `test_pipeline_unit_cycle_ideal` | Verifies $T_{\text{seq}} = N \cdot K = 40$ and $T_{\text{pipe}} = K + N - 1 = 13$ | **PASSED** |
| `test_pipeline.py`| `test_pipeline_single_request` | Verifies for $N=1$, $T_{\text{seq}} == T_{\text{pipe}}$ and speedup is 1.0x | **PASSED** |
| `test_pipeline.py`| `test_pipeline_bottleneck_detection` | Verifies bottleneck stage identification and throughput limits | **PASSED** |
| `test_pipeline.py`| `test_pipeline_invalid_parameters` | Verifies validation of zero requests and negative stage cycle times | **PASSED** |
| `test_api.py` | `test_api_health` | Verifies `/api/health` returns healthy status and dataset metadata | **PASSED** |
| `test_api.py` | `test_api_stops` | Verifies `/api/stops` returns full station catalog | **PASSED** |
| `test_api.py` | `test_api_network` | Verifies `/api/network` returns annotated graph with disruption states | **PASSED** |
| `test_api.py` | `test_api_route_plan` | Verifies end-to-end Dijkstra calculation through REST API | **PASSED** |
| `test_api.py` | `test_api_route_plan_invalid_identical` | Verifies proper 400 Bad Request error response formatting | **PASSED** |
| `test_api.py` | `test_api_dfa_validate_accepted` | Verifies REST endpoint character trace for `ON_TIME` | **PASSED** |
| `test_api.py` | `test_api_dfa_validate_rejected` | Verifies REST endpoint rejection diagnostics for invalid tokens | **PASSED** |
| `test_api.py` | `test_api_dfa_spec` | Verifies REST endpoint delivery of formal 5-tuple and delta table | **PASSED** |
| `test_api.py` | `test_api_pipeline_simulate` | Verifies REST endpoint execution of cycle simulation and Gantt data | **PASSED** |
| `test_api.py` | `test_api_disruptions_flow` | Verifies scenario activation, deactivation, and network reset cycle | **PASSED** |

---

## 3. Frontend Test Results (Vitest)

Command executed: `npm test` in `frontend/`

| Test Suite | Test Identifier | Purpose & Verification | Result |
|---|---|---|---|
| `RouteCard.test.tsx` | `renders route duration, fare, and transfers` | Verifies metrics cards, duration, fare format, and line badges | **PASSED** |
| `RouteCard.test.tsx` | `displays infeasible notice when route unavailable` | Verifies graceful UI rendering when a route cannot be found | **PASSED** |
| `Navbar.test.tsx` | `renders branding and navigation tabs` | Verifies all tabs, logos, and normal status indicators render | **PASSED** |
| `Navbar.test.tsx` | `triggers setActiveTab when clicked` | Verifies user interaction switches tabs and displays disruption badge | **PASSED** |
| `DfaExplorer.test.tsx` | `renders formal 5-tuple specs and validation trace` | Verifies live trace steps, character sequence, and state labels | **PASSED** |

---

## 4. Production Build Verification

Command executed: `npm run build` in `frontend/`
- Vite TypeScript compilation: **PASSED**
- 1,942 modules transformed with 0 warnings.
- Production bundle generated cleanly:
  - `dist/index.html` (0.45 kB)
  - `dist/assets/index.css` (28.32 kB)
  - `dist/assets/index.js` (299.50 kB)
