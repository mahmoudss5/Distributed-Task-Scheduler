import React from 'react';
import { Mail, BarChart2, Globe, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import type { Job } from '../../../../shared/types';
import StatusBadge from '../../../../shared/components/StatusBadge/StatusBadge';

interface JobRowProps {
  job: Job;
}

const typeIcons: Record<string, React.ReactNode> = {
  Email:   <Mail size={12} className="text-blue-400" />,
  Report:  <BarChart2 size={12} className="text-violet-400" />,
  Webhook: <Globe size={12} className="text-emerald-400" />,
};

const priorityIcon = (priority: Job['priority']) => {
  if (priority === 'HIGH' || priority === 'CRITICAL') return <ChevronUp size={12} className="text-red-400" />;
  if (priority === 'LOW') return <ChevronDown size={12} className="text-slate-500" />;
  return <Minus size={12} className="text-amber-400" />;
};

const JobRow: React.FC<JobRowProps> = ({ job }) => (
  <tr className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors duration-150">
    <td className="py-2.5 px-3 text-xs font-mono text-slate-400">{job.id}</td>
    <td className="py-2.5 px-3">
      <div className="flex items-center gap-1.5">
        {typeIcons[job.type] ?? null}
        <span className="text-xs text-slate-300">{job.type}</span>
      </div>
    </td>
    <td className="py-2.5 px-3">
      <div className="flex items-center gap-1">
        {priorityIcon(job.priority)}
        <span className="text-xs text-slate-300">{job.priorityLevel}</span>
      </div>
    </td>
    <td className="py-2.5 px-3"><StatusBadge status={job.status} /></td>
    <td className="py-2.5 px-3 text-xs text-slate-400 tabular-nums">{job.executionTime ?? '—'}</td>
    <td className="py-2.5 px-3 text-xs text-slate-500 font-mono">{job.workerId ?? '—'}</td>
  </tr>
);

export default JobRow;
