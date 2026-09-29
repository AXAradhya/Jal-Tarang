import React, { useState, useMemo } from 'react';
import {
  Waves,
  AlertTriangle,
  CheckCircle,
  Clock,
  Compass,
  ArrowRight,
  Anchor,
  HelpCircle,
  Ship,
  Info
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';

export interface RiverBarCrossing {
  id: string;
  name: string;
  riverSystem: string;
  datumDepthM: number;
  maxTidalHeightM: number;
  currentTidalHeightM: number;
  requiredUkcM: number; // Under-keel clearance
  transitPermissibleDraftM: number;
  nextHighWaterWindow: string;
  pilotageNotes: string;
}

const RIVER_BARS: RiverBarCrossing[] = [
  {
    id: 'bar-auckland',
    name: 'Auckland Bar (Hooghly Estuary)',
    riverSystem: 'Hooghly River / Sagar approaches',
    datumDepthM: 4.8,
    maxTidalHeightM: 5.4,
    currentTidalHeightM: 4.6,
    requiredUkcM: 0.9,
    transitPermissibleDraftM: 8.5,
    nextHighWaterWindow: 'Today, 21:40 IST (+4.9m)',
    pilotageNotes: 'Primary seaward shallow bar. Governs maximum entry draft for Kolkata and Haldia vessel convoys.'
  },
  {
    id: 'bar-jellingham',
    name: 'Jellingham Shoal / Channel',
    riverSystem: 'Haldia approaches',
    datumDepthM: 4.9,
    maxTidalHeightM: 5.2,
    currentTidalHeightM: 4.5,
    requiredUkcM: 0.8,
    transitPermissibleDraftM: 8.6,
    nextHighWaterWindow: 'Today, 22:15 IST (+4.8m)',
    pilotageNotes: 'Constantly dredged channel. High siltation rates during southwest monsoon season require echo-sounder monitoring.'
  },
  {
    id: 'bar-balari',
    name: 'Balari Bar Crossing',
    riverSystem: 'Upstream Hooghly river',
    datumDepthM: 4.2,
    maxTidalHeightM: 5.0,
    currentTidalHeightM: 4.2,
    requiredUkcM: 0.9,
    transitPermissibleDraftM: 7.5,
    nextHighWaterWindow: 'Tomorrow, 09:20 IST (+4.6m)',
    pilotageNotes: 'Severe river bend and shifting sandbars restrict Kolkata river traffic to daylight hours only.'
  },
  {
    id: 'bar-sagar-anchorage',
    name: 'Sagar Roads / Sandheads Anchorage',
    riverSystem: 'Bay of Bengal Deepwater Bar Gateway',
    datumDepthM: 10.5,
    maxTidalHeightM: 5.6,
    currentTidalHeightM: 4.8,
    requiredUkcM: 1.2,
    transitPermissibleDraftM: 14.1,
    nextHighWaterWindow: 'All-weather anchor access',
    pilotageNotes: 'Designated ocean lightering area where Capesize vessels discharge bulk coking coal onto coastal daughter vessels before entering the river bar.'
  }
];

export const TidalBarCrossingPanel: React.FC = () => {
  const { currency } = useUiStore();

  // Interactive Lightering & Bar Transit Modeler
  const [arrivalDraftM, setArrivalDraftM] = useState<number>(12.2); // Capesize part-laden or Panamax
  const [cargoTonnageMt, setCargoTonnageMt] = useState<number>(75000);
  const [targetTideHeightM, setTargetTideHeightM] = useState<number>(4.8);

  const governingBar = RIVER_BARS[0]; // Auckland Bar governs Haldia transit

  // Calculation of permissible draft & required lighterage
  const calculation = useMemo(() => {
    // Permissible draft = Datum depth + Tide height - UKC (0.9m)
    const maxPermissibleDraft = Math.round((governingBar.datumDepthM + targetTideHeightM - governingBar.requiredUkcM) * 10) / 10;
    const draftExcessM = Math.max(0, arrivalDraftM - maxPermissibleDraft);

    // Metric tonnes per centimeter immersion (TPC) for a typical bulk carrier ~ 65-75 MT/cm
    const tpc = 70; // 70 MT per 0.01m draft = 7,000 MT per 1.0m draft
    const requiredLighterageMt = Math.round(draftExcessM * 100 * tpc);
    const lighteringBargesNeeded = Math.ceil(requiredLighterageMt / 12000); // 12k MT daughter vessels

    const canTransitDirect = draftExcessM === 0;

    return {
      maxPermissibleDraft,
      draftExcessM: Math.round(draftExcessM * 10) / 10,
      requiredLighterageMt,
      lighteringBargesNeeded,
      canTransitDirect,
      lighteringCostUsd: Math.round(requiredLighterageMt * 4.25), // ~$4.25/MT lightering tariff
    };
  }, [arrivalDraftM, targetTideHeightM, governingBar]);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-lg">
                <Waves className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-foreground">
                Tidal Windows & River Bar Crossings Intelligence
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time tidal window tracking and Hooghly river bar draft calculations for Haldia Dock Complex and Sagar / Sandheads lighterage (FR-004).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-muted font-mono px-2.5 py-1 rounded-lg text-foreground font-semibold border border-border">
              Governing River Datum: 8.5m Chart
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Governing River Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {RIVER_BARS.map((bar) => (
          <div key={bar.id} className="bg-card border border-border rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold text-foreground">{bar.name}</h4>
                  <span className="text-[10px] text-muted-foreground block">{bar.riverSystem}</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                  {bar.transitPermissibleDraftM}m Draft
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/30 p-2 rounded">
                  <span className="text-muted-foreground text-[10px] block">Datum Depth:</span>
                  <span className="font-mono font-bold text-foreground">{bar.datumDepthM} m</span>
                </div>
                <div className="bg-muted/30 p-2 rounded">
                  <span className="text-muted-foreground text-[10px] block">Current Tide:</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">+{bar.currentTidalHeightM} m</span>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-muted-foreground font-mono">
                <strong>Next Tidal Window:</strong> {bar.nextHighWaterWindow}
              </div>

              <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/60 leading-relaxed">
                {bar.pilotageNotes}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-border text-[10px] text-muted-foreground flex justify-between">
              <span>Required UKC: {bar.requiredUkcM}m</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tidal Gate Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive River Bar Transit & Lightering Calculator */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">
              Haldia / Hooghly Bar Transit & Lighterage Calculator
            </h4>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Verifies if incoming bulk cargo requires transshipment at Sagar Anchorage
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-foreground">Vessel Arrival Draft:</span>
                <span className="font-mono font-bold text-primary">{arrivalDraftM.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min={7.5}
                max={16.5}
                step={0.1}
                value={arrivalDraftM}
                onChange={(e) => setArrivalDraftM(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>7.5m (Light)</span>
                <span>8.5m (Haldia Datum)</span>
                <span>16.5m (Capesize)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-foreground">High Tide Elevation Window:</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">+{targetTideHeightM.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min={3.5}
                max={5.6}
                step={0.1}
                value={targetTideHeightM}
                onChange={(e) => setTargetTideHeightM(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>3.5m (Neap Tide)</span>
                <span>4.8m (Average Spring)</span>
                <span>5.6m (Equinoctial Spring)</span>
              </div>
            </div>
          </div>

          {/* Bar Transit Verdict */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between ${
            calculation.canTransitDirect
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                {calculation.canTransitDirect ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
                <span className="text-xs font-bold uppercase tracking-wide">
                  {calculation.canTransitDirect ? 'Direct River Transit Approved' : 'Lighterage Required at Sandheads'}
                </span>
              </div>

              <div className="mt-2 text-xs space-y-1">
                <p>
                  Permissible River Draft: <strong>{calculation.maxPermissibleDraft} m</strong> (including 0.9m UKC).
                </p>
                {!calculation.canTransitDirect && (
                  <p className="font-medium">
                    Arrival draft exceeds safe bar limit by <strong className="text-rose-600 dark:text-rose-400 font-mono">{calculation.draftExcessM} m</strong>.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-current/20 text-[11px]">
              {calculation.canTransitDirect ? (
                <span>Vessel can navigate Auckland Bar without cargo lightening during high tide.</span>
              ) : (
                <span>Must drop anchor at Sagar / Sandheads to lighten parcel before proceeding upstream.</span>
              )}
            </div>
          </div>

          {/* Lighterage Operation Scope */}
          <div className="bg-muted/30 p-4 rounded-xl border border-border flex flex-col justify-between text-xs">
            <div>
              <span className="font-bold text-foreground block mb-2">
                Sagar Transshipment Plan:
              </span>
              <div className="space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Cargo to Lighten:</span>
                  <strong className="text-foreground font-mono">
                    {calculation.requiredLighterageMt.toLocaleString()} MT
                  </strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Daughter Barges Needed:</span>
                  <strong className="text-foreground font-mono">
                    {calculation.lighteringBargesNeeded} Barges (~12k MT each)
                  </strong>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Lightering Tariff:</span>
                  <strong className="text-foreground font-mono">
                    {formatCurrency(calculation.lighteringCostUsd, { currencyOverride: 'USD' })}
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-border text-[10px] text-muted-foreground">
              SAIL Logistics automatically generates transshipment work orders upon confirmation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TidalBarCrossingPanel;
