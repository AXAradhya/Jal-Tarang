import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  unit?: string;
  subtitle?: React.ReactNode;
  subValue?: string;
  icon?: any;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  timeframe?: string;
  status?: 'good' | 'warning' | 'danger' | 'normal';
  trend?: {
    value: number | string;
    label?: string;
    isPositive?: boolean;
  };
  badge?: {
    text: string;
    variant?: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
  };
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  subValue,
  icon: IconProp,
  change,
  changeDirection,
  timeframe,
  status = 'normal',
  trend,
  badge,
  className,
}) => {
  const badgeColors = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    blue: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  const statusBorderColors = {
    good: 'border-emerald-500/30',
    warning: 'border-amber-500/30',
    danger: 'border-rose-500/30',
    normal: 'border-slate-200 dark:border-slate-800',
  };

  // Render icon whether it is a ComponentType or ReactElement
  const renderIcon = () => {
    if (!IconProp) return null;
    if (React.isValidElement(IconProp)) {
      return IconProp;
    }
    const Comp = IconProp as React.ComponentType<{ className?: string; size?: number }>;
    return <Comp className="w-5 h-5 text-slate-400 dark:text-slate-500" />;
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between',
        statusBorderColors[status] || statusBorderColors.normal,
        className
      )}
    >
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium tracking-tight truncate pr-2">{title}</span>
        {renderIcon()}
      </div>

      <div className="my-2 flex items-baseline gap-1.5">
        <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
          {value}
        </div>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100/80 dark:border-slate-800/80 mt-1">
        {change ? (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums',
                changeDirection === 'up'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : changeDirection === 'down'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
              )}
            >
              {changeDirection === 'up' && <ArrowUpRight className="w-3 h-3" />}
              {changeDirection === 'down' && <ArrowDownRight className="w-3 h-3" />}
              {changeDirection === 'neutral' && <Minus className="w-3 h-3" />}
              {change}
            </span>
            {timeframe && <span className="text-[11px] text-slate-400">{timeframe}</span>}
          </div>
        ) : trend ? (
          <div
            className={cn(
              'flex items-center gap-1 font-medium tabular-nums text-[11px]',
              trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {trend.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            <span>{trend.value}</span>
            {trend.label && <span className="text-slate-400 font-normal ml-0.5">{trend.label}</span>}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 truncate">{subValue || subtitle}</div>
        )}

        {badge && (
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-bold border',
              badgeColors[badge.variant || 'slate']
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subValue && change && (
        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
          {subValue}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
