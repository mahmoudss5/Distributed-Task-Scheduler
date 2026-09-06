import React from 'react';
import { Settings } from 'lucide-react';
import type { JobFormData } from '../../../../shared/types';

const JOB_TYPES = ['Email', 'Report', 'Webhook', 'SMS', 'Push'];
const PRIORITIES = ['Low', 'Normal', 'High', 'Critical'];

interface JobConfigurationProps {
  type: JobFormData['type'];
  priority: JobFormData['priority'];
  onTypeChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
}

const selectClass = "w-full bg-slate-700/50 border border-slate-600/50 text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all duration-200 dark:bg-slate-800/50";

const JobConfiguration: React.FC<JobConfigurationProps> = ({ type, priority, onTypeChange, onPriorityChange }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <span className="flex items-center justify-center w-5 h-5 bg-violet-600/20 text-violet-400 rounded text-xs font-bold">1</span>
      <div className="flex items-center gap-1.5">
        <Settings size={13} className="text-violet-400" />
        <h2 className="text-sm font-semibold text-violet-400">Job configuration</h2>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Job type</label>
        <select value={type} onChange={(e) => onTypeChange(e.target.value)} className={selectClass}>
          {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <p className="text-xs text-slate-500 mt-1.5">Select the handler that will execute this job.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Priority</label>
        <select value={priority} onChange={(e) => onPriorityChange(e.target.value)} className={selectClass}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <p className="text-xs text-slate-500 mt-1.5">Higher-priority jobs are picked up first.</p>
      </div>
    </div>
  </div>
);

export default JobConfiguration;
