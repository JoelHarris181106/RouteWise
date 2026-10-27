# RouteWise — CPU Pipeline Simulator Analysis (COA Integration)

## 1. Subject Overview
- **Subject:** Computer Organization and Architecture (COA)
- **Module Focus:** Instruction Pipelining, Throughput, Latency, Speedup, Pipeline Hazards, Gantt Scheduling.
- **Component in RouteWise:** Performance Simulation Engine (`backend/app/pipeline/`).

---

## 2. Pipeline Stage Definitions

The RouteWise simulator conceptualizes the processing of incoming route planning queries as a 4-stage processing pipeline:

```
+---------------+     +---------------+     +---------------+     +---------------+
| Stage 1: PREP | --> |  Stage 2: VAL | --> | Stage 3: ROUTE| --> | Stage 4: RES  |
| Request Parse |     | DFA Validator |     | Dijkstra Heap |     | Serialization |
+---------------+     +---------------+     +---------------+     +---------------+
```

1. **Stage 1: Input & Request Preparation (`IF_PREP`)**
   - Corresponds to Instruction Fetch (IF) / Decode in a classic RISC pipeline.
   - Parses HTTP payload, extracts origin/destination identifiers, and applies mode filtering parameters.
2. **Stage 2: Input Validation (`VAL`)**
   - Validates existence of station identifiers and runs the DFA validator on operational status codes.
3. **Stage 3: Route Calculation (`ROUTE`)**
   - Corresponds to the Execution (EX) stage.
   - Graph adjacency traversal, min-heap priority queue insertions/deletions, and distance relaxations.
4. **Stage 4: Result Preparation (`WB_RES`)**
   - Corresponds to Memory / Write-Back (WB).
   - Reconstructs predecessor edge paths, calculates fare sums, formats JSON segments, and returns the response.

---

## 3. Mathematical Execution Models

Let:
- $N$: Total number of requests in the workload batch ($N \ge 1$).
- $K$: Number of pipeline stages ($K = 4$).
- $d_k$: Processing duration of stage $k$ in clock cycles ($d_k \ge 1$).

### 3.1 Sequential Execution Model
In sequential processing, each request completes all $K$ stages before the next request begins:
$$T_{\text{seq}} = N \times \sum_{k=1}^K d_k$$

### 3.2 Pipelined Execution Model (Cycle-Accurate Discrete Recurrence)
In a synchronous pipelined architecture, hardware stage resources cannot be shared simultaneously by two requests (structural hazard). Furthermore, a request cannot enter stage $k$ until its previous stage $k-1$ is complete.

For request $r \in \{1, \dots, N\}$ and stage $k \in \{0, \dots, K-1\}$:
$$\text{start}(r, k) = \max\Big(\text{end}(r, k-1), \, \text{end}(r-1, k)\Big)$$
$$\text{end}(r, k) = \text{start}(r, k) + d_k$$
With base boundary conditions:
- $\text{end}(r, -1) = 0$ (request is available at cycle 0)
- $\text{end}(0, k) = 0$ (stage resource is initially idle)

Total pipelined completion time is:
$$T_{\text{pipe}} = \text{end}(N, K-1)$$

### 3.3 Ideal Unit-Cycle Pipeline ($d_k = 1, \, \forall k$)
When all stages take exactly 1 clock cycle:
$$T_{\text{seq}} = N \times K$$
$$T_{\text{pipe}} = K + N - 1$$
Example for $N = 10, \, K = 4$:
- $T_{\text{seq}} = 10 \times 4 = 40$ cycles.
- $T_{\text{pipe}} = 4 + 10 - 1 = 13$ cycles.
- Speedup $S = \frac{40}{13} \approx 3.077\text{x}$.

---

## 4. Derived Architectural Performance Metrics

### 4.1 Speedup ($S$)
$$S = \frac{T_{\text{seq}}}{T_{\text{pipe}}}$$
The theoretical maximum speedup in an ideal pipeline with uniform stages is bounded by $K$:
$$\lim_{N \to \infty} S = K$$
For non-uniform stage durations, the maximum speedup is bounded by the bottleneck stage:
$$S_{\max} = \frac{\sum_{k=1}^K d_k}{\max_k d_k}$$

### 4.2 Throughput ($TP$)
Throughput represents the rate of completed requests per clock cycle:
$$TP_{\text{seq}} = \frac{N}{T_{\text{seq}}} = \frac{1}{\sum_{k=1}^K d_k}$$
$$TP_{\text{pipe}} = \frac{N}{T_{\text{pipe}}}$$
As $N$ becomes large, pipelined throughput approaches $\frac{1}{\max_k d_k}$.

### 4.3 Pipeline Efficiency ($E$)
Efficiency measures the percentage of hardware stage utilization:
$$E = \frac{S}{K} \times 100\%$$

---

## 5. Architectural Hazards & Educational Insights

1. **Pipeline Fill Latency:**
   - The first completed request always requires $\sum_{k=1}^K d_k$ cycles. Pipelining does **not** reduce the execution latency of an individual request; it improves **throughput** across batches by overlapping execution.
2. **Structural Hazards & Bottlenecks:**
   - If the Dijkstra routing stage takes $d_{\text{ROUTE}} = 5$ cycles while other stages take 1 cycle, previous requests stall in stage buffers waiting for the routing engine to become free.
   - This directly demonstrates Amdahl's Law and illustrates why computer architects optimize stage balancing and superscalar execution units.
