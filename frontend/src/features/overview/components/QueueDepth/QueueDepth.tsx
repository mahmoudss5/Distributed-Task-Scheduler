import React from 'react';
import { Layers } from 'lucide-react';
import type { QueueItem } from '../../../../shared/types';

const mockQueue: QueueItem[] = [
  { level: 'Critical', current: 8,   total: 714, color: 'bg-red-500' },
  { level: 'High',     current: 26,  total: 288, color: 'bg-orange-500' },
  { level: 'Normal',   current: 121, total: 284, color: 'bg-blue-500' },
  { level: 'Low',      current: 29,  total: 719, color: 'bg-slate-500' },
];

const QueueDepth: React.FC = () => {
  const total = mockQueue.reduce((sum, q) => sum + q.total, 0);

  return (
    <div className="bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">Queue depth</span>
        </div>
        <div className="text-xs text-slate-500">
          <span className="text-slate-300 font-medium">{total.toLocaleString()}</span> pending
        </div>
      </div>

      <div className="space-y-3">
        {mockQueue.map((item) => (
          <div key={item.level}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-300">{item.level}</span>
              <div className="text-xs text-slate-500">
                <span className="text-slate-300">{item.current}</span>
                <span className="mx-1">/</span>
                <span>{item.total}</span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                style={{ width: `${(item.current / item.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueueDepth;
