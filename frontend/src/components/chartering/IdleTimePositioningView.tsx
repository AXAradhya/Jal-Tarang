import React, { useState, useMemo } from 'react';
import {
  Clock,
  Navigation,
  Anchor,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Compass,
  CheckCircle,
  HelpCircle,
  BarChart3,
  Ship
} from 'lucide-react';
import { formatCurrency, formatDailyRate } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';

interface IdleRiskPeriod {
  id: string;
  quarter: string;
  monthRange: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  demandForecastMt: number;
  projectedIdleVessels: number;
  marketDriver: string;
  mitigationStrategy: string;
}

interface PositioningRecommendation {
  id: string;
  vesselName: string;
  vesselClass: string;
  currentLocation: string;
  recommendedPosition: string;
  strategyType: 'TRIANGULATION' | 'OPTIMIZED_BALLAST' | 'SHORT_COASTAL';
  sailingDays: number;
  bunkerConsumptionMt: number;
  expectedTceYieldUsd: number;
  estimatedNetSavingsUsd: number;
  rationale: string;
}

const IDLE_RISK_PERIODS: IdleRiskPeriod[] = [
  {
    id: 'risk-q1',
    quarter: 'Q1 (Jan – Mar)',
    monthRange: 'Post-Holiday & Lunar Lull',
    riskLevel: 'MEDIUM',
    demandForecastMt: 2.1,
    projectedIdleVessels: 2,
    marketDriver: 'Chinese New Year slowdown in Pacific fixtures; seasonal Australian cyclone disruptions at Hay Point.',
    mitigationStrategy: 'Fix short-term coastal iron ore parcels (Vizag to Paradip/Haldia) or position ballast towards South Africa (Nacala/RBCT).'
  },
  {
    id: 'risk-q2',
    quarter: 'Q2 (Apr – Jun)',
    monthRange: 'Pre-Monsoon Restocking Peak',
    riskLevel: 'LOW',
    demandForecastMt: 3.4,
    projectedIdleVessels: 0,
    marketDriver: 'Aggressive SAIL mill restocking before monsoon onset. High fleet utilization across all East Coast Indian discharge berths.',
    mitigationStrategy: 'Full deployment on long-haul coking coal contracts from Australia and USA.'
  },
  {
    id: 'risk-q3',
    quarter: 'Q3 (Jul – Sep)',
    monthRange: 'Southwest Monsoon Slowdown',
    riskLevel: 'HIGH',
    demandForecastMt: 1.8,
    projectedIdleVessels: 3,
    marketDriver: 'Heavy monsoon swells at Paradip & Gopalpur anchorages; handling rates drop by 25–35%. Risk of prolonged vessel waiting and demurrage.',
    mitigationStrategy: 'Schedule planned dry-dockings and annual class surveys; slow steam ballast voyages (eco-speed 10.5 kn) to absorb market slack.'
  },
  {
    id: 'risk-q4',
    quarter: 'Q4 (Oct – Dec)',
    monthRange: 'Post-Monsoon Mill Production Ramp',
    riskLevel: 'LOW',
    demandForecastMt: 3.6,
    projectedIdleVessels: 0,
    marketDriver: 'Peak steel demand quarter in India; maximum steel plant capacity utilization driving record raw material intake.',
    mitigationStrategy: 'Lock multi-voyage CoA fixtures at early Q4 cyclical entry lows.'
  }
];

const POSITIONING_RECOMMENDATIONS: PositioningRecommendation[] = [
  {
    id: 'pos-1',
    vesselName: 'MV Ocean Ambition',
    vesselClass: 'Capesize (180k DWT)',
    currentLocation: 'Paradip Port (Discharging)',
    recommendedPosition: 'Hay Point (Queensland, Australia)',
    strategyType: 'OPTIMIZED_BALLAST',
    sailingDays: 14,
    bunkerConsumptionMt: 420,
    expectedTceYieldUsd: 28500,
    estimatedNetSavingsUsd: 145000,
    rationale: 'Direct ballast at 11.2 knots eco-speed avoids Singapore bunker wait; aligns perfectly with 18-day laycan window at BMA terminal.'
  },
  {
    id: 'pos-2',
    vesselName: 'MV Steel Pioneer',
    vesselClass: 'Capesize (178k DWT)',
    currentLocation: 'Visakhapatnam (Outer Harbour)',
    recommendedPosition: 'Nacala (Mozambique) via Colombo',
    strategyType: 'TRIANGULATION',
    sailingDays: 11,
    bunkerConsumptionMt: 330,
    expectedTceYieldUsd: 26800,
    estimatedNetSavingsUsd: 185000,
    rationale: 'Repositioning to Mozambique corridor captures $1.40/MT freight discount for SAIL coking coal intake while avoiding Pacific cyclone season.'
  },
  {
    id: 'pos-3',
    vesselName: 'MV Kalingan Bharat',
    vesselClass: 'Panamax (82k DWT)',
    currentLocation: 'Haldia Dock Complex',
    recommendedPosition: 'Dhamra → Gopalpur Coastal Shuttle',
    strategyType: 'SHORT_COASTAL',
    sailingDays: 4,
    bunkerConsumptionMt: 95,
    expectedTceYieldUsd: 18200,
    estimatedNetSavingsUsd: 65000,
    rationale: 'Absorbs 8-day river bar waiting time by performing interim coastal shuttle for domestic pellet movement.'
  }
];

export const IdleTimePositioningView: React.FC = () => {
  const { currency } = useUiStore();

  // Interactive Daily Idle Cost Modeler
  const [modelVesselClass, setModelVesselClass] = useState<'CAPESIZE' | 'PANAMAX' | 'SUPRAMAX'>('CAPESIZE');
  const [modelIdleDays, setModelIdleDays] = useState<number>(7);

  const costParameters = useMemo(() => {
    switch (modelVesselClass) {
      case 'CAPESIZE':
        return { opexPerDay: 7500, auxBunkerPerDayUsd: 1700, portWaitDuesPerDay: 1200, totalDailyUsd: 10400 };
      case 'PANAMAX':
        return { opexPerDay: 5800, auxBunkerPerDayUsd: 1250, portWaitDuesPerDay: 950, totalDailyUsd: 8000 };
      case 'SUPRAMAX':
        return { opexPerDay: 4800, auxBunkerPerDayUsd: 950, portWaitDuesPerDay: 750, totalDailyUsd: 6500 };
    }
  }, [modelVesselClass]);

  const totalCalculatedIdleUsd = costParameters.totalDailyUsd * modelIdleDays;
  const inrConversion = 86.85;
  const totalCalculatedIdleInr = Math.round(totalCalculatedIdleUsd * inrConversion);

  return (
    <div className="space-y-5">
      {/* Header Overview */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                <Compass className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-foreground">
                Idle Time & Ballast Vessel Positioning Intelligence
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Predictive demand-gap forecasting, ballast repositioning optimization, and idle cost mitigation (Section 1.1 FR-005).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-500/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Fleet Idleness Risk: Low (4.2%)
            </span>
          </div>
        </div>

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-border">
          <div className="bg-muted/40 p-3 rounded-lg">
            <span className="text-xs text-muted-foreground block">Active Ballast Legs</span>
            <span className="text-lg font-bold text-foreground font-mono">4 Vessels</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
              All on eco-speed schedules
            </span>
          </div>

          <div className="bg-muted/40 p-3 rounded-lg">
            <span className="text-xs text-muted-foreground block">Projected Monthly Idle Burn</span>
            <span className="text-lg font-bold text-foreground font-mono">$0</span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              100% fixture coverage for next 45d
            </span>
          </div>

          <div className="bg-muted/40 p-3 rounded-lg">
            <span className="text-xs text-muted-foreground block">Triangulation Arbitrage</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">+$395,000</span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Mozambique + Australia corridors
            </span>
          </div>

          <div className="bg-muted/40 p-3 rounded-lg">
            <span className="text-xs text-muted-foreground block">Average Ballast Speed</span>
            <span className="text-lg font-bold text-primary font-mono">11.4 Knots</span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Saves ~18% VLSFO vs 13.0 kn
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Idle Risk Calendar across Quarters */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">
              Seasonal Cargo Demand & Idle Risk Calendar (FR-005)
            </h4>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Correlated with East Coast Monsoon & Global Cyclone Cycles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {IDLE_RISK_PERIODS.map((period) => {
            let badgeBg = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            if (period.riskLevel === 'MEDIUM') badgeBg = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            if (period.riskLevel === 'HIGH') badgeBg = 'bg-rose-500/10 text-rose-600 border-rose-500/20';

            return (
              <div key={period.id} className="p-3.5 rounded-lg border border-border bg-muted/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{period.quarter}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                      {period.riskLevel} RISK
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    {period.monthRange}
                  </div>

                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Demand Forecast:</span>
                      <strong className="text-foreground font-mono">{period.demandForecastMt}M MT</strong>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Idle Vulnerability:</span>
                      <strong className="text-foreground font-mono">{period.projectedIdleVessels} Vessel(s)</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-2.5 pt-2 border-t border-border leading-relaxed">
                    <strong>Driver:</strong> {period.marketDriver}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-border/70 text-[11px] text-primary font-medium">
                  <strong>Mitigation:</strong> {period.mitigationStrategy}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Ballast Repositioning & Alternative Employment Recommendations */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-500" />
            <h4 className="text-sm font-bold text-foreground">
              Optimized Ballast Positioning & Alternative Employment
            </h4>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Targeting Maximum TCE Yield & Minimizing Empty Miles
          </span>
        </div>

        <div className="space-y-3">
          {POSITIONING_RECOMMENDATIONS.map((rec) => (
            <div key={rec.id} className="p-3.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">{rec.vesselName}</span>
                    <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {rec.vesselClass}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      {(rec.strategyType || 'Repositioning').replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{rec.currentLocation}</span>
                    <ArrowRight className="w-3 h-3 text-primary" />
                    <strong className="text-foreground">{rec.recommendedPosition}</strong>
                    <span className="font-mono">({rec.sailingDays} sailing days • {rec.bunkerConsumptionMt} MT VLSFO)</span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1.5">
                    {rec.rationale}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end lg:self-center">
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Projected TCE Yield</span>
                    <span className="text-xs font-bold text-foreground font-mono">
                      {formatDailyRate(rec.expectedTceYieldUsd)}
                    </span>
                  </div>

                  <div className="text-right pl-3 border-l border-border">
                    <span className="text-[10px] text-muted-foreground block">Net Efficiency Gain</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      +{formatCurrency(rec.estimatedNetSavingsUsd, { currencyOverride: 'USD' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Interactive Idle Cost Calculator */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-foreground">
              Vessel Idle Cost & Demurrage Burn Calculator
            </h4>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Computes true operational cash burn during anchorage & idle wait periods
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Vessel Class:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['CAPESIZE', 'PANAMAX', 'SUPRAMAX'] as const).map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setModelVesselClass(cls)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      modelVesselClass === cls
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-foreground">Estimated Idle Duration:</span>
                <span className="font-mono font-bold text-primary">{modelIdleDays} Days</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={modelIdleDays}
                onChange={(e) => setModelIdleDays(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>1 Day</span>
                <span>15 Days</span>
                <span>30 Days (Drydock scope)</span>
              </div>
            </div>
          </div>

          {/* Breakdown Cost Items */}
          <div className="bg-muted/30 p-3.5 rounded-lg border border-border space-y-2 text-xs">
            <span className="font-semibold text-foreground block mb-1">Daily Cost Components ({modelVesselClass}):</span>
            <div className="flex justify-between text-muted-foreground">
              <span>Crew, Stores, Insurance (OPEX):</span>
              <span className="font-mono font-bold text-foreground">${costParameters.opexPerDay.toLocaleString()} / day</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Auxiliary Boiler / Generator Fuel (MGO):</span>
              <span className="font-mono font-bold text-foreground">${costParameters.auxBunkerPerDayUsd.toLocaleString()} / day</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Port Anchorage & Light Dues:</span>
              <span className="font-mono font-bold text-foreground">${costParameters.portWaitDuesPerDay.toLocaleString()} / day</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between font-bold text-foreground">
              <span>Combined Daily Idle Rate:</span>
              <span className="font-mono text-primary">${costParameters.totalDailyUsd.toLocaleString()} / day</span>
            </div>
          </div>

          {/* Total Result */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                Total Projected Idle Cost ({modelIdleDays} Days)
              </span>
              <div className="text-2xl font-extrabold text-foreground font-mono mt-1">
                {formatCurrency(totalCalculatedIdleUsd, { currencyOverride: 'USD' })}
              </div>
              <div className="text-xs font-semibold text-muted-foreground mt-0.5 font-mono">
                ≈ {formatCurrency(totalCalculatedIdleInr, { currencyOverride: 'INR' })}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-amber-500/20 text-[11px] text-muted-foreground">
              <strong className="text-foreground">Recommendation:</strong> If idle period exceeds 5 days, slow steam to next loading origin or accept secondary coastal parcel to mitigate capital loss.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdleTimePositioningView;
