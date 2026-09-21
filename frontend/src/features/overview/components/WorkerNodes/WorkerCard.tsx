import React from 'react';
import { Clock3, Wifi, WifiOff } from 'lucide-react';
import type { Worker } from '../../../../shared/types';

interface WorkerCardProps {
  worker: Worker;
}

const WorkerCard: React.FC<WorkerCardProps> = ({ worker }) => {
  const isActive = worker.status === 'active';
  const lastHeartbeat = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(worker.lastHeartbeat));

  return (
    <div className={`p-3 rounded-lg border transition-all duration-200 ${
      isActive
        ? 'bg-slate-700/40 border-slate-600/40 hover:border-slate-500/40'
        : 'bg-slate-800/20 border-slate-700/20 opacity-60'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isActive
            ? <Wifi size={12} className="text-emerald-400" />
            : <WifiOff size={12} className="text-red-400" />
          }
          <span className="text-xs font-medium text-slate-200">{worker.host}</span>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
          isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {isActive ? 'Active' : 'Dead'}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-lg font-bold text-white tabular-nums">
            {worker.jobsProcessed.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">Your jobs completed</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock3 size={10} className="text-blue-400" />
          <span>{lastHeartbeat}</span>
        </div>
      </div>
      {!isActive && (
        <p className="text-xs text-red-400 mt-1">No heartbeat</p>
      )}
    </div>
  );
};

export default WorkerCard;
