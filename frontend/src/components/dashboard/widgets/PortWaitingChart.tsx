import React, { useState, useMemo } from 'react';
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
  Clock,
  Download,
  AlertTriangle,
  ArrowUpDown,
  DollarSign,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { useUiStore } from '../../../store/uiStore';
import { formatCurrency, cn } from '../../../lib/utils';

export interface PortWaitingItem {
  port: string;
  waitingDays: number;
  [key: string]: any;
}

export interface PortWaitingChartProps {
  data?: PortWaitingItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const PortWaitingChart: React.FC<PortWaitingChartProps> = ({
  data = [],
  title = 'East Coast Port Pre-Berthing Wait & Demurrage Exposure',
  subtitle = 'Average anchorage waiting hours and demurrage risk across key bulk coal terminals',
  className,
}) => {
  const { currency } = useUiStore();
  const [sortBy, setSortBy] = useState<'highest' | 'lowest' | 'name'>('highest');

  // Fallback East Coast bulk ports if data empty
  const rawData = useMemo(() => {
    if (data && data.length > 0) return data;
    return [
      { port: 'Paradip (PICT)', waitingDays: 3.2 },
      { port: 'Visakhapatnam (VPT)', waitingDays: 2.1 },
      { port: 'Haldia (HDC)', waitingDays: 4.8 },
      { port: 'Dhamra (DPCL)', waitingDays: 1.2 },
      { port: 'Gopalpur Port', waitingDays: 0.8 },
      { port: 'Kolkata Dock (KDS)', waitingDays: 3.9 },
    ];
  }, [data]);

  // Sort data
  const chartData = useMemo(() => {
    const copy = [...rawData];
    if (sortBy === 'highest') {
      return copy.sort((a, b) => b.waitingDays - a.waitingDays);
    } else if (sortBy === 'lowest') {
      return copy.sort((a, b) => a.waitingDays - b.waitingDays);
    } else {
      return copy.sort((a, b) => a.port.localeCompare(b.port));
    }
  }, [rawData, sortBy]);

  // Summary statistics
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    const avgWait = (chartData.reduce((acc, p) => acc + p.waitingDays, 0) / chartData.length).toFixed(1);
    const maxPort = [...chartData].sort((a, b) => b.waitingDays - a.waitingDays)[0];
    // Demurrage exposure assuming $18,000/day standard rate
    const totalDemurrageUsd = Math.round(chartData.reduce((acc, p) => acc + p.waitingDays * 18000, 0));

    return { avgWait, maxPort, totalDemurrageUsd };
  }, [chartData]);

  // Export CSV
  const handleExportCsv = () => {
    if (!chartData || chartData.length === 0) return;
    const headers = ['Port', 'Pre_Berthing_Wait_Days', 'Estimated_Wait_Hours', 'Demurrage_Exposure_USD'];
    const rows = chartData.map((p) => [
      `"${p.port}"`,
      p.waitingDays,
      Math.round(p.waitingDays * 24),
      Math.round(p.waitingDays * 18000),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `east_coast_port_waiting_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Severity color helper
  const getPortColor = (days: number) => {
    if (days >= 3.5) return '#ef4444'; // Severe
    if (days >= 2.0) return '#f59e0b'; // Moderate
    return '#10b981'; // Low
  };

  // Glassmorphic Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    const hours = Math.round(item.waitingDays * 24);
    const isSevere = item.waitingDays >= 3.5;
    const isModerate = item.waitingDays >= 2.0 && item.waitingDays < 3.5;
    const demurrageRisk = item.waitingDays * 18000;

    return (
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[210px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-bold text-white truncate max-w-[150px]">{item.port}</span>
          <span
            className={cn(
              'text-[9.5px] font-bold px-1.5 py-0.2 rounded border',
              isSevere
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : isModerate
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            )}
          >
            {isSevere ? 'SEVERE WAIT' : isModerate ? 'MODERATE' : 'OPTIMAL'}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Anchorage Delay:</span>
            <span className="font-mono font-bold text-white text-xs">
              {item.waitingDays.toFixed(1)} Days ({hours}h)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Demurrage Risk:</span>
            <span className="font-mono text-amber-400 font-bold text-xs">
              {formatCurrency(demurrageRisk)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
            <span>Standard Capesize TCE:</span>
            <span className="font-mono text-slate-300">$18,000/Day</span>
          </div>
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
              <Clock size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sorting Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSortBy('highest')}
              title="Sort highest wait first"
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer',
                sortBy === 'highest'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Highest Wait
            </button>
            <button
              onClick={() => setSortBy('lowest')}
              title="Sort lowest wait first"
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer',
                sortBy === 'lowest'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Lowest
            </button>
            <button
              onClick={() => setSortBy('name')}
              title="Sort alphabetically"
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
            title="Download port wait data as CSV"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer ios-btn-spring"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* ─── Summary Badges ─────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Average Wait Time</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
              {stats.avgWait} Days ({Math.round(Number(stats.avgWait) * 24)}h)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Max Congestion</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs truncate block">
              {stats.maxPort?.port.split(' ')[0]} ({stats.maxPort?.waitingDays}d)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Demurrage Exposure</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
              {formatCurrency(stats.totalDemurrageUsd)}
            </span>
          </div>
        </div>
      )}

      {/* ─── Legend Indicator ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-3 text-xs flex-wrap">
        <span className="text-[11px] font-semibold text-slate-400">Congestion Severity:</span>
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span>Optimal (&lt;2.0D)</span>
        </span>
        <span className="flex items-center gap-1.5 text-amber-500 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
          <span>Moderate (2.0–3.5D)</span>
        </span>
        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
          <span>Severe (&gt;3.5D)</span>
        </span>
      </div>

      {/* ─── Chart Display ───────────────────────────────────────────────────── */}
      {chartData.length === 0 ? (
        <div className="h-60 w-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
          <Clock size={28} className="text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No pre-berthing wait time data recorded</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Live anchorage waiting hours from coastal port radar will appear here.</p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
              <XAxis dataKey="port" tick={{ fontSize: 11 }} stroke="#64748b" dy={6} />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#64748b"
                tickFormatter={(v) => `${v}d`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={2.0}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: '2.0D Alert Gate', fill: '#f59e0b', fontSize: 10, position: 'top' }}
              />
              <Bar dataKey="waitingDays" radius={[6, 6, 0, 0]} name="Wait Days">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-port-${index}`} fill={getPortColor(entry.waitingDays)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PortWaitingChart;
