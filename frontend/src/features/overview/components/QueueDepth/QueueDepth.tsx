import React from 'react';
import { Layers } from 'lucide-react';
import type { JobQueueCounts } from '../../../../shared/types';

interface QueueDepthProps {
  counts?: JobQueueCounts;
  isLoading: boolean;
  isError: boolean;
}

const QueueDepth: React.FC<QueueDepthProps> = ({ counts, isLoading, isError }) => {
  const queue = [
    { level: 'High', count: counts?.high ?? 0, color: 'bg-orange-500' },
    { level: 'Medium', count: counts?.medium ?? 0, color: 'bg-blue-500' },
    { level: 'Low', count: counts?.low ?? 0, color: 'bg-slate-500' },
  ];
  const total = queue.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">Queue depth</span>
        </div>
        <div className="text-xs text-slate-500">
          <span className="text-slate-300 font-medium">{total.toLocaleString()}</span> jobs
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => <div key={index} className="h-7 rounded bg-slate-700/40 animate-pulse" />)}
        </div>
      ) : isError ? (
        <p className="text-xs text-red-400">Queue data is temporarily unavailable.</p>
      ) : (
        <div className="space-y-3">
        {queue.map((item) => (
          <div key={item.level}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-300">{item.level}</span>
              <div className="text-xs text-slate-500">
                <span className="text-slate-300">{item.count.toLocaleString()}</span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                style={{ width: `${total === 0 ? 0 : (item.count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default QueueDepth;
