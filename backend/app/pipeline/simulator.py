from typing import Dict, List, Tuple
from ..models.schemas import PipelineSimResult, PipelineGanttBlock

STAGE_KEYS = ["IF_PREP", "VAL", "ROUTE", "WB_RES"]
STAGE_DISPLAY_NAMES = {
    "IF_PREP": "1. Request Prep",
    "VAL": "2. DFA Validation",
    "ROUTE": "3. Dijkstra Routing",
    "WB_RES": "4. Result Prep"
}

class PipelineSimulator:
    """
    Simulates Sequential vs Pipelined execution of transit route planning requests.
    Models instruction pipelining concepts from Computer Organization & Architecture (COA).
    """

    def __init__(self):
        self.stage_keys = STAGE_KEYS
        self.stage_names = STAGE_DISPLAY_NAMES

    def simulate(self, num_requests: int, stage_durations: Dict[str, int]) -> PipelineSimResult:
        if num_requests < 1:
            raise ValueError("Workload must contain at least 1 request.")

        # Sanitize and validate stage durations
        durations: Dict[str, int] = {}
        for k in self.stage_keys:
            d = stage_durations.get(k, 1)
            if d < 1:
                raise ValueError(f"Duration for stage '{k}' must be at least 1 cycle. Got {d}.")
            durations[k] = d

        num_stages = len(self.stage_keys)
        sum_durations = sum(durations[k] for k in self.stage_keys)

        # 1. Sequential Execution Timeline
        timeline_seq: List[PipelineGanttBlock] = []
        current_seq_cycle = 0

        for req_id in range(1, num_requests + 1):
            for stage_idx, stage_key in enumerate(self.stage_keys):
                dur = durations[stage_key]
                start_c = current_seq_cycle
                end_c = start_c + dur
                timeline_seq.append(PipelineGanttBlock(
                    request_id=req_id,
                    stage=stage_key,
                    stage_name=self.stage_names[stage_key],
                    start_cycle=start_c,
                    end_cycle=end_c,
                    is_pipelined=False
                ))
                current_seq_cycle = end_c

        total_seq_cycles = current_seq_cycle

        # 2. Pipelined Execution Timeline
        # Recurrence: start(r, k) = max(end(r, k-1), end(r-1, k))
        timeline_pipe: List[PipelineGanttBlock] = []
        # stage_end_times[k] tracks when stage k becomes free from previous request
        stage_free_cycle: Dict[int, int] = {k: 0 for k in range(num_stages)}
        # req_prev_stage_end[r] tracks when request r finishes stage k-1
        req_prev_stage_end: Dict[int, int] = {r: 0 for r in range(1, num_requests + 1)}

        for req_id in range(1, num_requests + 1):
            for stage_idx, stage_key in enumerate(self.stage_keys):
                dur = durations[stage_key]
                prev_stage_done = req_prev_stage_end[req_id]
                stage_available = stage_free_cycle[stage_idx]

                # Request can only start when its previous stage is done AND this stage resource is free
                start_c = max(prev_stage_done, stage_available)
                end_c = start_c + dur

                timeline_pipe.append(PipelineGanttBlock(
                    request_id=req_id,
                    stage=stage_key,
                    stage_name=self.stage_names[stage_key],
                    start_cycle=start_c,
                    end_cycle=end_c,
                    is_pipelined=True
                ))

                # Update states
                req_prev_stage_end[req_id] = end_c
                stage_free_cycle[stage_idx] = end_c

        total_pipe_cycles = stage_free_cycle[num_stages - 1]

        # Calculate COA Metrics
        speedup = round(total_seq_cycles / total_pipe_cycles, 3) if total_pipe_cycles > 0 else 0.0
        seq_throughput = round(num_requests / total_seq_cycles, 4) if total_seq_cycles > 0 else 0.0
        pipe_throughput = round(num_requests / total_pipe_cycles, 4) if total_pipe_cycles > 0 else 0.0
        
        # Max theoretical speedup: bounded by K stages or sum(d) / max(d)
        max_stage_dur = max(durations.values())
        theoretical_max = round(sum_durations / max_stage_dur, 2)
        efficiency = round((speedup / num_stages) * 100, 2)

        # Bottleneck detection
        bottleneck_stage = max(durations.items(), key=lambda item: item[1])[0]
        bottleneck_dur = durations[bottleneck_stage]
        pipeline_fill_time = sum_durations

        analysis = (
            f"Under sequential processing, {num_requests} requests require {total_seq_cycles} cycles "
            f"({num_requests} × {sum_durations} cycles). "
            f"With pipelined overlapping, total runtime is reduced to {total_pipe_cycles} cycles, "
            f"achieving a speedup of {speedup}x and increasing throughput from {seq_throughput} to {pipe_throughput} requests/cycle. "
            f"Stage '{self.stage_names[bottleneck_stage]}' is the bottleneck ({bottleneck_dur} cycles). "
            f"Pipeline fill latency is {pipeline_fill_time} cycles."
        )

        return PipelineSimResult(
            num_requests=num_requests,
            stage_durations=durations,
            sequential_cycles=total_seq_cycles,
            pipelined_cycles=total_pipe_cycles,
            speedup=speedup,
            theoretical_max_speedup=theoretical_max,
            sequential_throughput=seq_throughput,
            pipelined_throughput=pipe_throughput,
            pipeline_efficiency_percent=efficiency,
            timeline_sequential=timeline_seq,
            timeline_pipelined=timeline_pipe,
            pipeline_fill_cycles=pipeline_fill_time,
            bottleneck_stage=self.stage_names[bottleneck_stage],
            bottleneck_duration=bottleneck_dur,
            analysis=analysis
        )

pipeline_simulator_instance = PipelineSimulator()
