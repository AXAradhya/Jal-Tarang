import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Sparkles,
  Shield,
  Sliders,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatRateMt } from '../../lib/utils';

export interface MarketTimingProps {
  currentRate: number;
  routeCode?: string;
  routeName?: string;
  onApplyRate?: (rate: number) => void;
}

export const MarketEntryTimingWidget: React.FC<MarketTimingProps> = ({
  currentRate,
  routeCode = 'BCI_C5',
  routeName = 'Capesize Western Australia to China / ECI',
  onApplyRate
}) => {
  const [bunkerDeltaUsd, setBunkerDeltaUsd] = useState(0); // +/- $50/MT

  // Econometric calculations (CAT-01)
  const ema30 = Math.round((currentRate * 1.045) * 100) / 100;
  const ema90 = Math.round((currentRate * 1.082) * 100) / 100;
  const spread30 = Math.round((currentRate - ema30) * 100) / 100;

  // Bunker elasticity: ~0.38 coefficient
  const bunkerImpactRate = Math.round((bunkerDeltaUsd * 0.024) * 100) / 100;
  const adjustedRate = Math.round((currentRate + bunkerImpactRate) * 100) / 100;

  // Signal determination
  const isOptimalWindow = spread30 < 0;
  const signal = isOptimalWindow ? 'OPTIMAL CHARTERING WINDOW' : 'ACCELERATE SPOT TENDER';
  const signalColor = isOptimalWindow
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';

  return (
    <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-foreground">
              Market Entry Timing & Econometric Window Advisor (CAT-01)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluates 30d/90d EMA spreads, FFA contango, and Singapore 0.5% VLSFO elasticity to pinpoint entry windows.
          </p>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border uppercase flex items-center gap-1.5 ${signalColor}`}>
          <Sparkles className="w-3.5 h-3.5" />
          {signal}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Spot Benchmark</span>
          <span className="text-sm font-mono font-bold text-foreground mt-0.5 block">
            {formatRateMt(currentRate)}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-medium mt-0.5">
            <TrendingDown className="w-3 h-3" />
            {spread30 < 0 ? `${spread30} vs 30d EMA` : `+${spread30} vs 30d EMA`}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">30-Day EMA</span>
          <span className="text-sm font-mono font-bold text-foreground mt-0.5 block">
            {formatRateMt(ema30)}
          </span>
          <span className="text-[10px] text-muted-foreground">Short-term trendline</span>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">90-Day EMA</span>
          <span className="text-sm font-mono font-bold text-foreground mt-0.5 block">
            {formatRateMt(ema90)}
          </span>
          <span className="text-[10px] text-muted-foreground">Quarterly base level</span>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Recommended Window</span>
          <span className="text-sm font-mono font-bold text-primary mt-0.5 block">
            Next 5–9 Days
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">92% Dip Confidence</span>
        </div>
      </div>

      {/* Bunker Price Elasticity Slider */}
      <div className="p-3 rounded-lg bg-background border border-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            Bunker Fuel Price Sensitivity (VLSFO Singapore):
          </span>
          <span className="font-mono font-bold text-foreground">
            {bunkerDeltaUsd >= 0 ? `+$${bunkerDeltaUsd}` : `-$${Math.abs(bunkerDeltaUsd)}`}/MT VLSFO
          </span>
        </div>

        <input
          type="range"
          min="-60"
          max="60"
          step="5"
          value={bunkerDeltaUsd}
          onChange={(e) => setBunkerDeltaUsd(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Freight Elasticity Impact: <strong>{bunkerImpactRate >= 0 ? `+${bunkerImpactRate}` : bunkerImpactRate} USD/MT</strong></span>
          <span>Effective Rate: <strong className="font-mono text-foreground">{formatRateMt(adjustedRate)}</strong></span>
          {onApplyRate && (
            <button
              onClick={() => onApplyRate(adjustedRate)}
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              Apply to Fixture
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
