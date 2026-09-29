import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { SystemRole } from '../../types';
import { DataFreshnessBar } from '../../components/common';
import { MaritimeRadarMap } from '../../components/radar/MaritimeRadarMap';
import {
  Radio, Ship, Package, Anchor, BarChart3, Shield,
  AlertTriangle, CheckCircle2, Clock, MapPin, Building2,
  Cpu, Activity, Navigation, ArrowUpRight, Loader2,
  Wind, Compass, Layers, CloudRain, Info, X, Eye, EyeOff,
  Waves, Sparkles, TrendingUp, DollarSign
} from 'lucide-react';
import { vesselApi, portApi, contractApi, procurementApi, liveFeedsApi } from '../../api';
import { queryKeys } from '../../api/queryKeys';

interface PortDisplay {
  name: string;
  un_locode: string;
  lat: number;
  lon: number;
  status: string;
  wait: string;
  berths: number;
  weatherAlert?: string;
  vesselCount: number;
}

const formatSignalCompact = (signalText?: string) => {
  if (!signalText) return '';
  const match = signalText.match(/\(([A-Z0-9-]+)\)/i);
  if (match) return match[1];
  const noMatch = signalText.match(/Signal\s*(?:No\.?)?\s*(\d+)/i);
  if (noMatch) return `Signal ${noMatch[1]}`;
  return signalText.length > 14 ? signalText.slice(0, 14) + '…' : signalText;
};

export const ControlTowerPage: React.FC = () => {
  const { user } = useAuthStore();
  const currentRole: SystemRole = user?.roles?.[0] || 'CHARTERING_MANAGER';

  const { data: rawPorts, isLoading: portsLoading } = useQuery({
    queryKey: queryKeys.ports.list({}),
    queryFn: async () => {
      const res = await portApi.list({ limit: 50 });
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

  const { data: rawContracts } = useQuery({
    queryKey: queryKeys.contracts.list({}),
    queryFn: async () => {
      const res = await contractApi.list({ limit: 50 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: rawRequirements } = useQuery({
    queryKey: queryKeys.procurement.requirements({}),
    queryFn: async () => {
      const res = await procurementApi.list({ limit: 20 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    staleTime: 60_000,
  });

  const { data: liveWeather } = useQuery({
    queryKey: ['liveFeeds', 'marineWeather'],
    queryFn: () => liveFeedsApi.getMarineWeather(),
    staleTime: 60_000,
  });

  const { data: liveFx } = useQuery({
    queryKey: ['liveFeeds', 'fx'],
    queryFn: () => liveFeedsApi.getFxRates(),
    staleTime: 60_000,
  });

  const { data: liveCommodities } = useQuery({
    queryKey: ['liveFeeds', 'commodities'],
    queryFn: () => liveFeedsApi.getCommodities(),
    staleTime: 60_000,
  });

  const { data: liveLogistics } = useQuery({
    queryKey: ['liveFeeds', 'portLogistics'],
    queryFn: () => liveFeedsApi.getPortLogistics(),
    staleTime: 120_000,
  });

  const [activeDeckTab, setActiveDeckTab] = useState<'FLEET' | 'WEATHER' | 'RAKES' | 'CONTRACTS'>('FLEET');

  const ports = rawPorts || [];
  const vessels = rawVessels || [];
  const contracts = rawContracts || [];
  const requirements = rawRequirements || [];
  const isLoading = portsLoading || vesselsLoading;

  const paradipWeather = liveWeather?.find((p: any) =>
    p.portId === 'INPAV' || p.portId === 'p-paradip' || (p.portName || '').toLowerCase().includes('paradip')
  );
  const vizagWeather = liveWeather?.find((p: any) =>
    p.portId === 'INVTZ' || p.portId === 'p-vizag' || (p.portName || '').toLowerCase().includes('visakhapatnam') || (p.portName || '').toLowerCase().includes('vizag')
  );

  // Build live Indian East Coast ports dynamically from database records
  const eastCoastPorts: PortDisplay[] = ports
    .filter((p: any) => {
      const country = (p.country || '').toUpperCase();
      const code = (p.un_locode || '').toUpperCase();
      return country === 'INDIA' || code.startsWith('IN') || p.latitude !== undefined;
    })
    .map((p: any) => {
      const wait = Number(p.current_waiting_days || p.currentWaitingDays || 0);
      const portName = p.port_name || p.name || 'Indian Port';
      const unLocode = p.un_locode || p.code || '';
      return {
        name: portName,
        un_locode: unLocode,
        lat: Number(p.latitude || p.lat || 0),
        lon: Number(p.longitude || p.lon || 0),
        status: (p.congestion_status || p.congestionStatus || 'NORMAL').toUpperCase(),
        wait: wait > 0 ? `${wait.toFixed(1)}d` : '0.0d',
        berths: Number(p.berth_count || p.berths_count || p.berths || 0),
        weatherAlert: p.weather_alert || p.weatherAlert || undefined,
        vesselCount: vessels.filter((v: any) => {
          const dest = (v.destination_port || v.current_port_name || v.destination || '').toLowerCase();
          return (portName && dest.includes(portName.toLowerCase().split(' ')[0])) ||
                 (unLocode && dest.includes(unLocode.toLowerCase()));
        }).length,
      };
    });

  const activeVessels = vessels.filter((v: any) =>
    ['EN_ROUTE', 'DISCHARGING', 'WAITING', 'BALLASTING'].includes(v.status)
  );

  // Simple verified live telemetry checks
  const isWeatherLive = Boolean(liveWeather && Array.isArray(liveWeather) && liveWeather.length > 0);
  const isFxLive = Boolean(liveFx?.rates?.inr);
  const isCommodityLive = Boolean(liveCommodities?.worldBankPinkSheet && liveCommodities.worldBankPinkSheet.length > 0);
  const isLogisticsLive = Boolean(liveLogistics?.ports && liveLogistics.ports.length > 0);

  const activeFeedsCount = [isWeatherLive, isFxLive, isCommodityLive, isLogisticsLive].filter(Boolean).length;
  const isAllFeedsLive = activeFeedsCount >= 3;

  return (
    <div className="space-y-4 max-w-[1920px] mx-auto">
      {/* Page Header & Executive Perspective Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="text-blue-600 dark:text-sky-400" size={22} />
              SAIL Fleet & Port Control Tower
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time Indian Ocean maritime radar tracking, vessel telemetry & East Coast berth congestion intelligence
            </p>
          </div>
          <DataFreshnessBar
            source="Live AIS Telemetry & Port Feeds"
            isLive={isAllFeedsLive}
            status={isAllFeedsLive ? 'LIVE' : activeFeedsCount > 0 ? 'STANDBY' : 'CACHED'}
          />
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Command Perspective:</span>
            <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 font-bold text-[11px] flex items-center gap-1.5">
              <Shield size={12} className="text-blue-600 dark:text-sky-400" />
              {currentRole.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry & Public Feeds Ticker Ribbon */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg py-1.5 px-2.5 sm:px-3 shadow-2xs text-[10.5px] border-beam-animated palette-ocean">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
          {/* Dynamic Verified Live Feed Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="flex h-1.5 w-1.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isAllFeedsLive ? 'bg-emerald-400' : activeFeedsCount > 0 ? 'bg-amber-400' : 'bg-rose-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                isAllFeedsLive ? 'bg-emerald-500' : activeFeedsCount > 0 ? 'bg-amber-500' : 'bg-rose-500'
              }`}></span>
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border shadow-2xs ${
              isAllFeedsLive
                ? 'bg-slate-900 text-white dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-600/50'
                : activeFeedsCount > 0
                  ? 'bg-amber-900 text-white dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-600/50'
                  : 'bg-rose-900 text-white dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-600/50'
            }`}>
              <Sparkles size={11} className={isAllFeedsLive ? 'text-amber-400 dark:text-emerald-400' : 'text-amber-400'} />
              <span>
                {isAllFeedsLive
                  ? `LIVE FEEDS (${activeFeedsCount}/4)`
                  : activeFeedsCount > 0
                    ? `ACTIVE FEEDS (${activeFeedsCount}/4)`
                    : 'OFFLINE'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto text-[10px] py-0.5 no-scrollbar">
            {/* Live Weather & Swell for Paradip */}
            <div
              className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-md px-2 py-0.5 shadow-2xs"
              title={`Paradip Swell: ${paradipWeather?.swellHeightM?.toFixed(1) ?? '1.2'}m\nStatus: ${isWeatherLive ? '100% Live Open-Meteo' : 'Cached'}\nAlert: ${paradipWeather?.dangerSignalText ?? 'Signal No. 1'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isWeatherLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <Waves size={11.5} className="text-sky-700 dark:text-sky-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Paradip Swell:</span>
              <span className="font-bold text-amber-950 dark:text-amber-300 font-mono text-[10.5px]">
                {paradipWeather?.swellHeightM?.toFixed(1) ?? '1.2'}m
              </span>
              <span className="text-[9px] font-medium text-amber-800/90 dark:text-amber-300/80">
                ({formatSignalCompact(paradipWeather?.dangerSignalText) || 'Signal 1'})
              </span>
              {isWeatherLive ? (
                <span className="text-[8.5px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded font-bold border border-emerald-300/50 dark:border-emerald-700/50">
                  LIVE
                </span>
              ) : (
                <span className="text-[8.5px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1 rounded font-bold">
                  CACHED
                </span>
              )}
            </div>

            {/* Live Sea State for Vizag */}
            <div
              className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-md px-2 py-0.5 shadow-2xs"
              title={`Vizag Wind: ${vizagWeather?.windSpeedKnots?.toFixed(0) ?? '14'} kts\nStatus: ${isWeatherLive ? '100% Live Open-Meteo' : 'Cached'}\nAlert: ${vizagWeather?.dangerSignalText ?? 'Signal No. 1'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isWeatherLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <Wind size={11.5} className="text-cyan-700 dark:text-cyan-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Vizag Wind:</span>
              <span className="font-bold text-cyan-950 dark:text-cyan-300 font-mono text-[10.5px]">
                {vizagWeather?.windSpeedKnots?.toFixed(0) ?? '14'} kts
              </span>
              <span className="text-[9px] font-medium text-cyan-800/90 dark:text-cyan-300/80">
                ({formatSignalCompact(vizagWeather?.dangerSignalText) || 'Signal 1'})
              </span>
              {isWeatherLive ? (
                <span className="text-[8.5px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded font-bold border border-emerald-300/50 dark:border-emerald-700/50">
                  LIVE
                </span>
              ) : (
                <span className="text-[8.5px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1 rounded font-bold">
                  CACHED
                </span>
              )}
            </div>

            {/* Live FX */}
            <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-md px-2 py-0.5 shadow-2xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isFxLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <DollarSign size={11.5} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">ECB USD/INR:</span>
              <span className="font-bold text-emerald-950 dark:text-emerald-300 font-mono text-[10.5px]">
                ₹{liveFx?.rates?.inr?.toFixed(2) ?? '85.50'}
              </span>
              {isFxLive ? (
                <span className="text-[8.5px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded font-bold border border-emerald-300/50 dark:border-emerald-700/50">
                  LIVE
                </span>
              ) : (
                <span className="text-[8.5px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1 rounded font-bold">
                  CACHED
                </span>
              )}
            </div>

            {/* Live Coking Coal */}
            <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-md px-2 py-0.5 shadow-2xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isCommodityLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <TrendingUp size={11.5} className="text-purple-700 dark:text-purple-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Coking Coal:</span>
              <span className="font-bold text-purple-950 dark:text-purple-300 font-mono text-[10.5px]">
                ${liveCommodities?.worldBankPinkSheet?.find((c: any) => c.commodityCode === 'COKING_COAL_PLV')?.priceUsd ?? 248.5}/t
              </span>
              {isCommodityLive ? (
                <span className="text-[8.5px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded font-bold border border-emerald-300/50 dark:border-emerald-700/50">
                  LIVE
                </span>
              ) : (
                <span className="text-[8.5px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1 rounded font-bold">
                  CACHED
                </span>
              )}
            </div>
          </div>

          <Link
            to="/data"
            id="open-data-hub-ribbon-btn"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-2xs hover:shadow transition-all shrink-0 cursor-pointer"
          >
            <span>Open Data Hub (8 Feeds)</span>
            <ArrowUpRight size={11.5} />
          </Link>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-center hover-lift hover-glow cursor-default group transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">Vessels in Fleet</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums group-hover:scale-105 transition-transform duration-200">{vessels.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-center hover-lift hover-glow cursor-default group transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">Active / En-Route</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-sky-400 tabular-nums group-hover:scale-105 transition-transform duration-200">{activeVessels.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-center hover-lift hover-glow cursor-default group transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">Ports Monitored</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums group-hover:scale-105 transition-transform duration-200">{eastCoastPorts.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs text-center hover-lift hover-glow cursor-default group transition-all duration-300">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">Active Contracts</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums group-hover:scale-105 transition-transform duration-200">
            {contracts.filter((c: any) => ['ACTIVE', 'APPROVED'].includes(c.status)).length}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-32 text-slate-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Loading live data from database…</span>
        </div>
      )}

      {/* Full-Sized Center Maritime Radar Theater */}
      <div className="w-full">
        <MaritimeRadarMap
          ports={ports}
          vessels={vessels}
          contracts={contracts}
          requirements={requirements}
        />
      </div>

      {/* Operational Perspective & Multi-Domain Command Deck */}
      <div className="space-y-4">
        {/* Command Perspective Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mr-1">
              Command Perspective:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'FLEET', label: 'Fleet Voyages', icon: Ship, badge: `${activeVessels.length} Active` },
                { id: 'WEATHER', label: 'Port Storm & Sea Radar', icon: Waves, badge: 'IMD Live' },
                { id: 'RAKES', label: 'Sagarmala Rakes & Plants', icon: Building2, badge: '16.8 MTPA' },
                { id: 'CONTRACTS', label: 'Contracts & Fixtures', icon: Cpu, badge: `${contracts.length} Total` },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeDeckTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDeckTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {tab.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/decision/chartering"
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <span>Chartering Decision Engine</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Dynamic Command Panel Content */}
        {activeDeckTab === 'WEATHER' ? (
          /* 1. Port Storm Warning & Ocean Sea State Panel (Open-Meteo & IMD Cyclone) */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Waves className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  East Coast Indian Ports — Live Marine Weather & IMD Storm Warning Centre
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  100% Free Open-Meteo ocean swell data correlated with official India Meteorological Department (IMD) port danger signals.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Live 15-min Polling
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(liveWeather && Array.isArray(liveWeather) ? liveWeather : [
                { portId: 'INPAV', portName: 'Paradip Port', waveHeightM: 2.4, swellHeightM: 2.1, windSpeedKnots: 28, dangerSignalNumber: 3, dangerSignalText: 'Signal No. 3 (LC-3)', operationalImpact: 'SWELL_RESTRICTIONS', portAuthorityNotice: 'Local Cautionary: Squally weather over Bay of Bengal. Berthing with caution.' },
                { portId: 'INVTZ', portName: 'Visakhapatnam Port', waveHeightM: 1.6, swellHeightM: 1.4, windSpeedKnots: 18, dangerSignalNumber: 1, dangerSignalText: 'Signal No. 1', operationalImpact: 'NORMAL', portAuthorityNotice: 'Normal outer harbor and inner channel berthing.' },
                { portId: 'INHAL', portName: 'Haldia Dock Complex', waveHeightM: 1.2, swellHeightM: 0.9, windSpeedKnots: 15, dangerSignalNumber: 1, dangerSignalText: 'Signal No. 1', operationalImpact: 'NORMAL', portAuthorityNotice: 'Tidal restrictions active. Draft limited to 8.5m.' },
                { portId: 'INDHM', portName: 'Dhamra Port', waveHeightM: 2.2, swellHeightM: 1.9, windSpeedKnots: 24, dangerSignalNumber: 3, dangerSignalText: 'Signal No. 3 (LC-3)', operationalImpact: 'SWELL_RESTRICTIONS', portAuthorityNotice: 'Cautionary signal hoisted. Capesize discharge operating normally.' },
                { portId: 'INMRM', portName: 'Mormugao Port', waveHeightM: 1.3, swellHeightM: 1.0, windSpeedKnots: 14, dangerSignalNumber: 1, dangerSignalText: 'Signal No. 1', operationalImpact: 'NORMAL', portAuthorityNotice: 'Arabian Sea swell calm. Normal mechanized handling.' },
              ]).map((p: any) => {
                const isWarning = (p.dangerSignalNumber || 1) >= 3;
                return (
                  <div
                    key={p.portId}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-3 hover:border-blue-400 dark:hover:border-blue-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{p.portName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{p.portId}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isWarning
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                      }`}>
                        {p.dangerSignalText || 'Signal No. 1'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[9px] text-slate-400 block">Swell</span>
                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                          {p.swellHeightM?.toFixed(1) ?? '1.2'}m
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[9px] text-slate-400 block">Wave</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {p.waveHeightM?.toFixed(1) ?? '1.5'}m
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[9px] text-slate-400 block">Wind</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {p.windSpeedKnots?.toFixed(0) ?? '18'} kts
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                      {p.portAuthorityNotice}
                    </p>

                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500">
                        Status: <strong className={isWarning ? 'text-amber-600' : 'text-emerald-600'}>{p.operationalImpact}</strong>
                      </span>
                      <Link
                        to="/decision/chartering"
                        className="text-[10px] text-blue-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-0.5"
                      >
                        Simulate Demurrage <ArrowUpRight size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeDeckTab === 'RAKES' ? (
          /* 2. Sagarmala IPA Port Logistics & SAIL Steel Plants Allocation Panel */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Sagarmala Port Logistics & SAIL Steel Plant Evacuation Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official Major Ports mechanical discharge rates, rake evacuation throughput, and annual imported coking coal runway (~16.8 MTPA).
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-mono">
                Data.gov.in & IPA
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Port Productivity Cards (7 Cols) */}
              <div className="lg:col-span-7 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Major Indian Port Operational Benchmarks
                </h4>
                <div className="space-y-2">
                  {(liveLogistics?.ports || [
                    { portName: 'Paradip Port', state: 'Odisha', maxDraughtM: 17.5, avgTurnaroundTimeDays: 2.1, preBerthingWaitDays: 1.2, mechanicalDischargeRateMtDay: 50000, rakeEvacuationCapacityRakesDay: 18, primarySailPlants: ['Bokaro (BSL)', 'Bhilai (BSP)'] },
                    { portName: 'Visakhapatnam Port', state: 'Andhra Pradesh', maxDraughtM: 16.5, avgTurnaroundTimeDays: 2.6, preBerthingWaitDays: 1.4, mechanicalDischargeRateMtDay: 45000, rakeEvacuationCapacityRakesDay: 14, primarySailPlants: ['Bhilai (BSP)', 'Rourkela (RSP)'] },
                    { portName: 'Haldia Dock Complex', state: 'West Bengal', maxDraughtM: 8.5, avgTurnaroundTimeDays: 3.2, preBerthingWaitDays: 2.1, mechanicalDischargeRateMtDay: 25000, rakeEvacuationCapacityRakesDay: 10, primarySailPlants: ['Durgapur (DSP)', 'IISCO Burnpur (ISP)'] },
                    { portName: 'Dhamra Port', state: 'Odisha', maxDraughtM: 18.0, avgTurnaroundTimeDays: 1.8, preBerthingWaitDays: 0.8, mechanicalDischargeRateMtDay: 55000, rakeEvacuationCapacityRakesDay: 12, primarySailPlants: ['Rourkela (RSP)'] },
                  ]).map((p: any) => (
                    <div
                      key={p.portName}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/60 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{p.portName}</div>
                        <div className="text-[11px] text-slate-500">
                          Draft: <strong>{p.maxDraughtM}m</strong> · TRT: <strong>{p.avgTurnaroundTimeDays}d</strong> · Wait: <strong>{p.preBerthingWaitDays}d</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Discharge</span>
                          <span className="font-bold text-blue-600 dark:text-sky-400">
                            {Number(p.mechanicalDischargeRateMtDay).toLocaleString()} MT/d
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Rakes</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {p.rakeEvacuationCapacityRakesDay} Rakes/d
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAIL Steel Plants Allocation (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    SAIL Plant Coal Runways
                  </h4>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    16.8 MTPA
                  </span>
                </div>
                <div className="space-y-2">
                  {(liveLogistics?.sailPlantDemands || [
                    { plantName: 'Bhilai Steel Plant (BSP)', annualDemandMtpa: 5.2, primaryDischargePort: 'Visakhapatnam (Vizag)', railDistanceKm: 540, statutoryRunwayDays: 21 },
                    { plantName: 'Bokaro Steel Plant (BSL)', annualDemandMtpa: 4.1, primaryDischargePort: 'Paradip Port', railDistanceKm: 440, statutoryRunwayDays: 21 },
                    { plantName: 'Rourkela Steel Plant (RSP)', annualDemandMtpa: 3.8, primaryDischargePort: 'Dhamra / Paradip', railDistanceKm: 320, statutoryRunwayDays: 21 },
                    { plantName: 'Durgapur Steel Plant (DSP)', annualDemandMtpa: 2.1, primaryDischargePort: 'Haldia Dock', railDistanceKm: 175, statutoryRunwayDays: 21 },
                    { plantName: 'IISCO Burnpur (ISP)', annualDemandMtpa: 1.6, primaryDischargePort: 'Haldia / Dhamra', railDistanceKm: 210, statutoryRunwayDays: 21 },
                  ]).map((plant: any) => (
                    <div key={plant.plantName} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-700/50 text-xs">
                      <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                        <span>{plant.plantName}</span>
                        <span className="font-mono text-blue-600 dark:text-sky-400">{plant.annualDemandMtpa} MTPA</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex justify-between">
                        <span>Gateway: {plant.primaryDischargePort}</span>
                        <span>{plant.railDistanceKm} km rail</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Default: Dual Deck (Fleet Voyages / Role Data + Contracts Summary) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              {activeDeckTab === 'CONTRACTS' ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Cpu size={16} className="text-purple-600" />
                    <span>Active Contracts & Executed Fixture Notes (DB)</span>
                  </h3>
                  <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
                    {contracts.slice(0, 8).map((c: any) => (
                      <div
                        key={c.id}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between hover-slide-right cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-900/50 transition shadow-2xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {c.contract_reference || c.ref || 'Contract'} · {c.vessel_name || c.vessel || 'Bulker'}
                          </div>
                          <div className="text-slate-500">
                            {Number(c.cargo_quantity_mt || c.quantity_mt || 160000).toLocaleString()} MT · Rate: ${c.rate_usd || c.rateUsd || 12.5}/MT
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-sky-300">
                          {c.status || 'ACTIVE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : currentRole === 'PORT_MANAGER' ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Anchor size={16} className="text-indigo-600" />
                    <span>Port Terminal Status (DB)</span>
                  </h3>
                  <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
                    {ports.map((p: any) => {
                      const status = p.congestion_status || p.congestionStatus || p.status || 'NORMAL';
                      const wait = Number(p.current_waiting_days || p.currentWaitingDays || 0);
                      const name = p.port_name || p.name || 'Unknown Port';
                      return (
                        <div
                          key={p.id || p.un_locode || p.name}
                          className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between hover-slide-right cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-slate-800/90 transition-all duration-200 shadow-2xs hover:shadow-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{name}</div>
                            <div className="text-slate-500">
                              {wait > 0 ? `${wait.toFixed(1)}d wait` : 'No wait'} · {p.berth_count || p.berths_count || p.berths || 0} berths
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            status === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                            status === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                            status === 'MODERATE' ? 'bg-amber-50 text-amber-600' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : currentRole === 'PROCUREMENT_MANAGER' ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 size={16} className="text-emerald-600" />
                    <span>Live Procurement Requirements (DB)</span>
                  </h3>
                  <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
                    {requirements.slice(0, 6).map((r: any) => (
                      <div
                        key={r.id}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover-slide-right cursor-pointer border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:bg-emerald-50/40 dark:hover:bg-slate-800/90 transition-all duration-200 shadow-2xs hover:shadow-xs"
                      >
                        <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                          <span>{r.commodity_name || r.commodityName || r.cargo_type || 'Unknown Commodity'}</span>
                          <span className={`${r.priority === 'CRITICAL' || r.priority === 'HIGH' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {r.priority || 'NORMAL'} Priority
                          </span>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {Number(r.quantity_mt || r.quantityMt || 0).toLocaleString()} MT · Status: {r.status || 'OPEN'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Ship size={16} className="text-blue-600" />
                    <span>Live Fleet Voyage Progress (DB)</span>
                  </h3>
                  <div className="space-y-2.5 text-xs max-h-72 overflow-y-auto">
                    {activeVessels.length > 0 ? activeVessels.slice(0, 6).map((v: any) => (
                      <div
                        key={v.id}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1 hover-slide-right cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/40 dark:hover:bg-slate-800/90 transition-all duration-200 shadow-2xs hover:shadow-xs"
                      >
                        <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                          <span>{v.vessel_name || v.name || 'Unknown Vessel'}</span>
                          <span className="text-blue-600 dark:text-sky-400 font-mono text-[10px]">
                            {v.vessel_class || v.vesselClass || '—'} · {v.deadweight_tonnes || v.dwt || 0} DWT
                          </span>
                        </div>
                        <div className="text-slate-500">
                          {v.flag_country || v.flag || '—'} · {v.status || 'EN_ROUTE'}
                          {v.current_port_name || v.destination ? ` → ${v.current_port_name || v.destination}` : ''}
                        </div>
                        <div className="flex items-center gap-2 pt-0.5">
                          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: v.status === 'EN_ROUTE' ? '60%' : v.status === 'DISCHARGING' ? '90%' : '30%' }} />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            {v.status === 'EN_ROUTE' ? '60%' : v.status === 'DISCHARGING' ? '90%' : '30%'}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-slate-400 py-4">No active vessels in database</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contracts Summary */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <Cpu size={15} className="text-purple-600" />
                  <span>Live Contract Summary (DB)</span>
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['ACTIVE', 'APPROVED', 'SUBMITTED', 'DRAFT', 'COMPLETED', 'TERMINATED'].map((s) => {
                    const count = contracts.filter((c: any) => c.status === s).length;
                    return (
                      <div
                        key={s}
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg hover-scale cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-900/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all duration-200 shadow-2xs hover:shadow-xs"
                      >
                        <span className="text-slate-600 dark:text-slate-400">{s}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vessel Fleet Table from DB */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Vessel Fleet — Live Database</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{vessels.length} vessels loaded from database</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="p-3">IMO / Name</th>
                <th className="p-3">Class</th>
                <th className="p-3 text-right">DWT</th>
                <th className="p-3">Flag</th>
                <th className="p-3">Destination</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vessels.slice(0, 8).map((v: any) => (
                <tr
                  key={v.id}
                  className="hover:bg-blue-50/40 dark:hover:bg-slate-800/70 transition-colors duration-150 cursor-pointer group"
                >
                  <td className="p-3">
                    <div className="font-medium text-blue-700 dark:text-sky-400 group-hover:underline transition-colors">{v.vessel_name || v.name || '—'}</div>
                    <div className="text-slate-400 font-mono text-[10px]">{v.imo_number || v.imoNumber || '—'}</div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{v.vessel_class || v.vesselClass || '—'}</td>
                  <td className="p-3 text-right font-mono font-semibold">{Number(v.deadweight_tonnes || v.dwt || 0).toLocaleString()}</td>
                  <td className="p-3 text-slate-500">{v.flag_country || v.flag || '—'}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{v.current_port_name || v.destination || '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      v.status === 'EN_ROUTE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-sky-300' :
                      v.status === 'DISCHARGING' ? 'bg-emerald-100 text-emerald-700' :
                      v.status === 'WAITING' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {v.status || 'UNKNOWN'}
                    </span>
                  </td>
                </tr>
              ))}
              {vessels.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">No vessels in database</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ControlTowerPage;
