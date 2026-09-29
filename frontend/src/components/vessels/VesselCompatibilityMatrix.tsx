import React, { useState, useMemo } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  Filter,
  Info,
  Layers,
  ArrowRight,
  Anchor,
  Maximize2
} from 'lucide-react';

export interface PortConstraint {
  id: string;
  name: string;
  code: string;
  region: 'EC_INDIA' | 'OVERSEAS_ORIGIN';
  country: string;
  maxLoa: number;
  maxBeam: number;
  maxDraft: number;
  maxDwt: number;
  tidalWindowHours?: number;
  specialNotes?: string;
  lighteringAvailable?: boolean;
}

export interface VesselSpec {
  id: string;
  className: string;
  typicalDwt: number;
  typicalLoa: number;
  typicalBeam: number;
  typicalDraft: number;
  fuelConsDay: number;
  description: string;
}

const DEFAULT_PORTS: PortConstraint[] = [
  // East Coast India Discharge Ports
  {
    id: 'port-ind-prdp',
    name: 'Paradip Port',
    code: 'INPAV',
    region: 'EC_INDIA',
    country: 'India',
    maxLoa: 295.0,
    maxBeam: 45.0,
    maxDraft: 16.5,
    maxDwt: 180000,
    tidalWindowHours: 6,
    specialNotes: 'Deepwater berths permit Capesize up to 16.5m draft. High tide pilotage required for laden cape vessels.'
  },
  {
    id: 'port-ind-vztg',
    name: 'Visakhapatnam (Vizag)',
    code: 'INVTZ',
    region: 'EC_INDIA',
    country: 'India',
    maxLoa: 290.0,
    maxBeam: 45.0,
    maxDraft: 16.0,
    maxDwt: 175000,
    tidalWindowHours: 8,
    specialNotes: 'Outer Harbour berths Capesize up to 16.0m. Inner harbour strictly limited to Panamax (11.0m draft).'
  },
  {
    id: 'port-ind-ggvr',
    name: 'Gangavaram Port',
    code: 'INGVP',
    region: 'EC_INDIA',
    country: 'India',
    maxLoa: 300.0,
    maxBeam: 48.0,
    maxDraft: 18.5,
    maxDwt: 200000,
    tidalWindowHours: 12,
    specialNotes: 'Modern deepwater all-weather port. Fully compatible with standard Capesize vessels with fast discharge rates.'
  },
  {
    id: 'port-ind-dhmr',
    name: 'Dhamra Port',
    code: 'INDHA',
    region: 'EC_INDIA',
    country: 'India',
    maxLoa: 320.0,
    maxBeam: 50.0,
    maxDraft: 18.0,
    maxDwt: 205000,
    tidalWindowHours: 12,
    specialNotes: 'Dedicated mechanised coal berths with 18.0m draft. Capesize fully supported.'
  },
  {
    id: 'port-ind-gplr',
    name: 'Gopalpur Port',
    code: 'INGOP',
    region: 'EC_INDIA',
    country: 'India',
    maxLoa: 235.0,
    maxBeam: 36.0,
    maxDraft: 12.5,
    maxDwt: 82000,
    tidalWindowHours: 8,
    specialNotes: 'Restricted draft of 12.5m accommodates Panamax/Supramax. Capesize requires offshore lighterage.'
  },
  {
    id: 'port-ind-sgr',
    name: 'Sagar / Sandheads Anchorage',
    code: 'INSGR',
    region: 'EC_INDIA',
    country: 'India',
    maxLoa: 225.0,
    maxBeam: 32.2,
    maxDraft: 8.8,
    maxDwt: 75000,
    tidalWindowHours: 4,
    specialNotes: 'River bar anchorage. Major transshipment and lighterage zone for Kolkata/Haldia-bound bulk parcels.',
    lighteringAvailable: true
  },
  {
    id: 'port-ind-hld',
    name: 'Haldia Dock Complex',
    code: 'INHAL',
    region: 'EC_INDIA',
    country: 'India',
    maxLoa: 230.0,
    maxBeam: 32.5,
    maxDraft: 8.5,
    maxDwt: 65000,
    tidalWindowHours: 4,
    specialNotes: 'River port with governing Hooghly river bar restrictions. Maximum draft 8.5m. Capesize prohibited; require lightering at Sagar/Sandheads.',
    lighteringAvailable: true
  },
  // Key Global Origins
  {
    id: 'port-aus-hpt',
    name: 'Hay Point Port',
    code: 'AUHPT',
    region: 'OVERSEAS_ORIGIN',
    country: 'Australia',
    maxLoa: 320.0,
    maxBeam: 52.0,
    maxDraft: 18.5,
    maxDwt: 230000,
    specialNotes: 'Primary BHP/BMA coking coal loading terminal. Fully Capesize equipped.'
  },
  {
    id: 'port-aus-dbt',
    name: 'Dalrymple Bay (DBCT)',
    code: 'AUDBT',
    region: 'OVERSEAS_ORIGIN',
    country: 'Australia',
    maxLoa: 325.0,
    maxBeam: 52.0,
    maxDraft: 18.8,
    maxDwt: 225000,
    specialNotes: 'World-class coking coal terminal with high load rates.'
  },
  {
    id: 'port-aus-ntl',
    name: 'Newcastle Port',
    code: 'AUNTL',
    region: 'OVERSEAS_ORIGIN',
    country: 'Australia',
    maxLoa: 300.0,
    maxBeam: 47.0,
    maxDraft: 15.2,
    maxDwt: 180000,
    specialNotes: 'Draft limitation of 15.2m limits deep Capesize loading to high-tide windows.'
  },
  {
    id: 'port-usa-orf',
    name: 'Norfolk / Hampton Roads',
    code: 'USORF',
    region: 'OVERSEAS_ORIGIN',
    country: 'United States',
    maxLoa: 300.0,
    maxBeam: 46.0,
    maxDraft: 15.5,
    maxDwt: 180000,
    specialNotes: 'East Coast US met coal hub with 15.5m draft.'
  },
  {
    id: 'port-usa-bal',
    name: 'Baltimore (Consol / CSX)',
    code: 'USBAL',
    region: 'OVERSEAS_ORIGIN',
    country: 'United States',
    maxLoa: 300.0,
    maxBeam: 46.0,
    maxDraft: 15.2,
    maxDwt: 160000,
    specialNotes: 'Consol Marine and CSX Curtis Bay bulk coal terminals.'
  },
  {
    id: 'port-moz-nac',
    name: 'Nacala Coal Terminal',
    code: 'MZMNC',
    region: 'OVERSEAS_ORIGIN',
    country: 'Mozambique',
    maxLoa: 325.0,
    maxBeam: 50.0,
    maxDraft: 18.5,
    maxDwt: 220000,
    specialNotes: 'Deepwater natural harbour. Dedicated coking coal terminal for Moatize basin.'
  },
  {
    id: 'port-moz-bei',
    name: 'Beira Port',
    code: 'MZBEW',
    region: 'OVERSEAS_ORIGIN',
    country: 'Mozambique',
    maxLoa: 200.0,
    maxBeam: 30.0,
    maxDraft: 9.2,
    maxDwt: 50000,
    specialNotes: 'Restricted draft (9.2m). Only Handysize / light Supramax vessels.'
  },
  {
    id: 'port-rus-vos',
    name: 'Vostochny (PPK-3 Terminal)',
    code: 'RUVYP',
    region: 'OVERSEAS_ORIGIN',
    country: 'Russia',
    maxLoa: 315.0,
    maxBeam: 48.0,
    maxDraft: 16.5,
    maxDwt: 190000,
    specialNotes: 'Far East Russian deepwater coal port handling Capesize and Panamax.'
  },
  {
    id: 'port-idn-bpn',
    name: 'Balikpapan / Samarinda',
    code: 'IDBPN',
    region: 'OVERSEAS_ORIGIN',
    country: 'Indonesia',
    maxLoa: 250.0,
    maxBeam: 38.0,
    maxDraft: 14.2,
    maxDwt: 95000,
    specialNotes: 'Anchorage loading via gear/barges for East Kalimantan thermal coal.'
  }
];

const VESSEL_SPECS: VesselSpec[] = [
  {
    id: 'ves-capesize',
    className: 'Capesize',
    typicalDwt: 180000,
    typicalLoa: 292.0,
    typicalBeam: 45.0,
    typicalDraft: 17.8,
    fuelConsDay: 48,
    description: '100,000–200,000+ DWT. Optimal for deepwater routes (Hay Point / Nacala to Paradip / Dhamra / Gangavaram).'
  },
  {
    id: 'ves-panamax',
    className: 'Panamax / Kamsarmax',
    typicalDwt: 82000,
    typicalLoa: 229.0,
    typicalBeam: 32.2,
    typicalDraft: 14.4,
    fuelConsDay: 31,
    description: '65,000–82,000 DWT. High versatility across all major East Coast Indian ports with moderate draft constraints.'
  },
  {
    id: 'ves-ultramax',
    className: 'Supramax / Ultramax',
    typicalDwt: 64000,
    typicalLoa: 199.0,
    typicalBeam: 32.2,
    typicalDraft: 13.0,
    fuelConsDay: 26,
    description: '50,000–65,000 DWT. Self-discharging cranes/grabs, ideal for Gopalpur or draft-sensitive Indian ports.'
  },
  {
    id: 'ves-handysize',
    className: 'Handysize',
    typicalDwt: 35000,
    typicalLoa: 180.0,
    typicalBeam: 28.0,
    typicalDraft: 10.2,
    fuelConsDay: 19,
    description: '15,000–35,000 DWT. Geared vessels for shallow river ports (Haldia/Beira) or small specialized parcel sizes.'
  }
];

type CompatibilityStatus = 'COMPATIBLE' | 'CONDITIONAL' | 'INCOMPATIBLE';

interface CellEvaluation {
  status: CompatibilityStatus;
  reasons: string[];
  limitingFactor?: string;
  lighteringSuggested?: boolean;
}

function evaluateCompatibility(vessel: VesselSpec, port: PortConstraint): CellEvaluation {
  const reasons: string[] = [];
  let isDraftViolated = false;
  let isLoaViolated = false;
  let isBeamViolated = false;
  let isDwtViolated = false;

  const draftDelta = vessel.typicalDraft - port.maxDraft;
  if (draftDelta > 0.01) {
    isDraftViolated = true;
    reasons.push(`Laden draft (${vessel.typicalDraft}m) exceeds max permissible draft (${port.maxDraft}m) by ${draftDelta.toFixed(1)}m`);
  }

  const loaDelta = vessel.typicalLoa - port.maxLoa;
  if (loaDelta > 0.01) {
    isLoaViolated = true;
    reasons.push(`LOA (${vessel.typicalLoa}m) exceeds port limit (${port.maxLoa}m) by ${loaDelta.toFixed(1)}m`);
  }

  const beamDelta = vessel.typicalBeam - port.maxBeam;
  if (beamDelta > 0.01) {
    isBeamViolated = true;
    reasons.push(`Beam (${vessel.typicalBeam}m) exceeds channel/berth max beam (${port.maxBeam}m)`);
  }

  const dwtDelta = vessel.typicalDwt - port.maxDwt;
  if (dwtDelta > 0.01) {
    isDwtViolated = true;
    reasons.push(`Vessel DWT (${vessel.typicalDwt.toLocaleString()} MT) exceeds port structural limit (${port.maxDwt.toLocaleString()} MT)`);
  }

  // Determine status
  if (isDraftViolated || isLoaViolated || isBeamViolated || isDwtViolated) {
    // If draft is only slightly exceeded and port has tidal assistance, mark conditional
    if (!isLoaViolated && !isBeamViolated && draftDelta <= 0.8 && (port.tidalWindowHours || 0) >= 6) {
      return {
        status: 'CONDITIONAL',
        reasons: [`Draft exceeds standard datum by ${draftDelta.toFixed(1)}m but can be accommodated during high-tide tidal window (${port.tidalWindowHours}h window).`],
        limitingFactor: 'Tidal Dependency'
      };
    }

    // If port has lightering zone (like Sagar/Haldia)
    if (port.lighteringAvailable && (port.id === 'port-ind-hld' || port.id === 'port-ind-sgr')) {
      return {
        status: 'CONDITIONAL',
        reasons: [
          ...reasons,
          'Direct berthing prohibited. Feasible via offshore lightering at Sagar / Sandheads anchorage before upstream transit.'
        ],
        limitingFactor: `Draft Exceeded (${draftDelta.toFixed(1)}m)`,
        lighteringSuggested: true
      };
    }

    return {
      status: 'INCOMPATIBLE',
      reasons,
      limitingFactor: isDraftViolated ? `Draft (${port.maxDraft}m limit)` : isLoaViolated ? `LOA (${port.maxLoa}m limit)` : 'DWT structural limit'
    };
  }

  // If close to limits
  if (vessel.typicalDraft >= port.maxDraft - 0.5) {
    return {
      status: 'CONDITIONAL',
      reasons: [`Under-keel clearance (UKC) within 0.5m of maximum permissible draft. Harbor master pilotage notice required.`],
      limitingFactor: 'Borderline UKC Clearance'
    };
  }

  return {
    status: 'COMPATIBLE',
    reasons: ['All parameters (LOA, Beam, Draft, DWT) satisfy published port infrastructure restrictions without operational waivers.']
  };
}

export const VesselCompatibilityMatrix: React.FC = () => {
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'EC_INDIA' | 'OVERSEAS_ORIGIN'>('ALL');
  const [cargoVolumeMt, setCargoVolumeMt] = useState<number>(150000);
  const [selectedCell, setSelectedCell] = useState<{ vessel: VesselSpec; port: PortConstraint; eval: CellEvaluation } | null>(null);

  const filteredPorts = useMemo(() => {
    if (regionFilter === 'ALL') return DEFAULT_PORTS;
    return DEFAULT_PORTS.filter(p => p.region === regionFilter);
  }, [regionFilter]);

  // Optimal vessel allocation suggestion for the current volume
  const allocationSuggestion = useMemo(() => {
    const capeParcels = Math.ceil(cargoVolumeMt / 175000);
    const pmxParcels = Math.ceil(cargoVolumeMt / 75000);
    const ultraParcels = Math.ceil(cargoVolumeMt / 58000);

    return {
      cape: `${capeParcels} × Capesize voyage${capeParcels > 1 ? 's' : ''}`,
      panamax: `${pmxParcels} × Panamax voyage${pmxParcels > 1 ? 's' : ''}`,
      ultramax: `${ultraParcels} × Ultramax voyage${ultraParcels > 1 ? 's' : ''}`
    };
  }, [cargoVolumeMt]);

  return (
    <div className="space-y-4">
      {/* Header controls & Cargo Volume Slider */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
                <Layers className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-foreground">
                Port Infrastructure & Vessel Compatibility Matrix
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Automated validation of vessel draft, beam, LOA, and DWT limits across East Coast Indian and overseas loading ports (Section 1.1 FR-003, FR-004).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border text-xs font-medium">
              <button
                onClick={() => setRegionFilter('ALL')}
                className={`px-3 py-1 rounded transition-colors ${regionFilter === 'ALL' ? 'bg-primary text-primary-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                All Ports ({DEFAULT_PORTS.length})
              </button>
              <button
                onClick={() => setRegionFilter('EC_INDIA')}
                className={`px-3 py-1 rounded transition-colors ${regionFilter === 'EC_INDIA' ? 'bg-primary text-primary-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                East Coast India (Discharge)
              </button>
              <button
                onClick={() => setRegionFilter('OVERSEAS_ORIGIN')}
                className={`px-3 py-1 rounded transition-colors ${regionFilter === 'OVERSEAS_ORIGIN' ? 'bg-primary text-primary-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Overseas Origins (Loading)
              </button>
            </div>
          </div>
        </div>

        {/* Cargo Volume Optimization Bar */}
        <div className="mt-4 pt-3 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-foreground">Target Cargo Parcel Volume:</span>
              <span className="font-mono font-bold text-primary tabular-nums">
                {cargoVolumeMt.toLocaleString()} MT
              </span>
            </div>
            <input
              type="range"
              min={25000}
              max={250000}
              step={5000}
              value={cargoVolumeMt}
              onChange={(e) => setCargoVolumeMt(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>25,000 MT (Handy)</span>
              <span>150,000 MT (Cape)</span>
              <span>250,000 MT (Multi-lift)</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-muted/40 rounded-lg p-2.5 border border-border flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-muted-foreground flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-primary" /> Parcel Sizing:
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[11px] font-semibold border border-emerald-500/20">
                {allocationSuggestion.cape}
              </span>
              <span className="text-muted-foreground">or</span>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[11px] font-semibold border border-blue-500/20">
                {allocationSuggestion.panamax}
              </span>
              <span className="text-muted-foreground">or</span>
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-[11px] font-semibold border border-amber-500/20">
                {allocationSuggestion.ultramax}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between text-xs px-1 text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground">Compatibility Verdicts:</span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Fully Compatible
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Conditional / Tidal / Lighterage
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
            <XCircle className="w-3.5 h-3.5" /> Incompatible (Constraint Exceeded)
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Click any cell to inspect physical parameters & lighterage alternatives.
        </div>
      </div>

      {/* Interactive Matrix Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-muted/70 border-b border-border">
                <th className="py-3 px-4 font-semibold text-foreground min-w-[200px] sticky left-0 bg-muted/90 backdrop-blur-xs z-10">
                  Vessel Class (Standard Dimensions)
                </th>
                {filteredPorts.map((port) => (
                  <th
                    key={port.id}
                    className="py-3 px-3 font-semibold text-foreground text-center border-l border-border/60 min-w-[125px]"
                  >
                    <div className="font-bold truncate" title={port.name}>{port.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {port.code} • Max {port.maxDraft}m
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {VESSEL_SPECS.map((vessel) => (
                <tr key={vessel.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card/95 backdrop-blur-xs z-10 border-r border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{vessel.className}</span>
                      <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {Math.round(vessel.typicalDwt / 1000)}k DWT
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 grid grid-cols-3 gap-1 font-mono">
                      <span>Draft: {vessel.typicalDraft}m</span>
                      <span>LOA: {vessel.typicalLoa}m</span>
                      <span>Beam: {vessel.typicalBeam}m</span>
                    </div>
                  </td>

                  {filteredPorts.map((port) => {
                    const evaluation = evaluateCompatibility(vessel, port);
                    const isSelected = selectedCell?.vessel.id === vessel.id && selectedCell?.port.id === port.id;

                    let bgClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20';
                    let IconComponent = CheckCircle;
                    let label = 'Compatible';

                    if (evaluation.status === 'CONDITIONAL') {
                      bgClass = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25';
                      IconComponent = AlertTriangle;
                      label = evaluation.limitingFactor || 'Conditional';
                    } else if (evaluation.status === 'INCOMPATIBLE') {
                      bgClass = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/25';
                      IconComponent = XCircle;
                      label = evaluation.limitingFactor || 'Incompatible';
                    }

                    return (
                      <td
                        key={port.id}
                        onClick={() => setSelectedCell({ vessel, port, eval: evaluation })}
                        className={`py-2 px-2 text-center border-l border-border/60 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}`}
                      >
                        <div className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 ${bgClass}`}>
                          <IconComponent className="w-4 h-4" />
                          <span className="text-[10px] font-semibold leading-tight line-clamp-1">
                            {label}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Constraint Detail Modal / Callout when a cell is clicked */}
      {selectedCell && (
        <div className="bg-card border border-primary/40 rounded-xl p-4 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className={`p-2 rounded-lg ${
                selectedCell.eval.status === 'COMPATIBLE'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : selectedCell.eval.status === 'CONDITIONAL'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                {selectedCell.eval.status === 'COMPATIBLE' && <CheckCircle className="w-5 h-5" />}
                {selectedCell.eval.status === 'CONDITIONAL' && <AlertTriangle className="w-5 h-5" />}
                {selectedCell.eval.status === 'INCOMPATIBLE' && <XCircle className="w-5 h-5" />}
              </span>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {selectedCell.vessel.className} at {selectedCell.port.name} ({selectedCell.port.country})
                </h4>
                <p className="text-xs text-muted-foreground">
                  Status: <strong className={
                    selectedCell.eval.status === 'COMPATIBLE' ? 'text-emerald-600 dark:text-emerald-400' :
                    selectedCell.eval.status === 'CONDITIONAL' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                  }>{selectedCell.eval.status}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCell(null)}
              className="text-muted-foreground hover:text-foreground text-xs p-1 rounded hover:bg-muted"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-border text-xs">
            <div className="bg-muted/40 p-2.5 rounded-lg">
              <span className="text-muted-foreground block text-[11px]">Draft Comparison:</span>
              <span className="font-mono font-bold text-foreground">
                Vessel {selectedCell.vessel.typicalDraft}m vs Max {selectedCell.port.maxDraft}m
              </span>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Delta: {(selectedCell.vessel.typicalDraft - selectedCell.port.maxDraft).toFixed(1)}m
              </div>
            </div>

            <div className="bg-muted/40 p-2.5 rounded-lg">
              <span className="text-muted-foreground block text-[11px]">LOA Comparison:</span>
              <span className="font-mono font-bold text-foreground">
                Vessel {selectedCell.vessel.typicalLoa}m vs Max {selectedCell.port.maxLoa}m
              </span>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Max Berth Limit
              </div>
            </div>

            <div className="bg-muted/40 p-2.5 rounded-lg">
              <span className="text-muted-foreground block text-[11px]">Beam Comparison:</span>
              <span className="font-mono font-bold text-foreground">
                Vessel {selectedCell.vessel.typicalBeam}m vs Max {selectedCell.port.maxBeam}m
              </span>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Channel / Crane Reach
              </div>
            </div>

            <div className="bg-muted/40 p-2.5 rounded-lg">
              <span className="text-muted-foreground block text-[11px]">Deadweight Capacity:</span>
              <span className="font-mono font-bold text-foreground">
                {Math.round(selectedCell.vessel.typicalDwt / 1000)}k MT vs Max {Math.round(selectedCell.port.maxDwt / 1000)}k MT
              </span>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Structural Displacement
              </div>
            </div>
          </div>

          {/* Justifications / Constraints */}
          <div className="mt-3 space-y-1.5 text-xs bg-muted/20 p-3 rounded-lg border border-border">
            <span className="font-semibold text-foreground block">Analysis & Specific Constraints:</span>
            {selectedCell.eval.reasons.map((r, i) => (
              <p key={i} className="text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary font-bold">•</span>
                <span>{r}</span>
              </p>
            ))}
            {selectedCell.port.specialNotes && (
              <p className="text-[11px] text-muted-foreground italic mt-2 border-t border-border/50 pt-1.5">
                <strong>Port Operational Guidance:</strong> {selectedCell.port.specialNotes}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VesselCompatibilityMatrix;
