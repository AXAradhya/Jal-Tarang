/**
 * JAL TARANG — Reusable Empty State Component
 * Renders consistent, accessible, enterprise empty states across tables, cards, and charts.
 */

import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  className,
}) => {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 transition-colors',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3.5 shadow-xs">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
        >
          {ActionIcon && <ActionIcon size={14} />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
