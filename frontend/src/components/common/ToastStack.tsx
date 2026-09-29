import React from 'react';
import { useToastStore } from '../../store/toastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ToastStack: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-ios-notif-enter',
              isSuccess && 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100',
              isError && 'bg-rose-950/90 border-rose-500/40 text-rose-100',
              isWarning && 'bg-amber-950/90 border-amber-500/40 text-amber-100',
              (!toast.type || toast.type === 'info') && 'bg-slate-900/90 border-slate-700/60 text-slate-100'
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 size={16} className="text-emerald-400" />}
              {isError && <AlertCircle size={16} className="text-rose-400" />}
              {isWarning && <AlertTriangle size={16} className="text-amber-400" />}
              {(!toast.type || toast.type === 'info') && <Info size={16} className="text-sky-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-snug">{toast.title}</p>
              {toast.message && (
                <p className="text-[11px] opacity-80 leading-relaxed mt-0.5">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-white/10 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
