# RouteWise — Algorithm Analysis (DAA Integration)

## 1. Subject Overview
- **Subject:** Design and Analysis of Algorithms (DAA)
- **Module Focus:** Graph Algorithms, Single-Source Shortest Path (SSSP), Priority Queues, Multi-Criteria Optimization.
- **Component in RouteWise:** Multi-Modal Route Planning Engine (`backend/app/algorithms/`).

---

## 2. Graph Formulation & Network Topology

The public transportation network is modeled as a directed, multi-modal weighted graph:
$$G = (V, E)$$

### 2.1 Vertex Representation ($V$)
Each vertex $v \in V$ represents a physical transit station or interchange:
- $v.\text{id}$: Unique station identifier (e.g., `STN_CENTRAL`).
- $v.\text{name}$: Fictional station name (e.g., `Central Station`).
- $v.\text{zone}$: Fare zone tier ($1, 2, 3$).
- $v.\text{coordinates}$: Schematic layout $(x, y)$ coordinates.
- $v.\text{is\_transfer\_station}$: Boolean flag denoting multimodal hub status.

### 2.2 Edge Representation ($E$)
Each directed edge $e = (u, v) \in E$ represents a directional connection from station $u$ to station $v$:
- $e.\text{id}$: Edge identifier (e.g., `EDGE_M1_03`).
- $e.\text{mode} \in \{\text{'metro'}, \text{'bus'}\}$: Transit mode.
- $e.\text{line\_name}$: Route or line identifier (e.g., `Metro Red (M1)`, `Route 101`).
- $e.\text{travel\_time} \in \mathbb{Z}_{\ge 0}$: Duration in minutes.
- $e.\text{fare} \in \mathbb{R}_{\ge 0}$: Cost in currency tokens.
- $e.\text{distance\_km} \in \mathbb{R}_{\ge 0}$: Physical distance in kilometers.
- $e.\text{is\_active} \in \{\text{True}, \text{False}\}$: Dynamic operational availability.

### 2.3 Non-Negativity Constraint
Dijkstra's algorithm relies on the greedy property: once a vertex is settled from the priority queue, its shortest path distance is finalized. This property strictly requires all edge weights to be non-negative:
$$\forall e \in E, \quad w(e) \ge 0$$
Both the Pydantic data schemas and graph construction routines strictly enforce:
$$\text{travel\_time}(e) \ge 0 \quad \text{and} \quad \text{fare}(e) \ge 0$$
Any attempt to insert a negative edge raises a validation error.

---

## 3. Implemented Route Objectives

RouteWise calculates four distinct route categories rather than a single generic path:

### 3.1 Fastest Route (Minimum Travel Time)
- **Weight Function:** $w_t(e) = e.\text{travel\_time}$
- **Objective:**
  $$\min \sum_{e \in P} e.\text{travel\_time}$$
- **Algorithm:** Standard Dijkstra with min-heap priority queue.
- **Characteristics:** Prioritizes high-speed metro lines over surface buses.

### 3.2 Cheapest Route (Minimum Fare)
- **Weight Function:** $w_f(e) = e.\text{fare}$
- **Objective:**
  $$\min \sum_{e \in P} e.\text{fare}$$
- **Algorithm:** Standard Dijkstra with min-heap priority queue.
- **Characteristics:** Prefers economical municipal bus services (e.g., Route 101 fare $7 vs Metro Red fare $20).

### 3.3 Fewest-Transfers Route (State-Expanded Graph)
In public transit networks, minimizing transfers is **not** equivalent to minimizing hop count (number of stations visited). Riding a single metro line across 8 stations involves 0 transfers, whereas taking a bus for 1 stop and switching to a metro line involves 1 transfer despite visiting fewer intermediate stations.

To model this correctly, we define an **expanded state graph**:
$$V' = V \times (L \cup \{\text{None}\})$$
Where $L$ is the set of all transit lines. Each state is a tuple $(u, \ell)$, where $u$ is the current station and $\ell$ is the currently boarded transit line.

- **Transition Cost Formulation:**
  When traversing edge $e = (u, v)$ on line $\ell_{\text{next}}$:
  $$\text{Transfer Penalty} = \begin{cases} 0 & \text{if } \ell = \text{None} \text{ (initial boarding)} \\ 0 & \text{if } \ell = \ell_{\text{next}} \text{ (continuing on same line)} \\ 10{,}000 & \text{if } \ell \neq \ell_{\text{next}} \text{ (transferring lines)} \end{cases}$$
- **Composite State Weight:**
  $$w_{\text{transfer\_state}} = \text{Transfer Penalty} + e.\text{travel\_time}$$
- **Optimality:** Because $10{,}000 > \sum_{e \in E} e.\text{travel\_time}$, minimizing this state cost strictly minimizes the global number of transfers, using total travel time solely as a tie-breaker.

### 3.4 Balanced Journey (Multi-Criteria Compromise)
Rather than naively adding minutes and dollars (which suffer from dimensional mismatch), candidate paths are evaluated using a normalized multi-criteria scoring function:
$$\text{Score}(P) = w_t \cdot \frac{T(P) - T_{\min}}{T_{\max} - T_{\min} + \epsilon} + w_c \cdot \frac{C(P) - C_{\min}}{C_{\max} - C_{\min} + \epsilon} + w_{tr} \cdot \frac{TR(P) - TR_{\min}}{TR_{\max} - TR_{\min} + \epsilon}$$
Where:
- $w_t = 0.45$ (Travel time weight)
- $w_c = 0.35$ (Fare cost weight)
- $w_{tr} = 0.20$ (Transfers count weight)
- $\epsilon = 10^{-6}$ (Zero-division guard)

---

## 4. Complexity Analysis

| Component | Metric | Formulation | Note |
|---|---|---|---|
| Adjacency List Construction | Time | $O(\|V\| + \|E\|)$ | Linear pass over vertices and edges |
| Adjacency List Storage | Space | $O(\|V\| + \|E\|)$ | Scalable sparse graph representation |
| Standard Dijkstra (Fastest / Cheapest) | Time | $O((\|V\| + \|E\|) \log \|V\|)$ | Binary min-heap operations |
| State-Expanded Dijkstra (Fewest Transfers) | Time | $O((\|V\| \cdot \|L\| + \|E\|) \log (\|V\| \cdot \|L\|))$ | $\|L\| = 7$ lines in synthetic network |
| Path Reconstruction | Time | $O(\|V\|)$ | Backtracking predecessor pointers |
| Overall Query Latency | Time | $< 2$ milliseconds | Executed in-memory |

---

## 5. Disruption Rerouting & Failure Modes
When simulated disruptions occur:
1. Disrupted edges are excluded from `graph.adjacency`.
2. Disrupted stations have all incident edges pruned.
3. If no path connects origin to destination (e.g. `STN_PORT_TERMINAL` viaduct disruption), Dijkstra's algorithm exhausts the priority queue and returns `None`.
4. The system safely returns an explicit `is_feasible = False` response with explanatory diagnostics without application crashes.
