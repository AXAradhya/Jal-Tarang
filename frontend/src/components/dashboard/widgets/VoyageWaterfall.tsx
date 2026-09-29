import React from 'react';
import { Layers, DollarSign } from 'lucide-react';
import { useUiStore } from '../../../store/uiStore';
import { formatCurrency, formatRateMt } from '../../../lib/utils';

export interface VoyageCostComponent {
  label: string;
  usdAmount: number;
  pct: number;
  category: 'BUNKER' | 'PORT' | 'CANAL' | 'INSURANCE' | 'MARGIN';
}

export interface VoyageWaterfallProps {
  voyageCostUsd?: number;
  cargoQtyMt?: number;
  components?: VoyageCostComponent[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const VoyageWaterfall: React.FC<VoyageWaterfallProps> = ({
  voyageCostUsd = 0,
  cargoQtyMt = 0,
  components = [],
  title = 'Voyage Cost Economics & Waterfall Distribution',
  subtitle = 'Exhaustive OPEX and fuel expenditure decomposition per metric ton',
  className,
}) => {
  const { currency } = useUiStore();
  const ratePerMt = cargoQtyMt > 0 ? voyageCostUsd / cargoQtyMt : 0;

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs ${className || ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {voyageCostUsd > 0 && (
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(voyageCostUsd)}
            </div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
              {ratePerMt > 0 ? formatRateMt(ratePerMt) : '—'}
            </div>
          </div>
        )}
      </div>

      {!components || components.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center text-slate-400">
          <Layers size={32} className="mb-2 opacity-40 text-blue-500" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No voyage cost decomposition available</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Calculate or select a voyage fixture to view itemized waterfall economics</p>
        </div>
      ) : (
        <div className="space-y-3">
        {components.map((c, i) => {
          const barColor =
            c.category === 'BUNKER'
              ? 'bg-blue-600'
              : c.category === 'PORT'
              ? 'bg-indigo-500'
              : c.category === 'MARGIN'
              ? 'bg-amber-500'
              : 'bg-cyan-500';

          return (
            <div key={i} className="space-y-1 text-left" dir="ltr">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200 text-left">
                  {typeof c.label === 'string' && c.label.includes('$615/MT') ? c.label.replace('$615/MT', formatRateMt(615)) : (c.label || 'Cost Component')}
                </span>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(c.usdAmount)}
                  </span>
                  <span className="text-slate-400 text-[11px]">({c.pct}%)</span>
                </div>
              </div>
              <div
                className="progress-track h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex justify-start items-center text-left"
                style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}
              >
                <div
                  className={`progress-bar h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${c.pct}%`, marginLeft: 0, marginRight: 'auto' }}
                />
              </div>
            </div>
          );
        })}
        </div>
      )}

      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span>Cargo Parcel: <strong>{Number(cargoQtyMt).toLocaleString()} MT</strong></span>
        <span>Active Currency: <strong>{currency}</strong></span>
      </div>
    </div>
  );
};
