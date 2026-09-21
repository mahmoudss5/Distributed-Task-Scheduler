import React from 'react';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle: string;
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon: Icon, iconColor, trend, subtitle, isLoading }) => {
  return (
    <div className="flex-1 min-w-0 bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</span>
        <div className={`p-1.5 rounded-lg ${iconColor}`}>
          <Icon size={14} />
        </div>
      </div>
      <div className="flex items-end gap-2 mb-1">
        {isLoading ? (
          <span className="h-8 w-14 rounded bg-slate-700/40 animate-pulse" />
        ) : (
          <span className="text-2xl font-bold text-white dark:text-slate-100 tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        )}
        {trend === 'up' && <TrendingUp size={14} className="text-emerald-400 mb-1" />}
        {trend === 'down' && <TrendingDown size={14} className="text-red-400 mb-1" />}
      </div>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
};

export default StatsCard;
