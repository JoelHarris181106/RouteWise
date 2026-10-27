import React, { useState } from 'react';
import { Disruption, Stop, Edge } from '../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Activity, 
  Zap, 
  ShieldAlert, 
  ShieldCheck,
  ChevronRight,
  Sliders
} from 'lucide-react';

interface DisruptionManagerProps {
  disruptions: Disruption[];
  stops: Stop[];
  edges: Edge[];
  onToggleDisruption: (disruptionId: string, activate: boolean) => void;
  onResetDisruptions: () => void;
  onToggleCustomEdge: (edgeId: string, isActive: boolean) => void;
  onSimulateImpact: (origin: string, dest: string) => void;
}

export const DisruptionManager: React.FC<DisruptionManagerProps> = ({
  disruptions,
  stops,
  edges,
  onToggleDisruption,
  onResetDisruptions,
  onToggleCustomEdge,
  onSimulateImpact,
}) => {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>('');

  const activeCount = disruptions.filter((d) => d.is_active).length;

  const severityBadges: Record<string, string> = {
    LOW: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
    MEDIUM: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
    HIGH: 'bg-orange-950/60 text-orange-300 border-orange-800/40',
    CRITICAL: 'bg-red-950/70 text-red-300 border-red-800/60 animate-pulse',
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white">Disruption & Incident Management</h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              activeCount > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {activeCount} Active Scenario{activeCount === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulate real-world corridor closures, track maintenance, and terminal isolations. The graph routing engine automatically identifies alternate paths or detects unreachable destinations.
          </p>
        </div>

        <button
          onClick={onResetDisruptions}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-2 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All Disruptions</span>
        </button>
      </div>

      {/* Predefined Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disruptions.map((disrupt) => {
          const isActive = disrupt.is_active;
          const badgeStyle = severityBadges[disrupt.severity] || severityBadges.HIGH;

          return (
            <div
              key={disrupt.id}
              className={`rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between ${
                isActive
                  ? 'bg-red-950/30 border-red-800/80 ring-1 ring-red-500/30 shadow-xl'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <h3 className="text-sm font-bold text-white">{disrupt.title}</h3>
                  </div>

                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${badgeStyle}`}>
                    {disrupt.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {disrupt.description}
                </p>

                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 mb-4">
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                    Status Code: <strong>{disrupt.status_code}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                    Affected Links: {disrupt.affected_edges.length}
                  </span>
                  {disrupt.affected_stops.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-red-950/50 border border-red-800/50 text-red-300 font-semibold">
                      Isolated Stops: {disrupt.affected_stops.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Toggle and Impact Test */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => onToggleDisruption(disrupt.id, !isActive)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isActive ? 'Deactivate Disruption' : 'Activate Disruption'}</span>
                </button>

                {/* Quick Link to Test Route Affected */}
                {disrupt.id === 'DISRUPT_RED_TUNNEL' && (
                  <button
                    onClick={() => onSimulateImpact('STN_CENTRAL', 'STN_TECH_PARK')}
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1"
                  >
                    <span>Test Route Rerouting</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                {disrupt.id === 'DISRUPT_PORT_ISOLATION' && (
                  <button
                    onClick={() => onSimulateImpact('STN_CENTRAL', 'STN_PORT_TERMINAL')}
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1"
                  >
                    <span>Test Unreachable Stop</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Connection Custom Override */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2 mb-3">
          <Sliders className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold text-white">Manual Connection Override</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Manually suspend or restore any single transit edge in the network to inspect custom edge isolation.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedEdgeId}
            onChange={(e) => setSelectedEdgeId(e.target.value)}
            className="flex-1 min-w-[280px] bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">-- Select an Edge Connection --</option>
            {edges.map((e) => (
              <option key={e.id} value={e.id}>
                [{e.id}] {e.source} → {e.target} ({e.line_name}) {!e.is_active ? '⚠️ DISRUPTED' : '✓ Normal'}
              </option>
            ))}
          </select>

          <button
            onClick={() => selectedEdgeId && onToggleCustomEdge(selectedEdgeId, false)}
            disabled={!selectedEdgeId}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-40"
          >
            Disrupt Connection
          </button>

          <button
            onClick={() => selectedEdgeId && onToggleCustomEdge(selectedEdgeId, true)}
            disabled={!selectedEdgeId}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-40"
          >
            Restore Connection
          </button>
        </div>
      </div>
    </div>
  );
};
