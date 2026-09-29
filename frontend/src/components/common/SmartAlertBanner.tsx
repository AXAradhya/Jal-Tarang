import React from 'react';
import { AlertTriangle, AlertCircle, Sparkles, ArrowRight, X } from 'lucide-react';

interface SmartAlertBannerProps {
  id?: string;
  severity: 'CRITICAL' | 'WARNING' | 'OPPORTUNITY';
  title: string;
  description: string;
  quickActionLabel?: string;
  onQuickAction?: () => void;
  onDismiss?: () => void;
}

export const SmartAlertBanner: React.FC<SmartAlertBannerProps> = ({
  severity,
  title,
  description,
  quickActionLabel,
  onQuickAction,
  onDismiss,
}) => {
  const styles = {
    CRITICAL: {
      container: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-500/40',
      icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />,
      title: 'text-red-950 dark:text-red-100',
      description: 'text-red-900 dark:text-red-200/90',
      badge: 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border-red-200 dark:border-red-500/30',
      btn: 'bg-red-600 hover:bg-red-700 text-white',
      dismiss: 'text-red-700 dark:text-red-300 hover:text-red-950 dark:hover:text-white hover:bg-red-100 dark:hover:bg-red-900/40',
    },
    WARNING: {
      container: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/40',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
      title: 'text-amber-950 dark:text-amber-100',
      description: 'text-amber-900 dark:text-amber-200/90',
      badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-500/30',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
      dismiss: 'text-amber-700 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white hover:bg-amber-100 dark:hover:bg-amber-900/40',
    },
    OPPORTUNITY: {
      container: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40',
      icon: <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      title: 'text-emerald-950 dark:text-emerald-100',
      description: 'text-emerald-900 dark:text-emerald-200/90',
      badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      dismiss: 'text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
    },
  }[severity];

  return (
    <div className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all animate-fade-in ${styles.container}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{styles.icon}</div>
        <div>
          <h4 className={`text-sm font-bold flex items-center gap-2 ${styles.title}`}>
            {title}
            <span className={`text-[10px] px-1.5 py-0.5 uppercase tracking-wider rounded font-mono font-semibold border ${styles.badge}`}>
              {severity}
            </span>
          </h4>
          <p className={`text-xs mt-1 leading-relaxed font-normal ${styles.description}`}>{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {quickActionLabel && onQuickAction && (
          <button
            onClick={onQuickAction}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer ${styles.btn}`}
          >
            {quickActionLabel} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`p-1 rounded-md transition-colors cursor-pointer ${styles.dismiss}`}
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
