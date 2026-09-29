import { NlpDisruptionRadar } from '../../components/risk/NlpDisruptionRadar';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { SystemRole } from '../../types';
import { DataFreshnessBar, StatusBadge } from '../../components/common';
import {
  Shield, AlertTriangle, Ship, Package, Anchor, BarChart3,
  CheckCircle2, AlertCircle, ArrowUpRight, TrendingUp, Filter, Loader2
} from 'lucide-react';
import { riskApi, vesselApi, contractApi, portApi } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { useUiStore } from '../../store/uiStore';
import { formatCurrency } from '../../lib/utils';

const RiskDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { currency } = useUiStore();
  const currentRole: SystemRole = user?.roles?.[0] || 'CHARTERING_MANAGER';
  const [levelFilter, setLevelFilter] = useState('');

  const { data: rawRisks, isLoading: risksLoading } = useQuery({
    queryKey: queryKeys.risks.factors({ level: levelFilter }),
    queryFn: async () => {
      const res = await riskApi.factors({ level: levelFilter || undefined });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: riskDashboard, isLoading: dashLoading } = useQuery({
    queryKey: queryKeys.risks.dashboard,
    queryFn: async () => {
      const res = await riskApi.dashboard();
      return res;
    },
    staleTime: 60_000,
  });

  const { data: rawVessels } = useQuery({
    queryKey: queryKeys.vessels.list({}),
    queryFn: async () => {
      const res = await vesselApi.list({ limit: 50 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 120_000,
  });

  const { data: rawContracts } = useQuery({
    queryKey: queryKeys.contracts.list({}),
    queryFn: async () => {
      const res = await contractApi.list({ limit: 50 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 120_000,
  });

  const { data: rawPorts } = useQuery({
    queryKey: queryKeys.ports.list({}),
    queryFn: async () => {
      const res = await portApi.list({ limit: 20 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 120_000,
  });

  const risks = rawRisks || [];
  const vessels = rawVessels || [];
  const contracts = rawContracts || [];
  const ports = rawPorts || [];

  // Derive risk-like data from contracts/vessels/ports if risk endpoint has no data
  const derivedRisks = risks.length > 0 ? risks : [
    ...contracts.filter((c: any) => c.demurrage_rate_usd_day > 0).map((c: any) => ({
      id: c.id,
      title: `Contract Demurrage Risk: ${c.contract_number || c.contractNumber || '—'}`,
      category: 'Contract',
      level: Number(c.demurrage_rate_usd_day) > 20000 ? 'HIGH' : 'MEDIUM',
      probability: 0.4,
      impact: 7,
      exposure_usd: Number(c.demurrage_rate_usd_day || 0),
      status: 'OPEN',
      mitigation: 'Monitor laycan adherence and berth availability',
    })),
    ...ports.filter((p: any) => ['HIGH', 'CRITICAL'].includes(p.congestion_status || p.congestionStatus || '')).map((p: any) => ({
      id: p.id,
      title: `Port Congestion Risk: ${p.name}`,
      category: 'Port Operations',
      level: p.congestion_status === 'CRITICAL' || p.congestionStatus === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      probability: 0.65,
      impact: 8,
      exposure_usd: Number(p.current_waiting_days || p.currentWaitingDays || 0) * 15000,
      status: 'OPEN',
      mitigation: 'Coordinate berth reallocation and priority sequencing',
    })),
    ...vessels.filter((v: any) => v.status === 'WAITING').map((v: any) => ({
      id: v.id,
      title: `Vessel Idle Risk: ${v.vessel_name || v.name || '—'}`,
      category: 'Vessel Performance',
      level: 'MEDIUM',
      probability: 0.5,
      impact: 6,
      exposure_usd: 15000,
      status: 'UNDER_REVIEW',
      mitigation: 'Expedite berthing slot and pilot booking',
    })),
  ];

  // Role-based filtering
  const roleFilteredRisks = derivedRisks.filter((r: any) => {
    if (currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') return true;
    if (currentRole === 'CHARTERING_MANAGER') return ['Vessel Performance', 'Fuel Commodity', 'Chartering', 'Contract'].includes(r.category);
    if (currentRole === 'PROCUREMENT_MANAGER') return ['Raw Material Inventory', 'Contract', 'Procurement', 'Supplier'].includes(r.category);
    if (currentRole === 'PORT_MANAGER') return ['Port Operations', 'Weather', 'Port'].includes(r.category);
    if (currentRole === 'ANALYST') return true;
    return true;
  });

  const filteredRisks = levelFilter
    ? roleFilteredRisks.filter((r: any) => (r.level || r.risk_level) === levelFilter)
    : roleFilteredRisks;

  const criticalCount = derivedRisks.filter((r: any) => (r.level || r.risk_level) === 'CRITICAL').length;
  const highCount = derivedRisks.filter((r: any) => (r.level || r.risk_level) === 'HIGH').length;
  const openCount = derivedRisks.filter((r: any) => (r.status || r.risk_status) === 'OPEN').length;
  const mitigatedCount = derivedRisks.filter((r: any) => (r.status || r.risk_status) === 'MITIGATED').length;
  const totalExposure = derivedRisks.reduce((sum: number, r: any) =>
    sum + Number(r.exposure_usd || r.exposureUsd || 0), 0
  );

  const isLoading = risksLoading || dashLoading;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield size={18} className="text-red-600" />
              Risk Intelligence Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {risks.length > 0
                ? `${risks.length} risk factors from database`
                : `${derivedRisks.length} risk factors derived from contracts, vessels & port data`}
            </p>
          </div>
          <DataFreshnessBar source="Live DB · Risk & Operations API" />
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Verified Risk Perspective:</span>
            <span className="px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 font-bold text-[11px] flex items-center gap-1.5">
              <Shield size={12} className="text-red-600 dark:text-red-400" />
              {(currentRole || 'CHARTERING_MANAGER').replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-[11px]">Role clearance locked to user profile</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Critical Risks</span>
            <AlertCircle size={14} className="text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalCount}</div>
          <div className="text-xs text-slate-400 mt-1">Immediate action required</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>High Risks</span>
            <AlertTriangle size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{highCount}</div>
          <div className="text-xs text-slate-400 mt-1">Monitoring required</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Open / Unmitigated</span>
            <Shield size={14} className="text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{openCount}</div>
          <div className="text-xs text-slate-400 mt-1">{mitigatedCount} mitigated</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Exposure</span>
            <TrendingUp size={14} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalExposure, { compact: true })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Across all risk categories</div>
        </div>
      </div>

      <NlpDisruptionRadar />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter size={14} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Filter by Level:</span>
        {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setLevelFilter(lvl)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              levelFilter === lvl
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {lvl || 'All Risks'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-24 text-slate-400">
          <Loader2 size={18} className="animate-spin mr-2" />
          <span className="text-sm">Loading risk data from database…</span>
        </div>
      )}

      {/* Risk Factors Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="font-bold text-slate-900 dark:text-white text-sm">
            Operational & Counterparty Risk Matrix ({filteredRisks.length} Factors)
          </div>
          <span className="text-xs text-slate-400">Values linked to active voyages & contracts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Risk Title</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-center">Probability</th>
                <th className="p-3 text-center">Impact</th>
                <th className="p-3 text-right">Exposure</th>
                <th className="p-3 text-center">Level</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRisks.slice(0, 12).map((r: any, i: number) => {
                const level = r.level || r.risk_level || 'MEDIUM';
                const status = r.status || r.risk_status || 'OPEN';
                const exposure = Number(r.exposure_usd || r.exposureUsd || r.financial_exposure_usd || 0);
                const prob = Number(r.probability || 0);
                const impact = Number(r.impact || 0);
                return (
                  <tr key={r.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-medium text-slate-900 dark:text-white max-w-xs">
                      <div>{r.title || r.risk_title || '—'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-normal leading-relaxed line-clamp-1">
                        {r.mitigation || r.mitigation_plan || ''}
                      </div>
                    </td>
                    <td className="p-3 text-slate-500">{r.category || r.risk_category || '—'}</td>
                    <td className="p-3 text-center">
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${prob * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500">{(prob * 100).toFixed(0)}%</span>
                    </td>
                    <td className="p-3 text-center font-bold tabular-nums">
                      {impact > 0 ? `${impact}/10` : '—'}
                    </td>
                    <td className="p-3 text-right font-semibold tabular-nums">
                      {formatCurrency(exposure)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        level === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                        level === 'HIGH' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        level === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {level}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        status === 'MITIGATED' ? 'bg-emerald-100 text-emerald-700' :
                        status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {(status || 'OPEN').replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredRisks.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {isLoading ? 'Loading…' : 'No risk data available for this role and filter combination'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskDashboardPage;
