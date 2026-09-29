import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package,
  Layers,
  AlertTriangle,
  Building2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import {
  KpiCard,
  PlantStockChart,
  ProcurementRequirementsTable,
} from '../../components/dashboard/widgets';
import { procurementApi } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { useUiStore } from '../../store/uiStore';
import { formatCurrency } from '../../lib/utils';

export const ProcurementDashboard: React.FC = () => {
  const currency = useUiStore((s) => s.currency);
  const {
    data: requirementsData,
    isLoading: isRequirementsLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.procurement.requirements(),
    queryFn: () => procurementApi.list(),
    staleTime: 60_000,
  });

  const requirements = requirementsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Raw Materials Procurement Desk
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Role: Procurement Manager
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Plant inventory buffers, blast furnace raw material requirements, and global tender allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition shadow-xs"
            title="Refresh procurement data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/decision/procurement"
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            Evaluate Supplier Tenders
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Avg Plant Stock Buffer"
          value="18.5"
          unit="Days"
          change="-2.5d"
          changeDirection="down"
          timeframe="vs 21-day target"
          icon={Layers}
          status="warning"
          subValue="Durgapur critically low at 11 days"
        />
        <KpiCard
          title="Open Requisitions"
          value={requirements.length > 0 ? requirements.length.toString() : '6'}
          unit="Parcels"
          change="+2"
          changeDirection="neutral"
          timeframe="Active RFQs"
          icon={Package}
          status="normal"
          subValue="Total volume: 540,000 MT"
        />
        <KpiCard
          title="Raw Material Spend (MTD)"
          value={formatCurrency(74200000, { compact: true })}
          change="-4.8%"
          changeDirection="down"
          timeframe="vs budgetary estimate"
          icon={DollarSign}
          status="good"
          subValue="Direct CIF import contracts"
        />
        <KpiCard
          title="Critical Buffer Alerts"
          value="2 Plants"
          change="Urgent"
          changeDirection="up"
          timeframe="Within 14 days"
          icon={AlertTriangle}
          status="danger"
          subValue="DSP & ISP blast furnace feedstock"
        />
      </div>

      {/* Plant Stock Chart */}
      <div>
        <PlantStockChart />
      </div>

      {/* Active Procurement Requirements Table */}
      <div>
        <ProcurementRequirementsTable
          requirements={requirements}
          isLoading={isRequirementsLoading}
        />
      </div>
    </div>
  );
};

export default ProcurementDashboard;
