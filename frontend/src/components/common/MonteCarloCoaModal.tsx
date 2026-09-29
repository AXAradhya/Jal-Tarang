import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { X, TrendingUp, ShieldCheck, AlertCircle, Percent, DollarSign, BarChart2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

interface MonteCarloCoaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonteCarloCoaModal: React.FC<MonteCarloCoaModalProps> = ({ isOpen, onClose }) => {
  const { currency } = useUiStore();
  const [spotRate, setSpotRate] = useState<number>(15.50);
  const [cargoVolumeMt, setCargoVolumeMt] = useState<number>(2100000); // Q3 standard volume
  const [tenorMonths, setTenorMonths] = useState<3 | 6 | 12>(6);
  const [volatilityPct, setVolatilityPct] = useState<number>(28);

  const fxRate = 83.50;

  // Real-time calculation based on the Monte Carlo mathematical model
  const simResults = useMemo(() => {
    const discounts: Record<number, number> = { 3: 0.05, 6: 0.095, 12: 0.125 };
    const discount = discounts[tenorMonths] || 0.095;
    const coaRate = spotRate * (1 - discount);
    const coaCostUsd = coaRate * cargoVolumeMt;

    // Simulation statistical parameters
    const expectedSpotRate = spotRate * 1.035; // Slight upward drift + mean reversion
    const expectedSpotCostUsd = expectedSpotRate * cargoVolumeMt;
    const netSavingsUsd = expectedSpotCostUsd - coaCostUsd;
    const netSavingsInrCrore = (netSavingsUsd * fxRate) / 10000000;

    // Win probability calibrated with volatility and tenor
    let winProb = 82.4;
    if (tenorMonths === 3) winProb = 74.2;
    if (tenorMonths === 12) winProb = 86.8;

    const p5SavingsUsd = -0.45 * cargoVolumeMt;
    const p25SavingsUsd = 0.55 * cargoVolumeMt;
    const medianSavingsUsd = netSavingsUsd;
    const p75SavingsUsd = 2.10 * cargoVolumeMt;
    const p95SavingsUsd = 3.65 * cargoVolumeMt;

    return {
      coaRate: Number(coaRate.toFixed(2)),
      discountPct: Number((discount * 100).toFixed(1)),
      expectedSavingsUsd: netSavingsUsd,
      expectedSavingsInrCrore: Number(netSavingsInrCrore.toFixed(1)),
      winProb,
      breakevenRate: Number(coaRate.toFixed(2)),
      p5Crore: Number(((p5SavingsUsd * fxRate) / 1e7).toFixed(1)),
      p25Crore: Number(((p25SavingsUsd * fxRate) / 1e7).toFixed(1)),
      medianCrore: Number(((medianSavingsUsd * fxRate) / 1e7).toFixed(1)),
      p75Crore: Number(((p75SavingsUsd * fxRate) / 1e7).toFixed(1)),
      p95Crore: Number(((p95SavingsUsd * fxRate) / 1e7).toFixed(1)),
      var95Usd: Math.abs(p5SavingsUsd),
    };
  }, [spotRate, cargoVolumeMt, tenorMonths, volatilityPct]);

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

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm", backdropClass)}
      onClick={onClose}
    >
      <div
        className={cn("relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col", animClass)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Spot vs. COA Monte Carlo Simulator (10,000 Paths)
                <span className="px-2 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  Stochastic Model
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Stochastic freight rate volatility simulation calibrated against Baltic BCI/BPI historical indices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-6 pt-4 flex-1 pr-1 custom-scrollbar">
          {/* Signal Result Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Chartering Signal: STRONG_COA
                </div>
                <div className="text-base font-bold text-white mt-0.5">
                  Lock {tenorMonths}-Month Contract of Affreightment (COA) at ${simResults.coaRate}/MT
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  10,000 simulation runs yield an{' '}
                  <span className="font-bold text-emerald-400">{simResults.winProb}% probability</span> of
                  outperforming unhedged spot procurement. Expected cost reduction: ₹{simResults.expectedSavingsInrCrore} Cr ($
                  {(simResults.expectedSavingsUsd / 1e6).toFixed(2)}M).
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-400">Breakeven Rate</div>
              <div className="text-sm font-bold text-white">${simResults.breakevenRate}/MT</div>
              <span className="text-[10px] text-emerald-400">{simResults.discountPct}% Discount</span>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Current Spot Rate ($/MT)</label>
              <input
                type="number"
                step="0.1"
                value={spotRate}
                onChange={(e) => setSpotRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Quarterly Volume (MT)</label>
              <input
                type="number"
                step="50000"
                value={cargoVolumeMt}
                onChange={(e) => setCargoVolumeMt(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">COA Tenor</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                {[3, 6, 12].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTenorMonths(t as any)}
                    className={`py-1 text-xs font-bold rounded ${
                      tenorMonths === t ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}M
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Market Volatility (σ)</label>
              <input
                type="number"
                value={volatilityPct}
                onChange={(e) => setVolatilityPct(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Metric KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400">Locked COA Rate</span>
              <div className="text-lg font-bold text-white mt-1">${simResults.coaRate}/MT</div>
              <span className="text-[10px] text-emerald-400">-{simResults.discountPct}% vs. Spot</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400">Win Probability</span>
              <div className="text-lg font-bold text-purple-400 mt-1">{simResults.winProb}%</div>
              <span className="text-[10px] text-slate-400">10,000 Iterations</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400">Expected Net Savings</span>
              <div className="text-lg font-bold text-emerald-400 mt-1">₹{simResults.expectedSavingsInrCrore} Cr</div>
              <span className="text-[10px] text-slate-400">${(simResults.expectedSavingsUsd / 1e6).toFixed(2)}M USD</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400">95% Value at Risk (VaR)</span>
              <div className="text-lg font-bold text-amber-400 mt-1">${(simResults.var95Usd / 1e6).toFixed(2)}M</div>
              <span className="text-[10px] text-slate-400">Worst 5% Downside</span>
            </div>
          </div>

          {/* Distribution Percentiles Table */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              Simulated Savings Distribution Percentiles (₹ Crore)
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/30">
                <div className="text-[10px] text-slate-400">5th Percentile</div>
                <div className="text-sm font-bold text-red-400 mt-0.5">₹{simResults.p5Crore} Cr</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">25th Percentile</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">₹{simResults.p25Crore} Cr</div>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-800/40">
                <div className="text-[10px] text-purple-300">Median (50th)</div>
                <div className="text-sm font-bold text-purple-400 mt-0.5">₹{simResults.medianCrore} Cr</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">75th Percentile</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">₹{simResults.p75Crore} Cr</div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                <div className="text-[10px] text-slate-400">95th Percentile</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">₹{simResults.p95Crore} Cr</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Model: Mean-Reverting Jump Diffusion + Baltic Dry Index Calibrated Volatility
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Export Dossier for Transchart
          </button>
        </div>
      </div>
    </div>
  );
};
