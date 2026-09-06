import React from 'react';
import { Calendar, Play, Clock, Repeat } from 'lucide-react';
import type { JobFormData } from '../../../../shared/types';

interface ExecutionScheduleProps {
  schedule: JobFormData['schedule'];
  onScheduleChange: (v: JobFormData['schedule']) => void;
}

const OPTIONS: { value: JobFormData['schedule']; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'now',       label: 'Run now',   desc: 'Queue immediately',    icon: <Play size={14} /> },
  { value: 'later',     label: 'Run later', desc: 'After a set delay',    icon: <Clock size={14} /> },
  { value: 'recurring', label: 'Recurring', desc: 'Cron expression',      icon: <Repeat size={14} /> },
];

const ExecutionSchedule: React.FC<ExecutionScheduleProps> = ({ schedule, onScheduleChange }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <span className="flex items-center justify-center w-5 h-5 bg-violet-600/20 text-violet-400 rounded text-xs font-bold">2</span>
      <div className="flex items-center gap-1.5">
        <Calendar size={13} className="text-violet-400" />
        <h2 className="text-sm font-semibold text-violet-400">Execution schedule</h2>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onScheduleChange(opt.value)}
          className={`flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-all duration-200 ${
            schedule === opt.value
              ? 'bg-violet-600/10 border-violet-500/40 text-violet-300'
              : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:border-slate-500/50 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
              schedule === opt.value ? 'border-violet-400 bg-violet-400' : 'border-slate-500'
            }`} />
            {opt.icon}
            <span className="text-sm font-medium">{opt.label}</span>
          </div>
          <span className="text-xs text-slate-500 pl-5">{opt.desc}</span>
        </button>
      ))}
    </div>
  </div>
);

export default ExecutionSchedule;
