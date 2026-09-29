import React, { useState } from 'react';
import { AlertTriangle, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../../store/settingsStore';

export const CriticalStockBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const thresholdDays = useSettingsStore((s) => s.settings?.criticalStockThresholdDays ?? 14);

  // In production, this checks plant stock data. DSP is currently at 11 days runway.
  const currentDays = 11;
  const isCritical = currentDays < thresholdDays;
  const deficitDays = thresholdDays - currentDays;

  const criticalPlant = {
    name: 'Durgapur Steel Plant (DSP)',
    days: currentDays,
    deficit: `${deficitDays} days below statutory buffer (${thresholdDays}d)`,
  };

  if (dismissed || !isCritical) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md select-none border-beam-animated palette-rose animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="p-1 rounded bg-white/20 flex-shrink-0 animate-pulse">
          <ShieldAlert size={14} />
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold tracking-wide uppercase text-[11px] bg-black/20 px-1.5 py-0.5 rounded">
            Statutory Stock Warning
          </span>
          <span className="font-medium truncate">
            {criticalPlant.name} is at <strong className="underline underline-offset-2">{criticalPlant.days} days</strong> runway ({criticalPlant.deficit}).
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <Link
          to="/decision"
          className="inline-flex items-center gap-1 font-bold bg-white text-rose-700 hover:bg-slate-100 px-2.5 py-1 rounded text-[11px] transition-colors shadow-2xs"
        >
          <span>Prioritize Discharge</span>
          <ArrowRight size={11} />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          title="Dismiss warning"
          className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
