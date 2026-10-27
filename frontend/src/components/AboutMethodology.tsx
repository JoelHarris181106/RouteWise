import React from 'react';
import { BookOpen, GraduationCap, Code2, Cpu, Activity, CheckCircle2 } from 'lucide-react';

export const AboutMethodology: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Metadata Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">RouteWise — Academic Micro-Project Submission</h2>
            <p className="text-xs text-slate-400">
              Three-in-One Computer Science Integration: DAA + FLAT + COA
            </p>
          </div>
        </div>

        {/* Academic Details Placeholder Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block font-medium">Student Name:</span>
            <span className="text-white font-semibold">[Student Name / Candidate]</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block font-medium">Register Number:</span>
            <span className="text-white font-semibold">[Register / Roll Number]</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block font-medium">Department:</span>
            <span className="text-white font-semibold">Computer Science & Engineering</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block font-medium">Academic Year:</span>
            <span className="text-white font-semibold">2026 – 2027</span>
          </div>
        </div>
      </div>

      {/* Subject 1: DAA Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
          <Code2 className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">1. Design & Analysis of Algorithms (DAA)</h3>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed space-y-3">
          <p>
            <strong>Problem Formulation:</strong> Public transit network modeled as a directed weighted multi-graph <code>G = (V, E)</code>. 
            Vertices <code>V</code> represent transit stations (metro stops, bus interchanges). 
            Edges <code>E</code> represent directional transit connections annotated with modal type, line identifier, travel time (mins), fare, and availability status.
          </p>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">Four Implemented Route Objectives:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-white">Fastest Route:</strong> Dijkstra's algorithm with min-heap priority queue minimizing edge travel time <code>t(e) ≥ 0</code>.</li>
              <li><strong className="text-white">Cheapest Route:</strong> Dijkstra's algorithm minimizing edge fare <code>c(e) ≥ 0</code>.</li>
              <li><strong className="text-white">Fewest-Transfers Route:</strong> State-expanded graph with states <code>(stop, line)</code>. Penalizes modal/line switches with a transfer cost penalty, avoiding false minimization of intermediate stops.</li>
              <li><strong className="text-white">Balanced Journey:</strong> Normalized multi-criteria Pareto evaluation scoring travel time, cost, and transfers with weighted coefficients (45% time, 35% fare, 20% transfers).</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 block font-bold">Time Complexity:</span>
              <span className="text-brand-300 font-mono font-bold">O((|V| + |E|) log |V|)</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Using binary min-heap priority queue implementation with adjacency lists.</p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 block font-bold">Space Complexity:</span>
              <span className="text-brand-300 font-mono font-bold">O(|V| + |E|)</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Adjacency lists, predecessor tracking maps, and distance tables.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject 2: FLAT Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">2. Formal Language & Automata Theory (FLAT)</h3>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed space-y-3">
          <p>
            <strong>Automaton Definition:</strong> A genuine Deterministic Finite Automaton (DFA) defined by the mathematical 5-tuple:
            <code className="text-brand-300 ml-1">M = (Q, Σ, δ, q₀, F)</code>.
          </p>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2 text-slate-300 font-mono">
            <div>• Q: Finite set of states including initial state q₀, intermediate prefix states, accepting states, and trap state q_trap.</div>
            <div>• Σ: Alphabet of uppercase ASCII letters [A-Z] and underscore '_'.</div>
            <div>• δ: Q × Σ → Q: Transition function mapping each (state, input char) deterministically.</div>
            <div>• q₀: Initial start state.</div>
            <div>• F: {'{ q_ACC_ON_TIME, q_ACC_DELAYED, q_ACC_CANCELLED, q_ACC_MAINTENANCE, q_ACC_DIVERTED }'}.</div>
          </div>

          <p className="text-slate-400">
            The validator consumes input character-by-character. Undefined transitions transition directly to <code>q_trap</code> (a permanent absorbing dead state). This guarantees mathematical rigour without relying on opaque regular expressions.
          </p>
        </div>
      </div>

      {/* Subject 3: COA Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
          <Activity className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">3. Computer Organization & Architecture (COA)</h3>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed space-y-3">
          <p>
            <strong>Instruction Pipelining Modeling:</strong> Models query execution over 4 hardware-style stages:
            1. <em>Input & Request Prep</em>, 2. <em>Validation</em>, 3. <em>Dijkstra Routing</em>, and 4. <em>Result Output</em>.
          </p>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">Mathematical Formulations:</div>
            <div className="font-mono text-slate-300 space-y-1">
              <div>Sequential Execution Cycles: T_seq = N × Σ dᵢ</div>
              <div>Ideal Unit-Cycle Pipeline Cycles: T_pipe = K + N - 1 (for dᵢ = 1)</div>
              <div>Measured Speedup: S = T_seq / T_pipe</div>
              <div>Throughput: TP = N / T_pipe (requests per simulated cycle)</div>
              <div>Pipeline Efficiency: E = S / K × 100%</div>
            </div>
          </div>

          <p className="text-slate-400">
            Structural hazards and stage duration imbalances create pipeline stalls. When the Dijkstra routing stage takes 4 cycles while others take 1 cycle, the throughput is strictly bound by the bottleneck stage, illustrating Amdahl's Law and balanced hardware design principles.
          </p>
        </div>
      </div>
    </div>
  );
};
