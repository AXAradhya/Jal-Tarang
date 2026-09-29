import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id: customId, ...props }, ref) => {
    const defaultId = useId();
    const id = customId || defaultId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border rounded-lg shadow-sm transition-colors',
            'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>
        )}
        {error && (
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, children, id: customId, ...props }, ref) => {
    const defaultId = useId();
    const id = customId || defaultId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border rounded-lg shadow-sm transition-colors',
            'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {hint && !error && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>
        )}
        {error && (
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
