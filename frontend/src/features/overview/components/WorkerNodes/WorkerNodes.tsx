import React from 'react';
import { Server } from 'lucide-react';
import type { Worker } from '../../../../shared/types';
import WorkerCard from './WorkerCard';

interface WorkerNodesProps {
  workers: Worker[];
  isLoading: boolean;
}

const WorkerNodes: React.FC<WorkerNodesProps> = ({ workers, isLoading }) => {
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
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {workers.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between">
        <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
          Configure autoscaling
        </button>
        <div className="flex gap-2 text-xs text-slate-500">
          <span>Scaled</span>
          <span className="text-slate-400">• Load more</span>
        </div>
      </div>
    </div>
  );
};

export default WorkerNodes;
