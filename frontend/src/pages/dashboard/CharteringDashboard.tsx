import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Ship,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  KpiCard,
  FreightTrendChart,
  ContractStatusMix,
  LiveContractsTable,
} from '../../components/dashboard/widgets';
import { freightApi, contractApi } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { useUiStore } from '../../store/uiStore';
import { formatCurrency, formatRateMt, formatDailyRate } from '../../lib/utils';

export const CharteringDashboard: React.FC = () => {
  const currency = useUiStore((s) => s.currency);
  const {
    data: freightData,
    isLoading: isFreightLoading,
    refetch: refetchFreight,
  } = useQuery({
    queryKey: queryKeys.freight.rates(),
    queryFn: () => freightApi.rates(),
    staleTime: 60_000,
  });

  const {
    data: contractsData,
    isLoading: isContractsLoading,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: queryKeys.contracts.list(),
    queryFn: () => contractApi.list(),
    staleTime: 60_000,
  });

  const handleRefresh = () => {
    refetchFreight();
    refetchContracts();
  };

  const contracts = contractsData?.data || [];
  const activeCount = contracts.filter((c: any) => c.status === 'ACTIVE' || c.status === 'APPROVED').length;
  const draftCount = contracts.filter((c: any) => c.status === 'DRAFT').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">Chartering Desk</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              Role: Chartering Manager
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Baltic bulk indices, fixture approvals, contract lifecycles, and charterparty execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition shadow-xs"
            title="Refresh live feeds"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/decision/chartering"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-blue-900/20 flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            Launch Decision Center
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Baltic Capesize Index (BCI)"
          value="3,245"
          change="+4.2%"
          changeDirection="up"
          timeframe="vs last session"
          icon={TrendingUp}
          status="good"
          subValue={`Timecharter Avg: ${formatDailyRate(26890)}`}
        />
        <KpiCard
          title="Active Fixtures / COA"
          value={activeCount.toString() || '14'}
          change="+2"
          changeDirection="neutral"
          timeframe="In execution"
          icon={Ship}
          status="normal"
          subValue={`${draftCount} in drafting / negotiation`}
        />
        <KpiCard
          title="Avg Freight Rate Paid"
          value={(formatRateMt(14.85) || '').replace('/MT', '')}
          unit="/ MT"
          change="-3.1%"
          changeDirection="down"
          timeframe="vs Baltic benchmark"
          icon={DollarSign}
          status="good"
          subValue={`Estimated savings: ${formatCurrency(240000)}`}
        />
        <KpiCard
          title="Fleet Pre-Berthing Wait"
          value="2.8"
          unit="Days"
          change="+0.4d"
          changeDirection="up"
          timeframe="East Coast ports"
          icon={Clock}
          status="warning"
          subValue={`Demurrage exposure: ${formatDailyRate(38000, { compact: true })}`}
        />
      </div>

      {/* Freight Trend & Contract Mix Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FreightTrendChart />
        </div>
        <div>
          <ContractStatusMix contracts={contracts} />
        </div>
      </div>

      {/* Live Contracts Registry */}
      <div>
        <LiveContractsTable contracts={contracts} isLoading={isContractsLoading} />
      </div>
    </div>
  );
};

export default CharteringDashboard;
