import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Play, Clock, XCircle, Plus, AlertTriangle } from 'lucide-react';
import StatsCard from './components/StatsCard/StatsCard';
import WorkerNodes from './components/WorkerNodes/WorkerNodes';
import QueueDepth from './components/QueueDepth/QueueDepth';
import RecentJobs from './components/RecentJobs/RecentJobs';
import { useOverview } from './hooks/useOverview';

const OverviewPage: React.FC = () => {
  const { statsQuery, workersQuery, jobsQuery, queryClient } = useOverview();

  const stats = statsQuery.data;
  const workers = workersQuery.data ?? [];
  const jobs = jobsQuery.data ?? [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['workers'] });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 dark:bg-slate-950 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Operations</p>
          <h1 className="text-xl font-bold text-white">System overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">Your jobs, queue, and workers. All in one place.</p>
        </div>
        <Link
          to="/submit"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors duration-200"
        >
          <Plus size={14} />
          Submit job
        </Link>
      </div>

      {/* Cluster Alert */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
        <span className="text-xs text-amber-300">Cluster degraded</span>
        <span className="text-xs text-slate-500 ml-1">3 of 4 workers operational</span>
        <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
          <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          LIVE — Updated just now
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-3 mb-4">
        <StatsCard label="Completed" value={stats?.completed ?? 0} icon={CheckCircle2} iconColor="bg-emerald-500/10 text-emerald-400" trend="up"     subtitle="Processed successfully" />
        <StatsCard label="Running"   value={stats?.running ?? 0}   icon={Play}         iconColor="bg-blue-500/10 text-blue-400"       trend="neutral" subtitle="Across active workers" />
        <StatsCard label="Pending"   value={stats?.pending ?? 0}   icon={Clock}        iconColor="bg-amber-500/10 text-amber-400"     trend="up"     subtitle="Waiting in queue" />
        <StatsCard label="Failed"    value={stats?.failed ?? 0}    icon={XCircle}      iconColor="bg-red-500/10 text-red-400"         trend="down"   subtitle="Requires attention" />
      </div>

      {/* Middle Row: Workers + Queue */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="col-span-2">
          <WorkerNodes workers={workers} isLoading={workersQuery.isLoading} />
        </div>
        <QueueDepth />
      </div>

      {/* Recent Jobs */}
      <RecentJobs jobs={jobs} isLoading={jobsQuery.isLoading} onRefresh={handleRefresh} />
    </div>
  );
};

export default OverviewPage;
