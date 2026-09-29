import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number | string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  badge?: string;
  variant?: 'default' | 'blue' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  badge,
  variant = 'default',
  className,
}) => {
  const borderVariants = {
    default: 'border-slate-200 dark:border-slate-800',
    blue: 'border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/10',
    emerald: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10',
    amber: 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10',
    rose: 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10',
  };

  return (
    <div
      className={cn(
        'relative bg-white dark:bg-slate-900/90 rounded-xl border p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-md',
        borderVariants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </div>
        </div>

        {icon && (
          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend || badge) && (
        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/60">
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
              {subtitle}
            </span>
          )}

          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 font-semibold ml-auto',
                trend.direction === 'up' && 'text-emerald-600 dark:text-emerald-400',
                trend.direction === 'down' && 'text-rose-600 dark:text-rose-400',
                trend.direction === 'neutral' && 'text-slate-500 dark:text-slate-400'
              )}
            >
              {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />}
              {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{trend.value}</span>
              {trend.label && <span className="font-normal text-slate-400 dark:text-slate-500">{trend.label}</span>}
            </div>
          )}

          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
