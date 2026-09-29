import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Sparkles,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useUiStore } from '../../../store/uiStore';
import { formatRateMt, formatPct, cn } from '../../../lib/utils';

export interface ForecastSeriesPoint {
  date: string;
  actualRate?: number;
  predictedRate?: number;
  confLow?: number;
  confHigh?: number;
  [key: string]: any;
}

export interface ForecastChartProps {
  data?: ForecastSeriesPoint[];
  title?: string;
  subtitle?: string;
  spotRate?: number;
  budgetCeiling?: number;
  className?: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  data = [],
  title = 'Bi-LSTM Forward Freight Curve & 95% Confidence Bounds',
  subtitle = 'Multi-Horizon Econometric Neural Forecast with Baltic FFA Synthesis',
  spotRate = 11.85,
  budgetCeiling = 14.50,
  className,
}) => {
  const { currency } = useUiStore();

  // ─── Interactive States ─────────────────────────────────────────────────────
  const [horizon, setHorizon] = useState<'7D' | '14D' | '30D' | '60D' | '90D' | 'ALL'>('30D');
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showBudgetLine, setShowBudgetLine] = useState<boolean>(true);

  // Filter series based on horizon
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (horizon === 'ALL') return data;
    const count = horizon === '7D' ? 7 : horizon === '14D' ? 14 : horizon === '30D' ? 30 : horizon === '60D' ? 60 : 90;
    return data.slice(0, count);
  }, [data, horizon]);

  // Key econometric summary metrics
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;
    const preds = filteredData.map((d) => d.predictedRate).filter((v): v is number => v !== undefined && !isNaN(v));
    if (preds.length === 0) return null;

    const targetPred = preds[preds.length - 1];
    const deltaFromSpot = targetPred - spotRate;
    const deltaPct = spotRate > 0 ? (deltaFromSpot / spotRate) * 100 : 0;
    const lastPoint = filteredData[filteredData.length - 1];

    return {
      spotRate,
      targetPred,
      deltaFromSpot,
      deltaPct,
      confLow: lastPoint?.confLow ?? (targetPred * 0.94),
      confHigh: lastPoint?.confHigh ?? (targetPred * 1.06),
    };
  }, [filteredData, spotRate]);

  // Export CSV
  const handleExportCsv = () => {
    if (!filteredData || filteredData.length === 0) return;
    const headers = ['Date', 'Settled_Rate', 'Predicted_Rate', 'Conf_Low_95', 'Conf_High_95'];
    const rows = filteredData.map((d) => [
      d.date,
      d.actualRate ?? '',
      d.predictedRate ?? '',
      d.confLow ?? '',
      d.confHigh ?? '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forward_freight_curve_${horizon.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Glassmorphic Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[210px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
          <span className="font-semibold text-slate-200">{label}</span>
          <span className="text-[10px] font-mono uppercase bg-blue-950/80 text-sky-300 border border-blue-800 px-1.5 py-0.2 rounded">
            Forward Curve
          </span>
        </div>
        <div className="space-y-1.5">
          {payload.map((entry: any, idx: number) => {
            if (entry.dataKey === 'confHigh' || entry.dataKey === 'confLow') return null;
            return (
              <div key={idx} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.color }} />
                  <span className="font-medium text-slate-300">{entry.name}</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {formatRateMt(Number(entry.value))}
                </span>
              </div>
            );
          })}

          {/* Show CI Range */}
          {payload[0]?.payload?.confLow !== undefined && (
            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] text-slate-400">
              <span>95% CI Range:</span>
              <span className="font-mono text-sky-400">
                {formatRateMt(payload[0].payload.confLow).split('/')[0]} – {formatRateMt(payload[0].payload.confHigh).split('/')[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all ios-card-hover ${className || ''}`}>
      {/* ─── Top Header & Controls ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sparkles size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Horizon toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['7D', '14D', '30D', '60D', '90D', 'ALL'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  horizon === h
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            title="Download forecast series as CSV"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer ios-btn-spring"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* ─── Key Econometric Metrics Callout Bar ────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Settled Spot Rate</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
              {formatRateMt(stats.spotRate)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">{horizon} Forward Forecast</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
              {formatRateMt(stats.targetPred)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Forecast Drift</span>
            <span
              className={cn(
                'font-mono font-bold text-xs flex items-center gap-0.5',
                stats.deltaPct >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {stats.deltaPct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              <span>{stats.deltaPct >= 0 ? `+${stats.deltaPct.toFixed(1)}%` : `${stats.deltaPct.toFixed(1)}%`}</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">95% Confidence Band</span>
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-xs">
              {formatRateMt(stats.confLow).split('/')[0]} – {formatRateMt(stats.confHigh).split('/')[0]}
            </span>
          </div>
        </div>
      )}

      {/* ─── Filter & Reference Line Toggles ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 mb-3 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Layers:</span>
          <button
            onClick={() => setShowConfidenceBand(!showConfidenceBand)}
            className={cn(
              'px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1.5 transition border cursor-pointer',
              showConfidenceBand
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent line-through'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>95% Confidence Interval</span>
          </button>

          <button
            onClick={() => setShowBudgetLine(!showBudgetLine)}
            className={cn(
              'px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1.5 transition border cursor-pointer',
              showBudgetLine
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent line-through'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Budget Ceiling (${budgetCeiling.toFixed(2)})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Settled Market</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-500">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>AI Forward Curve</span>
          </span>
        </div>
      </div>

      {/* ─── Chart Display ───────────────────────────────────────────────────── */}
      {!filteredData || filteredData.length === 0 ? (
        <div className="h-68 flex flex-col items-center justify-center text-center text-slate-400">
          <Sparkles size={32} className="mb-2 opacity-40 text-blue-500" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No econometric forecast data available</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Run or trigger a forward freight prediction to view forward curve</p>
        </div>
      ) : (
        <div className="h-68 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                {/* 95% Confidence Interval Soft Cloud Gradient */}
                <linearGradient id="confBandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
                </linearGradient>
                {/* Predicted Forward Curve Glow */}
                <linearGradient id="predCurveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />

              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" dy={6} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11 }}
                stroke="#64748b"
                tickFormatter={(v) => formatRateMt(v).split('/')[0]}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Spot Rate Reference Line */}
              <ReferenceLine
                y={spotRate}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: `Spot: ${formatRateMt(spotRate).split('/')[0]}`, fill: '#10b981', fontSize: 10, position: 'top' }}
              />

              {/* Budget Ceiling Reference Line */}
              {showBudgetLine && (
                <ReferenceLine
                  y={budgetCeiling}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  label={{ value: `Ceiling: $${budgetCeiling.toFixed(2)}`, fill: '#ef4444', fontSize: 10, position: 'top' }}
                />
              )}

              {/* 95% CI Area Band */}
              {showConfidenceBand && (
                <Area
                  type="monotone"
                  dataKey="confHigh"
                  fill="url(#confBandGradient)"
                  stroke="#38bdf8"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  name="Upper 95% CI"
                />
              )}

              {/* Settled Market Rate Line */}
              <Line
                type="monotone"
                dataKey="actualRate"
                stroke="#2563eb"
                strokeWidth={2.8}
                dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#60a5fa', stroke: '#1d4ed8', strokeWidth: 2 }}
                name="Settled Market Rate"
              />

              {/* AI Predicted Forward Curve Line */}
              <Line
                type="monotone"
                dataKey="predictedRate"
                stroke="#f59e0b"
                strokeWidth={2.8}
                strokeDasharray="5 3"
                dot={{ r: 3.5, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#fbbf24', stroke: '#b45309', strokeWidth: 2 }}
                name="AI Forward Curve"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ForecastChart;
