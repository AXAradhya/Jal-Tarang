import React from 'react';
import { CheckCircle2, AlertTriangle, Ship, Anchor, Ruler } from 'lucide-react';

export interface FeasibilityMetric {
  label: string;
  required: string | number;
  available: string | number;
  isCompatible: boolean;
  notes?: string;
}

export interface FeasibilityCardProps {
  vesselName?: string;
  vesselClass?: string;
  portName?: string;
  metrics?: FeasibilityMetric[];
  isOverallCompatible?: boolean;
  title?: string;
  className?: string;
}

export const FeasibilityCard: React.FC<FeasibilityCardProps> = ({
  vesselName,
  vesselClass,
  portName,
  metrics = [],
  isOverallCompatible = true,
  title = 'Vessel & Terminal Technical Feasibility',
  className,
}) => {
  const hasMetrics = metrics && metrics.length > 0;

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs ${className || ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Ruler size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Physical nautical parameters, under-keel clearance (UKC) & draft validation
          </p>
        </div>

        {hasMetrics && (
          <div className="flex items-center gap-2">
            {isOverallCompatible ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={13} />
                <span>BERTH COMPATIBLE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <AlertTriangle size={13} />
                <span>DRAFT RESTRICTED</span>
              </span>
            )}
          </div>
        )}
      </div>

      {(vesselName || portName) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
          {vesselName && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center gap-2.5">
              <Ship size={16} className="text-blue-500 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400">Candidate Vessel</div>
                <div className="font-bold text-slate-900 dark:text-white">{vesselName} {vesselClass ? `(${vesselClass})` : ''}</div>
              </div>
            </div>
          )}

          {portName && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center gap-2.5">
              <Anchor size={16} className="text-indigo-500 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400">Target Terminal</div>
                <div className="font-bold text-slate-900 dark:text-white">{portName}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {!hasMetrics ? (
        <div className="py-10 flex flex-col items-center justify-center text-center text-slate-400">
          <Ship size={32} className="mb-2 opacity-40 text-blue-500" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No vessel-terminal feasibility check performed</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Select a vessel and destination terminal to evaluate physical draft and LOA clearance</p>
        </div>
      ) : (
        <div className="space-y-2.5">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-850 text-xs"
          >
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{m.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Vessel: <strong className="text-slate-700 dark:text-slate-300 font-mono">{m.required}</strong> · Terminal Max: <span className="font-mono">{m.available}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                m.isCompatible
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {m.isCompatible ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                {m.isCompatible ? 'PASS' : 'EXCEEDED'}
              </span>
              {m.notes && <div className="text-[10px] text-slate-400 mt-0.5">{m.notes}</div>}
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};
