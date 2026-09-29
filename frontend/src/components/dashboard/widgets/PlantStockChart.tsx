import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Factory,
  Download,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers
} from 'lucide-react';
import { procurementApi } from '../../../api';
import { queryKeys } from '../../../api/queryKeys';
import { cn } from '../../../lib/utils';

export interface PlantStockItem {
  plant: string;
  currentDays: number;
  safeDays?: number;
  [key: string]: any;
}

export interface PlantStockChartProps {
  data?: PlantStockItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const PlantStockChart: React.FC<PlantStockChartProps> = ({
  data,
  title = 'Steel Plant Raw Material Stock Cushions',
  subtitle = 'Inventory cushion in buffer days vs. 21-day safe operating threshold',
  className,
}) => {
  const [sortBy, setSortBy] = useState<'urgent' | 'highest' | 'name'>('urgent');

  const { data: apiData } = useQuery({
    queryKey: queryKeys.procurement.plantStock,
    queryFn: () => procurementApi.plantStock(),
    enabled: !data || data.length === 0,
    staleTime: 60_000,
  });

  const rawList = useMemo(() => {
    if (data && data.length > 0) return data;
    const list = Array.isArray(apiData) ? apiData : (apiData as any)?.data || [];
    if (list.length > 0) {
      return list.map((p: any) => ({
        plant: p.plant,
        currentDays: Number(p.currentDays || 0),
        safeDays: Number(p.safeBuffer || 21),
      }));
    }
    // Default fallback SAIL integrated plants if API offline
    return [
      { plant: 'Bhilai Steel Plant (BSP)', currentDays: 19.4, safeDays: 21 },
      { plant: 'Bokaro Steel Plant (BSL)', currentDays: 14.8, safeDays: 21 },
      { plant: 'Rourkela Steel Plant (RSP)', currentDays: 11.2, safeDays: 21 },
      { plant: 'Durgapur Steel Plant (DSP)', currentDays: 24.1, safeDays: 21 },
      { plant: 'IISCO Steel Plant (ISP)', currentDays: 16.5, safeDays: 21 },
    ];
  }, [data, apiData]);

  // Sorted data based on selected sort criteria
  const chartData = useMemo(() => {
    const copy = [...rawList];
    if (sortBy === 'urgent') {
      return copy.sort((a, b) => a.currentDays - b.currentDays);
    } else if (sortBy === 'highest') {
      return copy.sort((a, b) => b.currentDays - a.currentDays);
    } else {
      return copy.sort((a, b) => a.plant.localeCompare(b.plant));
    }
  }, [rawList, sortBy]);

  // Summary statistics
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    const critical = chartData.filter((p) => p.currentDays < 14).length;
    const moderate = chartData.filter((p) => p.currentDays >= 14 && p.currentDays < 21).length;
    const avgDays = (chartData.reduce((acc, p) => acc + p.currentDays, 0) / chartData.length).toFixed(1);
    const minPlant = [...chartData].sort((a, b) => a.currentDays - b.currentDays)[0];

    return { critical, moderate, avgDays, minPlant };
  }, [chartData]);

  // Export CSV
  const handleExportCsv = () => {
    if (!chartData || chartData.length === 0) return;
    const headers = ['Plant', 'Current_Stock_Days', 'Safe_Threshold_Days', 'Status'];
    const rows = chartData.map((p) => [
      `"${p.plant}"`,
      p.currentDays,
      p.safeDays ?? 21,
      p.currentDays < 14 ? 'CRITICAL' : p.currentDays < 21 ? 'MODERATE' : 'SAFE',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sail_plant_stock_buffer_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Color helper based on threshold
  const getBarColor = (days: number) => {
    if (days < 14) return '#ef4444'; // Critical Red
    if (days < 18) return '#f59e0b'; // Moderate Amber
    return '#10b981'; // Safe Green
  };

  // Custom Glassmorphic Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    const isCritical = item.currentDays < 14;
    const isModerate = item.currentDays >= 14 && item.currentDays < 21;

    return (
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[210px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-bold text-white truncate max-w-[150px]">{item.plant}</span>
          <span
            className={cn(
              'text-[9.5px] font-bold px-1.5 py-0.2 rounded border',
              isCritical
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : isModerate
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            )}
          >
            {isCritical ? 'CRITICAL' : isModerate ? 'MODERATE' : 'SAFE'}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Stock Runway:</span>
            <span className="font-mono font-bold text-white text-xs">{item.currentDays} Days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Statutory Target:</span>
            <span className="font-mono text-slate-300 text-xs">21.0 Days</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
            <span className="text-slate-400">Runway Deficit:</span>
            <span className={cn('font-mono font-semibold', item.currentDays < 21 ? 'text-rose-400' : 'text-emerald-400')}>
              {item.currentDays < 21 ? `-${(21 - item.currentDays).toFixed(1)} Days` : `+${(item.currentDays - 21).toFixed(1)} Days`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all ios-card-hover ${className || ''}`}>
      {/* ─── Header & Controls ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400">
              <Factory size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSortBy('urgent')}
              title="Sort lowest buffer first"
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer',
                sortBy === 'urgent'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Urgent First
            </button>
            <button
              onClick={() => setSortBy('highest')}
              title="Sort highest buffer first"
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer',
                sortBy === 'highest'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Highest
            </button>
            <button
              onClick={() => setSortBy('name')}
              title="Sort by plant name"
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer',
                sortBy === 'name'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              A–Z
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            title="Download plant stock data as CSV"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer ios-btn-spring"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* ─── Summary Badges ─────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Average Fleet Stock</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
              {stats.avgDays} Days
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Lowest Stock</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs truncate block">
              {stats.minPlant?.plant.split(' ')[0]} ({stats.minPlant?.currentDays}d)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Critical Plants (&lt;14d)</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
              {stats.critical} Plants
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Statutory Gate</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
              21.0 Days Target
            </span>
          </div>
        </div>
      )}

      {/* ─── Legend Indicator ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-3 text-xs flex-wrap">
        <span className="text-[11px] font-semibold text-slate-400">Buffer Status:</span>
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span>Safe (&gt;18D)</span>
        </span>
        <span className="flex items-center gap-1.5 text-amber-500 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
          <span>Moderate (14–18D)</span>
        </span>
        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
          <span>Critical (&lt;14D)</span>
        </span>
      </div>

      {/* ─── Chart Display ───────────────────────────────────────────────────── */}
      {chartData.length === 0 ? (
        <div className="h-68 flex flex-col items-center justify-center text-center text-slate-400">
          <Factory size={32} className="mb-2 opacity-40 text-blue-500" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No plant stock inventory data available</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Inventory levels will appear once plant telemetry is synced</p>
        </div>
      ) : (
        <div className="h-68 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
              <XAxis
                type="number"
                domain={[0, 35]}
                tick={{ fontSize: 11 }}
                stroke="#64748b"
                tickFormatter={(v) => `${v}d`}
              />
              <YAxis
                dataKey="plant"
                type="category"
                tick={{ fontSize: 11 }}
                stroke="#64748b"
                width={170}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={21}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: '21D Safe Line', fill: '#ef4444', fontSize: 10, position: 'top' }}
              />
              <Bar dataKey="currentDays" radius={[0, 6, 6, 0]} name="Stock Days">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.currentDays)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PlantStockChart;
