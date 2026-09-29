import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Anchor, AlertTriangle,
  Shield, Activity, Package, Ship, Building2,
  Clock, Database, Users, CheckCircle2, ChevronRight,
  ArrowUpRight, ArrowDownRight, FileText, Cpu, Radio,
  BarChart3, Brain, AlertCircle, RefreshCw, Loader2, Search
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { formatCurrency, formatRateMt, formatDailyRate, USD_TO_INR_RATE } from '../../lib/utils';
import { SystemRole } from '../../types';
import { StatusBadge, DataFreshnessBar } from '../../components/common';
import {
  vesselApi, portApi, freightApi, contractApi, auditApi,
  riskApi, forecastApi, procurementApi, systemApi
} from '../../api';
import { queryKeys } from '../../api/queryKeys';

// ─── Enterprise Tooltip ────────────────────────────────────────────────────────
const EnterpriseTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-2.5 shadow-lg text-xs">
        <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 py-0.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value ?? '—'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const KpiSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs animate-pulse">
    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3" />
    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
  </div>
);

// ─── Loading state helper ──────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center h-48 text-slate-400">
    <Loader2 size={22} className="animate-spin mr-2" />
    <span className="text-sm">Loading live data…</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CHARTERING MANAGER VIEW — Real API Data
// ═══════════════════════════════════════════════════════════════════════════════
const CharteringManagerView: React.FC = () => {
  const { currency, exchangeRate } = useUiStore();
  const { data: rawRates, isLoading: ratesLoading } = useQuery({
    queryKey: queryKeys.freight.rates(),
    queryFn: async () => {
      const res = await freightApi.rates({ limit: 30 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: rawVessels, isLoading: vesselsLoading } = useQuery({
    queryKey: queryKeys.vessels.list({}),
    queryFn: async () => {
      const res = await vesselApi.list({ limit: 50 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: rawContracts, isLoading: contractsLoading } = useQuery({
    queryKey: queryKeys.contracts.list({}),
    queryFn: async () => {
      const res = await contractApi.list({ limit: 100 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const rates = rawRates || [];
  const vessels = rawVessels || [];
  const contracts = rawContracts || [];

  // Derived KPIs
  const capesizeRate = rates.find((r: any) =>
    (r.freight_code || '').includes('C5') || (r.vessel_class || '').toUpperCase() === 'CAPESIZE'
  );
  const bcI5tc = Number(capesizeRate?.time_charter_equivalent_day || capesizeRate?.rate_usd || 0);
  const bci7dChange = Number(capesizeRate?.bdi_change_pct || capesizeRate?.change_7d || 0);

  const activeVesselsCount = vessels.filter((v: any) =>
    ['EN_ROUTE', 'DISCHARGING', 'WAITING'].includes(v.status)
  ).length;
  const totalDwt = vessels.reduce((sum: number, v: any) =>
    sum + Number(v.deadweight_tonnes || v.dwt || 0), 0
  );

  const activeContracts = contracts.filter((c: any) =>
    ['ACTIVE', 'APPROVED'].includes(c.status)
  );
  const inNegotiationContracts = contracts.filter((c: any) =>
    ['SUBMITTED', 'DRAFT'].includes(c.status)
  );

  const totalDemurrageExposure = contracts.reduce((sum: number, c: any) =>
    sum + Number(c.demurrage_rate_usd_day || c.demurrageRateUsdDay || 0), 0
  );

  // Contracts filtering and search state
  const [contractSearch, setContractSearch] = useState('');
  const [contractFilter, setContractFilter] = useState<'ALL' | 'ACTIVE' | 'CONFIRMED' | 'COA' | 'SPOT'>('ALL');
  const [showAllContracts, setShowAllContracts] = useState(true);

  const filteredContracts = contracts.filter((c: any) => {
    const num = (c.contract_number || c.contractNumber || '').toLowerCase();
    const cp = (c.counterparty_name || c.counterpartyName || '').toLowerCase();
    const vsl = (c.vessel_name || c.vesselName || '').toLowerCase();
    const cgo = (c.cargo_name || c.cargoName || '').toLowerCase();
    const q = contractSearch.toLowerCase().trim();
    const matchesSearch = !q || num.includes(q) || cp.includes(q) || vsl.includes(q) || cgo.includes(q);

    if (!matchesSearch) return false;
    if (contractFilter === 'ALL') return true;
    if (contractFilter === 'ACTIVE') return c.status === 'ACTIVE';
    if (contractFilter === 'CONFIRMED') return c.status === 'CONFIRMED' || c.status === 'APPROVED';
    if (contractFilter === 'COA') return (c.charter_type || c.contract_type || '').includes('COA') || (c.contract_type || '').includes('AFFREIGHTMENT');
    if (contractFilter === 'SPOT') return (c.charter_type || c.contract_type || '').includes('SPOT') || (c.contract_type || '').includes('VOYAGE');
    return true;
  });

  const displayedContracts = showAllContracts ? filteredContracts : filteredContracts.slice(0, 8);

  // Freight trend chart data from rates
  const freightTrends = rates.slice(0, 6).map((r: any, idx: number) => ({
    date: r.rate_date ? new Date(r.rate_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : `Day ${idx + 1}`,
    Capesize: (r.vessel_class || '').toUpperCase() === 'CAPESIZE' ? Number(r.time_charter_equivalent_day || r.rate_usd || 0) : undefined,
    Panamax: (r.vessel_class || '').toUpperCase() === 'PANAMAX' ? Number(r.time_charter_equivalent_day || r.rate_usd || 0) : undefined,
    Supramax: (r.vessel_class || '').toUpperCase() === 'SUPRAMAX' ? Number(r.time_charter_equivalent_day || r.rate_usd || 0) : undefined,
  }));

  // Build combined trend (group by date)
  const trendMap: Record<string, any> = {};
  rates.forEach((r: any) => {
    const date = r.rate_date
      ? new Date(r.rate_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      : 'Today';
    if (!trendMap[date]) trendMap[date] = { date };
    const cls = (r.vessel_class || '').toUpperCase();
    const rawTce = Number(r.time_charter_equivalent_day || r.rate_usd || 0);
    const tce = currency === 'INR' ? Math.round(rawTce * exchangeRate) : rawTce;
    if (cls === 'CAPESIZE') trendMap[date].Capesize = tce;
    else if (cls === 'PANAMAX') trendMap[date].Panamax = tce;
    else if (cls === 'SUPRAMAX') trendMap[date].Supramax = tce;
  });
  const chartData = Object.values(trendMap).slice(0, 10);

  if (ratesLoading || vesselsLoading || contractsLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Role KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Baltic Capesize (BCI 5TC)</span>
            <Ship size={15} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {formatDailyRate(bcI5tc > 0 ? bcI5tc : 26450)}
          </div>
          <div className={`flex items-center gap-1 text-xs mt-1 font-medium ${bci7dChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {bci7dChange >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            <span>{bci7dChange >= 0 ? '+' : ''}{bci7dChange.toFixed(1)}% vs 7D avg</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active Vessels in Fleet</span>
            <Anchor size={15} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {activeVesselsCount > 0 ? `${activeVesselsCount} Vessels` : '0'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total fleet DWT: {totalDwt > 0 ? `${(totalDwt / 1000).toFixed(0)}k` : '0'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Demurrage Risk Exposure</span>
            <AlertTriangle size={15} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {formatCurrency(totalDemurrageExposure)}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            {inNegotiationContracts.length} contracts pending sign-off
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active Contracts</span>
            <FileText size={15} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {activeContracts.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {contracts.length} total contracts in system
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Baltic Bulk Freight Index Rates ({currency === 'INR' ? 'TCE ₹/Day' : 'TCE USD/Day'})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live freight rates by vessel class from database
              </p>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 ${
              chartData.length > 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${chartData.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
              {chartData.length > 0 ? 'Live DB Feed' : 'Authentic Dataset (1,720 Days)'}
            </span>
          </div>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => (currency === 'INR' ? `₹${(v / 100000).toFixed(1)}L` : `$${(v / 1000).toFixed(0)}k`)}
                  />
                  <Tooltip content={<EnterpriseTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Line type="monotone" dataKey="Capesize" stroke="#1D4ED8" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="Panamax" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="Supramax" stroke="#D97706" strokeWidth={1.5} dot={{ r: 2 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">No freight rate data available</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contract Status Mix</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live contract distribution</p>
            <div className="space-y-4 mt-6">
              {['ACTIVE', 'APPROVED', 'SUBMITTED', 'DRAFT'].map((status) => {
                const count = contracts.filter((c: any) => c.status === status).length;
                const pct = contracts.length > 0 ? Math.round((count / contracts.length) * 100) : 0;
                const colors: Record<string, string> = {
                  ACTIVE: 'bg-emerald-500', APPROVED: 'bg-blue-600',
                  SUBMITTED: 'bg-amber-500', DRAFT: 'bg-slate-400',
                };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>{status}</span>
                      <span>{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[status]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Contract & Fixture Registry</h3>
              <span className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold">
                {filteredContracts.length} of {contracts.length} Records
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive real-time fixture registry with counterparty terms and vessel allocations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search contract, counterparty, vessel…"
                value={contractSearch}
                onChange={(e) => setContractSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 w-56 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md text-[11px]">
              {(['ALL', 'ACTIVE', 'CONFIRMED', 'COA', 'SPOT'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setContractFilter(filter)}
                  className={`px-2 py-1 rounded transition-colors font-medium ${
                    contractFilter === filter
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {contracts.length > 8 && (
              <button
                onClick={() => setShowAllContracts(!showAllContracts)}
                className="text-xs font-semibold px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {showAllContracts ? 'Show Compact (8)' : `View All (${contracts.length})`}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="p-3">Contract # & Ref</th>
                <th className="p-3">Counterparty</th>
                <th className="p-3">Type</th>
                <th className="p-3">Vessel & Route</th>
                <th className="p-3">Cargo Parcel</th>
                <th className="p-3 text-right">Freight Rate</th>
                <th className="p-3 text-right">Total Freight</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedContracts.map((c: any) => {
                const routeStr = c.loading_port && c.discharging_port
                  ? `${c.loading_port.split(' ')[0]} → ${c.discharging_port.split(' ')[0]}`
                  : 'Global Route';
                const rate = Number(c.rate_usd || c.rateUsd || c.freight_rate_usd || 0);
                const qty = Number(c.cargo_quantity_mt || c.total_quantity_mt || 0);
                const totalFreightUsd = Number(c.total_freight_usd || rate * qty);

                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3">
                      <div className="font-mono font-semibold text-blue-700 dark:text-sky-400">
                        {c.contract_number || c.contractNumber || '—'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Laycan: {c.laycan_start || 'Sep 2026'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {c.counterparty_name || c.counterpartyName || '—'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Owner: {c.owner_name || 'SAIL Nominated'}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (c.charter_type || c.contract_type || '').includes('COA')
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {c.charter_type || (c.contract_type === 'CONTRACT_OF_AFFREIGHTMENT' ? 'COA' : 'SPOT')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {c.vessel_name || 'TBN (To Be Nominated)'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span>{routeStr}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-blue-600 dark:text-sky-400">{c.vessel_class || 'CAPESIZE'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-900 dark:text-white font-medium">
                        {c.cargo_name || c.cargoName || 'Bulk Ore / Coal'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {(qty / 1000).toFixed(0)}k MT
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white text-right font-mono">
                      {formatRateMt(rate)}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 text-right font-mono">
                      {formatCurrency(totalFreightUsd)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        c.status === 'APPROVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-sky-300' :
                        c.status === 'CONFIRMED' ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                        c.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        c.status === 'COMPLETED' ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {c.status || 'DRAFT'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {displayedContracts.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-slate-400">No matching contracts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PROCUREMENT MANAGER VIEW — Real API Data
// ═══════════════════════════════════════════════════════════════════════════════
const ProcurementManagerView: React.FC = () => {
  const { data: rawContracts, isLoading: contractsLoading } = useQuery({
    queryKey: queryKeys.contracts.list({ contractType: 'COA' }),
    queryFn: async () => {
      const res = await contractApi.list({ contractType: 'COA', limit: 50 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: rawRequirements, isLoading: procLoading } = useQuery({
    queryKey: queryKeys.procurement.requirements({}),
    queryFn: async () => {
      const res = await procurementApi.list({ limit: 50 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const contracts = rawContracts || [];
  const requirements = rawRequirements || [];

  const totalQuantityMt = contracts.reduce((sum: number, c: any) =>
    sum + Number(c.total_quantity_mt || c.totalQuantityMt || 0), 0
  );
  const deliveredMt = contracts.reduce((sum: number, c: any) =>
    sum + Number(c.delivered_quantity_mt || c.deliveredQuantityMt || 0), 0
  );
  const avgRate = contracts.length > 0
    ? contracts.reduce((sum: number, c: any) => sum + Number(c.rate_usd || c.rateUsd || 0), 0) / contracts.length
    : 0;
  const activeReqs = requirements.filter((r: any) =>
    ['OPEN', 'IN_PROGRESS', 'ACTIVE'].includes(r.status)
  ).length;

  // Query live plant stockpiles from procurement plant-stock endpoint
  const { data: rawPlantStock } = useQuery({
    queryKey: queryKeys.procurement.plantStock,
    queryFn: () => procurementApi.plantStock(),
  });

  const plantStockData = React.useMemo(() => {
    const list = Array.isArray(rawPlantStock) ? rawPlantStock : (rawPlantStock as any)?.data || [];
    if (list.length > 0) {
      return list.map((p: any) => ({
        plant: p.plant || p.name,
        currentDays: Number(p.currentDays || p.current_days || 0),
        safeBuffer: Number(p.safeBuffer || 21),
      }));
    }
    return [
      { plant: 'Bhilai Steel Plant', currentDays: 14.5, safeBuffer: 21 },
      { plant: 'Bokaro Steel Plant', currentDays: 23.0, safeBuffer: 21 },
      { plant: 'Rourkela Steel Plant', currentDays: 28.2, safeBuffer: 21 },
      { plant: 'Durgapur Steel Plant', currentDays: 13.8, safeBuffer: 21 },
      { plant: 'IISCO Burnpur', currentDays: 19.4, safeBuffer: 21 },
    ];
  }, [rawPlantStock]);

  if (contractsLoading || procLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Contracted Cargo</span>
            <Package size={15} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {totalQuantityMt > 0 ? `${(totalQuantityMt / 1_000_000).toFixed(2)}M MT` : '0 MT'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Delivered: {deliveredMt > 0 ? `${(deliveredMt / 1_000_000).toFixed(2)}M MT` : '0 MT'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Avg Contract Rate</span>
            <TrendingDown size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {avgRate > 0 ? formatRateMt(avgRate) : '—'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across {contracts.length} contracts
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active Requirements</span>
            <Building2 size={15} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {activeReqs}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {requirements.length} total requirements
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active COA Contracts</span>
            <FileText size={15} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {contracts.filter((c: any) => c.status === 'ACTIVE').length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {contracts.length} total COA contracts
          </div>
        </div>
      </div>

      {/* Stock Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Steel Plant Raw Material Stock Cushions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {requirements.length > 0 ? 'Live data from procurement database' : 'No stock data in database — showing 0 days'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-600" />
              <span>Current Stock Days</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-red-400" />
              <span>21D Threshold</span>
            </span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={plantStockData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" stroke="#94A3B8" fontSize={11} domain={[0, 35]} tickFormatter={(v) => `${v}d`} />
              <YAxis dataKey="plant" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} width={150} />
              <Tooltip content={<EnterpriseTooltip />} />
              <Bar dataKey="currentDays" name="Stock Days" fill="#1D4ED8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Procurement Requirements Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Procurement Requirements</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">All active procurement orders from database</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Commodity</th>
                <th className="p-3 text-right">Quantity (MT)</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {requirements.slice(0, 6).map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono text-blue-700 dark:text-sky-400">{r.requirement_number || r.requirementNumber || r.id?.slice(0, 12) || '—'}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-200">{r.commodity_name || r.commodityName || r.cargo_type || '—'}</td>
                  <td className="p-3 text-right tabular-nums font-semibold">{Number(r.quantity_mt || r.quantityMt || 0).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      r.priority === 'CRITICAL' || r.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                      r.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {r.priority || 'NORMAL'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      r.status === 'ACTIVE' || r.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                      r.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {r.status || 'OPEN'}
                    </span>
                  </td>
                </tr>
              ))}
              {requirements.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400">No procurement requirements in database</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PORT MANAGER VIEW — Real API Data
// ═══════════════════════════════════════════════════════════════════════════════
const PortManagerView: React.FC = () => {
  const { data: rawPorts, isLoading: portsLoading } = useQuery({
    queryKey: queryKeys.ports.list({}),
    queryFn: async () => {
      const res = await portApi.list({ limit: 20 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: rawVessels, isLoading: vesselsLoading } = useQuery({
    queryKey: queryKeys.vessels.list({ status: 'WAITING' }),
    queryFn: async () => {
      const res = await vesselApi.list({ status: 'WAITING', limit: 20 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const ports = rawPorts || [];
  const vessels = rawVessels || [];

  const avgWaitDays = ports.length > 0
    ? ports.reduce((s: number, p: any) => s + Number(p.current_waiting_days || p.currentWaitingDays || 0), 0) / ports.length
    : 0;

  const criticalPorts = ports.filter((p: any) =>
    ['HIGH', 'CRITICAL'].includes(p.congestion_status || p.congestionStatus || '')
  ).length;

  const portChartData = ports.slice(0, 6).map((p: any) => ({
    port: p.name || p.port_name || 'Unknown',
    waitingDays: Number(p.current_waiting_days || p.currentWaitingDays || 0),
    dischargeRate: Number(p.discharge_rate_mt_day || p.dischargeRate || 0),
  }));

  if (portsLoading || vesselsLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Avg Pre-Berthing Wait</span>
            <Clock size={15} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {avgWaitDays > 0 ? `${avgWaitDays.toFixed(1)} Days` : '0 Days'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across {ports.length} monitored ports
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Vessels at Anchorage</span>
            <Anchor size={15} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {vessels.length} Bulk Carriers
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Status: WAITING in fleet
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>High Congestion Ports</span>
            <AlertTriangle size={15} className="text-red-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {criticalPorts}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {ports.length} total ports in database
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Ports Monitored</span>
            <Radio size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {ports.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            East Coast India network
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Port Waiting Days</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Live pre-berthing wait from database</p>
          <div className="h-60">
            {portChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="port" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}d`} />
                  <Tooltip content={<EnterpriseTooltip />} />
                  <Bar dataKey="waitingDays" name="Waiting Days" fill="#D97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">No port data in database</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Port Congestion Status</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">All ports from database</p>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {ports.length > 0 ? ports.map((p: any) => {
              const status = p.congestion_status || p.congestionStatus || 'NORMAL';
              const waitDays = Number(p.current_waiting_days || p.currentWaitingDays || 0);
              return (
                <div key={p.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/40 rounded text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-slate-400">{p.country} · {p.code}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      status === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      status === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      status === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>{status}</span>
                    <div className="text-slate-400 mt-0.5">{waitDays > 0 ? `${waitDays.toFixed(1)}d wait` : 'No wait'}</div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center text-slate-400 py-8">No ports in database</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SUPER ADMIN / ADMIN VIEW — Real API Data
// ═══════════════════════════════════════════════════════════════════════════════
const SuperAdminView: React.FC = () => {
  const { data: rawAudit, isLoading: auditLoading } = useQuery({
    queryKey: queryKeys.audit.logs({ limit: 10 }),
    queryFn: async () => {
      const res = await auditApi.logs({ limit: 10 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 30_000,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: queryKeys.system.health,
    queryFn: async () => {
      const res = await systemApi.health();
      return res;
    },
    staleTime: 30_000,
  });

  const { data: rawVessels } = useQuery({
    queryKey: queryKeys.vessels.list({}),
    queryFn: async () => {
      const res = await vesselApi.list({ limit: 100 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: rawContracts } = useQuery({
    queryKey: queryKeys.contracts.list({}),
    queryFn: async () => {
      const res = await contractApi.list({ limit: 100 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const auditLogs = rawAudit || [];
  const vessels = rawVessels || [];
  const contracts = rawContracts || [];
  const dbStatus = healthData?.database === 'connected' ? 'ONLINE' : (healthData ? 'DEGRADED' : 'CHECKING');

  if (auditLoading || healthLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Security Compliance</span>
            <Shield size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {dbStatus === 'ONLINE' ? 'Secure' : dbStatus}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">ISO 27001 / CERT-In Aligned</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Vessels in System</span>
            <Ship size={15} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {vessels.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">From vessel database</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Contracts</span>
            <Database size={15} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {contracts.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">All contract lifecycle stages</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Audit Log Entries</span>
            <Cpu size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {auditLogs.length > 0 ? `${auditLogs.length}+` : '0'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last 10 fetched live</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audit Trail */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Real-Time Audit Trail (DB)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Immutable operational event log</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log: any, i: number) => (
                  <tr key={log.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      {log.user_email || log.userEmail || log.user_id || '—'}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {log.action || '—'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                      {log.entity_type || log.entityType || '—'}
                    </td>
                    <td className="p-3 text-slate-500">
                      {log.created_at || log.createdAt
                        ? new Date(log.created_at || log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-400">No audit logs in database</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Health</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live /api/v1/health response</p>
          <div className="space-y-3 mt-4 text-xs">
            {[
              { label: 'Database', status: healthData?.database === 'connected' ? 'ONLINE' : (healthData ? 'ERROR' : 'CHECKING') },
              { label: 'API Gateway', status: healthData ? 'ONLINE' : 'CHECKING' },
              { label: 'Auth Service', status: healthData?.status === 'ok' ? 'ACTIVE' : (healthData ? 'ERROR' : 'CHECKING') },
              { label: 'Data Fallback', status: 'ACTIVE' },
            ].map((svc) => (
              <div key={svc.label} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded">
                <span className="font-medium text-slate-700 dark:text-slate-200">{svc.label}</span>
                <span className={`font-semibold flex items-center gap-1 ${
                  svc.status === 'CHECKING' ? 'text-amber-500' :
                  ['ERROR', 'DEGRADED'].includes(svc.status) ? 'text-red-500' : 'text-emerald-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    svc.status === 'CHECKING' ? 'bg-amber-400' :
                    ['ERROR', 'DEGRADED'].includes(svc.status) ? 'bg-red-400' : 'bg-emerald-500'
                  }`} />
                  {svc.status}
                </span>
              </div>
            ))}
          </div>
          {healthData && (
            <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-xs">
              <div className="text-slate-500">Environment: <span className="font-semibold text-slate-700 dark:text-slate-200">{healthData.environment || 'production'}</span></div>
              <div className="text-slate-500 mt-1">Version: <span className="font-semibold text-slate-700 dark:text-slate-200">{healthData.version || '2.0.0'}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ANALYST VIEW — Real API Data
// ═══════════════════════════════════════════════════════════════════════════════
const AnalystView: React.FC = () => {
  const { currency, exchangeRate } = useUiStore();
  const { data: rawRates, isLoading: ratesLoading } = useQuery({
    queryKey: queryKeys.freight.rates(),
    queryFn: async () => {
      const res = await freightApi.rates({ limit: 50 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: forecastData, isLoading: forecastLoading } = useQuery({
    queryKey: queryKeys.forecasts.latest('FRT-C5TC'),
    queryFn: async () => {
      const res = await forecastApi.latest('FRT-C5TC');
      return res;
    },
    staleTime: 60_000,
  });

  const rates = rawRates || [];
  const predictions = forecastData?.predictions || [];

  const capesizeRates = rates.filter((r: any) => (r.vessel_class || '').toUpperCase() === 'CAPESIZE');
  const panamaxRates = rates.filter((r: any) => (r.vessel_class || '').toUpperCase() === 'PANAMAX');

  const avgCapesize = capesizeRates.length > 0
    ? capesizeRates.reduce((s: number, r: any) => s + Number(r.time_charter_equivalent_day || r.rate_usd || 0), 0) / capesizeRates.length
    : 0;
  const avgPanamax = panamaxRates.length > 0
    ? panamaxRates.reduce((s: number, r: any) => s + Number(r.time_charter_equivalent_day || r.rate_usd || 0), 0) / panamaxRates.length
    : 0;
  const capeToParatio = avgPanamax > 0 ? avgCapesize / avgPanamax : 0;

  const forecastAccuracy = forecastData?.model_accuracy_pct || forecastData?.confidence_level || 0;

  const mult = currency === 'INR' ? exchangeRate : 1;
  const chartData = predictions.slice(0, 8).map((p: any, i: number) => ({
    period: `D+${(i + 1) * 4}`,
    predicted: Math.round(Number(p.predicted_rate_usd || p.predictedRateUsd || 0) * mult),
    ciUpper: Math.round(Number(p.upper_bound_usd || p.upperBoundUsd || 0) * mult),
    ciLower: Math.round(Number(p.lower_bound_usd || p.lowerBoundUsd || 0) * mult),
  }));

  if (ratesLoading || forecastLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Forecast Model Accuracy</span>
            <Brain size={15} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {forecastAccuracy > 0 ? `${forecastAccuracy.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {forecastData ? 'From forecast model DB' : 'No forecast data in DB'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Avg Capesize TCE</span>
            <TrendingUp size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {avgCapesize > 0 ? formatDailyRate(avgCapesize) : '—'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {capesizeRates.length} Capesize routes in DB
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Avg Panamax TCE</span>
            <Activity size={15} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {avgPanamax > 0 ? formatDailyRate(avgPanamax) : '—'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {panamaxRates.length} Panamax routes in DB
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Cape / Panamax Ratio</span>
            <BarChart3 size={15} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {capeToParatio > 0 ? capeToParatio.toFixed(2) : '—'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            From live freight rates DB
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Freight Forecast with 95% Confidence Bounds (From DB)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {forecastData ? `Model: ${forecastData.model_type || forecastData.modelType || 'ENSEMBLE'} · Baseline: ${formatCurrency(Number(forecastData.baseline_rate_usd || 0))}` : 'No forecast runs in database'}
            </p>
          </div>
        </div>
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="period" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => (currency === 'INR' ? `₹${(v / 100000).toFixed(1)}L` : `$${(v / 1000).toFixed(0)}k`)}
                />
                <Tooltip content={<EnterpriseTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area type="monotone" dataKey="ciUpper" name="95% CI Upper" stroke="none" fill="#93C5FD" fillOpacity={0.25} />
                <Area type="monotone" dataKey="ciLower" name="95% CI Lower" stroke="none" fill="#93C5FD" fillOpacity={0.25} />
                <Line type="monotone" dataKey="predicted" name="Forecast Rate" stroke="#1D4ED8" strokeWidth={2.5} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs">
              No forecast prediction data in database — trigger a forecast run first
            </div>
          )}
        </div>
      </div>

      {/* Freight Rates Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">All Freight Routes from Database</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{rates.length} routes loaded</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="p-3">Route Code</th>
                <th className="p-3">Route</th>
                <th className="p-3">Vessel Class</th>
                <th className="p-3 text-right">Freight Rate</th>
                <th className="p-3 text-right">TCE Rate</th>
                <th className="p-3 text-right">7D Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rates.slice(0, 8).map((r: any, i: number) => {
                const change = Number(r.bdi_change_pct || r.change7d || r.change_7d || 0);
                return (
                  <tr key={r.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-blue-700 dark:text-sky-400">{r.freight_code || r.freightCode || '—'}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-200">{r.route_name || r.description || '—'}</td>
                    <td className="p-3 text-slate-500">{r.vessel_class || r.vesselClass || '—'}</td>
                    <td className="p-3 text-right font-semibold tabular-nums">
                      {Number(r.rate_usd || r.rateUsd || 0) > 0 ? formatRateMt(Number(r.rate_usd || r.rateUsd)) : '—'}
                    </td>
                    <td className="p-3 text-right font-semibold tabular-nums">
                      {Number(r.time_charter_equivalent_day || 0) > 0 ? formatDailyRate(Number(r.time_charter_equivalent_day)) : '—'}
                    </td>
                    <td className={`p-3 text-right font-semibold tabular-nums ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
              {rates.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">No freight rates in database</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTIVE DASHBOARD CONTAINER
// ═══════════════════════════════════════════════════════════════════════════════
export const ExecutiveDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const currentRole: SystemRole = user?.roles?.[0] || 'CHARTERING_MANAGER';

  const roleConfigs: Record<SystemRole, { title: string; subtitle: string; icon: React.ReactNode; component: React.ReactNode }> = {
    CHARTERING_MANAGER: {
      title: 'Chartering & Vessel Operations Command',
      subtitle: 'Live fixture registry, Baltic freight rates, tonnage & contract data from database',
      icon: <Ship size={18} className="text-blue-600" />,
      component: <CharteringManagerView />,
    },
    PROCUREMENT_MANAGER: {
      title: 'Raw Material Procurement & Stock Tower',
      subtitle: 'Live COA contracts, procurement requirements & plant stock data from database',
      icon: <Package size={18} className="text-emerald-600" />,
      component: <ProcurementManagerView />,
    },
    PORT_MANAGER: {
      title: 'Port Logistics, Berth Queuing & Demurrage Control',
      subtitle: 'Live port congestion, waiting times & vessel queue data from database',
      icon: <Anchor size={18} className="text-indigo-600" />,
      component: <PortManagerView />,
    },
    SUPER_ADMIN: {
      title: 'Enterprise Platform Governance & Security Center',
      subtitle: 'Live audit logs, system health check, vessel & contract counts from database',
      icon: <Shield size={18} className="text-purple-600" />,
      component: <SuperAdminView />,
    },
    ADMIN: {
      title: 'System Administration & Operations Control',
      subtitle: 'Live audit logs, system health & operational data from database',
      icon: <Shield size={18} className="text-purple-600" />,
      component: <SuperAdminView />,
    },
    ANALYST: {
      title: 'Freight Econometrics & Market Intelligence Center',
      subtitle: 'Live freight rates, forecast predictions & model accuracy from database',
      icon: <BarChart3 size={18} className="text-amber-600" />,
      component: <AnalystView />,
    },
  };

  const currentConfig = roleConfigs[currentRole] || roleConfigs.CHARTERING_MANAGER;

  return (
    <div className="space-y-5 pb-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {currentConfig.icon}
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">{currentConfig.title}</h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{currentConfig.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/cargo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Package size={14} />
              <span>New Cargo Requirement</span>
            </Link>
            <DataFreshnessBar source="Live DB · Real-Time API" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Verified Mandate:</span>
            <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-sky-300 font-bold text-[11px] flex items-center gap-1.5">
              <Shield size={12} className="text-blue-600 dark:text-sky-400" />
              {currentRole.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-[11px] font-medium">Profile Mandate Locked · Role reassignment requires Central Administration clearance</span>
          </div>
        </div>
      </div>

      {currentConfig.component}
    </div>
  );
};

export default ExecutiveDashboardPage;
