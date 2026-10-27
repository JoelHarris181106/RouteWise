import React, { useState } from 'react';
import { Stop, Edge, RouteOption } from '../types';
import { AlertTriangle, MapPin, CheckCircle, Info } from 'lucide-react';

interface NetworkMapProps {
  stops: Stop[];
  edges: Edge[];
  selectedRoute?: RouteOption | null;
  originId: string;
  destinationId: string;
  onSelectStation: (stopId: string, role: 'origin' | 'destination') => void;
}

export const NetworkMap: React.FC<NetworkMapProps> = ({
  stops,
  edges,
  selectedRoute,
  originId,
  destinationId,
  onSelectStation,
}) => {
  const [hoveredStop, setHoveredStop] = useState<Stop | null>(null);
  const [clickedStop, setClickedStop] = useState<Stop | null>(null);

  // Group edges by line for clean rendering
  const lineColors: Record<string, string> = {
    'Metro Red (M1)': '#ef4444',
    'Metro Blue (M2)': '#3b82f6',
    'Metro Green (M3)': '#10b981',
    'Route 101': '#f59e0b',
    'Route 204': '#ec4899',
    'Route 305': '#8b5cf6',
    'Route 408': '#14b8a6',
  };

  // Find stop by ID helper
  const getStopPos = (id: string) => {
    const s = stops.find((item) => item.id === id);
    return s ? { x: s.x, y: s.y, name: s.name } : { x: 0, y: 0, name: id };
  };

  // Check if an edge is part of the selected route
  const isEdgeInRoute = (edge: Edge) => {
    if (!selectedRoute || !selectedRoute.segments) return false;
    return selectedRoute.segments.some(
      (seg) =>
        (seg.from_stop_id === edge.source && seg.to_stop_id === edge.target) ||
        (seg.from_stop_id === edge.target && seg.to_stop_id === edge.source)
    );
  };

  // Filter unique bidirectional edges to avoid rendering two overlapping lines
  const renderedEdgePairs = new Set<string>();
  const uniqueEdges = edges.filter((e) => {
    const key1 = `${e.source}_${e.target}_${e.line_name}`;
    const key2 = `${e.target}_${e.source}_${e.line_name}`;
    if (renderedEdgePairs.has(key1) || renderedEdgePairs.has(key2)) {
      return false;
    }
    renderedEdgePairs.add(key1);
    return true;
  });

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl overflow-hidden relative">
      {/* Header controls & legend */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-2 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Schematic Transit Diagram</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
              Simplified Network Topology
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Click on any station to designate as origin or destination.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-red-500 rounded-sm"></span>
            <span>Metro Red (M1)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-blue-500 rounded-sm"></span>
            <span>Metro Blue (M2)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-emerald-500 rounded-sm"></span>
            <span>Metro Green (M3)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 border-t-2 border-dashed border-amber-400"></span>
            <span>Bus Routes</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 border-t-2 border-dashed border-red-500"></span>
            <span className="text-red-400 font-semibold">Disrupted</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[540px] bg-slate-950/70 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center">
        <svg
          viewBox="50 40 940 620"
          className="w-full h-full select-none"
          style={{ maxHeight: '540px' }}
        >
          <defs>
            {/* Glow filters for active path */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines background for technical schematic look */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* 1. Base Edges (Inactive, normal, disrupted) */}
          {uniqueEdges.map((edge) => {
            const p1 = getStopPos(edge.source);
            const p2 = getStopPos(edge.target);
            const isDisrupted = !edge.is_active || edge.status === 'CANCELLED';
            const lineColor = lineColors[edge.line_name] || '#94a3b8';
            const isBus = edge.mode === 'bus';

            return (
              <g key={edge.id} className="transition-all duration-300">
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isDisrupted ? '#dc2626' : lineColor}
                  strokeWidth={isDisrupted ? 3 : isBus ? 2.5 : 4}
                  strokeDasharray={isDisrupted ? '6,4' : isBus ? '5,4' : 'none'}
                  strokeOpacity={isDisrupted ? 0.9 : 0.65}
                  strokeLinecap="round"
                />

                {/* Disruption Icon on edge center */}
                {isDisrupted && (
                  <g transform={`translate(${(p1.x + p2.x) / 2}, ${(p1.y + p2.y) / 2})`}>
                    <circle r="9" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      !
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 2. Highlighted Route Edges (Overlaid with glow) */}
          {uniqueEdges
            .filter((e) => isEdgeInRoute(e))
            .map((edge) => {
              const p1 = getStopPos(edge.source);
              const p2 = getStopPos(edge.target);
              return (
                <g key={`highlight-${edge.id}`}>
                  {/* Outer bright glow */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#ffffff"
                    strokeWidth={7}
                    strokeOpacity={0.85}
                    filter="url(#glow)"
                    strokeLinecap="round"
                  />
                  {/* Inner path color */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#6366f1"
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

          {/* 3. Station Nodes */}
          {stops.map((stop) => {
            const isOrigin = stop.id === originId;
            const isDestination = stop.id === destinationId;
            const isDisrupted = stop.status === 'CANCELLED';
            const isTransfer = stop.is_transfer_station;
            const isHovered = hoveredStop?.id === stop.id;
            const isClicked = clickedStop?.id === stop.id;

            let fillColor = '#1e293b';
            let strokeColor = '#94a3b8';
            let strokeWidth = 2;
            let radius = isTransfer ? 8 : 6;

            if (isTransfer) {
              fillColor = '#334155';
              strokeColor = '#f8fafc';
              strokeWidth = 2.5;
            }

            if (isOrigin) {
              fillColor = '#10b981';
              strokeColor = '#ffffff';
              strokeWidth = 3;
              radius = 9;
            } else if (isDestination) {
              fillColor = '#8b5cf6';
              strokeColor = '#ffffff';
              strokeWidth = 3;
              radius = 9;
            } else if (isDisrupted) {
              fillColor = '#ef4444';
              strokeColor = '#7f1d1d';
              radius = 7;
            }

            return (
              <g
                key={stop.id}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredStop(stop)}
                onMouseLeave={() => setHoveredStop(null)}
                onClick={() => setClickedStop(stop)}
              >
                {/* Outer ring for Origin / Destination */}
                {(isOrigin || isDestination) && (
                  <circle
                    cx={stop.x}
                    cy={stop.y}
                    r={radius + 6}
                    fill="none"
                    stroke={isOrigin ? '#10b981' : '#8b5cf6'}
                    strokeWidth="2"
                    strokeDasharray="4,3"
                    className="animate-spin"
                    style={{ transformOrigin: `${stop.x}px ${stop.y}px`, animationDuration: '6s' }}
                  />
                )}

                {/* Node Circle */}
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r={radius}
                  fill={fillColor}
                  stroke={isHovered || isClicked ? '#38bdf8' : strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-200"
                />

                {/* Inner dot for transfer hub */}
                {isTransfer && !isOrigin && !isDestination && !isDisrupted && (
                  <circle cx={stop.x} cy={stop.y} r="3" fill="#ffffff" />
                )}

                {/* Station Label */}
                <text
                  x={stop.x}
                  y={stop.y + (stop.y > 500 ? -14 : 18)}
                  textAnchor="middle"
                  fill={isOrigin ? '#34d399' : isDestination ? '#c084fc' : isDisrupted ? '#f87171' : isHovered ? '#ffffff' : '#cbd5e1'}
                  fontSize={isTransfer ? '11' : '9.5'}
                  fontWeight={isTransfer || isOrigin || isDestination ? 'bold' : 'normal'}
                  className="pointer-events-none drop-shadow-sm select-none"
                >
                  {stop.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Station Click Popover Modal */}
        {clickedStop && (
          <div className="absolute bottom-4 left-4 bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl z-20 max-w-xs animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-sm text-white">{clickedStop.name}</span>
              <button
                onClick={() => setClickedStop(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 my-2">
              Zone {clickedStop.zone} • {clickedStop.lines.join(', ')}
            </p>
            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => {
                  onSelectStation(clickedStop.id, 'origin');
                  setClickedStop(null);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1"
              >
                <MapPin className="w-3 h-3" />
                <span>Set Origin</span>
              </button>
              <button
                onClick={() => {
                  onSelectStation(clickedStop.id, 'destination');
                  setClickedStop(null);
                }}
                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1"
              >
                <MapPin className="w-3 h-3" />
                <span>Set Dest</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
