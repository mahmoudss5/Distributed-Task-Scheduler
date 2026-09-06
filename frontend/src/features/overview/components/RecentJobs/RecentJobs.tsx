import React from 'react';
import { List, RefreshCw } from 'lucide-react';
import type { Job } from '../../../../shared/types';
import JobRow from './JobRow';

interface RecentJobsProps {
  jobs: Job[];
  isLoading: boolean;
  onRefresh: () => void;
}

const RecentJobs: React.FC<RecentJobsProps> = ({ jobs, isLoading, onRefresh }) => (
  <div className="bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl backdrop-blur-sm">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
      <div className="flex items-center gap-2">
        <List size={14} className="text-slate-400" />
        <span className="text-sm font-semibold text-slate-200">Recent jobs</span>
        <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono">LIVE</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
        <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
          Latest activity across all workers
        </button>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700/30">
            {['Job ID', 'Type', 'Priority', 'Status', 'Execution Time', 'Worker'].map((h) => (
              <th key={h} className="py-2 px-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-slate-700/30">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="py-3 px-3">
                      <div className="h-3 bg-slate-700/40 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            : jobs.map((job) => <JobRow key={job.id} job={job} />)
          }
        </tbody>
      </table>
    </div>
  </div>
);

export default RecentJobs;
