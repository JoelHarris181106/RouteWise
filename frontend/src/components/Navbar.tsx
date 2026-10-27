import React from 'react';
import { 
  Navigation, 
  Map as MapIcon, 
  AlertTriangle, 
  Cpu, 
  Activity, 
  BookOpen, 
  CheckCircle2, 
  Train
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeDisruptionsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeDisruptionsCount,
}) => {
  const navItems = [
    { id: 'planner', label: 'Journey Planner', icon: Navigation },
    { id: 'network', label: 'Network Diagram', icon: MapIcon },
    { 
      id: 'disruptions', 
      label: 'Disruptions', 
      icon: AlertTriangle,
      badge: activeDisruptionsCount > 0 ? activeDisruptionsCount : null 
    },
    { id: 'dfa', label: 'FLAT: DFA Explorer', icon: Cpu },
    { id: 'pipeline', label: 'COA: Pipeline Sim', icon: Activity },
    { id: 'about', label: 'Methodology & Report', icon: BookOpen },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('planner')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">RouteWise</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium">
                  3-in-1 CS Project
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                DAA Dijkstra • FLAT DFA • COA Pipelining
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-red-500 text-white text-xs rounded-full font-bold animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status Indicator */}
          <div className="hidden lg:flex items-center space-x-3 pl-4 border-l border-slate-800">
            {activeDisruptionsCount > 0 ? (
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800/50 text-red-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>{activeDisruptionsCount} Active Disruption{activeDisruptionsCount > 1 ? 's' : ''}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All Lines Normal</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
