import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Anchor,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Ship,
  TrendingDown,
  Compass,
} from 'lucide-react';
import {
  KpiCard,
  PortWaitingChart,
  PortCongestionList,
} from '../../components/dashboard/widgets';
import { portApi } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { useUiStore } from '../../store/uiStore';
import { formatDailyRate } from '../../lib/utils';

export const PortDashboard: React.FC = () => {
  const currency = useUiStore((s) => s.currency);
  const {
    data: portsData,
    isLoading: isPortsLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.ports.list(),
    queryFn: () => portApi.list(),
    staleTime: 60_000,
  });

  const ports = portsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Port Operations & Terminals
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
              Role: Port Operations Manager
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Berth congestion, pre-berthing waiting times, draft restrictions, and rake evacuation logistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition shadow-xs"
            title="Refresh port telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/decision/ports"
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-cyan-900/20 flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            Optimize Port Diversions
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Avg Pre-Berthing Wait"
          value="48.2"
          unit="Hours"
          change="+6.5h"
          changeDirection="up"
          timeframe="East Coast ports avg"
          icon={Clock}
          status="warning"
          subValue="Haldia max wait: 129 hours"
        />
        <KpiCard
          title="Vessels at Anchorage"
          value="18"
          unit="Bulk Carriers"
          change="+3"
          changeDirection="up"
          timeframe="Awaiting pilot/berth"
          icon={Anchor}
          status="danger"
          subValue={`Demurrage burning: ${formatDailyRate(290000, { compact: true })}`}
        />
        <KpiCard
          title="Berth Turnaround Time"
          value="3.2"
          unit="Days"
          change="-0.4d"
          changeDirection="down"
          timeframe="Discharge completion"
          icon={Ship}
          status="good"
          subValue="Paradip CQ-1 mechanized peak"
        />
        <KpiCard
          title="Railway Rake Evacuation"
          value="42"
          unit="Rakes / day"
          change="+5"
          changeDirection="up"
          timeframe="ECoR & SER sidings"
          icon={Compass}
          status="good"
          subValue="Target: 45 rakes/day"
        />
      </div>

      {/* Port Waiting Hours Chart */}
      <div>
        <PortWaitingChart />
      </div>

      {/* Live Port Congestion Registry */}
      <div>
        <PortCongestionList />
      </div>
    </div>
  );
};

export default PortDashboard;
