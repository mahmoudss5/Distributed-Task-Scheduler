import React from 'react';
import { Server } from 'lucide-react';
import type { Worker } from '../../../../shared/types';
import WorkerCard from './WorkerCard';

interface WorkerNodesProps {
  workers: Worker[];
  isLoading: boolean;
  isError: boolean;
}

const WorkerNodes: React.FC<WorkerNodesProps> = ({ workers, isLoading, isError }) => {
  const activeCount = workers.filter((w) => w.status === 'active').length;
  const deadCount   = workers.filter((w) => w.status === 'dead').length;

  return (
    <div className="bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">Worker nodes</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-400">{activeCount} active</span>
          {deadCount > 0 && <span className="text-red-400">{deadCount} dead</span>}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-slate-700/30 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-xs text-red-400">Worker status is temporarily unavailable.</p>
      ) : workers.length === 0 ? (
        <p className="text-xs text-slate-500">No worker records are available yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {workers.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      )}

      <p className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
        Worker availability is based on each worker's latest heartbeat.
      </p>
    </div>
  );
};

export default WorkerNodes;
