import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { X, Calculator, Clock, DollarSign, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';

interface DemurrageCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemurrageCalculatorModal: React.FC<DemurrageCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currency } = useUiStore();
  const settings = useSettingsStore((s) => s.settings);
  const [cargoTonnage, setCargoTonnage] = useState<number>(75000);
  const [loadDischargeRate, setLoadDischargeRate] = useState<number>(15000); // MT/day
  const [actualHoursUsed, setActualHoursUsed] = useState<number>(168); // 7 days in hours
  const [demurrageRatePerDay, setDemurrageRatePerDay] = useState<number>(settings?.demurrageCalculationRateUsd || 18500);

  // iOS-style smooth open and close lifecycle
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animClass, setAnimClass] = useState(isOpen ? 'animate-ios-search-open' : '');
  const [backdropClass, setBackdropClass] = useState(isOpen ? 'animate-ios-backdrop-open' : '');
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);

    if (isOpen) {
      setShouldRender(true);
      setAnimClass('animate-ios-search-open');
      setBackdropClass('animate-ios-backdrop-open');
    } else if (shouldRender) {
      setAnimClass('animate-ios-search-close');
      setBackdropClass('animate-ios-backdrop-close');
      animTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimClass('');
        setBackdropClass('');
      }, 230);
    }

    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  // Laytime calculation
  const laytimeDaysAllowed = cargoTonnage / (loadDischargeRate || 1);
  const laytimeHoursAllowed = laytimeDaysAllowed * 24;
  const excessHours = Math.max(0, actualHoursUsed - laytimeHoursAllowed);
  const excessDays = excessHours / 24;
  const dispatchHours = Math.max(0, laytimeHoursAllowed - actualHoursUsed);
  const dispatchDays = dispatchHours / 24;

  const demurrageCostUsd = excessDays * demurrageRatePerDay;
  const dispatchEarnedUsd = dispatchDays * (demurrageRatePerDay * 0.5); // Dispatch typically 50%

  const inrRate = 83.5;
  const formatMoney = (usd: number) => {
    if (currency === 'INR') {
      const inr = usd * inrRate;
      return `₹${(inr / 100000).toFixed(2)} Lakhs`;
    }
    return `$${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const hasDemurrage = excessHours > 0;

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm", backdropClass)}
      onClick={onClose}
    >
      <div
        className={cn("w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden", animClass)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calculator size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Demurrage & Laytime Calculator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instantly compute demurrage liability or dispatch earnings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4 py-5">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Cargo Tonnage (MT)
            </label>
            <input
              type="number"
              value={cargoTonnage}
              onChange={(e) => setCargoTonnage(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Discharge Rate (MT/Day)
            </label>
            <input
              type="number"
              value={loadDischargeRate}
              onChange={(e) => setLoadDischargeRate(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Actual Port Hours Used
            </label>
            <input
              type="number"
              value={actualHoursUsed}
              onChange={(e) => setActualHoursUsed(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Demurrage Rate ($/Day)
            </label>
            <input
              type="number"
              value={demurrageRatePerDay}
              onChange={(e) => setDemurrageRatePerDay(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        {/* Results Card */}
        <div
          className={`p-4 rounded-xl border ${
            hasDemurrage
              ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50'
              : 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {hasDemurrage ? 'Projected Demurrage Liability' : 'Projected Dispatch Earned'}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                hasDemurrage
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {hasDemurrage ? `+${excessHours.toFixed(1)} hrs Demurrage` : `-${dispatchHours.toFixed(1)} hrs Dispatch`}
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatMoney(hasDemurrage ? demurrageCostUsd : dispatchEarnedUsd)}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
            <div>Laytime Allowed: <span className="font-bold text-slate-900 dark:text-slate-200">{laytimeDaysAllowed.toFixed(1)} days ({laytimeHoursAllowed.toFixed(0)}h)</span></div>
            <div>Actual Time: <span className="font-bold text-slate-900 dark:text-slate-200">{(actualHoursUsed / 24).toFixed(1)} days ({actualHoursUsed}h)</span></div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
