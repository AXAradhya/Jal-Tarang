import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  liveFeedsApi,
  dataApi,
  systemApi,
  configApi,
  forecastApi,
} from '../../api';
import { queryKeys } from '../../api/queryKeys';
import {
  RefreshCw,
  Waves,
  DollarSign,
  TrendingUp,
  Anchor,
  Globe,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Database,
  Calculator,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Loader2,
  Ship,
} from 'lucide-react';
import { useLiveStatus } from '../../hooks/useLiveStatus';

type TabType = 'sources' | 'weather' | 'commodities' | 'calculator' | 'ports' | 'trade' | 'lineage';

const DataPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isSystemLive, isBrowserOnline } = useLiveStatus();
  const [activeTab, setActiveTab] = useState<TabType>('sources');
  const [syncingSource, setSyncingSource] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Landed cost calculator state
  const [calcFreightRate, setCalcFreightRate] = useState<number>(12.5);
  const [calcTonnage, setCalcTonnage] = useState<number>(150000);

  // Queries
  const { data: feedStatusData, isLoading: feedStatusLoading } = useQuery({
    queryKey: ['liveFeeds', 'status'],
    queryFn: () => liveFeedsApi.getStatus(),
    staleTime: 30_000,
  });

  const { data: marineWeatherData, isLoading: weatherLoading } = useQuery({
    queryKey: ['liveFeeds', 'marineWeather'],
    queryFn: () => liveFeedsApi.getMarineWeather(),
    staleTime: 60_000,
  });

  const { data: commoditiesData, isLoading: commoditiesLoading } = useQuery({
    queryKey: ['liveFeeds', 'commodities'],
    queryFn: () => liveFeedsApi.getCommodities(),
    staleTime: 60_000,
  });

  const { data: fxData, isLoading: fxLoading } = useQuery({
    queryKey: ['liveFeeds', 'fx', calcFreightRate, calcTonnage],
    queryFn: () => liveFeedsApi.getFxRates({ freightRateUsd: calcFreightRate, cargoTonnageMt: calcTonnage }),
    staleTime: 60_000,
  });

  const { data: portLogisticsData, isLoading: portsLoading } = useQuery({
    queryKey: ['liveFeeds', 'portLogistics'],
    queryFn: () => liveFeedsApi.getPortLogistics(),
    staleTime: 120_000,
  });

  const { data: tradeFlowsData, isLoading: tradeLoading } = useQuery({
    queryKey: ['liveFeeds', 'tradeFlows'],
    queryFn: () => liveFeedsApi.getTradeFlows(),
    staleTime: 120_000,
  });

  const { data: qualityData, isLoading: qualityLoading } = useQuery({
    queryKey: queryKeys.data.quality,
    queryFn: () => dataApi.quality(),
    staleTime: 60_000,
  });

  const { data: healthData } = useQuery({
    queryKey: queryKeys.system.health,
    queryFn: () => systemApi.health(),
    staleTime: 30_000,
  });

  const { data: uiConfig } = useQuery({
    queryKey: queryKeys.config.ui,
    queryFn: () => configApi.getUiConfig(),
    staleTime: 300_000,
  });

  const { data: rawModels } = useQuery({
    queryKey: queryKeys.forecasts.models,
    queryFn: async () => {
      const res = await forecastApi.models();
      return Array.isArray(res) ? res : (res as any)?.data || [];
    },
    staleTime: 120_000,
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: (source: string) => liveFeedsApi.triggerSync(source),
    onMutate: (source) => {
      setSyncingSource(source);
      setSyncFeedback(null);
    },
    onSuccess: (_, source) => {
      queryClient.invalidateQueries({ queryKey: ['liveFeeds'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.data.quality });
      setSyncingSource(null);
      setSyncFeedback(`Successfully synchronized live feed: ${source.toUpperCase()}`);
      setTimeout(() => setSyncFeedback(null), 4000);
    },
    onError: (err: any) => {
      setSyncingSource(null);
      setSyncFeedback(`Sync failed: ${err?.message || 'Network error'}`);
      setTimeout(() => setSyncFeedback(null), 4000);
    },
  });

  const handleSync = (source: string = 'all') => {
    syncMutation.mutate(source);
  };

  const feeds = feedStatusData?.feeds || [];
  const ports = marineWeatherData || [];
  const pinkSheet = commoditiesData?.worldBankPinkSheet || [];
  const balticIndices = commoditiesData?.balticFreightIndices || [];
  const fredSeries = commoditiesData?.fredSeries || [];
  const portBenchmarks = portLogisticsData?.ports || [];
  const plantDemands = portLogisticsData?.sailPlantDemands || [];
  const tradeFlows = tradeFlowsData?.unComtradeBilateralFlows || [];
  const routeCalibrations = tradeFlowsData?.routeCalibrations || [];
  const qualityScores = qualityData?.scores || [];
  const lineageStages = uiConfig?.lineageStages || [];
  const models = rawModels || [];

  const dbOnline =
    healthData?.database === 'connected' ||
    (healthData as any)?.database?.status === 'CONNECTED' ||
    healthData?.status === 'OK' ||
    healthData?.status === 'HEALTHY';

  const liveUsdInr = fxData?.rates?.inr ?? 95.88;
  const landedCalc = fxData?.landedCostCalculator;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header & Value Proposition Banner ────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-xl border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                100% Free Public APIs · Zero Vendor Lock-in
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Sparkles size={11} />
                Govt of India & Open Portals
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Open Data & Live Feeds Command Center
            </h1>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl leading-relaxed">
              Live maritime data mesh orchestrating real-time telemetry, ocean weather, foreign exchange, commodity benchmarks, and Indian major port infrastructure without commercial subscription costs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col text-right pr-3 border-r border-indigo-800/50">
              <div className="text-[10px] text-indigo-300 uppercase font-semibold">Estimated Cost Savings</div>
              <div className="text-lg font-black text-emerald-400">~$48,000 / yr</div>
              <div className="text-[9px] text-indigo-300/60">vs Clarksons / Bloomberg SIN</div>
            </div>

            <button
              onClick={() => handleSync('all')}
              disabled={syncMutation.isPending}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncMutation.isPending && syncingSource === 'all' ? 'animate-spin' : ''} />
              <span>{syncMutation.isPending && syncingSource === 'all' ? 'Syncing Feeds…' : 'Sync All Feeds'}</span>
            </button>
          </div>
        </div>

        {/* Live sync notification toast */}
        {syncFeedback && (
          <div className="mt-4 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* ─── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'sources' as TabType, label: 'Live Data Portals (8)', icon: Globe },
          { id: 'weather' as TabType, label: 'Ocean & Cyclone Radar', icon: Waves },
          { id: 'commodities' as TabType, label: 'Commodity Benchmarks', icon: TrendingUp },
          { id: 'calculator' as TabType, label: 'Live FX & Landed Cost (₹)', icon: Calculator },
          { id: 'ports' as TabType, label: 'Indian Ports & SAIL Demand', icon: Anchor },
          { id: 'trade' as TabType, label: 'Bilateral Flows (UN Comtrade)', icon: Ship },
          { id: 'lineage' as TabType, label: 'Pipeline Lineage & DB Quality', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg font-semibold transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: ALL LIVE SOURCES GRID ───────────────────────────────────── */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Real-Time Feeds & Portals</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connected zero-cost APIs, official portals, and public-domain datasets
              </p>
            </div>
            <div className="text-[11px] text-slate-400">
              Auto-polled via background Ingestion Engine
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {feedStatusLoading ? (
              <div className="col-span-4 p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Loading public data portals…</span>
              </div>
            ) : (
              feeds.map((feed: any) => {
                const isSyncing = syncingSource === feed.id || (syncingSource === 'all' && syncMutation.isPending);
                return (
                  <div
                    key={feed.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {feed.category}
                        </span>
                        {isSyncing ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            <Loader2 size={10} className="animate-spin" />
                            <span>SYNCING</span>
                          </div>
                        ) : !isBrowserOnline ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>OFFLINE</span>
                          </div>
                        ) : isSystemLive && feed.status === 'LIVE' ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>LIVE</span>
                          </div>
                        ) : feed.status === 'STANDBY' ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>STANDBY</span>
                          </div>
                        ) : feed.status === 'CACHED' || feed.status === 'ACTIVE' ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>CACHED</span>
                          </div>
                        ) : feed.status === 'DEGRADED' ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>DEGRADED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>OFFLINE</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                        {feed.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {feed.description}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2 text-[10px]">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Access:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{feed.accessType}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Cadence:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{feed.cadence}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Records:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{feed.records}</span>
                      </div>

                      <button
                        onClick={() => handleSync(feed.id)}
                        disabled={isSyncing}
                        className="w-full mt-2 py-1.5 px-3 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 text-[11px]"
                      >
                        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                        <span>{isSyncing ? 'Syncing…' : 'Sync Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: OCEAN & CYCLONE RADAR ───────────────────────────────────── */}
      {activeTab === 'weather' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Port Ocean Weather & Cyclone Warnings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live Open-Meteo Marine wave heights & India Meteorological Department (IMD) port danger signals
              </p>
            </div>
            <button
              onClick={() => handleSync('weather')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
            >
              <RefreshCw size={12} />
              <span>Refresh Marine Weather</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3 text-left">Port Name</th>
                    <th className="px-4 py-3 text-right">Wave Height</th>
                    <th className="px-4 py-3 text-right">Swell Height</th>
                    <th className="px-4 py-3 text-right">Wind Speed</th>
                    <th className="px-4 py-3 text-left">IMD Danger Signal</th>
                    <th className="px-4 py-3 text-left">Operational Impact</th>
                    <th className="px-4 py-3 text-left">Port Authority Notice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {weatherLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        <Loader2 size={16} className="animate-spin inline mr-2" />
                        Fetching live port conditions…
                      </td>
                    </tr>
                  ) : (
                    ports.map((port: any) => {
                      const isSwell = port.operationalImpact === 'SWELL_RESTRICTIONS';
                      return (
                        <tr key={port.portId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <Anchor size={14} className="text-indigo-600 shrink-0" />
                              <span>{port.portName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Lat {port.latitude}°, Lon {port.longitude}°
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            <span className={port.waveHeightM > 2.0 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}>
                              {port.waveHeightM} m
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            {port.swellHeightM} m
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            {port.windSpeedKnots} kts
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {port.dangerSignalText}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isSwell
                                  ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {port.operationalImpact}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                            {port.portAuthorityNotice}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: COMMODITY BENCHMARKS ────────────────────────────────────── */}
      {activeTab === 'commodities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Authoritative Commodity Benchmarks & Freight Indices</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ingested from World Bank "Pink Sheet" Open Data & Baltic Exchange Ground Truth
              </p>
            </div>
            <button
              onClick={() => handleSync('commodities')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
            >
              <RefreshCw size={12} />
              <span>Refresh Benchmarks</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {commoditiesLoading ? (
              <div className="col-span-4 p-8 text-center text-slate-400">Loading commodity price benchmarks…</div>
            ) : (
              pinkSheet.map((item: any) => (
                <div key={item.commodityCode} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                    {item.source}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1 mb-2">
                    {item.commodityName}
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    ${item.priceUsd?.toFixed(2)}
                    <span className="text-xs font-normal text-slate-400 ml-1">/{item.unit}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                    <span>Verified Benchmark</span>
                    <span>{item.observationDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Baltic Exchange Real Ground Truth Indices
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {balticIndices.map((idx: any) => (
                <div key={idx.indexCode} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">{idx.indexCode}</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{idx.description}</div>
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                    {idx.value} <span className="text-xs font-normal text-slate-400">{idx.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: LIVE FX & LANDED COST CALCULATOR ──────────────────────────── */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Frankfurter / European Central Bank Feed
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                Live USD $\leftrightarrow$ INR Currency Converter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dynamic conversion engine translating international freight contracts ($/MT) into landed cost (₹/MT).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
              <div className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                Official Today's Rate
              </div>
              <div className="text-3xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1">
                ₹{liveUsdInr.toFixed(2)}
                <span className="text-xs font-medium text-indigo-500 ml-1.5">per 1 USD</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Source: European Central Bank (100% Free / No Key)</div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ocean Freight Rate (USD / MT):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calcFreightRate}
                  onChange={(e) => setCalcFreightRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cargo Parcel Tonnage (Metric Tonnes):
                </label>
                <input
                  type="number"
                  step="5000"
                  value={calcTonnage}
                  onChange={(e) => setCalcTonnage(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Landed Cost Breakdown (₹/MT vs $/MT)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Real-time computation combining ocean freight and port discharge handling
              </p>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Ocean Freight in INR</div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    ₹{landedCalc?.freightPerMtInr?.toLocaleString('en-IN') || '—'} <span className="text-xs font-normal">/ MT</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">@ ${calcFreightRate} × ₹{liveUsdInr}</div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Port Handling & Stevedoring</div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    ₹{landedCalc?.portHandlingPerMtInr?.toLocaleString('en-IN') || 560} <span className="text-xs font-normal">/ MT</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Standard East Coast Major Port dues</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Total Landed Freight Cost:
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                    ₹{landedCalc?.totalLandedFreightPerMtInr?.toLocaleString('en-IN')} / MT
                  </span>
                </div>

                <div className="border-t border-emerald-200 dark:border-emerald-800/80 pt-2 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400">Total Voyage Outlay (INR):</span>
                  <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200">
                    ₹{((landedCalc?.totalVoyageOutlayInr || 0) / 10000000).toFixed(2)} Crores
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400">Total Voyage Outlay (USD):</span>
                  <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200">
                    ${((landedCalc?.totalVoyageOutlayUsd || 0) / 1000000).toFixed(3)} Million USD
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-[11px] text-slate-400 text-right">
              Powered by Live Frankfurter ECB Ingestion Service
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: INDIAN PORTS & SAIL DEMAND ───────────────────────────────── */}
      {activeTab === 'ports' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Indian Major Ports Operational Infrastructure</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official benchmarks from Data.gov.in & Indian Ports Association (IPA Sagarmala)
              </p>
            </div>
            <button
              onClick={() => handleSync('datagov')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
            >
              <RefreshCw size={12} />
              <span>Sync IPA Port Data</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3 text-left">Port Name</th>
                    <th className="px-4 py-3 text-right">Permissible Draught</th>
                    <th className="px-4 py-3 text-right">Handling Rate</th>
                    <th className="px-4 py-3 text-right">Turnaround Time (TRT)</th>
                    <th className="px-4 py-3 text-right">Pre-Berthing Wait</th>
                    <th className="px-4 py-3 text-right">Rake Evacuation</th>
                    <th className="px-4 py-3 text-left">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {portBenchmarks.map((b: any) => (
                    <tr key={b.portId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <Anchor size={14} className="text-indigo-600 shrink-0" />
                          <span>{b.portName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.unLocode} · {b.berthCount} Berths</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {b.maxDraughtM} m
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {b.mechanicalHandlingRateMtDay?.toLocaleString()} MT/day
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {b.averageTurnaroundHours} hrs
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {b.preBerthingWaitHours} hrs
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold">
                        {b.rakeEvacuationPerDay} rakes/day
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Ministry of Steel — SAIL Steel Plant Consumption Allocations (~16.8 MTPA Total)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Steel Authority of India Limited plant coking coal requirements & stock buffers
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {plantDemands.map((plant: any) => (
                <div key={plant.plantCode} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-indigo-600">{plant.plantCode}</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{plant.plantName}</div>
                  <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1">
                    {plant.annualDemandMtpa} <span className="text-xs font-normal text-slate-400">MTPA</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 space-y-1">
                    <div>Port: <span className="font-semibold text-slate-700 dark:text-slate-300">{plant.primaryPort}</span></div>
                    <div>Stock: <span className="font-bold text-emerald-600">{plant.currentStockDays}d</span> / {plant.targetStockDays}d</div>
                    <div>Rakes: <span className="font-semibold">{plant.railRakesRequiredDaily} / day</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: BILATERAL FLOWS (UN COMTRADE) ────────────────────────────── */}
      {activeTab === 'trade' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">UN Comtrade Bilateral Bulk Cargo Trade Flows</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                HS Code 270112 (Bituminous Coking Coal) Queensland, Australia $\rightarrow$ East Coast India
              </p>
            </div>
            <button
              onClick={() => handleSync('uncomtrade')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
            >
              <RefreshCw size={12} />
              <span>Sync UN Comtrade</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3 text-left">Period</th>
                    <th className="px-4 py-3 text-left">Origin Hub (Australia)</th>
                    <th className="px-4 py-3 text-left">Destination (India)</th>
                    <th className="px-4 py-3 text-right">Volume (MT)</th>
                    <th className="px-4 py-3 text-right">CIF Value (USD)</th>
                    <th className="px-4 py-3 text-right">Unit Landed Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tradeFlows.map((flow: any) => (
                    <tr key={flow.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">{flow.period}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{flow.originPortHub}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{flow.destinationPortHub}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {flow.volumeMetricTonnes?.toLocaleString()} MT
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        ${(flow.tradeValueUsd / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                        ${flow.unitValueUsdPerMt?.toFixed(2)} / MT
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              NOAA MarineCadastre & Kaggle Route Calibrations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Empirical speed, duration, and bunker consumption distributions calibrated against thousands of historic AIS voyages
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routeCalibrations.map((route: any) => (
                <div key={route.routeCode} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-indigo-600">{route.routeCode}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      {route.vesselClass}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    {route.originPort} → {route.destinationPort}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>Distance: <span className="font-bold text-slate-800 dark:text-slate-200">{route.distanceNauticalMiles} NM</span></div>
                    <div>Avg Transit: <span className="font-bold text-indigo-600">{route.averageTransitDays} days</span></div>
                    <div>Bunker: <span className="font-bold text-slate-800 dark:text-slate-200">{route.bunkerConsumptionPerDayMt} MT/day</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 7: PIPELINE LINEAGE & DB QUALITY ────────────────────────────── */}
      {activeTab === 'lineage' && (
        <div className="space-y-6">
          {/* DB Status Banner */}
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs ${
            dbOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
          }`}>
            {dbOnline ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-amber-500" />}
            <span className="font-bold">Database Connectivity:</span>
            <span>{dbOnline ? 'ONLINE — Enterprise PostgreSQL Active & Live Fallback Ingestions Running' : 'Development Fallback Proxy Connected'}</span>
            <span className="ml-auto font-mono text-[10px]">
              {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString('en-IN') : '—'}
            </span>
          </div>

          {/* End-to-End Data Lineage Diagram */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">End-to-End Data Lineage & Pipeline Progression</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Free Source APIs → Ingestion Workers → Feature Store → Forecast Models → Decision Engine → Charter Fixture
              </p>
            </div>
            <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
              {lineageStages.map((stage: any, idx: number) => (
                <React.Fragment key={stage.id}>
                  <div className="flex-1 min-w-[130px]">
                    <div className="border rounded-lg p-3 h-full" style={{ borderColor: `${stage.color}40`, backgroundColor: `${stage.color}08` }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: stage.color }}>
                        {stage.label}
                      </p>
                      {stage.items.map((item: string) => (
                        <p key={item} className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">• {item}</p>
                      ))}
                    </div>
                  </div>
                  {idx < lineageStages.length - 1 && (
                    <div className="flex items-center px-1 flex-shrink-0">
                      <div className="text-slate-300 dark:text-slate-600 text-lg">→</div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Quality Scorecard */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Live Data Quality Scorecard</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time quality metrics evaluating completeness, timeliness, and outlier anomalies across tables
              </p>
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                  {['Data Source', 'Records (DB)', 'Completeness', 'Timeliness', 'Accuracy', 'Outlier Rate', 'Overall'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {qualityScores.map((row: any, i: number) => {
                  const overall = row.recordCount > 0 ? (row.completeness + row.timeliness + row.accuracy) / 3 : 0;
                  const hasData = row.recordCount > 0;
                  return (
                    <tr key={i} className={`border-b border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{row.source}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <span className={`font-bold ${hasData ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {row.recordCount > 0 ? row.recordCount : '0 (Cached)'}
                        </span>
                      </td>
                      {[row.completeness, row.timeliness, row.accuracy].map((v, j) => (
                        <td key={j} className="px-3 py-2 text-right tabular-nums">
                          <span className={!hasData ? 'text-slate-300' : v >= 95 ? 'text-emerald-600' : v >= 85 ? 'text-amber-500' : 'text-red-500'}>
                            {v.toFixed(1)}%
                          </span>
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right tabular-nums">
                        <span className={!hasData ? 'text-slate-300' : row.outlierRate < 1 ? 'text-emerald-600' : 'text-amber-500'}>
                          {row.outlierRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <span className={`font-bold ${!hasData ? 'text-slate-300' : overall >= 95 ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {overall.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataPage;
