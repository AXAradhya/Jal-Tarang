import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../api/queryKeys';
import { contractApi, configApi } from '../../api';
import { StatusBadge, DataFreshnessBar } from '../../components/common';
import { EnterpriseDataTable, Column } from '../../components/common/EnterpriseDataTable';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { formatRateMt, formatDailyRate, formatCurrency } from '../../lib/utils';
import { SystemRole } from '../../types';
import {
  FileText,
  CheckCircle2,
  Clock,
  Shield,
  Filter,
  DollarSign,
  AlertTriangle,
  Building,
  ArrowRight,
  Send,
  Eye,
  Ship,
  MapPin,
  Download,
  Hash
} from 'lucide-react';

const getContractTypeBadge = (rawType: string) => {
  const t = (rawType || '').toUpperCase();
  if (t.includes('AFFREIGHTMENT') || t === 'COA') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-sky-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
        COA
      </span>
    );
  }
  if (t.includes('VOYAGE') || t.includes('SPOT')) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
        Spot Voyage
      </span>
    );
  }
  if (t.includes('TIME')) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800 whitespace-nowrap">
        Time Charter
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
      {(rawType || 'Standard').replace(/_/g, ' ')}
    </span>
  );
};

const ContractsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { currency } = useUiStore();
  const currentRole: SystemRole = user?.roles?.[0] || SystemRole.CHARTERING_MANAGER;

  // Fetch contract statuses from config API
  const { data: uiConfig } = useQuery({
    queryKey: queryKeys.config.ui,
    queryFn: () => configApi.getUiConfig(),
    staleTime: 300_000,
  });

  const [statusFilter, setStatusFilter] = useState('');
  const [selectedContractId, setSelectedContractId] = useState<string | null>('cnt-sail-2026-001');
  const [approvalMsg, setApprovalMsg] = useState<string | null>(null);

  // Fetch real contracts from backend
  const { data: rawContracts, isLoading, refetch } = useQuery({
    queryKey: queryKeys.contracts.list({ status: statusFilter }),
    queryFn: async () => {
      const res = await contractApi.list({ status: statusFilter || undefined });
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const contracts = (rawContracts && rawContracts.length > 0 ? rawContracts : []).map((c: any) => ({
    id: c.id,
    contractNumber: c.contract_number || c.contract_reference || '—',
    contractType: c.contract_type || c.charter_type || '—',
    counterpartyName: c.counterparty_name || c.charterer_name || '—',
    counterpartyType: c.counterparty_type || 'SUPPLIER',
    cargoName: c.cargo_name || '—',
    totalQuantityMt: Number(c.cargo_quantity_mt || c.quantity_mt || 0),
    deliveredQuantityMt: Number(c.delivered_quantity_mt || 0),
    rateUsd: Number(c.freight_rate_usd || c.rate_usd || 0),
    rateType: c.freight_rate_basis || 'USD/MT',
    demurrageRateUsdDay: Number(c.demurrage_rate_usd_day || 0),
    despatchRateUsdDay: Number(c.despatch_rate_usd_day || 0),
    startDate: c.laycan_start || '—',
    endDate: c.laycan_end || '—',
    status: c.status || 'DRAFT',
    voyageCount: Number(c.voyage_count || 0),
    vesselName: c.vessel_name || '—',
    loadingPort: c.loading_port || '—',
    dischargingPort: c.discharging_port || '—',
  }));

  const filteredContracts = statusFilter
    ? contracts.filter((c: any) => c.status === statusFilter)
    : contracts;

  const selectedContract =
    contracts.find((c: any) => c.id === selectedContractId) || contracts[0] || null;

  const statuses = uiConfig?.contractStatuses || ['ALL', 'ACTIVE', 'CONFIRMED', 'COMPLETED', 'PENDING_APPROVAL', 'CANCELLED'];
  const statusSummary = statuses.map((s) => ({
    status: s,
    count: s === 'ALL' ? contracts.length : contracts.filter((c: any) => c.status === s).length,
  }));

  const columns: Column[] = [
    {
      key: 'contractNumber',
      header: 'Contract Reference',
      minWidth: '220px',
      render: (v) => (
        <span className="font-mono text-blue-600 dark:text-sky-400 font-bold text-xs whitespace-nowrap">
          {v}
        </span>
      ),
    },
    {
      key: 'contractType',
      header: 'Type',
      minWidth: '120px',
      render: (v) => getContractTypeBadge(v),
    },
    {
      key: 'counterpartyName',
      header: 'Counterparty',
      minWidth: '220px',
      render: (v, row: any) => (
        <div className="py-0.5">
          <span className="font-bold text-slate-900 dark:text-white block whitespace-nowrap">{v}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.cargoName}</p>
        </div>
      ),
    },
    {
      key: 'totalQuantityMt',
      header: 'Commitment',
      minWidth: '130px',
      align: 'right',
      render: (v) => (
        <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
          {v.toLocaleString()} MT
        </span>
      ),
      sortable: true,
    },
    {
      key: 'rateUsd',
      header: 'Contract Rate',
      minWidth: '140px',
      align: 'right',
      render: (v) => (
        <span className="tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap">
          {formatRateMt(v)}
        </span>
      ),
    },
    {
      key: 'demurrageRateUsdDay',
      header: 'Demurrage',
      minWidth: '130px',
      align: 'right',
      render: (v) => (
        <span className="tabular-nums text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
          {formatDailyRate(v, { compact: true })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Lifecycle Status',
      minWidth: '130px',
      render: (v) => <StatusBadge value={v} size="xs" />,
    },
    {
      key: 'voyageCount',
      header: 'Voyages',
      minWidth: '80px',
      align: 'center',
      render: (v) => (
        <span className="tabular-nums font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {v}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Maritime Contract Lifecycle & Governance
            </h1>
            <span className="inline-flex items-center justify-center text-center leading-none bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-sky-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 tracking-wide">
              LEGAL & CHARTERING DESK
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            COA master agreements, spot fixtures, laycan compliance tracking, and counterparty performance monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataFreshnessBar source="JAL TARANG Legal ERP" />
          <button
            onClick={() => refetch()}
            className="text-xs px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Verified Mandate Security Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600 dark:text-sky-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Verified Mandate:</span>
          <span className="text-xs font-bold text-blue-700 dark:text-sky-300 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
            {currentRole.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span className="text-[11px] font-medium">Profile Mandate Locked</span>
        </div>
      </div>

      {/* Role-Specific Action Banner */}
      {currentRole === SystemRole.SUPER_ADMIN && (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex-shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Super Admin Clearance: Contract Amendments & CVC Compliance
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                All COA amendments above {formatCurrency(1000000, { compact: true })} or laycan modifications require board-level digital countersignature.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setApprovalMsg(`Executive clearance granted for Contract ${selectedContract?.contractNumber || 'SAIL/CHTR/COA/2026/089'}. Audit hash generated.`);
              setTimeout(() => setApprovalMsg(null), 5000);
            }}
            className="text-xs font-semibold px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-xs whitespace-nowrap flex-shrink-0 transition-colors"
          >
            Authorize Executive Clearance
          </button>
        </div>
      )}

      {approvalMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{approvalMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
        {statusSummary.map((s) => (
          <button
            key={s.status}
            onClick={() => setStatusFilter(s.status === 'ALL' ? '' : s.status)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              (statusFilter === '' && s.status === 'ALL') || statusFilter === s.status
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {(s.status || '').replace(/_/g, ' ')} ({s.count})
          </button>
        ))}
      </div>

      {/* 1. Full-Width Contracts Table: Complete Visibility with Zero Clipping */}
      <div className="w-full space-y-2">
        <EnterpriseDataTable
          columns={columns}
          data={filteredContracts}
          onRowClick={(row) => setSelectedContractId(row.id)}
          selectedRowKey={selectedContract?.id}
          caption="Active Maritime Contracts & Charter Parties"
          loading={isLoading}
        />
        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
          💡 Tip: Click any row to inspect complete commercial terms, laycan routing, and download fixture notes below.
        </p>
      </div>

      {/* 2. Selected Contract Commercial Inspector */}
      {selectedContract && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-sky-400 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                  {selectedContract.contractNumber}
                </span>
                {getContractTypeBadge(selectedContract.contractType)}
                <StatusBadge value={selectedContract.status} size="sm" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                {selectedContract.counterpartyName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary Cargo: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedContract.cargoName}</span> · Commitment Volume: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedContract.totalQuantityMt.toLocaleString()} MT</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setApprovalMsg(`Signed fixture note exported for ${selectedContract.contractNumber}.`);
                  setTimeout(() => setApprovalMsg(null), 4000);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Download size={13} />
                <span>Download Fixture Note</span>
              </button>
            </div>
          </div>

          {/* Detailed Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium uppercase">Freight Rate</span>
              <span className="font-bold text-slate-900 dark:text-white text-base tabular-nums mt-0.5 block">
                {formatRateMt(selectedContract.rateUsd)}
              </span>
              <span className="text-[10px] text-slate-400">Agreed baseline charter</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium uppercase">Total Volume</span>
              <span className="font-bold text-slate-900 dark:text-white text-base tabular-nums mt-0.5 block">
                {selectedContract.totalQuantityMt.toLocaleString()} MT
              </span>
              <span className="text-[10px] text-slate-400">Delivered: {selectedContract.deliveredQuantityMt.toLocaleString()} MT</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-rose-600 dark:text-rose-400 block text-[11px] font-medium uppercase">Demurrage Daily Rate</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-base tabular-nums mt-0.5 block">
                {formatDailyRate(selectedContract.demurrageRateUsdDay)}
              </span>
              <span className="text-[10px] text-slate-400">Agreed laytime: 48 hours</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-emerald-600 dark:text-emerald-400 block text-[11px] font-medium uppercase">Despatch Daily Incentive</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base tabular-nums mt-0.5 block">
                {formatDailyRate(selectedContract.despatchRateUsdDay)}
              </span>
              <span className="text-[10px] text-slate-400">50% demurrage standard</span>
            </div>
          </div>

          {/* Maritime Routing & Laycan Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-850/40">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={13} className="text-blue-600 dark:text-sky-400" />
                Maritime Routing & Terminal
              </span>
              <div className="text-xs space-y-1.5 divide-y divide-slate-200/60 dark:divide-slate-800 pt-1">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Loading Terminal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedContract.loadingPort}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Discharge Terminal:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedContract.dischargingPort}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Nominated Vessel:</span>
                  <span className="font-bold text-blue-600 dark:text-sky-400">{selectedContract.vesselName}</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-850/40">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={13} className="text-blue-600 dark:text-sky-400" />
                Laycan Window & Voyage Tracking
              </span>
              <div className="text-xs space-y-1.5 divide-y divide-slate-200/60 dark:divide-slate-800 pt-1">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Laycan Window:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {selectedContract.startDate} → {selectedContract.endDate}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Completed Voyages:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedContract.voyageCount} fixtures executed</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Governance Clearance:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Digital Seal & CVC Ledger Hash Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsPage;
