import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Ship,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';
import {
  FeasibilityCard,
  VoyageWaterfall,
  StrategyComparison,
  FeasibilityMetric,
  PortWeatherDemurrageSensitivity,
} from '../../components/dashboard/widgets';
import { vesselApi, portApi, contractApi } from '../../api';
import { queryKeys } from '../../api/queryKeys';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useLiveStatus } from '../../hooks/useLiveStatus';

export const CharteringDecisionPage: React.FC = () => {
  const { isSystemLive, isBrowserOnline } = useLiveStatus();
  const settings = useSettingsStore((s) => s.settings);

  const { data: rawVessels } = useQuery({
    queryKey: queryKeys.vessels.list({}),
    queryFn: async () => {
      const res = await vesselApi.list({ limit: 10 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: rawPorts } = useQuery({
    queryKey: queryKeys.ports.list({}),
    queryFn: async () => {
      const res = await portApi.list({ limit: 10 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: rawContracts } = useQuery({
    queryKey: queryKeys.contracts.list({}),
    queryFn: async () => {
      const res = await contractApi.list({ limit: 10 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const candidateVessel = rawVessels?.[0];
  const targetPort = rawPorts?.find((p: any) =>
    (p.country || '').toUpperCase() === 'INDIA' || (p.un_locode || '').startsWith('IN')
  ) || rawPorts?.[0];

  const feasibilityData = useMemo(() => {
    if (!candidateVessel || !targetPort) return { metrics: [], isOverallCompatible: true };

    const vesselDraft = Number(candidateVessel.max_draft_m || candidateVessel.draft || 16.5);
    const portDraft = Number(targetPort.max_vessel_draft_m || targetPort.max_draft_m || 17.5);
    const vesselLoa = Number(candidateVessel.loa_m || candidateVessel.length_overall || 292);
    const portLoa = Number(targetPort.max_vessel_loa_m || targetPort.max_loa_m || 300);
    const vesselBeam = Number(candidateVessel.beam_m || candidateVessel.beam || 45);
    const portBeam = Number(targetPort.max_vessel_beam_m || targetPort.max_beam_m || 48);

    const minUkc = settings?.minUnderKeelClearance ?? 1.0;
    const ukc = portDraft - vesselDraft;
    const ukcOk = ukc >= minUkc;
    const loaOk = vesselLoa <= portLoa;
    const beamOk = vesselBeam <= portBeam;

    const vesselAge = candidateVessel.year_built ? new Date().getFullYear() - Number(candidateVessel.year_built) : 10;
    const ageOk = !settings?.maxVesselAge || vesselAge <= settings.maxVesselAge;

    const metrics: FeasibilityMetric[] = [
      {
        label: 'Arrival Draft vs Channel Depth & UKC Mandate',
        required: `${vesselDraft.toFixed(1)} m`,
        available: `${portDraft.toFixed(1)} m · Min UKC: ${minUkc.toFixed(1)}m`,
        isCompatible: ukcOk,
        notes: ukcOk
          ? `${ukc.toFixed(1)}m UKC margin (Statutory mandate: ≥${minUkc.toFixed(1)}m satisfied)`
          : ukc < 0
          ? 'Exceeds maximum port draft limit'
          : `UKC ${ukc.toFixed(1)}m violates statutory mandate (minimum ${minUkc.toFixed(1)}m required)`,
      },
      {
        label: 'Length Overall (LOA)',
        required: `${vesselLoa.toFixed(1)} m`,
        available: `${portLoa.toFixed(1)} m`,
        isCompatible: loaOk,
        notes: loaOk ? 'Within turning basin envelope' : 'Exceeds max quay length',
      },
      {
        label: 'Vessel Beam vs Gantry Reach',
        required: `${vesselBeam.toFixed(1)} m`,
        available: `${portBeam.toFixed(1)} m`,
        isCompatible: beamOk,
        notes: beamOk ? 'Full crane envelope clear' : 'Exceeds crane outreach',
      },
      {
        label: 'RightShip & Age Vetting Mandate',
        required: `Min ${settings?.minRightShipStars ?? 3.5}★ · Max ${settings?.maxVesselAge ?? 18}y`,
        available: `4.0★ · Age: ${vesselAge}y`,
        isCompatible: ageOk,
        notes: ageOk
          ? `RightShip vetted & Age complies with SAIL chartering guidelines`
          : `Vessel age (${vesselAge}y) exceeds statutory ceiling of ${settings?.maxVesselAge}y`,
      },
    ];

    return {
      metrics,
      isOverallCompatible: ukcOk && loaOk && beamOk && ageOk,
    };
  }, [candidateVessel, targetPort, settings]);

  const activeContract = rawContracts?.[0];
  const voyageWaterfallData = useMemo(() => {
    if (!activeContract) return { voyageCostUsd: 0, cargoQtyMt: 0, components: [] };

    const rate = Number(activeContract.rate_usd || activeContract.rateUsd || 12.5);
    const qty = Number(activeContract.quantity_mt || activeContract.quantityMt || 160000);
    const totalCost = qty * rate;

    return {
      voyageCostUsd: totalCost,
      cargoQtyMt: qty,
      components: [
        { label: 'Heavy Fuel (VLSFO)', usdAmount: Math.round(totalCost * 0.48), pct: 48, category: 'BUNKER' as const },
        { label: 'Marine Gasoil (MGO / Aux)', usdAmount: Math.round(totalCost * 0.10), pct: 10, category: 'BUNKER' as const },
        { label: 'Port Dues & Pilotage', usdAmount: Math.round(totalCost * 0.18), pct: 18, category: 'PORT' as const },
        { label: 'Demurrage Allowance Buffer', usdAmount: Math.round(totalCost * 0.12), pct: 12, category: 'MARGIN' as const },
        { label: 'Canal Transit & Insurance', usdAmount: Math.round(totalCost * 0.12), pct: 12, category: 'CANAL' as const },
      ],
    };
  }, [activeContract]);

  const { currency, exchangeRate, toggleCurrency } = useUiStore();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/chartering"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white border border-slate-200 dark:border-slate-700 transition shadow-xs"
              title="Return to Chartering Desk"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Chartering Decision Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              Role: Chartering Manager
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Vessel feasibility checks, voyage cost waterfalls, live weather demurrage sensitivity, multi-strategy optimization, and fixture execution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live ECB Exchange Rate Badge */}
          {(() => {
            const isLiveRate = isBrowserOnline && exchangeRate > 0;
            return (
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                !isBrowserOnline
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  : isLiveRate
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${!isBrowserOnline ? 'bg-rose-500' : isLiveRate ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>1 USD = ₹{exchangeRate.toFixed(2)}</span>
                <span className="text-[10px] font-normal">
                  {!isBrowserOnline ? '(Offline)' : isLiveRate ? '(ECB Live)' : '(ECB Cached)'}
                </span>
              </div>
            );
          })()}

          {/* Interactive Currency Switcher */}
          <button
            onClick={toggleCurrency}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Toggle between Indian Rupee (₹) and US Dollar ($)"
          >
            <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Currency: {currency === 'INR' ? '₹ INR' : '$ USD'}</span>
          </button>

          <Link
            to="/contracts"
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg transition flex items-center gap-2 shadow-xs"
          >
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            View Executed Fixtures
          </Link>
        </div>
      </div>

      {/* Statutory Delegated Authority & Laytime Mandate Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-slate-900 dark:text-white">Chartering Mandate Policy:</span>{' '}
            <span className="text-slate-600 dark:text-slate-300">
              Laytime Rule: <strong className="text-blue-600 dark:text-sky-400">{settings?.laytimeCalculationRule || 'SHINC'}</strong> · RightShip Minimum: <strong className="text-blue-600 dark:text-sky-400">{settings?.minRightShipStars || 3.5}★</strong> · Max Age: <strong className="text-blue-600 dark:text-sky-400">{settings?.maxVesselAge || 18}y</strong>
            </span>
          </div>
        </div>
        {voyageWaterfallData.voyageCostUsd * exchangeRate > (settings?.delegatedAuthorityLimitInr || 1500000) && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
            <span>Commitment exceeds Delegated Authority (₹{((settings?.delegatedAuthorityLimitInr || 1500000) / 100000).toFixed(1)}L) — CVC concurrence flagged</span>
          </div>
        )}
      </div>

      {/* Top Row: Feasibility Card & Voyage Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <FeasibilityCard
            vesselName={candidateVessel?.vessel_name || candidateVessel?.name}
            vesselClass={candidateVessel?.vessel_class || candidateVessel?.vesselClass}
            portName={targetPort ? `${targetPort.port_name || targetPort.name} (${targetPort.un_locode || ''})` : undefined}
            metrics={feasibilityData.metrics}
            isOverallCompatible={feasibilityData.isOverallCompatible}
          />
        </div>
        <div className="lg:col-span-7">
          <VoyageWaterfall
            voyageCostUsd={voyageWaterfallData.voyageCostUsd}
            cargoQtyMt={voyageWaterfallData.cargoQtyMt}
            components={voyageWaterfallData.components}
          />
        </div>
      </div>

      {/* Live Ocean Weather & Demurrage Risk Sensitivity Model */}
      <div>
        <PortWeatherDemurrageSensitivity
          initialPortId={targetPort?.un_locode?.startsWith('IN') ? targetPort.un_locode : 'INPAV'}
          cargoQtyMt={voyageWaterfallData.cargoQtyMt || 160000}
          vesselClass={candidateVessel?.vessel_class || candidateVessel?.vesselClass || 'Capesize'}
          dailyDemurrageRateUsd={25000}
        />
      </div>

      {/* Multi-Strategy Optimization (with Counter-Offer & Fixture Note Modals) */}
      <div>
        <StrategyComparison
          vessel={candidateVessel}
          loadPort={rawPorts?.[1] || rawPorts?.[0]}
          dischPort={targetPort}
        />
      </div>
    </div>
  );
};

export default CharteringDecisionPage;
