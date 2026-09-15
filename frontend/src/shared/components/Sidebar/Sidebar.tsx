import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Zap, FileText, Loader2, LogOut } from 'lucide-react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { reportApi } from '../../api/reportApi';
import { useAuth } from '../../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const [reportStatus, setReportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
    }`;

  const handleGenerateReport = async () => {
    setReportStatus('loading');
    try {
      await reportApi.generate();
      setReportStatus('success');
      setTimeout(() => setReportStatus('idle'), 3000);
    } catch {
      setReportStatus('error');
      setTimeout(() => setReportStatus('idle'), 3000);
    }
  };

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

        <div className="mt-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-3 mb-2">Actions</p>
          <button
            onClick={handleGenerateReport}
            disabled={reportStatus === 'loading'}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              reportStatus === 'success'
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : reportStatus === 'error'
                ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {reportStatus === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            {reportStatus === 'loading'
              ? 'Queuing report…'
              : reportStatus === 'success'
              ? 'Job queued!'
              : reportStatus === 'error'
              ? 'Failed — retry'
              : 'Generate Report'}
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">Connected</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={logout}
            title="Logout"
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;


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
