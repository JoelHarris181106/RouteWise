import pytest
from backend.app.pipeline.simulator import PipelineSimulator

@pytest.fixture
def simulator():
    return PipelineSimulator()

def test_pipeline_unit_cycle_ideal(simulator):
    # K = 4 stages, N = 10 requests, each stage = 1 cycle
    stage_durations = {"IF_PREP": 1, "VAL": 1, "ROUTE": 1, "WB_RES": 1}
    result = simulator.simulate(num_requests=10, stage_durations=stage_durations)

    # Ideal formula: T_seq = N * K = 10 * 4 = 40
    assert result.sequential_cycles == 40
    # Ideal formula: T_pipe = K + N - 1 = 4 + 10 - 1 = 13
    assert result.pipelined_cycles == 13
    assert result.speedup == round(40 / 13, 3)
    assert result.pipelined_throughput > result.sequential_throughput

def test_pipeline_single_request(simulator):
    # For N = 1, pipelining has no overlap: T_seq == T_pipe
    stage_durations = {"IF_PREP": 1, "VAL": 2, "ROUTE": 3, "WB_RES": 1}
    sum_dur = sum(stage_durations.values())
    result = simulator.simulate(num_requests=1, stage_durations=stage_durations)

    assert result.sequential_cycles == sum_dur
    assert result.pipelined_cycles == sum_dur
    assert result.speedup == 1.0

def test_pipeline_bottleneck_detection(simulator):
    stage_durations = {"IF_PREP": 1, "VAL": 1, "ROUTE": 5, "WB_RES": 1}
    result = simulator.simulate(num_requests=8, stage_durations=stage_durations)

    assert "3. Dijkstra Routing" in result.bottleneck_stage
    assert result.bottleneck_duration == 5
    assert result.pipelined_cycles < result.sequential_cycles

def test_pipeline_invalid_parameters(simulator):
    with pytest.raises(ValueError, match="at least 1"):
        simulator.simulate(num_requests=0, stage_durations={"IF_PREP": 1, "VAL": 1, "ROUTE": 1, "WB_RES": 1})

    with pytest.raises(ValueError, match="at least 1 cycle"):
        simulator.simulate(num_requests=5, stage_durations={"IF_PREP": 0, "VAL": 1, "ROUTE": 1, "WB_RES": 1})
