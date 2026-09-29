import React from 'react';
import { cn } from '../../lib/utils';

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-pulse space-y-3',
      className
    )}
  >
    <div className="flex items-center justify-between">
      <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
      <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
    </div>
    <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-32" />
    <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-48" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className,
}) => (
  <div
    className={cn(
      'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm animate-pulse',
      className
    )}
  >
    <div className="h-10 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4">
      <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-24" />
      <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
      <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-20 ml-auto" />
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 flex items-center px-4 gap-4">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-28" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-36" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20 ml-auto" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-pulse space-y-4',
      className
    )}
  >
    <div className="flex items-center justify-between">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36" />
      <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-28" />
    </div>
    <div className="h-48 bg-slate-100 dark:bg-slate-800/40 rounded-lg flex items-end p-4 gap-3">
      <div className="h-3/4 bg-slate-200 dark:bg-slate-800 rounded-t w-1/6" />
      <div className="h-1/2 bg-slate-200 dark:bg-slate-800 rounded-t w-1/6" />
      <div className="h-4/5 bg-slate-200 dark:bg-slate-800 rounded-t w-1/6" />
      <div className="h-2/3 bg-slate-200 dark:bg-slate-800 rounded-t w-1/6" />
      <div className="h-1/3 bg-slate-200 dark:bg-slate-800 rounded-t w-1/6" />
      <div className="h-5/6 bg-slate-200 dark:bg-slate-800 rounded-t w-1/6" />
    </div>
  </div>
);
