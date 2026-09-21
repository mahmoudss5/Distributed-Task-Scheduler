import React from 'react';
import { List, RefreshCw } from 'lucide-react';
import type { Job } from '../../../../shared/types';
import JobRow from './JobRow';

interface RecentJobsProps {
  jobs: Job[];
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}

const RecentJobs: React.FC<RecentJobsProps> = ({ jobs, isLoading, isError, onRefresh }) => (
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
        <span className="text-xs text-slate-500">Your latest jobs</span>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700/30">
            {['Job ID', 'Type', 'Priority', 'Status', 'Submitted', 'Worker'].map((h) => (
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
            : isError ? (
                <tr><td className="px-3 py-6 text-xs text-red-400" colSpan={6}>Your jobs could not be loaded. Refresh to try again.</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td className="px-3 py-6 text-xs text-slate-500" colSpan={6}>You have not submitted any jobs yet.</td></tr>
              ) : jobs.map((job) => <JobRow key={job.id} job={job} />)
          }
        </tbody>
      </table>
    </div>
  </div>
);

export default RecentJobs;
