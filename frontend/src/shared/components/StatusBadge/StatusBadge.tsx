import React from 'react';
import type { Job } from '../../types';

interface StatusBadgeProps {
  status: Job['status'];
}

const statusStyles: Record<Job['status'], string> = {
  PENDING:    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  COMPLETED:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  FAILED:     'bg-red-500/10 text-red-400 border border-red-500/20',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[status]}`}>
    {status.charAt(0) + status.slice(1).toLowerCase()}
  </span>
);

export default StatusBadge;
