import React from 'react';
import { PieChart } from 'lucide-react';

export interface ContractStatusMixProps {
  contracts: any[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const ContractStatusMix: React.FC<ContractStatusMixProps> = ({
  contracts = [],
  title = 'Contract Status Mix',
  subtitle = 'Live charterparty portfolio distribution',
  className,
}) => {
  const statuses = ['ACTIVE', 'APPROVED', 'SUBMITTED', 'DRAFT'];
  const colors: Record<string, { bar: string; text: string; bg: string }> = {
    ACTIVE: { bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    APPROVED: { bar: 'bg-blue-600', text: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    SUBMITTED: { bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    DRAFT: { bar: 'bg-slate-400', text: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
  };

  const total = contracts.length || 1;

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between ${className || ''}`}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PieChart size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>

        <div className="space-y-4 mt-6">
          {statuses.map((status) => {
            const count = contracts.filter((c: any) => c.status === status).length;
            const pct = Math.round((count / total) * 100);
            const style = colors[status] || colors.DRAFT;

            return (
              <div key={status} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">{count}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${style.bg} ${style.text}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div
                  className="progress-track h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex justify-start items-center text-left"
                  style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}
                >
                  <div
                    className={`progress-bar h-full ${style.bar} transition-all duration-500`}
                    style={{ width: `${pct}%`, marginLeft: 0, marginRight: 'auto' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 flex items-center justify-between text-xs text-slate-500">
        <span>Total Portfolios</span>
        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
          {contracts.length} Contracts
        </span>
      </div>
    </div>
  );
};
