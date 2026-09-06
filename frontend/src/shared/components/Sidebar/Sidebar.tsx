import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Zap } from 'lucide-react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const Sidebar: React.FC = () => {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
    }`;

  return (
    <aside className="w-56 flex-shrink-0 h-screen flex flex-col bg-slate-900 dark:bg-slate-950 border-r border-slate-700/50">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-700/50">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <span className="font-bold text-white text-sm tracking-wide">TaskFlow</span>
        <span className="ml-auto text-xs text-slate-500 font-mono">v1.0</span>
      </div>

      {/* Cluster Info */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Workspace</p>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold">T</div>
          <div>
            <p className="text-xs font-medium text-slate-200">TaskFlow Cluster</p>
            <p className="text-xs text-slate-500">Development</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <p className="text-xs text-slate-500 uppercase tracking-wider px-3 mb-2">Navigation</p>
        <NavLink to="/" end className={navClass}>
          <LayoutDashboard size={16} />
          Overview
        </NavLink>
        <NavLink to="/submit" className={navClass}>
          <PlusCircle size={16} />
          Submit Job
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">Connected</span>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
};

export default Sidebar;
