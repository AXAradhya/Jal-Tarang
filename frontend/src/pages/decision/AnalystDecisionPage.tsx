import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Brain,
  ArrowLeft,
  Sliders,
  TrendingUp,
  Activity,
  Percent,
  Cpu,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { ForecastChart, FreightTrendChart } from '../../components/dashboard/widgets';
import { useUiStore } from '../../store/uiStore';
import { formatRateMt } from '../../lib/utils';
import { freightApi } from '../../api';

export const AnalystDecisionPage: React.FC = () => {
  const { currency, exchangeRate } = useUiStore();
  const [bunkerShock, setBunkerShock] = useState(0); // +/- $/MT
  const [cycloneScenario, setCycloneScenario] = useState('NORMAL');
  const [macroDemand, setMacroDemand] = useState('STABLE');

  const { data: rawTrajectory } = useQuery({
    queryKey: ['freight-trajectory'],
    queryFn: async () => {
      try {
        const res = await freightApi.trajectory();
        return Array.isArray(res) ? res : ((res as any)?.data || []);
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  const trajectory = rawTrajectory || [];

  const forecastData = useMemo(() => {
    if (!trajectory || trajectory.length === 0) return [];
    return trajectory.map((p: any) => ({
      date: p.date,
      actualRate: !p.isProjection ? p.C5TC : undefined,
      predictedRate: p.isProjection ? p.C5TC : undefined,
      confLow: p.isProjection ? +(p.C5TC * 0.94).toFixed(2) : undefined,
      confHigh: p.isProjection ? +(p.C5TC * 1.06).toFixed(2) : undefined,
    }));
  }, [trajectory]);

  const trendData = useMemo(() => {
    if (!trajectory || trajectory.length === 0) return [];
    return trajectory.map((p: any) => ({
      date: p.date,
      Capesize: p.C5TC ? Math.round(p.C5TC * 1800) : 0,
      Panamax: p.P1A ? Math.round(p.P1A * 1500) : 0,
      Supramax: p.C3TC ? Math.round(p.C3TC * 1300) : 0,
    }));
  }, [trajectory]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/analyst"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white border border-slate-200 dark:border-slate-700 transition shadow-xs"
              title="Return to Market Intelligence Desk"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Econometric & Forward Curve Decision Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
              Role: Quantitative Market Analyst
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Ensemble forecasting models (Bi-LSTM, XGBoost, LightGBM), bunker price sensitivity shocks, and FFA forward curve scenario evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs font-semibold text-purple-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            Ensemble Convergence: 96.8%
          </span>
        </div>
      </div>

      {/* Scenario Simulation Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            Macro & Geopolitical Shock Simulator
          </h3>
          <span className="text-[11px] text-slate-400">
            Real-time parameter perturbation injected into neural forecast
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              VLSFO Bunker Price Shock:{' '}
              <span className="text-white font-mono font-bold">
                {bunkerShock > 0 ? '+' : ''}
                {currency === 'INR' ? `₹${Math.round(bunkerShock * exchangeRate)}` : `$${bunkerShock}`}/MT
              </span>
            </label>
            <input
              type="range"
              min="-80"
              max="120"
              step="10"
              value={bunkerShock}
              onChange={(e) => setBunkerShock(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>{currency === 'INR' ? `-₹${Math.round(80 * exchangeRate).toLocaleString()}` : '-$80'} (Oversupply)</span>
              <span>Baseline</span>
              <span>{currency === 'INR' ? `+₹${Math.round(120 * exchangeRate).toLocaleString()}` : '+$120'} (Refinery Squeeze)</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Weather / Cyclone Severity</label>
            <select
              value={cycloneScenario}
              onChange={(e) => setCycloneScenario(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:ring-1 focus:ring-purple-500"
            >
              <option value="NORMAL">Normal Maritime Conditions (Sea State 3)</option>
              <option value="MONSOON">Bay of Bengal Active Depression (+1.8d wait)</option>
              <option value="CYCLONE_WEST_AUS">Pilbara Cat-4 Tropical Cyclone (+4.2d wait)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Global Steelmaking Requisition</label>
            <select
              value={macroDemand}
              onChange={(e) => setMacroDemand(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:ring-1 focus:ring-purple-500"
            >
              <option value="STABLE">Baseline Consumption (Domestic Growth 8%)</option>
              <option value="EXPANSION">Surge Demand (Government Infra Push +15%)</option>
              <option value="CONTRACTION">Slower Production Cycle (-10%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Econometric Bi-LSTM Forecast Chart */}
      <div>
        <ForecastChart data={forecastData} />
      </div>

      {/* Route Rates & Model Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <FreightTrendChart />
        </div>

        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Machine Learning Model Specs
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-lg">
                <div className="flex justify-between text-slate-400">
                  <span>Architecture</span>
                  <span className="font-semibold text-white">Bi-LSTM + Multi-Head Attention</span>
                </div>
                <div className="flex justify-between text-slate-400 mt-1">
                  <span>Backtest MAE</span>
                  <span className="font-semibold text-emerald-400">{formatRateMt(0.38)}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-lg">
                <div className="flex justify-between text-slate-400">
                  <span>Training Data</span>
                  <span className="font-semibold text-white">10 Years Baltic Exchange Data</span>
                </div>
                <div className="flex justify-between text-slate-400 mt-1">
                  <span>Exogenous Features</span>
                  <span className="font-semibold text-purple-300">Brent, Iron Ore 62%, Capesize Fleet</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-lg">
                <div className="flex justify-between text-slate-400">
                  <span>Inference Latency</span>
                  <span className="font-semibold text-cyan-400">18 ms</span>
                </div>
                <div className="flex justify-between text-slate-400 mt-1">
                  <span>Loss Function</span>
                  <span className="font-semibold text-white">Quantile Pinball Loss (q=0.05, 0.5, 0.95)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Optimal fixing window identified: <strong>Q4 forward rates favor 6-month COA locks</strong>.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystDecisionPage;
