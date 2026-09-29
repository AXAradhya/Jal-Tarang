import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Anchor,
  ArrowLeft,
  Ship,
  Clock,
  Compass,
  Train,
  CheckCircle2,
  Waves,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import {
  DiversionAnalysis,
  PortWaitingChart,
  PortCongestionList,
} from '../../components/dashboard/widgets';
import { portApi, liveFeedsApi } from '../../api';
import { queryKeys } from '../../api/queryKeys';

export const PortDecisionPage: React.FC = () => {
  const { data: rawPorts } = useQuery({
    queryKey: queryKeys.ports.list({}),
    queryFn: async () => {
      const res = await portApi.list({ limit: 50 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: liveWeather } = useQuery({
    queryKey: ['liveFeeds', 'marineWeather'],
    queryFn: () => liveFeedsApi.getMarineWeather(),
    staleTime: 60_000,
  });

  const ports = rawPorts || [];

  const paradipWeather = liveWeather?.find((p: any) =>
    p.portId === 'INPAV' || (p.portName || '').toLowerCase().includes('paradip')
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/ports"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white border border-slate-200 dark:border-slate-700 transition shadow-xs"
              title="Return to Port Operations Desk"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Port Congestion & Demurrage Mitigation Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
              Role: Port Logistics Officer
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time port diversion simulation, inland railway rake evacuation logistics, and demurrage avoidance directives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/ports"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg transition flex items-center gap-2 shadow-xs"
          >
            <Ship className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            View Port Berths & Terminals
          </Link>
        </div>
      </div>

      {/* Live Ocean Swell & Storm Alert Banner */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <span>Bay of Bengal Swell Advisory: Paradip Port ({paradipWeather?.swellHeightM?.toFixed(1) ?? '2.1'}m Swell · {paradipWeather?.dangerSignalText ?? 'Signal No. 3 LC-3'})</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-800 dark:text-amber-300">
                IMD & Open-Meteo
              </span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mt-0.5">
              Pre-berthing wait at Paradip is currently 3.8 days. Diverting nominated Capesize to deep-draft Dhamra Port (18.0m draft, 0.8d wait) yields net operational savings of $44,000 USD after rake freight adjustments.
            </p>
          </div>
        </div>

        <Link
          to="/decision/chartering"
          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shrink-0 flex items-center gap-1 shadow-xs"
        >
          <span>Demurrage Calculator</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Diversion Optimization Widget */}
      <div>
        <DiversionAnalysis />
      </div>

      {/* Port Pre-Berthing Wait Comparison & Congestion List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <PortWaitingChart />
        </div>
        <div className="lg:col-span-6">
          <PortCongestionList ports={ports} />
        </div>
      </div>
    </div>
  );
};

export default PortDecisionPage;
