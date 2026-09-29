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
} from 'recharts';
import {
  TrendingUp,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { freightApi } from '../../../api';
import { useUiStore } from '../../../store/uiStore';
import { formatDailyRate, cn } from '../../../lib/utils';

export interface FreightTrendPoint {
  date: string;
  shortDate?: string;
  isoDate?: string;
  bdi?: number;
  bdiIndex?: number;
  c5FreightRate?: number;
  Capesize?: number;
  Panamax?: number;
  Supramax?: number;
  isLive?: boolean;
  [key: string]: any;
}

export interface FreightTrendChartProps {
  data?: FreightTrendPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const FreightTrendChart: React.FC<FreightTrendChartProps> = ({
  data,
  title,
  subtitle = 'Spot & time charter trends across key dry bulk vessel classes',
  className,
}) => {
  const { currency, exchangeRate } = useUiStore();
  const currentRate = exchangeRate || 95;

  // ─── Autonomous Live API Fetching ──────────────────────────────────────────
  const {
    data: remoteData = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['freightTrends', 'history'],
    queryFn: async () => {
      const res = await freightApi.trends({ days: 365 });
      return Array.isArray(res) ? res : ((res as any)?.data || []);
    },
    enabled: !data || data.length === 0,
    staleTime: 5 * 60 * 1000,
  });

  const effectiveData: FreightTrendPoint[] = useMemo(() => {
    if (data && data.length > 0) return data;
    return remoteData;
  }, [data, remoteData]);

  // ─── Dynamic Currency Title ────────────────────────────────────────────────
  const chartTitle = useMemo(() => {
    if (typeof title === 'string' && title.trim()) {
      if (currency === 'INR') {
        return title.replace(/\$\/Day/g, '₹/Day').replace(/USD\/Day/g, 'INR/Day');
      }
      return title.replace(/₹\/Day/g, '$/Day').replace(/INR\/Day/g, 'USD/Day');
    }
    return currency === 'INR'
      ? 'Baltic Freight Rate Indices (TCE ₹/Day)'
      : 'Baltic Freight Rate Indices (TCE $/Day)';
  }, [title, currency]);

  // ─── Interactive States ─────────────────────────────────────────────────────
  const [timeframe, setTimeframe] = useState<'7D' | '14D' | '30D' | '90D' | 'ALL'>('30D');
  const [activeSeries, setActiveSeries] = useState<{ Capesize: boolean; Panamax: boolean; Supramax: boolean }>({
    Capesize: true,
    Panamax: true,
    Supramax: true,
  });

  // Filter data based on selected timeframe
  const filteredData = useMemo(() => {
    if (!effectiveData || effectiveData.length === 0) return [];
    if (timeframe === 'ALL') return effectiveData;
    const days = timeframe === '7D' ? 7 : timeframe === '14D' ? 14 : timeframe === '30D' ? 30 : 90;
    return effectiveData.slice(-days);
  }, [effectiveData, timeframe]);

  // Compute live statistical summary metrics
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;
    const capeVals = filteredData.map((d) => d.Capesize).filter((v): v is number => v !== undefined && !isNaN(v));
    if (capeVals.length === 0) return null;

    const maxCape = Math.max(...capeVals);
    const minCape = Math.min(...capeVals);
    const avgCape = Math.round(capeVals.reduce((a, b) => a + b, 0) / capeVals.length);
    const first = capeVals[0];
    const last = capeVals[capeVals.length - 1];
    const deltaPct = first ? ((last - first) / first) * 100 : 0;

    const lastPoint = filteredData[filteredData.length - 1];
    const latestBdi = lastPoint?.bdi ?? lastPoint?.bdiIndex;

    return { maxCape, minCape, avgCape, deltaPct, latestBdi };
  }, [filteredData]);

  // Toggle series visibility
  const toggleSeries = (key: 'Capesize' | 'Panamax' | 'Supramax') => {
    setActiveSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Export CSV Utility - exports exact timeframe data with active currency values
  const handleExportCsv = () => {
    if (!filteredData || filteredData.length === 0) return;
    const isINR = currency === 'INR';
    const rate = currentRate;

    const headers = [
      'Date',
      'Baltic_Dry_Index_BDI',
      `Capesize_TCE_${currency}_per_Day`,
      `Panamax_TCE_${currency}_per_Day`,
      `Supramax_TCE_${currency}_per_Day`,
      'C5TC_WAust_China_USD_per_MT',
      'Currency',
      'Exchange_Rate_USD_INR'
    ];

    const rows = filteredData.map((d) => {
      const rawCape = d.Capesize != null ? Number(d.Capesize) : 0;
      const rawPanamax = d.Panamax != null ? Number(d.Panamax) : 0;
      const rawSupramax = d.Supramax != null ? Number(d.Supramax) : 0;

      const cape = isINR ? Math.round(rawCape * rate) : rawCape;
      const panamax = isINR ? Math.round(rawPanamax * rate) : rawPanamax;
      const supramax = isINR ? Math.round(rawSupramax * rate) : rawSupramax;
      const bdi = d.bdi ?? d.bdiIndex ?? '';
      const c5 = d.c5FreightRate ?? d.C5TC ?? '';
      const dateStr = d.isoDate || d.date;

      return [
        `"${dateStr}"`,
        bdi,
        cape,
        panamax,
        supramax,
        c5,
        currency,
        rate
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateLabel = new Date().toISOString().slice(0, 10);
    a.download = `baltic_freight_indices_${timeframe.toLowerCase()}_${currency.toLowerCase()}_${dateLabel}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Custom Glassmorphic Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0]?.payload;
    const bdiVal = point?.bdi ?? point?.bdiIndex;

    return (
      <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-xs space-y-2.5 min-w-[210px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
          <div>
            <span className="font-semibold text-slate-200 block">{point?.date || label}</span>
            {bdiVal ? (
              <span className="text-[10px] text-blue-400 font-mono font-medium">
                Baltic Dry Index (BDI): {bdiVal}
              </span>
            ) : null}
          </div>
          <span className="text-[10px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
            {currency}
          </span>
        </div>
        <div className="space-y-1.5">
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.color }} />
                <span className="font-medium text-slate-300">{entry.name}</span>
              </div>
              <span className="font-mono font-bold text-white">
                {formatDailyRate(Number(entry.value))}
              </span>
            </div>
          ))}
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
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400">
              <TrendingUp size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {chartTitle}
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live API</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Timeframe selector, Sync & CSV export */}
        <div className="flex items-center gap-2">
          {/* Timeframe buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['7D', '14D', '30D', '90D', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            title="Refresh Baltic Exchange data from API"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin text-blue-500' : ''} />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            title={`Download ${timeframe} Baltic freight indices CSV (${currency})`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer ios-btn-spring"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── Statistical Summary Metrics Banner ─────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Capesize Peak</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
              {formatDailyRate(stats.maxCape)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Capesize Trough</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
              {formatDailyRate(stats.minCape)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Period Average</span>
            <span className="font-mono font-bold text-blue-600 dark:text-sky-400 text-xs">
              {formatDailyRate(stats.avgCape)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Period Trend</span>
            <span
              className={cn(
                'font-mono font-bold text-xs flex items-center gap-0.5',
                stats.deltaPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {stats.deltaPct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              <span>{stats.deltaPct >= 0 ? `+${stats.deltaPct.toFixed(1)}%` : `${stats.deltaPct.toFixed(1)}%`}</span>
            </span>
          </div>
        </div>
      )}

      {/* ─── Series Visibility Toggles ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <Layers size={11} /> Series:
        </span>
        <button
          onClick={() => toggleSeries('Capesize')}
          className={cn(
            'px-2.5 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1.5 transition border cursor-pointer',
            activeSeries.Capesize
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 border-blue-300 dark:border-blue-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent line-through'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Capesize (BCI)</span>
        </button>

        <button
          onClick={() => toggleSeries('Panamax')}
          className={cn(
            'px-2.5 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1.5 transition border cursor-pointer',
            activeSeries.Panamax
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent line-through'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Panamax (BPI)</span>
        </button>

        <button
          onClick={() => toggleSeries('Supramax')}
          className={cn(
            'px-2.5 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1.5 transition border cursor-pointer',
            activeSeries.Supramax
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent line-through'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Supramax (BSI)</span>
        </button>
      </div>

      {/* ─── Chart Display ───────────────────────────────────────────────────── */}
      {isLoading && (!effectiveData || effectiveData.length === 0) ? (
        <div className="h-68 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Loading live Baltic Exchange indices...</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Streaming 1-year historical freight rates</p>
        </div>
      ) : !filteredData || filteredData.length === 0 ? (
        <div className="h-68 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
          <TrendingUp size={32} className="opacity-40 text-blue-500" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No freight trend index data available</p>
          <button
            onClick={() => refetch()}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      ) : (
        <div className="h-68 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                {/* Capesize Multi-Stop Gradient */}
                <linearGradient id="capesizeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                {/* Panamax Gradient */}
                <linearGradient id="panamaxGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                {/* Supramax Gradient */}
                <linearGradient id="supramaxGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />

              <XAxis
                dataKey={timeframe === 'ALL' || filteredData.length > 30 ? 'shortDate' : 'date'}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                dy={6}
                minTickGap={30}
              />

              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => {
                  if (currency === 'INR') {
                    const inr = v * currentRate;
                    return `₹${(inr / 100000).toFixed(0)}L`;
                  }
                  return `$${(v / 1000).toFixed(0)}k`;
                }}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Shaded Area Fills */}
              {activeSeries.Capesize && (
                <Area
                  type="monotone"
                  dataKey="Capesize"
                  fill="url(#capesizeGradient)"
                  stroke="none"
                />
              )}

              {/* Crisp Smoothed Lines */}
              {activeSeries.Capesize && (
                <Line
                  type="monotone"
                  dataKey="Capesize"
                  name="Capesize BCI"
                  stroke="#3b82f6"
                  strokeWidth={2.8}
                  dot={filteredData.length <= 30 ? { r: 3, fill: '#3b82f6', strokeWidth: 0 } : false}
                  activeDot={{ r: 5, fill: '#60a5fa', stroke: '#1e40af', strokeWidth: 2 }}
                />
              )}

              {activeSeries.Panamax && (
                <Line
                  type="monotone"
                  dataKey="Panamax"
                  name="Panamax BPI"
                  stroke="#10b981"
                  strokeWidth={2.2}
                  dot={filteredData.length <= 30 ? { r: 2.5, fill: '#10b981', strokeWidth: 0 } : false}
                  activeDot={{ r: 5, fill: '#34d399', stroke: '#065f46', strokeWidth: 2 }}
                />
              )}

              {activeSeries.Supramax && (
                <Line
                  type="monotone"
                  dataKey="Supramax"
                  name="Supramax BSI"
                  stroke="#f59e0b"
                  strokeWidth={2.2}
                  dot={filteredData.length <= 30 ? { r: 2.5, fill: '#f59e0b', strokeWidth: 0 } : false}
                  activeDot={{ r: 5, fill: '#fbbf24', stroke: '#92400e', strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default FreightTrendChart;
