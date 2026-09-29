import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { X, ArrowRight, CheckCircle2, AlertTriangle, Train, Ship, Anchor, DollarSign, Layers } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

interface ArbitrageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArbitrageModal: React.FC<ArbitrageModalProps> = ({ isOpen, onClose }) => {
  const { currency } = useUiStore();
  const [cargoMt, setCargoMt] = useState<number>(120000);
  const [destinationPlant, setDestinationPlant] = useState<'DURGAPUR' | 'BOKARO' | 'ROURKELA' | 'IISCO' | 'BHILAI'>('DURGAPUR');
  const [capeRateUsd, setCapeRateUsd] = useState<number>(14.85);
  const [supraRateUsd, setSupraRateUsd] = useState<number>(22.10);
  const [sandheadsRateUsd, setSandheadsRateUsd] = useState<number>(3.20);
  const [rakeAvailabilityPct, setRakeAvailabilityPct] = useState<number>(85);
  const [haldiaFillPct, setHaldiaFillPct] = useState<number>(72);

  const fxRate = 83.50;

  const railRates: Record<string, { fromDhamra: number; fromHaldia: number }> = {
    DURGAPUR: { fromDhamra: 1280, fromHaldia: 690 },
    BOKARO:   { fromDhamra: 1320, fromHaldia: 880 },
    ROURKELA: { fromDhamra: 940,  fromHaldia: 980 },
    IISCO:    { fromDhamra: 1310, fromHaldia: 730 },
    BHILAI:   { fromDhamra: 1490, fromHaldia: 1540 },
  };

  const results = useMemo(() => {
    const rail = railRates[destinationPlant] || railRates['DURGAPUR'];

    // Option A: 2× Supramax direct to Haldia
    const optA_oceanInr = supraRateUsd * fxRate;
    const optA_handlingInr = 380;
    const optA_railInr = rail.fromHaldia;
    const optA_totalInrMt = optA_oceanInr + optA_handlingInr + optA_railInr;
    const optA_totalCrore = (optA_totalInrMt * cargoMt) / 10000000;

    // Option B: 1× Capesize split: 40% Dhamra + 60% Sandheads Lighterage
    const optB_oceanInr = (capeRateUsd + 1.20) * fxRate;
    const optB_lighterageInr = (sandheadsRateUsd * fxRate) * 0.60;
    const optB_handlingInr = (320 * 0.40) + (380 * 0.60);
    const optB_railInr = (rail.fromDhamra * 0.40) + (rail.fromHaldia * 0.60);
    const optB_totalInrMt = optB_oceanInr + optB_lighterageInr + optB_handlingInr + optB_railInr;
    const optB_totalCrore = (optB_totalInrMt * cargoMt) / 10000000;

    // Option C: Full Capesize to Dhamra + FOIS Rail Transport
    const optC_oceanInr = capeRateUsd * fxRate;
    const optC_handlingInr = 290;
    const optC_railInr = rail.fromDhamra;
    const optC_totalInrMt = optC_oceanInr + optC_handlingInr + optC_railInr;
    const optC_totalCrore = (optC_totalInrMt * cargoMt) / 10000000;

    const rakesNeeded = Math.ceil(cargoMt / 3800);
    const rakesAvailable = Math.round(rakesNeeded * (rakeAvailabilityPct / 100));

    const savingsVsDirectCrore = optA_totalCrore - optC_totalCrore;
    const savingsPerMtInr = optA_totalInrMt - optC_totalInrMt;

    return {
      optA: { inrMt: Math.round(optA_totalInrMt), crore: optA_totalCrore },
      optB: { inrMt: Math.round(optB_totalInrMt), crore: optB_totalCrore },
      optC: { inrMt: Math.round(optC_totalInrMt), crore: optC_totalCrore },
      savingsVsDirectCrore,
      savingsPerMtInr,
      rakesNeeded,
      rakesAvailable,
    };
  }, [cargoMt, destinationPlant, capeRateUsd, supraRateUsd, sandheadsRateUsd, rakeAvailabilityPct, haldiaFillPct]);

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
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Haldia Lighterage vs. Dhamra Rail Arbitrage Engine
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Feature B
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Multi-modal landed cost optimization for Capesize parcels destined for SAIL blast furnaces
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
          {/* Top Recommendation Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Recommended Routing Strategy
                </div>
                <div className="text-base font-bold text-white mt-0.5">
                  Option C: Full Capesize to Dhamra Deepwater + Indian Railways FOIS Rake Transit
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Bypasses Haldia draft constraint and open-sea Sandheads barge lighterage. Delivers{' '}
                  <span className="font-bold text-emerald-400">
                    ₹{results.savingsVsDirectCrore.toFixed(2)} Crore
                  </span>{' '}
                  savings (₹{Math.round(results.savingsPerMtInr)}/MT benefit) vs. 2× Supramax direct to Haldia.
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-400">FOIS Rake Signal</div>
              <div className="text-sm font-bold text-emerald-400">
                {results.rakesAvailable}/{results.rakesNeeded} Rakes
              </div>
              <span className="text-[10px] text-slate-400">85% Availability</span>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Cargo Parcel (MT)</label>
              <input
                type="number"
                value={cargoMt}
                onChange={(e) => setCargoMt(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">SAIL Destination Plant</label>
              <select
                value={destinationPlant}
                onChange={(e) => setDestinationPlant(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="DURGAPUR">Durgapur Steel Plant (DSP)</option>
                <option value="BOKARO">Bokaro Steel Plant (BSL)</option>
                <option value="ROURKELA">Rourkela Steel Plant (RSP)</option>
                <option value="IISCO">IISCO Steel Plant (Burnpur)</option>
                <option value="BHILAI">Bhilai Steel Plant (BSP)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Capesize Ocean Freight ($/MT)</label>
              <input
                type="number"
                step="0.05"
                value={capeRateUsd}
                onChange={(e) => setCapeRateUsd(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 3-Option Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Option A */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">OPTION A</span>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded">Direct Water</span>
                </div>
                <div className="text-sm font-bold text-white mb-1">Two Supramax to Haldia</div>
                <p className="text-xs text-slate-400 mb-3">
                  Fits Haldia 8.5m draft without open-sea lightering, but requires 2× parcels at higher ocean TCE.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ocean Freight:</span>
                    <span>${supraRateUsd}/MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lighterage:</span>
                    <span>₹0/MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rail Leg:</span>
                    <span>₹{railRates[destinationPlant]?.fromHaldia}/MT</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="text-xs text-slate-400">Landed Cost</div>
                <div className="text-base font-bold text-white">₹{results.optA.inrMt}/MT</div>
                <div className="text-xs text-slate-400">₹{results.optA.crore.toFixed(2)} Cr total</div>
              </div>
            </div>

            {/* Option B */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">OPTION B</span>
                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                    High Risk
                  </span>
                </div>
                <div className="text-sm font-bold text-white mb-1">Capesize Split + Lighterage</div>
                <p className="text-xs text-slate-400 mb-3">
                  40% discharge at Dhamra + 60% double-banking barge transfer off Sagar / Sandheads anchorage.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ocean Freight:</span>
                    <span>${(capeRateUsd + 1.20).toFixed(2)}/MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lighterage:</span>
                    <span>₹{Math.round(sandheadsRateUsd * fxRate * 0.6)}/MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transit:</span>
                    <span>11 Days</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="text-xs text-slate-400">Landed Cost</div>
                <div className="text-base font-bold text-white">₹{results.optB.inrMt}/MT</div>
                <div className="text-xs text-slate-400">₹{results.optB.crore.toFixed(2)} Cr total</div>
              </div>
            </div>

            {/* Option C */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border-2 border-emerald-500/50 flex flex-col justify-between relative shadow-lg shadow-emerald-950/50">
              <div className="absolute -top-3 right-3 px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-slate-950 rounded-full uppercase tracking-wider">
                Least Landed Cost
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-400">OPTION C</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                    Recommended
                  </span>
                </div>
                <div className="text-sm font-bold text-white mb-1">Capesize Dhamra + FOIS Rail</div>
                <p className="text-xs text-slate-300 mb-3">
                  Dhamra 18.5m deepwater draft accepts full-laden Capesize. Dispatched via Indian Railways rakes.
                </p>
                <div className="space-y-1.5 text-xs text-slate-300 border-t border-emerald-800/40 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ocean Freight:</span>
                    <span className="font-semibold text-emerald-300">${capeRateUsd}/MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lighterage:</span>
                    <span>₹0/MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rail Leg:</span>
                    <span>₹{railRates[destinationPlant]?.fromDhamra}/MT</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-800/40">
                <div className="text-xs text-slate-400">Landed Cost</div>
                <div className="text-lg font-black text-emerald-400">₹{results.optC.inrMt}/MT</div>
                <div className="text-xs text-emerald-300">₹{results.optC.crore.toFixed(2)} Cr total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Train className="w-4 h-4 text-blue-400" />
            FOIS Tariff Data: Ministry of Railways Rates Circular No. 24
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Apply to Chartering Plan
          </button>
        </div>
      </div>
    </div>
  );
};
