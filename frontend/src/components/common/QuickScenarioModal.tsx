import React, { useState } from 'react';
import { X, GitBranch, Play, RefreshCw, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { showToast } from '../../store/toastStore';
import { audioService } from '../../lib/audioService';

interface QuickScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickScenarioModal: React.FC<QuickScenarioModalProps> = ({ isOpen, onClose }) => {
  const { currency } = useUiStore();
  const [bunkerShockPct, setBunkerShockPct] = useState<number>(15);
  const [portDelayDays, setPortDelayDays] = useState<number>(3);
  const [demandSpikePct, setDemandSpikePct] = useState<number>(10);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    freightDeltaPct: number;
    extraCostPerTon: number;
    annualExposureUsd: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunSimulation = () => {
    setIsSimulating(true);
    audioService.playClick();
    setTimeout(() => {
      // Econometric simulation approximation
      const freightDelta = bunkerShockPct * 0.45 + portDelayDays * 2.8 + demandSpikePct * 0.35;
      const extraCost = (freightDelta / 100) * 14.2; // Base $14.20/t
      const annualExposure = extraCost * 12_000_000; // 12M MT imported coking coal

      setSimResult({
        freightDeltaPct: Number(freightDelta.toFixed(1)),
        extraCostPerTon: Number(extraCost.toFixed(2)),
        annualExposureUsd: Math.round(annualExposure),
      });
      setIsSimulating(false);
      audioService.playSuccess();
      showToast('Scenario Simulated', `Projected freight impact: +${freightDelta.toFixed(1)}%`, 'warning');
    }, 600);
  };

  const formatMoney = (usd: number) => {
    if (currency === 'INR') {
      const inrCrores = (usd * 83.5) / 10_000_000;
      return `₹${inrCrores.toFixed(1)} Cr`;
    }
    return `$${(usd / 1_000_000).toFixed(1)}M`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-ios-search-open"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <GitBranch size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Quick Scenario Simulator
                <kbd className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                  Ctrl+S
                </kbd>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stress-test freight budget against fuel shocks & weather delays
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

        {/* Sliders */}
        <div className="py-5 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>VLSFO Bunker Fuel Shock</span>
              <span className="font-mono text-blue-600 dark:text-sky-400">+{bunkerShockPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={bunkerShockPct}
              onChange={(e) => setBunkerShockPct(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Average Port Delay / Weather Stoppage</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">+{portDelayDays} Days</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={portDelayDays}
              onChange={(e) => setPortDelayDays(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Indian Steel Production Demand Spike</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">+{demandSpikePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={demandSpikePct}
              onChange={(e) => setDemandSpikePct(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Simulation Output */}
        {simResult && (
          <div className="p-4 rounded-xl border bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 mb-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Stress Test Impact
              </span>
              <span className="text-xs font-mono font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded">
                +{simResult.freightDeltaPct}% Rate Surge
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Extra Freight Cost</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  +${simResult.extraCostPerTon}/t
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Annual Financial Risk</span>
                <span className="text-base font-black text-amber-600 dark:text-amber-400">
                  {formatMoney(simResult.annualExposureUsd)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setBunkerShockPct(0);
              setPortDelayDays(0);
              setDemandSpikePct(0);
              setSimResult(null);
            }}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Reset Baseline
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Simulating Econometrics...</span>
              </>
            ) : (
              <>
                <Play size={13} />
                <span>Run Stress Test</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
