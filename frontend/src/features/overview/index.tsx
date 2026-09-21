import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Play, Clock, XCircle, Plus, AlertTriangle } from 'lucide-react';
import StatsCard from './components/StatsCard/StatsCard';
import WorkerNodes from './components/WorkerNodes/WorkerNodes';
import QueueDepth from './components/QueueDepth/QueueDepth';
import RecentJobs from './components/RecentJobs/RecentJobs';
import { useOverview } from './hooks/useOverview';

const OverviewPage: React.FC = () => {
  const { statsQuery, workersQuery, jobsQuery, queueDepthQuery, queryClient } = useOverview();

  const stats = statsQuery.data;
  const workers = workersQuery.data ?? [];
  const jobs = jobsQuery.data ?? [];
  const activeWorkers = workers.filter((worker) => worker.status === 'active').length;
  const isClusterDegraded = workers.length === 0 || activeWorkers < workers.length;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['workers'] });
    queryClient.invalidateQueries({ queryKey: ['queue-depth'] });
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
      <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border ${isClusterDegraded ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
        <AlertTriangle size={13} className={`${isClusterDegraded ? 'text-amber-400' : 'text-emerald-400'} flex-shrink-0`} />
        <span className={`text-xs ${isClusterDegraded ? 'text-amber-300' : 'text-emerald-300'}`}>{isClusterDegraded ? 'Cluster degraded' : 'Cluster healthy'}</span>
        <span className="text-xs text-slate-500 ml-1">{workersQuery.isError ? 'Worker status unavailable' : `${activeWorkers} of ${workers.length} workers operational`}</span>
        <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
          <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          LIVE — updates every 5s
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-3 mb-4">
        <StatsCard label="Completed" value={stats?.completed ?? 0} icon={CheckCircle2} iconColor="bg-emerald-500/10 text-emerald-400" trend="up"     subtitle="Processed successfully" isLoading={statsQuery.isLoading} />
        <StatsCard label="Running"   value={stats?.running ?? 0}   icon={Play}         iconColor="bg-blue-500/10 text-blue-400"       trend="neutral" subtitle="Across active workers" isLoading={statsQuery.isLoading} />
        <StatsCard label="Pending"   value={stats?.pending ?? 0}   icon={Clock}        iconColor="bg-amber-500/10 text-amber-400"     trend="up"     subtitle="Waiting in queue" isLoading={statsQuery.isLoading} />
        <StatsCard label="Failed"    value={stats?.failed ?? 0}    icon={XCircle}      iconColor="bg-red-500/10 text-red-400"         trend="down"   subtitle="Requires attention" isLoading={statsQuery.isLoading} />
      </div>

      {/* Middle Row: Workers + Queue */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="col-span-2">
          <WorkerNodes workers={workers} isLoading={workersQuery.isLoading} isError={workersQuery.isError} />
        </div>
        <QueueDepth
          counts={queueDepthQuery.data}
          isLoading={queueDepthQuery.isLoading}
          isError={queueDepthQuery.isError}
        />
      </div>

      {/* Recent Jobs */}
      <RecentJobs jobs={jobs} isLoading={jobsQuery.isLoading} isError={jobsQuery.isError} onRefresh={handleRefresh} />
    </div>
  );
};

export default OverviewPage;
