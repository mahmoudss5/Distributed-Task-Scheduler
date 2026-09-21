import React, { useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Server,
} from 'lucide-react';
import { useJobFailures } from './hooks/useJobFailures';
import type { JobFailure } from '../../shared/types';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const FailureRow: React.FC<{ failure: JobFailure }> = ({ failure }) => (
  <tr className="border-b border-slate-700/30 align-top hover:bg-slate-700/20 transition-colors">
    <td className="py-3 px-3">
      <p className="text-xs font-mono text-slate-300">{failure.jobId.slice(0, 8)}</p>
      <p className="text-[11px] text-slate-500 mt-1">Attempt {failure.attemptNumber}</p>
    </td>
    <td className="py-3 px-3 text-xs text-slate-300">{failure.jobType}</td>
    <td className="py-3 px-3 min-w-[260px]">
      <p className="text-sm text-red-200 break-words">{failure.errorMessage}</p>
      {failure.errorName && <p className="text-[11px] text-slate-500 mt-1">{failure.errorName}</p>}
    </td>
    <td className="py-3 px-3">
      <span
        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${
          failure.permanent
            ? 'bg-red-500/10 text-red-300 border border-red-500/20'
            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
        }`}
      >
        {failure.permanent ? 'Permanent' : 'Retrying'}
      </span>
    </td>
    <td className="py-3 px-3 text-xs text-slate-400 whitespace-nowrap">{formatDate(failure.failedAt)}</td>
    <td className="py-3 px-3 text-xs text-slate-500 font-mono">{failure.workerId ?? '—'}</td>
  </tr>
);

const JobFailuresPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { failuresQuery, refresh } = useJobFailures(page);
  const failures = failuresQuery.data?.data ?? [];
  const meta = failuresQuery.data?.meta;
  const hasPreviousPage = page > 1;
  const hasNextPage = Boolean(meta && page * meta.limit < meta.total);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 dark:bg-slate-950 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Diagnostics</p>
          <h1 className="text-xl font-bold text-white">Job failures</h1>
          <p className="text-sm text-slate-400 mt-0.5">See why job executions failed and whether they will be retried.</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={failuresQuery.isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border bg-red-500/10 border-red-500/20">
        <AlertCircle size={14} className="text-red-400" />
        <span className="text-xs text-red-300">
          {meta?.total ?? 0} recorded failed execution{meta?.total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/30">
                {['Job ID', 'Type', 'Reason', 'Outcome', 'Failed at', 'Worker'].map((heading) => (
                  <th key={heading} className="py-2.5 px-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {failuresQuery.isLoading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-slate-700/30">
                    {[...Array(6)].map((__, cellIndex) => (
                      <td key={cellIndex} className="py-4 px-3"><div className="h-3 bg-slate-700/40 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : failuresQuery.isError ? (
                <tr><td colSpan={6} className="px-3 py-8 text-sm text-red-400">Failure history could not be loaded. Refresh to try again.</td></tr>
              ) : failures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center">
                    <Server size={24} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">No failed executions recorded.</p>
                    <p className="text-xs text-slate-600 mt-1">When a job fails, its reason will appear here.</p>
                  </td>
                </tr>
              ) : failures.map((failure) => <FailureRow key={failure.id} failure={failure} />)}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
          <span className="text-xs text-slate-500">Page {page}{meta ? ` of ${Math.max(1, Math.ceil(meta.total / meta.limit))}` : ''}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => current - 1)}
              disabled={!hasPreviousPage || failuresQuery.isFetching}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((current) => current + 1)}
              disabled={!hasNextPage || failuresQuery.isFetching}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobFailuresPage;
