import React, { useState, useEffect } from 'react';
import { DfaValidationResult, DfaSpecResponse } from '../types';
import { validateDfa, fetchDfaSpec } from '../api/client';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Cpu, 
  Layers, 
  HelpCircle, 
  Play, 
  RefreshCw,
  Table
} from 'lucide-react';

export const DfaExplorer: React.FC = () => {
  const [inputCode, setInputCode] = useState('ON_TIME');
  const [result, setResult] = useState<DfaValidationResult | null>(null);
  const [spec, setSpec] = useState<DfaSpecResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const sampleInputs = [
    { label: 'ON_TIME', type: 'valid' },
    { label: 'DELAYED', type: 'valid' },
    { label: 'CANCELLED', type: 'valid' },
    { label: 'MAINTENANCE', type: 'valid' },
    { label: 'DIVERTED', type: 'valid' },
    { label: 'DELAY', type: 'invalid', note: 'Prefix error' },
    { label: 'ON-TIME', type: 'invalid', note: 'Bad hyphen' },
    { label: 'BUS_LATE', type: 'invalid', note: 'Unrecognized keyword' },
    { label: 'on_time', type: 'invalid', note: 'Lowercase' },
    { label: 'CANCELLED_EXTRA', type: 'invalid', note: 'Extra suffix' },
  ];

  const handleValidate = async (textToValidate?: string) => {
    const text = textToValidate !== undefined ? textToValidate : inputCode;
    setIsLoading(true);
    try {
      const data = await validateDfa(text);
      setResult(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleValidate('ON_TIME');
    fetchDfaSpec().then(setSpec).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header and Academic Context Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-bold border border-brand-500/30">
                Subject 2: FLAT
              </span>
              <h2 className="text-xl font-bold text-white">Deterministic Finite Automaton (DFA) Validator</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Formal language validator implemented character-by-character as a mathematical 5-tuple: 
              <code className="text-brand-300 ml-1">M = (Q, Σ, δ, q₀, F)</code>. Used to formally verify transit service status codes.
            </p>
          </div>

          <button
            onClick={() => setShowTable(!showTable)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition-all"
          >
            <Table className="w-4 h-4" />
            <span>{showTable ? 'Hide Transition Table' : 'View δ Transition Table'}</span>
          </button>
        </div>

        {/* Input Bar and Quick Pre-sets */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter transit status code (e.g. ON_TIME, DELAYED)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all uppercase"
                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
              />
            </div>
            <button
              onClick={() => handleValidate()}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Validate Token</span>
            </button>
          </div>

          {/* Quick Test Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400 font-medium">Test Inputs:</span>
            {sampleInputs.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputCode(sample.label);
                  handleValidate(sample.label);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all flex items-center space-x-1 ${
                  sample.type === 'valid'
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60'
                    : 'bg-red-950/40 text-red-300 border-red-800/40 hover:bg-red-900/60'
                }`}
              >
                <span>{sample.label}</span>
                {sample.note && <span className="text-[10px] text-slate-400">({sample.note})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Formal Language Specification 5-Tuple Box */}
      {spec && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-semibold">Alphabet (Σ)</div>
            <div className="text-xs text-slate-200 font-mono mt-1 break-all">
              {'{ ' + spec.alphabet.slice(0, 12).join(', ') + ', ... }'}
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-semibold">States Set (Q)</div>
            <div className="text-sm font-bold text-white mt-1">{spec.states.length} States</div>
            <div className="text-[11px] text-slate-400">Includes q₀ and q_trap</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-semibold">Start State (q₀)</div>
            <div className="text-sm font-mono font-bold text-brand-400 mt-1">{spec.initial_state}</div>
            <div className="text-[11px] text-slate-400">Initial empty condition</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-semibold">Accepting States (F)</div>
            <div className="text-sm font-mono font-bold text-emerald-400 mt-1">{spec.accepting_states.length} States</div>
            <div className="text-[11px] text-slate-400">{'{ q_ACC_ON_TIME, ... }'}</div>
          </div>
        </div>
      )}

      {/* Validation Result Box */}
      {result && (
        <div className={`rounded-2xl border p-6 transition-all shadow-xl ${
          result.is_accepted
            ? 'bg-emerald-950/20 border-emerald-800/80'
            : 'bg-red-950/20 border-red-800/80'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {result.is_accepted ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <XCircle className="w-7 h-7" />
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-white">
                    {result.is_accepted ? 'STATUS CODE ACCEPTED' : 'STATUS CODE REJECTED'}
                  </h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono ${
                    result.is_accepted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    Final State: {result.final_state}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{result.explanation}</p>
              </div>
            </div>
          </div>

          {/* Character-by-Character State Trace Timeline */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Step-by-Step Automaton State Traversal Trace</span>
            </h4>

            {result.trace.length === 0 ? (
              <div className="text-xs text-slate-400 italic">Empty input string. Automaton remained in q0.</div>
            ) : (
              <div className="flex items-center space-x-2 overflow-x-auto pb-3 pt-1">
                {/* Initial State node */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 mb-1">Start</span>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-white shadow">
                    q0
                  </div>
                </div>

                {/* Transition steps */}
                {result.trace.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex-shrink-0 flex flex-col items-center px-1">
                      <span className="text-xs font-bold font-mono text-brand-300 bg-brand-950/80 px-1.5 py-0.5 rounded border border-brand-800/60">
                        '{step.character}'
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500 mt-1" />
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 mb-1">Step {step.step}</span>
                      <div
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all shadow ${
                          step.to_state === 'q_trap'
                            ? 'bg-red-950 text-red-300 border-red-700 animate-pulse'
                            : step.to_state.startsWith('q_ACC')
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                            : 'bg-slate-800 text-slate-200 border-slate-700'
                        }`}
                      >
                        {step.to_state}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delta Transition Table View */}
      {showTable && spec && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in fade-in duration-300">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
            <Table className="w-4 h-4 text-brand-400" />
            <span>Automaton State Transition Table δ(q, a)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Shows all deterministic state transitions. Unlisted cells transition to the dead/trap state <code>q_trap</code>.
          </p>

          <div className="overflow-x-auto max-h-96 border border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Current State</th>
                  <th className="px-3 py-2.5">Read Char</th>
                  <th className="px-3 py-2.5">Next State δ(q, a)</th>
                  <th className="px-3 py-2.5">State Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {Object.entries(spec.transition_table).map(([state, transitions]) => (
                  Object.entries(transitions).map(([char, targetState], idx) => {
                    const isAccepting = spec.accepting_states.includes(targetState);
                    return (
                      <tr key={`${state}-${char}-${idx}`} className="hover:bg-slate-800/40">
                        <td className="px-3 py-1.5 font-bold text-white">{state}</td>
                        <td className="px-3 py-1.5 text-brand-300">'{char}'</td>
                        <td className="px-3 py-1.5 text-slate-200">{targetState}</td>
                        <td className="px-3 py-1.5">
                          {isAccepting ? (
                            <span className="text-emerald-400 font-sans text-[11px] font-bold">Accepting State (F)</span>
                          ) : (
                            <span className="text-slate-400 font-sans text-[11px]">Intermediate</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
