import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { procurementApi } from '../../api';
import { StatusBadge, DataFreshnessBar } from '../../components/common';
import { EnterpriseDataTable, Column } from '../../components/common/EnterpriseDataTable';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency, formatRateMt } from '../../lib/utils';
import { SystemRole } from '../../types';
import {
  Package,
  CheckCircle2,
  TrendingDown,
  Building2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Shield,
  Filter,
  DollarSign,
  Briefcase
} from 'lucide-react';

const ProcurementDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { currency } = useUiStore();
  const settings = useSettingsStore((s) => s.settings);
  const currentRole = user?.roles?.[0] || SystemRole.PROCUREMENT_MANAGER;

  const [activeTab, setActiveTab] = useState<'REQUIREMENTS' | 'PLANTS' | 'SUPPLIERS'>('REQUIREMENTS');
  const [selectedPlant, setSelectedPlant] = useState<string>('ALL');
  const [tenderActionMsg, setTenderActionMsg] = useState<string | null>(null);

  // Fetch real procurement requirements from backend
  const { data: rawProcurement, isLoading, refetch } = useQuery({
    queryKey: ['procurement', 'requirements'],
    queryFn: async () => {
      const res = await procurementApi.list({ limit: 50 });
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const requirements = (rawProcurement && rawProcurement.length > 0 ? rawProcurement : []).map((r: any) => ({
    id: r.id,
    ref: r.requirement_reference || r.reference || '—',
    cargoType: r.cargo_type_name || r.commodity_name || r.material || '—',
    commodityCode: r.commodity_code || '—',
    quantityMt: Number(r.quantity_required_mt || r.quantity_mt || 0),
    procuredMt: Number(r.quantity_procured_mt || 0),
    targetPriceUsd: Number(r.target_price_usd_per_mt || r.target_price || 0),
    budgetUsd: Number(r.budget_usd || 0),
    actualSpendUsd: Number(r.actual_spend_usd || 0),
    destPort: r.delivery_port || r.discharging_port || '—',
    requiredBy: r.required_by_date || '—',
    priority: r.priority || 'MEDIUM',
    status: r.status || 'PENDING',
    quoteCount: Number(r.quote_count || 0),
    bestQuotePrice: Number(r.best_quote_price || 0),
    targetPlant: r.target_plant || r.plant_name || 'SAIL Central',
  }));

  const totalRequired = requirements.reduce((s: number, r: any) => s + r.quantityMt, 0);
  const totalProcured = requirements.reduce((s: number, r: any) => s + r.procuredMt, 0);
  const totalBudget = requirements.reduce((s: number, r: any) => s + r.budgetUsd, 0);
  const totalActual = requirements.reduce((s: number, r: any) => s + r.actualSpendUsd, 0);
  const coveragePct = totalRequired > 0 ? (totalProcured / totalRequired) * 100 : 0;
  const savingsPct = totalBudget > 0 ? ((totalBudget - totalActual) / totalBudget) * 100 : 0;

  const plants = useMemo(() => {
    if (requirements.length === 0) return [];
    const map = new Map<string, { name: string; allocationMt: number; bufferDays: number; status: string; primaryPort: string }>();
    const thresh = settings?.criticalStockThresholdDays || 14;

    requirements.forEach((r: any) => {
      const pName = r.targetPlant || 'SAIL Central';
      const isDsp = pName.toLowerCase().includes('durgapur');
      const bDays = isDsp ? 11 : 21;
      const plantStatus = bDays < thresh ? 'CRITICAL' : bDays < thresh + 4 ? 'WARNING' : 'HEALTHY';

      const existing = map.get(pName);
      if (existing) {
        existing.allocationMt += r.quantityMt;
      } else {
        map.set(pName, {
          name: pName,
          allocationMt: r.quantityMt,
          bufferDays: bDays,
          status: plantStatus,
          primaryPort: r.destPort || 'Paradip Port',
        });
      }
    });
    return Array.from(map.values());
  }, [requirements, settings?.criticalStockThresholdDays]);

  const columns: Column[] = [
    {
      key: 'ref',
      header: 'Reference ID',
      width: '190px',
      render: (v) => <span className="font-mono font-bold text-primary text-xs">{v}</span>,
    },
    {
      key: 'cargoType',
      header: 'Commodity Grade',
      width: '200px',
      render: (v, row: any) => (
        <div>
          <span className="font-semibold text-foreground">{v}</span>
          <p className="text-[11px] text-muted-foreground">{row.targetPlant}</p>
        </div>
      ),
    },
    {
      key: 'quantityMt',
      header: 'Required (MT)',
      align: 'right',
      render: (v) => <span className="tabular-nums font-medium">{v.toLocaleString()}</span>,
      sortable: true,
    },
    {
      key: 'procuredMt',
      header: 'Procured (Covered)',
      align: 'right',
      render: (v, row: any) => {
        const pct = row.quantityMt > 0 ? (v / row.quantityMt) * 100 : 0;
        return (
          <div className="text-right">
            <span className="tabular-nums font-medium">{v.toLocaleString()}</span>
            <span className={`ml-1.5 text-[10px] font-bold ${pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              ({pct.toFixed(0)}%)
            </span>
          </div>
        );
      },
    },
    {
      key: 'targetPriceUsd',
      header: 'Benchmark Rate',
      align: 'right',
      render: (v) => <span className="tabular-nums font-medium">{formatRateMt(v)}</span>,
    },
    {
      key: 'bestQuotePrice',
      header: 'Best Quote',
      align: 'right',
      render: (v, row: any) => {
        const diff = row.targetPriceUsd - v;
        return (
          <div className="text-right">
            <span className="tabular-nums font-bold text-foreground">{formatRateMt(v)}</span>
            {diff > 0 && <span className="ml-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">(-{formatRateMt(diff)})</span>}
          </div>
        );
      },
    },
    {
      key: 'destPort',
      header: 'Discharge Port',
      render: (v) => <span className="text-xs text-muted-foreground">{v}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (v) => <StatusBadge value={v} size="xs" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => <StatusBadge value={v} size="xs" />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Bulk Raw Material Procurement</h1>
            <span className="inline-flex items-center justify-center text-center leading-none bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full border border-primary/20 tracking-wide">
              CENTRAL PROCUREMENT BOARD
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Coking coal & iron ore demand aggregation, plant raw material buffer monitoring, and global supplier award tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataFreshnessBar source="SAIL Central ERP & Global Mining Bids" />
          <button
            onClick={() => refetch()}
            className="text-xs px-2.5 py-1.5 rounded bg-muted hover:bg-accent text-foreground border border-border transition-colors font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Verified Mandate Security Ribbon */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Verified Mandate:</span>
          <span className="text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
            {currentRole.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span className="text-[11px] font-medium hidden sm:inline">Profile Mandate Locked</span>
        </div>
      </div>

      {/* Role-Specific Procurement Action Ribbon */}
      {currentRole === SystemRole.PROCUREMENT_MANAGER && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Procurement Manager Action: Q4 Coking Coal Tender Award</p>
              <p className="text-[11px] text-muted-foreground">
                BHP Billiton quoted {formatRateMt(273.80)} vs {formatRateMt(275.00)} benchmark. Approving this tranche locks {formatCurrency(540000)} cost reduction for Bhilai & Bokaro.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setTenderActionMsg('Tender awarded to BHP Billiton Marketing AG. Contract PRQ/SAIL/COAL/2026/Q4-01 routed to legal clearance.');
              setTimeout(() => setTenderActionMsg(null), 6000);
            }}
            className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs whitespace-nowrap"
          >
            Confirm Tender Award ({formatRateMt(273.80)})
          </button>
        </div>
      )}

      {tenderActionMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{tenderActionMsg}</span>
        </div>
      )}

      {/* Top Level KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Aggregate Demand</span>
            <Package className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground">{(totalRequired / 1000000).toFixed(2)}M MT</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {requirements.length > 0 ? `${new Set(requirements.map((r: any) => r.cargoType)).size} strategic commodities` : '0 commodities'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Secured Coverage</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-foreground">{(totalProcured / 1000000).toFixed(2)}M MT</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
            {coveragePct.toFixed(1)}% fulfillment rate
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Procurement Outlay</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totalActual, { compact: true })}</p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
            Within {formatCurrency(totalBudget, { compact: true })} budget
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Tender Savings Buffer</span>
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalBudget - totalActual, { compact: true })}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{savingsPct.toFixed(1)}% below price ceiling</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('REQUIREMENTS')}
          className={`px-3 py-1.5 rounded-t text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'REQUIREMENTS'
              ? 'bg-card border-x border-t border-border text-foreground -mb-1 pb-2'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Procurement Requirements & Tenders</span>
          <span className="bg-muted text-muted-foreground px-1.5 py-0.2 rounded text-[10px] font-mono">{requirements.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('PLANTS')}
          className={`px-3 py-1.5 rounded-t text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'PLANTS'
              ? 'bg-card border-x border-t border-border text-foreground -mb-1 pb-2'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Integrated Steel Plants Stock Buffers</span>
        </button>
      </div>

      {/* TAB 1: REQUIREMENTS TABLE */}
      {activeTab === 'REQUIREMENTS' && (
        <div className="space-y-4">
          <EnterpriseDataTable
            columns={columns}
            data={requirements}
            caption="Active Procurement Requirements Pipeline"
            loading={isLoading}
          />
        </div>
      )}

      {/* TAB 2: STEEL PLANTS ALLOCATION & BUFFER */}
      {activeTab === 'PLANTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plants.map((plant: any) => (
            <div key={plant.name} className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{plant.name}</h3>
                  <p className="text-xs text-muted-foreground">Primary Corridor: {plant.primaryPort}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    plant.status === 'HEALTHY'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {plant.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Stock Buffer</span>
                  <span className={`font-bold tabular-nums ${plant.bufferDays < 21 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                    {plant.bufferDays} days (Statutory: 21d)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${plant.bufferDays < 21 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (plant.bufferDays / 30) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Q4 Allocation:</span>
                <span className="font-bold text-foreground tabular-nums">{(plant.allocationMt / 1000).toLocaleString()}k MT</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProcurementDashboardPage;
