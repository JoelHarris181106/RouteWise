import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { JourneyPlanner } from './components/JourneyPlanner';
import { NetworkMap } from './components/NetworkMap';
import { DisruptionManager } from './components/DisruptionManager';
import { DfaExplorer } from './components/DfaExplorer';
import { PipelineSimulator } from './components/PipelineSimulator';
import { AboutMethodology } from './components/AboutMethodology';

import { Stop, Edge, Disruption, RouteOption, RoutePlanResponse } from './types';
import { 
  fetchNetwork, 
  fetchDisruptions, 
  toggleDisruption, 
  resetAllDisruptions, 
  toggleCustomEdge,
  planRoute 
} from './api/client';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('planner');

  // Network State
  const [stops, setStops] = useState<Stop[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Routing State
  const [originId, setOriginId] = useState<string>('STN_CENTRAL');
  const [destinationId, setDestinationId] = useState<string>('STN_TECH_PARK');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [preference, setPreference] = useState<string>('balanced');
  
  const [planResult, setPlanResult] = useState<RoutePlanResponse | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Load initial network and disruption data
  const loadInitialData = async () => {
    try {
      setBackendError(null);
      const net = await fetchNetwork();
      setStops(net.stops);
      setEdges(net.edges);

      const dis = await fetchDisruptions();
      setDisruptions(dis);

      // Trigger default journey calculation for initial display
      calculateRoute('STN_CENTRAL', 'STN_TECH_PARK', 'all', 'balanced');
    } catch (err: any) {
      console.error('Failed to load initial data from backend:', err);
      setBackendError(
        'Unable to connect to RouteWise Backend at http://127.0.0.1:8000. Please ensure the FastAPI backend is running.'
      );
    }
  };

  const calculateRoute = async (
    from: string,
    to: string,
    mode: string = modeFilter,
    pref: string = preference
  ) => {
    if (!from || !to || from === to) return;
    setIsLoadingRoute(true);
    setRouteError(null);
    try {
      const result = await planRoute(from, to, mode, pref);
      setPlanResult(result);
      // Default to balanced or fastest route
      const defaultOption = result.routes.balanced || result.routes.fastest || null;
      setSelectedRoute(defaultOption);
    } catch (err: any) {
      setRouteError(err.message || 'Error computing route recommendations.');
      setPlanResult(null);
      setSelectedRoute(null);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Disruption Handlers
  const handleToggleDisruption = async (disruptionId: string, activate: boolean) => {
    try {
      await toggleDisruption(disruptionId, activate);
      // Reload network and disruptions
      const net = await fetchNetwork();
      setStops(net.stops);
      setEdges(net.edges);
      const dis = await fetchDisruptions();
      setDisruptions(dis);

      // Recalculate route if one was displayed
      if (originId && destinationId) {
        calculateRoute(originId, destinationId);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleResetDisruptions = async () => {
    try {
      await resetAllDisruptions();
      const net = await fetchNetwork();
      setStops(net.stops);
      setEdges(net.edges);
      const dis = await fetchDisruptions();
      setDisruptions(dis);

      if (originId && destinationId) {
        calculateRoute(originId, destinationId);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleCustomEdge = async (edgeId: string, isActive: boolean) => {
    try {
      await toggleCustomEdge(edgeId, isActive);
      const net = await fetchNetwork();
      setEdges(net.edges);
      if (originId && destinationId) {
        calculateRoute(originId, destinationId);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Station Click handler from Map
  const handleSelectStationFromMap = (stopId: string, role: 'origin' | 'destination') => {
    if (role === 'origin') {
      setOriginId(stopId);
    } else {
      setDestinationId(stopId);
    }
  };

  // Quick test shortcut from Disruption Manager
  const handleSimulateImpact = (origin: string, dest: string) => {
    setOriginId(origin);
    setDestinationId(dest);
    setActiveTab('planner');
    calculateRoute(origin, dest);
  };

  const activeDisruptionsCount = disruptions.filter((d) => d.is_active).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeDisruptionsCount={activeDisruptionsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Backend Connectivity Warning if offline */}
        {backendError && (
          <div className="bg-red-950/70 border border-red-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-xs text-red-200">{backendError}</p>
            </div>
            <button
              onClick={loadInitialData}
              className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-white text-xs font-semibold flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Tab 1: Journey Planner Dashboard */}
        {activeTab === 'planner' && (
          <div className="space-y-6">
            <JourneyPlanner
              stops={stops}
              originId={originId}
              setOriginId={setOriginId}
              destinationId={destinationId}
              setDestinationId={setDestinationId}
              modeFilter={modeFilter}
              setModeFilter={setModeFilter}
              preference={preference}
              setPreference={setPreference}
              onPlanJourney={() => calculateRoute(originId, destinationId)}
              planResult={planResult}
              isLoading={isLoadingRoute}
              errorMessage={routeError}
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              activeDisruptionsCount={activeDisruptionsCount}
            />

            {/* In-view mini schematic map */}
            <div className="mt-8 pt-6 border-t border-slate-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-300">Active Journey Map Preview</h3>
                <button
                  onClick={() => setActiveTab('network')}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                >
                  Open Full Interactive Map →
                </button>
              </div>
              <NetworkMap
                stops={stops}
                edges={edges}
                selectedRoute={selectedRoute}
                originId={originId}
                destinationId={destinationId}
                onSelectStation={handleSelectStationFromMap}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Network Schematic Diagram */}
        {activeTab === 'network' && (
          <div className="space-y-4">
            <NetworkMap
              stops={stops}
              edges={edges}
              selectedRoute={selectedRoute}
              originId={originId}
              destinationId={destinationId}
              onSelectStation={handleSelectStationFromMap}
            />
          </div>
        )}

        {/* Tab 3: Disruption Manager */}
        {activeTab === 'disruptions' && (
          <DisruptionManager
            disruptions={disruptions}
            stops={stops}
            edges={edges}
            onToggleDisruption={handleToggleDisruption}
            onResetDisruptions={handleResetDisruptions}
            onToggleCustomEdge={handleToggleCustomEdge}
            onSimulateImpact={handleSimulateImpact}
          />
        )}

        {/* Tab 4: FLAT DFA Explorer */}
        {activeTab === 'dfa' && <DfaExplorer />}

        {/* Tab 5: COA Pipeline Simulator */}
        {activeTab === 'pipeline' && <PipelineSimulator />}

        {/* Tab 6: Methodology & Report */}
        {activeTab === 'about' && <AboutMethodology />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RouteWise © 2026 — Smart Public Transport Route Planning & Disruption Assistance</span>
          <span className="text-slate-400">
            DAA (Dijkstra) • FLAT (DFA Validator) • COA (Pipelining Simulator)
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
