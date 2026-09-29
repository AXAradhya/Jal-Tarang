import React from 'react';
import { AlertTriangle, Anchor, CheckCircle2 } from 'lucide-react';

export interface PortCongestionItem {
  id?: string;
  name: string;
  code?: string;
  country?: string;
  congestionStatus?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL';
  currentWaitingDays?: number;
  [key: string]: any;
}

export interface PortCongestionListProps {
  ports?: PortCongestionItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const PortCongestionList: React.FC<PortCongestionListProps> = ({
  ports = [],
  title = 'Port Congestion Status & Alert Feeds',
  subtitle = 'Real-time terminal congestion tracking across Indian gateways',
  className,
}) => {
  const items = ports || [];

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          <AlertTriangle size={10} /> CRITICAL
        </span>
      );
    }
    if (s === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
          <AlertTriangle size={10} /> HIGH
        </span>
      );
    }
    if (s === 'MODERATE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          MODERATE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 size={10} /> NORMAL
      </span>
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between ${className || ''}`}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Anchor size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{subtitle}</p>

        {items.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400">
            <Anchor size={28} className="mb-2 opacity-40 text-blue-500" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No port congestion records available</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Live port congestion data will appear once reported</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {items.map((p) => {
              const status = p.congestionStatus || p.congestion_status || 'NORMAL';
              const waitDays = Number(p.currentWaitingDays || p.current_waiting_days || 0);

              return (
                <div
                  key={p.id || p.name}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-[11px] text-slate-400">{p.country || 'India'} • {p.code || 'PORT'}</div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(status)}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {waitDays > 0 ? `${waitDays.toFixed(1)}d wait` : 'No wait'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Monitored Terminals</span>
        <span className="font-semibold text-slate-900 dark:text-white">{items.length} Ports</span>
      </div>
    </div>
  );
};
