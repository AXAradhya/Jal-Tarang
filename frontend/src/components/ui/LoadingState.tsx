/**
 * JAL TARANG — Reusable Loading Skeleton Component
 * Provides clean shimmering loading skeletons for cards, tables, charts, and lists.
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface LoadingStateProps {
  type?: 'card' | 'table' | 'chart' | 'list';
  rows?: number;
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'card',
  rows = 4,
  message = 'Loading live data from official feeds...',
  className,
}) => {
  if (type === 'table') {
    return (
      <div className={cn('w-full space-y-3 p-4 animate-pulse', className)}>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4 mb-4" />
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/5" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div
        className={cn(
          'w-full h-64 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-end gap-2 animate-pulse',
          className
        )}
      >
        <div className="text-center text-xs text-slate-400 mb-auto">{message}</div>
        <div className="flex items-end gap-3 h-36">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t-sm"
              style={{ height: `${Math.min(95, (idx + 1) * 12 + 20)}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default: Card Skeleton
  return (
    <div
      className={cn(
        'p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 animate-pulse',
        className
      )}
    >
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
      <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
      <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">{message}</p>
    </div>
  );
};
