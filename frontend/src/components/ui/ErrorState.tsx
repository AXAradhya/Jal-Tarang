/**
 * JAL TARANG — Reusable Error State Component
 * Renders user-friendly error banners with actionable retry callbacks.
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to Load Data',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-6 rounded-xl border border-red-200 dark:border-red-950/60 bg-red-50/40 dark:bg-red-950/20 text-center flex flex-col items-center justify-center transition-colors',
        className
      )}
    >
      <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 mb-3 shadow-xs">
        <AlertTriangle size={22} strokeWidth={2} />
      </div>
      <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
        {title}
      </h3>
      <p className="text-xs text-red-600 dark:text-red-400 max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
        >
          <RefreshCw size={13} />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
};
