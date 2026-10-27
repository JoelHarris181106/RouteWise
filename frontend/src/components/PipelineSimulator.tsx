import React, { useState, useEffect } from 'react';
import { PipelineSimResult, PipelineGanttBlock } from '../types';
import { simulatePipeline } from '../api/client';
import { 
  Activity, 
  Cpu, 
  Zap, 
  BarChart3, 
  Sliders, 
  Clock, 
  Play, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const PipelineSimulator: React.FC = () => {
  const [numRequests, setNumRequests] = useState<number>(8);
  const [durations, setDurations] = useState<Record<string, number>>({
    IF_PREP: 1,
    VAL: 1,
    ROUTE: 3,
    WB_RES: 1,
  });
  const [result, setResult] = useState<PipelineSimResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'pipelined' | 'sequential'>('pipelined');

  const stageLabels: Record<string, { name: string; color: string; bg: string }> = {
    IF_PREP: { name: '1. Request Prep', color: 'text-sky-400', bg: 'bg-sky-500' },
    VAL: { name: '2. DFA Validation', color: 'text-emerald-400', bg: 'bg-emerald-500' },
    ROUTE: { name: '3. Dijkstra Routing', color: 'text-amber-400', bg: 'bg-amber-500' },
    WB_RES: { name: '4. Result Output', color: 'text-indigo-400', bg: 'bg-indigo-500' },
  };

  const handleSimulate = async () => {
    setIsLoading(true);
    try {
      const data = await simulatePipeline(numRequests, durations);
      setResult(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (preset: 'ideal' | 'bottleneck' | 'balanced') => {
    if (preset === 'ideal') {
      setDurations({ IF_PREP: 1, VAL: 1, ROUTE: 1, WB_RES: 1 });
    } else if (preset === 'bottleneck') {
      setDurations({ IF_PREP: 1, VAL: 1, ROUTE: 5, WB_RES: 1 });
    } else if (preset === 'balanced') {
      setDurations({ IF_PREP: 2, VAL: 2, ROUTE: 2, WB_RES: 2 });
    }
  };

  useEffect(() => {
    handleSimulate();
  }, [numRequests, durations]);

  return (
    <div className="space-y-6">
      {/* Header and Context */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30">
                Subject 3: COA
              </span>
              <h2 className="text-xl font-bold text-white">CPU Pipeline Processing Simulator</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Simulates cycle-by-cycle execution of route planning query workloads across 4 architectural stages.
              Models instruction overlapping, structural hazards, throughput, and speedup.
            </p>
          </div>

          {/* Presets */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Presets:</span>
            <button
              onClick={() => applyPreset('ideal')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Ideal Unit (1-1-1-1)
            </button>
            <button
              onClick={() => applyPreset('bottleneck')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Routing Bottleneck (1-1-5-1)
            </button>
            <button
              onClick={() => applyPreset('balanced')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Balanced (2-2-2-2)
            </button>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* Workload Size N */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Workload Size (N)</span>
              <span className="text-brand-400 font-bold">{numRequests} queries</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={numRequests}
              onChange={(e) => setNumRequests(parseInt(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
          </div>

          {/* Stage Durations sliders */}
          {Object.entries(stageLabels).map(([key, info]) => (
            <div key={key} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span className={info.color}>{info.name}</span>
                <span className="font-bold text-white">{durations[key]} cyc</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                value={durations[key]}
                onChange={(e) =>
                  setDurations({ ...durations, [key]: parseInt(e.target.value) })
                }
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics Cards */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
            <div className="text-xs text-slate-400">Sequential Cycles</div>
            <div className="text-2xl font-bold text-white mt-1">{result.sequential_cycles}</div>
            <div className="text-[11px] text-slate-400">T_seq = N × Σ dᵢ</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
            <div className="text-xs text-slate-400">Pipelined Cycles</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{result.pipelined_cycles}</div>
            <div className="text-[11px] text-emerald-400/80">With stage overlap</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
            <div className="text-xs text-slate-400">Measured Speedup</div>
            <div className="text-2xl font-bold text-brand-400 mt-1">{result.speedup}x</div>
            <div className="text-[11px] text-slate-400">Max theoretical: {result.theoretical_max_speedup}x</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
            <div className="text-xs text-slate-400">Throughput</div>
            <div className="text-2xl font-bold text-sky-400 mt-1">{result.pipelined_throughput}</div>
            <div className="text-[11px] text-slate-400">reqs/cycle (vs {result.sequential_throughput})</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
            <div className="text-xs text-slate-400">Pipeline Efficiency</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{result.pipeline_efficiency_percent}%</div>
            <div className="text-[11px] text-slate-400">Speedup / K stages</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
            <div className="text-xs text-slate-400">Bottleneck Stage</div>
            <div className="text-sm font-bold text-red-400 mt-1 line-clamp-1">{result.bottleneck_stage}</div>
            <div className="text-[11px] text-slate-400">{result.bottleneck_duration} cycles / op</div>
          </div>
        </div>
      )}

      {/* Gantt Chart / Timeline Visualization */}
      {result && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-brand-400" />
                <span>Cycle-by-Cycle Execution Schedule (Gantt Chart)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Each row corresponds to an incoming route request passing through 4 stages over simulated clock cycles.
              </p>
            </div>

            {/* Toggle View Mode */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setViewMode('pipelined')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'pipelined'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pipelined Overlap ({result.pipelined_cycles} cycles)
              </button>
              <button
                onClick={() => setViewMode('sequential')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'sequential'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sequential Execution ({result.sequential_cycles} cycles)
              </button>
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[650px] space-y-2">
              {/* Request rows */}
              {Array.from({ length: numRequests }, (_, i) => i + 1).map((reqId) => {
                const timeline = viewMode === 'pipelined' ? result.timeline_pipelined : result.timeline_sequential;
                const reqBlocks = timeline.filter((b) => b.request_id === reqId);
                const totalCycles = viewMode === 'pipelined' ? result.pipelined_cycles : result.sequential_cycles;

                return (
                  <div key={reqId} className="flex items-center space-x-2 text-xs">
                    <span className="w-16 font-mono text-slate-400 font-semibold flex-shrink-0">
                      Req #{reqId}
                    </span>
                    <div className="relative flex-1 h-7 bg-slate-950/70 rounded-lg border border-slate-800/80 overflow-hidden flex items-center">
                      {reqBlocks.map((block, idx) => {
                        const leftPct = (block.start_cycle / totalCycles) * 100;
                        const widthPct = ((block.end_cycle - block.start_cycle) / totalCycles) * 100;
                        const stageInfo = stageLabels[block.stage] || { name: block.stage, bg: 'bg-brand-500' };

                        return (
                          <div
                            key={idx}
                            style={{
                              left: `${leftPct}%`,
                              width: `${Math.max(widthPct, 1.5)}%`,
                            }}
                            title={`${stageInfo.name}: cycles ${block.start_cycle}-${block.end_cycle}`}
                            className={`absolute h-5 rounded ${stageInfo.bg} opacity-90 hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-slate-900 shadow transition-transform hover:scale-105 cursor-pointer`}
                          >
                            <span className="truncate px-1">{block.stage}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Cycle scale footer */}
              <div className="flex items-center space-x-2 pt-2 text-[10px] text-slate-400 font-mono">
                <span className="w-16 flex-shrink-0">Cycle:</span>
                <div className="flex-1 flex justify-between px-1">
                  <span>0</span>
                  <span>{Math.round((viewMode === 'pipelined' ? result.pipelined_cycles : result.sequential_cycles) * 0.25)}</span>
                  <span>{Math.round((viewMode === 'pipelined' ? result.pipelined_cycles : result.sequential_cycles) * 0.5)}</span>
                  <span>{Math.round((viewMode === 'pipelined' ? result.pipelined_cycles : result.sequential_cycles) * 0.75)}</span>
                  <span>{viewMode === 'pipelined' ? result.pipelined_cycles : result.sequential_cycles} cycles</span>
                </div>
              </div>
            </div>
          </div>

          {/* Educational Notes & Analysis */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/50 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
            <h4 className="font-bold text-white mb-1 flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Architectural Insight & Pipeline Hazards</span>
            </h4>
            <p>{result.analysis}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-2 border-t border-slate-900 text-slate-400">
              <div>
                <strong className="text-slate-200">Latency vs Throughput:</strong> Individual query latency remains{' '}
                {result.pipeline_fill_cycles} cycles. Pipelining improves batch throughput by overlapping non-interfering sub-operations.
              </div>
              <div>
                <strong className="text-slate-200">Structural Bottleneck:</strong> The maximum achievable speedup is bounded by the slowest stage ({result.bottleneck_stage} taking {result.bottleneck_duration} cycles).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
