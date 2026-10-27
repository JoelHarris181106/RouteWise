import React, { useState } from 'react';
import { Stop, RouteOption, RoutePlanResponse } from '../types';
import { RouteCard } from './RouteCard';
import { 
  ArrowLeftRight, 
  Search, 
  AlertTriangle, 
  Sparkles, 
  Compass, 
  Clock, 
  DollarSign, 
  Shuffle, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface JourneyPlannerProps {
  stops: Stop[];
  originId: string;
  setOriginId: (id: string) => void;
  destinationId: string;
  setDestinationId: (id: string) => void;
  modeFilter: string;
  setModeFilter: (mode: string) => void;
  preference: string;
  setPreference: (pref: string) => void;
  onPlanJourney: () => void;
  planResult: RoutePlanResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  selectedRoute: RouteOption | null;
  setSelectedRoute: (route: RouteOption | null) => void;
  activeDisruptionsCount: number;
}

export const JourneyPlanner: React.FC<JourneyPlannerProps> = ({
  stops,
  originId,
  setOriginId,
  destinationId,
  setDestinationId,
  modeFilter,
  setModeFilter,
  preference,
  setPreference,
  onPlanJourney,
  planResult,
  isLoading,
  errorMessage,
  selectedRoute,
  setSelectedRoute,
  activeDisruptionsCount,
}) => {
  const [localValidation, setLocalValidation] = useState<string | null>(null);

  const handleSwap = () => {
    const temp = originId;
    setOriginId(destinationId);
    setDestinationId(temp);
  };

  const handleQuickDemo = (from: string, to: string) => {
    setOriginId(from);
    setDestinationId(to);
    setLocalValidation(null);
  };

  const validateAndSubmit = () => {
    if (!originId || !destinationId) {
      setLocalValidation('Please select both an Origin and a Destination station.');
      return;
    }
    if (originId === destinationId) {
      setLocalValidation('Origin and Destination cannot be the same station.');
      return;
    }
    setLocalValidation(null);
    onPlanJourney();
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Simulated Transit Environment</h4>
            <p className="text-xs text-slate-400">
              Operating on a synthetic 20-station metropolitan graph with real algorithmic calculation. Not live GPS transit data.
            </p>
          </div>
        </div>

        {activeDisruptionsCount > 0 && (
          <span className="text-xs px-3 py-1 rounded-full bg-red-950/70 border border-red-800/60 text-red-300 font-semibold flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{activeDisruptionsCount} Active Disruption{activeDisruptionsCount > 1 ? 's' : ''} Altering Routing</span>
          </span>
        )}
      </div>

      {/* Network Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 shadow-md">
          <div className="text-xs text-slate-400">Total Stations</div>
          <div className="text-xl font-bold text-white mt-0.5">20 Stations</div>
          <div className="text-[11px] text-brand-400 mt-1">Multi-modal grid</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 shadow-md">
          <div className="text-xs text-slate-400">Transit Modes</div>
          <div className="text-xl font-bold text-white mt-0.5">Metro & Bus</div>
          <div className="text-[11px] text-emerald-400 mt-1">3 Metro, 4 Bus routes</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 shadow-md">
          <div className="text-xs text-slate-400">Algorithms Engine</div>
          <div className="text-xl font-bold text-white mt-0.5">Dijkstra Min-Heap</div>
          <div className="text-[11px] text-sky-400 mt-1">O((V + E) log V)</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 shadow-md">
          <div className="text-xs text-slate-400">Status Verification</div>
          <div className="text-xl font-bold text-white mt-0.5">FLAT DFA</div>
          <div className="text-[11px] text-amber-400 mt-1">5-Tuple Automaton</div>
        </div>
      </div>

      {/* Journey Planning Form Panel */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Compass className="w-5 h-5 text-brand-400" />
              <span>Route Search & Comparison</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select origin and destination to compute fastest, cheapest, fewest-transfers, and balanced journeys.
            </p>
          </div>

          {/* Quick Demo Pre-sets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick Demos:</span>
            <button
              onClick={() => handleQuickDemo('STN_CENTRAL', 'STN_TECH_PARK')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Central ↔ Tech Park (Trade-off)
            </button>
            <button
              onClick={() => handleQuickDemo('STN_WEST_HILLS', 'STN_INNOVATION')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              West Hills ↔ Innovation (Direct Metro)
            </button>
            <button
              onClick={() => handleQuickDemo('STN_CENTRAL', 'STN_PORT_TERMINAL')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Central ↔ Port Terminal (Isolation)
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Origin */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Starting Station (Origin)
            </label>
            <select
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
            >
              <option value="">-- Choose Starting Station --</option>
              {stops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Zone {s.zone}) {s.is_transfer_station ? '★ Transfer' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center pt-2 md:pt-6">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap Origin and Destination"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all transform hover:rotate-180 duration-300"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Destination */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Destination Station
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
            >
              <option value="">-- Choose Destination Station --</option>
              {stops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Zone {s.zone}) {s.is_transfer_station ? '★ Transfer' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters and Action Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          {/* Mode Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-semibold">Mode Filter:</span>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setModeFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  modeFilter === 'all'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Modes
              </button>
              <button
                onClick={() => setModeFilter('metro')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  modeFilter === 'metro'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Metro Only
              </button>
              <button
                onClick={() => setModeFilter('bus')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  modeFilter === 'bus'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bus Only
              </button>
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={validateAndSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Executing Dijkstra...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Calculate Journeys</span>
              </>
            )}
          </button>
        </div>

        {/* Validation or Error Message */}
        {(localValidation || errorMessage) && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-sm flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{localValidation || errorMessage}</span>
          </div>
        )}
      </div>

      {/* Route Results Grid */}
      {planResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Journey Recommendations</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  {planResult.origin_name} → {planResult.destination_name}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparing 4 objective functions across travel duration, fare cost, line transfers, and multi-criteria trade-offs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {planResult.routes.fastest && (
              <RouteCard
                route={planResult.routes.fastest}
                isSelected={selectedRoute?.category === 'fastest'}
                onSelect={() => setSelectedRoute(planResult.routes.fastest || null)}
              />
            )}

            {planResult.routes.cheapest && (
              <RouteCard
                route={planResult.routes.cheapest}
                isSelected={selectedRoute?.category === 'cheapest'}
                onSelect={() => setSelectedRoute(planResult.routes.cheapest || null)}
              />
            )}

            {planResult.routes.fewest_transfers && (
              <RouteCard
                route={planResult.routes.fewest_transfers}
                isSelected={selectedRoute?.category === 'fewest_transfers'}
                onSelect={() => setSelectedRoute(planResult.routes.fewest_transfers || null)}
              />
            )}

            {planResult.routes.balanced && (
              <RouteCard
                route={planResult.routes.balanced}
                isSelected={selectedRoute?.category === 'balanced'}
                onSelect={() => setSelectedRoute(planResult.routes.balanced || null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
