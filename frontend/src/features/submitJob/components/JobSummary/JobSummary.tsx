import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import type { JobFormData } from '../../../../shared/types';

interface JobSummaryProps {
  form: JobFormData;
}

const JobSummary: React.FC<JobSummaryProps> = ({ form }) => (
  <div className="bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 sticky top-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <FileText size={13} className="text-slate-400" />
        <span className="text-sm font-semibold text-slate-200">Job summary</span>
      </div>
      <button className="text-xs bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 px-2 py-1 rounded transition-colors">
        PREVIEW
      </button>
    </div>

    <div className="space-y-3 mb-4">
      {[
        { label: 'Handler',          value: form.type === 'sendEmail' ? 'Email' : 'Report' },
        { label: 'Priority',         value: form.priority,  highlight: true },
        { label: 'Schedule',         value: form.schedule === 'now' ? 'Immediately' : form.schedule === 'later' ? 'Delayed' : 'Recurring' },
        { label: 'Worker assignment', value: 'Automatic' },
      ].map(({ label, value, highlight }) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{label}</span>
          <span className={`text-xs font-medium ${highlight ? 'text-violet-400' : 'text-slate-300'}`}>{value}</span>
        </div>
      ))}
    </div>

    <div className="p-3 bg-slate-700/30 rounded-lg mb-4">
      <div className="flex items-start gap-2">
        <ArrowRight size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-400">
          The next available worker will pick up your job based on its priority.
        </p>
      </div>
    </div>

    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
      <div className="flex items-start gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-0.5">Development environment</p>
          <p className="text-xs text-slate-500">Jobs run in this interactive demo only. No production services are connected.</p>
        </div>
      </div>
    </div>
  </div>
);

export default JobSummary;
