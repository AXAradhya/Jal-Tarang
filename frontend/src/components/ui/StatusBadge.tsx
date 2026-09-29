import React from 'react';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = 'md',
}) => {
  const norm = (status || '').toUpperCase().trim();

  let styles = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (['ACTIVE', 'AVAILABLE', 'CONFIRMED', 'OPERATIONAL', 'LOW', 'SUCCESS'].includes(norm)) {
    styles = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  } else if (['SUBMITTED', 'PENDING', 'MEDIUM', 'WATCH', 'DELAYED', 'IN_TRANSIT'].includes(norm)) {
    styles = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  } else if (['CRITICAL', 'HIGH', 'WARNING', 'SUSPENDED', 'CANCELLED', 'FAILED', 'DISCONNECTED'].includes(norm)) {
    styles = 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  } else if (['COA', 'CONTRACT_OF_AFFREIGHTMENT', 'STRATEGY', 'TIME_CHARTER'].includes(norm)) {
    styles = 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-sky-300 border-blue-200 dark:border-blue-800';
  }

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border tracking-wide uppercase',
        sizes[size],
        styles,
        className
      )}
    >
      {(status || '').replace(/_/g, ' ') || '—'}
    </span>
  );
};
