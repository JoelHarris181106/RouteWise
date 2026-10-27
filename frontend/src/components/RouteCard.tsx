import React, { useState } from 'react';
import { RouteOption } from '../types';
import { Clock, DollarSign, Shuffle, Compass, ChevronDown, ChevronUp, Check, AlertCircle, Train, Bus } from 'lucide-react';

interface RouteCardProps {
  route: RouteOption;
  isSelected: boolean;
  onSelect: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, isSelected, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryConfig: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
    fastest: {
      label: 'Fastest Route',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    },
    cheapest: {
      label: 'Cheapest Route',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
    },
    fewest_transfers: {
      label: 'Fewest Transfers',
      icon: Shuffle,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/30',
    },
    balanced: {
      label: 'Balanced Journey',
      icon: Compass,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
      border: 'border-brand-500/30',
    },
  };

  const config = categoryConfig[route.category] || categoryConfig.balanced;
  const CategoryIcon = config.icon;

  if (!route.is_feasible) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-red-900/40 p-5 shadow-lg opacity-80">
        <div className="flex items-center space-x-3 mb-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-base font-bold text-red-300">{config.label} Unavailable</h3>
        </div>
        <p className="text-sm text-slate-400">{route.explanation}</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg ${
        isSelected
          ? 'bg-slate-800/95 border-brand-500 ring-2 ring-brand-500/30'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
      }`}
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center`}>
              <CategoryIcon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">{config.label}</h3>
                {isSelected && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Active View</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{route.explanation}</p>
            </div>
          </div>

          <button
            onClick={onSelect}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isSelected
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {isSelected ? 'Viewing' : 'Select'}
          </button>
        </div>

        {/* Coincidence Notice */}
        {route.coincides_with && route.coincides_with.length > 0 && (
          <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            <span>
              Also satisfies: <strong>{route.coincides_with.map((c) => c.replace('_', ' ')).join(', ')}</strong> objective
            </span>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-center">
          <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/50">
            <div className="text-xs text-slate-400 flex items-center justify-center space-x-1 mb-0.5">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Duration</span>
            </div>
            <div className="text-base font-bold text-white">{route.total_time_mins} <span className="text-xs font-normal text-slate-400">mins</span></div>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/50">
            <div className="text-xs text-slate-400 flex items-center justify-center space-x-1 mb-0.5">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              <span>Fare</span>
            </div>
            <div className="text-base font-bold text-white">${route.total_fare.toFixed(2)}</div>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/50">
            <div className="text-xs text-slate-400 flex items-center justify-center space-x-1 mb-0.5">
              <Shuffle className="w-3 h-3 text-sky-400" />
              <span>Transfers</span>
            </div>
            <div className="text-base font-bold text-white">{route.transfers_count}</div>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/50">
            <div className="text-xs text-slate-400 flex items-center justify-center space-x-1 mb-0.5">
              <span>Distance</span>
            </div>
            <div className="text-base font-bold text-white">{route.total_distance_km} <span className="text-xs font-normal text-slate-400">km</span></div>
          </div>
        </div>

        {/* Lines used pill badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2">
          <span className="text-xs text-slate-400 mr-1">Lines:</span>
          {route.lines_used.map((line, idx) => {
            const isMetro = line.toLowerCase().includes('metro');
            return (
              <span
                key={idx}
                className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center space-x-1 ${
                  isMetro
                    ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                }`}
              >
                {isMetro ? <Train className="w-3 h-3" /> : <Bus className="w-3 h-3" />}
                <span>{line}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Accordion Toggle for Detailed Stop Sequence */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2.5 px-5 bg-slate-950/40 hover:bg-slate-950/70 border-t border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-between transition-colors"
      >
        <span>{isExpanded ? 'Hide Station Sequence' : `Show Stop Breakdown (${route.stops_sequence.length} stops)`}</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expanded Segments Timeline */}
      {isExpanded && (
        <div className="p-5 bg-slate-950/60 border-t border-slate-800/60 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step-by-Step Transit Legs</h4>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
            {route.segments.map((seg, idx) => (
              <div key={idx} className="relative">
                {/* Node marker */}
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-slate-900 ring-2 ring-slate-800"></div>
                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                    <span>{seg.from_stop_name} → {seg.to_stop_name}</span>
                    <span className="text-slate-400 font-normal">{seg.travel_time} mins • ${seg.fare.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {seg.line_name}
                    </span>
                    <span>• {seg.distance_km} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
