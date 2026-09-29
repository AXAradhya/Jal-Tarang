import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CloudLightning,
  Waves,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Anchor,
  TrendingDown,
  Info,
  CheckCircle2,
  RefreshCw,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { liveFeedsApi } from '../../../api';
import { useUiStore } from '../../../store/uiStore';
import { formatCurrency, formatDailyRate } from '../../../lib/utils';

export interface PortWeatherDemurrageSensitivityProps {
  initialPortId?: string;
  cargoQtyMt?: number;
  vesselClass?: string;
  dailyDemurrageRateUsd?: number;
  onApplyTerms?: (terms: {
    recommendedLaydays: number;
    demurrageRateUsd: number;
    weatherRiderClause: string;
    portId: string;
  }) => void;
  className?: string;
}

export const PortWeatherDemurrageSensitivity: React.FC<PortWeatherDemurrageSensitivityProps> = ({
  initialPortId = 'INPAV',
  cargoQtyMt = 160000,
  vesselClass = 'Capesize',
  dailyDemurrageRateUsd = 25000,
  onApplyTerms,
  className,
}) => {
  const { currency, exchangeRate } = useUiStore();
  const [selectedPortId, setSelectedPortId] = useState<string>(initialPortId);
  const [demurrageRate, setDemurrageRate] = useState<number>(dailyDemurrageRateUsd);
  const [customDelayDays, setCustomDelayDays] = useState<number | null>(null);
  const [applied, setApplied] = useState(false);

  // 1. Fetch live Open-Meteo & IMD port weather
  const { data: weatherPorts, isLoading: weatherLoading, refetch: refetchWeather } = useQuery({
    queryKey: ['liveFeeds', 'marineWeather'],
    queryFn: () => liveFeedsApi.getMarineWeather(),
    staleTime: 60_000,
  });

  // 2. Fetch Data.gov.in & Sagarmala port logistics benchmarks
  const { data: logisticsData, isLoading: logisticsLoading } = useQuery({
    queryKey: ['liveFeeds', 'portLogistics'],
    queryFn: () => liveFeedsApi.getPortLogistics(),
    staleTime: 120_000,
  });

  const activeWeather = useMemo(() => {
    if (!weatherPorts || !Array.isArray(weatherPorts)) return null;
    return weatherPorts.find((p: any) => p.portId === selectedPortId) || weatherPorts[0];
  }, [weatherPorts, selectedPortId]);

  const activeBenchmark = useMemo(() => {
    if (!logisticsData?.ports || !Array.isArray(logisticsData.ports)) return null;
    return logisticsData.ports.find((p: any) => p.portId === selectedPortId) || logisticsData.ports[0];
  }, [logisticsData, selectedPortId]);

  // Estimate expected weather delay based on IMD Danger Signal & swell height
  const autoWeatherDelayDays = useMemo(() => {
    if (!activeWeather) return 0.5;
    const signal = activeWeather.dangerSignalNumber || 1;
    const swell = activeWeather.swellHeightM || 1.2;

    if (signal >= 7) return 4.0;
    if (signal >= 5) return 3.0;
    if (signal >= 3) return 1.5;
    if (swell > 2.2) return 1.0;
    if (swell > 1.5) return 0.5;
    return 0.2;
  }, [activeWeather]);

  const delayDays = customDelayDays !== null ? customDelayDays : autoWeatherDelayDays;

  // Demurrage calculation
  const demurrageExposureUsd = Math.round(delayDays * demurrageRate);
  const dischargeRateMtDay = activeBenchmark?.mechanicalDischargeRateMtDay || 50000;
  const netDischargeDays = +(cargoQtyMt / dischargeRateMtDay).toFixed(1);
  const recommendedLaydays = +(netDischargeDays + delayDays).toFixed(1);

  const recommendedClause = `Laytime allowed: ${recommendedLaydays} Weather Working Days of 24 consecutive hours, Sundays and Holidays Included (WWD SHINC). Demurrage rate: ${formatDailyRate(demurrageRate)} with laytime to cease upon completion of discharge or vessel sailing.`;

  const handleApply = () => {
    setApplied(true);
    if (onApplyTerms) {
      onApplyTerms({
        recommendedLaydays,
        demurrageRateUsd: demurrageRate,
        weatherRiderClause: recommendedClause,
        portId: selectedPortId,
      });
    }
    setTimeout(() => setApplied(false), 3000);
  };

  const getSignalBadge = (sigNum: number) => {
    if (sigNum >= 7) return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
    if (sigNum >= 3) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs ${
        className || ''
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CloudLightning className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Live Port Weather & Demurrage Risk Sensitivity
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Open-Meteo & IMD Live
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulate ocean swell, port storm danger signals, and demurrage financial liability for {vesselClass} arrivals.
          </p>
        </div>

        {/* Port Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'INPAV', name: 'Paradip' },
            { id: 'INVTZ', name: 'Vizag' },
            { id: 'INHAL', name: 'Haldia' },
            { id: 'INDHM', name: 'Dhamra' },
            { id: 'INMRM', name: 'Mormugao' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPortId(p.id);
                setCustomDelayDays(null);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                selectedPortId === p.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Weather Telemetry + Demurrage Sensitivity Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left Column: Live Ocean Conditions & Port Productivity (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Sea State & IMD Danger Signal Box */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {activeWeather?.portName || 'Port'} ({selectedPortId})
                </span>
              </div>
              <span
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${getSignalBadge(
                  activeWeather?.dangerSignalNumber || 1
                )}`}
              >
                {activeWeather?.dangerSignalText || 'Signal No. 1'}
              </span>
            </div>

            {/* Weather Metrics Strip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Wave Height</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                  {activeWeather?.waveHeightM?.toFixed(1) || '1.4'} m
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Swell Height</span>
                <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {activeWeather?.swellHeightM?.toFixed(1) || '1.1'} m
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">Wind Gusts</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                  {activeWeather?.windSpeedKnots?.toFixed(0) || '15'} kts
                </span>
              </div>
            </div>

            {/* Port Notice */}
            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 p-2 rounded-lg border border-slate-200/40 dark:border-slate-700/40 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>{activeWeather?.portAuthorityNotice || 'Standard operational weather status.'}</span>
            </div>
          </div>

          {/* Port Logistics Benchmarks (Data.gov.in / Sagarmala) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Terminal Handling Efficiency (Data.gov.in)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">SAGARMALA IPA</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-500">Discharge Rate:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {Number(dischargeRateMtDay).toLocaleString()} MT/day
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-500">Pre-Berth Wait:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeBenchmark?.preBerthingWaitDays || 1.2} Days
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Average TRT:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeBenchmark?.avgTurnaroundTimeDays || 2.1} Days
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Permissible Draft:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {activeBenchmark?.maxDraughtM || 17.5} m
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Demurrage Sensitivity & Laytime Recommendation (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Demurrage Exposure Sensitivity Model
                </h4>
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Active: <strong className="text-blue-600 dark:text-blue-400">{currency}</strong> (@ ₹{exchangeRate.toFixed(2)}/$)
              </span>
            </div>

            {/* Slider & Inputs */}
            <div className="space-y-4">
              {/* Weather Delay Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">
                    Weather & Storm Surge Delay at Berth:{' '}
                    <strong className="text-slate-900 dark:text-white tabular-nums">{delayDays.toFixed(1)} Days</strong>
                  </span>
                  {customDelayDays !== null && (
                    <button
                      onClick={() => setCustomDelayDays(null)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Reset to IMD Auto ({autoWeatherDelayDays.toFixed(1)}d)
                    </button>
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="5.0"
                  step="0.1"
                  value={delayDays}
                  onChange={(e) => setCustomDelayDays(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0.0d (Calm / Signal 1)</span>
                  <span>1.5d (Signal 3 Cautionary)</span>
                  <span>3.0d (Signal 5 Storm)</span>
                  <span>5.0d (Severe Surge)</span>
                </div>
              </div>

              {/* Demurrage Rate Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                    Contractual Demurrage Rate ($/day):
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      value={demurrageRate}
                      onChange={(e) => setDemurrageRate(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-6 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums font-semibold"
                    />
                  </div>
                </div>

                {/* Demurrage Exposure Metric Card */}
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/60 p-2.5 rounded-lg flex flex-col justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                    Net Demurrage Exposure
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-base font-extrabold text-red-700 dark:text-red-300 tabular-nums">
                      {formatCurrency(demurrageExposureUsd)}
                    </span>
                    {currency === 'INR' && (
                      <span className="text-[11px] font-semibold text-red-600/70 dark:text-red-400/70">
                        (${(demurrageExposureUsd).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Rider Clause Recommendation */}
            <div className="mt-3.5 p-2.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Recommended SAIL Charterparty Shield
              </div>
              <p className="text-[11px] text-blue-800 dark:text-blue-200 leading-relaxed">
                Negotiate <strong>{recommendedLaydays} Laydays (WWD SHINC)</strong> incorporating Weather Working Days clause to absorb the +{delayDays.toFixed(1)}d IMD weather disruption and prevent {formatCurrency(demurrageExposureUsd)} demurrage forfeiture.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Net Laytime: <strong>{netDischargeDays}d</strong> discharge + <strong>{delayDays.toFixed(1)}d</strong> weather buffer
            </span>
            <button
              onClick={handleApply}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs ${
                applied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {applied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Applied to Fixture Terms!
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Apply Shield to Counter-Offer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortWeatherDemurrageSensitivity;
