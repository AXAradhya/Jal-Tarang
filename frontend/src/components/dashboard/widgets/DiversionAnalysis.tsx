import React, { useState } from 'react';
import {
  Navigation,
  Anchor,
  Clock,
  DollarSign,
  Train,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Download,
  X,
  Send,
  ExternalLink,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';
import { useUiStore } from '../../../store/uiStore';
import { formatCurrency, formatDailyRate } from '../../../lib/utils';

export interface DiversionOption {
  vesselName: string;
  cargoType: string;
  quantityMT: number;
  originalPort: {
    name: string;
    waitingDays: number;
    demurrageRatePerDay: number;
    projectedDemurrage: number;
    berthAvailability: string;
  };
  diversionPort: {
    name: string;
    waitingDays: number;
    projectedDemurrage: number;
    deviationFuelCost: number;
    additionalRakeFreight: number;
    berthAvailability: string;
    rakeTurnaroundHours: number;
  };
  targetPlant: string;
  netSavingsUSD: number;
  timeSavedDays: number;
  recommended: boolean;
}

interface DiversionAnalysisProps {
  options?: DiversionOption[];
}

export const DiversionAnalysis: React.FC<DiversionAnalysisProps> = ({
  options = [],
}) => {
  const { currency } = useUiStore();
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [isDirectiveModalOpen, setIsDirectiveModalOpen] = useState(false);
  const [directiveCopied, setDirectiveCopied] = useState(false);
  const [executedDirectives, setExecutedDirectives] = useState<Record<string, boolean>>({});

  const selectedOption: DiversionOption | null = options && options.length > 0
    ? (options.find((o) => o.vesselName === selectedVessel) || options[0])
    : null;

  const isExecuted = selectedOption ? !!executedDirectives[selectedOption.vesselName] : false;

  const generateDirectiveText = (opt: DiversionOption) => {
    return `================================================================================
STEEL AUTHORITY OF INDIA LIMITED (SAIL) - CENTRAL SHIPPING & LOGISTICS CELL
MARITIME PORT DIVERSION DIRECTIVE & VOYAGE INSTRUCTION
================================================================================
DATE / TIME: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
DIRECTIVE REF: SAIL/LOG/DIV/${new Date().getFullYear()}/${opt.vesselName.replace(/\s+/g, '-').toUpperCase()}
CLASSIFICATION: COMMERCIAL CONFIDENTIAL // IMMEDIATE DISPATCH

TO:
  1. MASTER / OWNERS / CHARTERERS - ${opt.vesselName}
  2. DISCHARGE PORT AGENTS: ${opt.originalPort.name} & ${opt.diversionPort.name}
  3. EXECUTIVE DIRECTOR (LOGISTICS), CONCOR & EAST COAST RAILWAY
  4. GENERAL MANAGER (MATERIALS MANAGEMENT), ${opt.targetPlant}

SUBJECT: VOYAGE AMENDMENT - PORT DIVERSION DIRECTIVE FOR CONGESTION AVOIDANCE

1. VESSEL PARTICULARS:
   - Vessel: ${opt.vesselName}
   - Cargo: ${opt.cargoType}
   - Quantity: ${opt.quantityMT.toLocaleString()} MT (+/- 5% MOLOO)
   - Discharge Port (Original Bill of Lading): ${opt.originalPort.name}
   - Designated New Discharge Port: ${opt.diversionPort.name}
   - Target Plant Delivery: ${opt.targetPlant}

2. COMMERCIAL & ECONOMIC JUSTIFICATION:
   - Original Port Congestion Delay: ${opt.originalPort.waitingDays.toFixed(1)} Days
   - Projected Demurrage at Original Port: $${opt.originalPort.projectedDemurrage.toLocaleString()} USD
   - Alternative Port Turnaround: ${opt.diversionPort.waitingDays.toFixed(1)} Days
   - Deviation Bunker Costs: $${opt.diversionPort.deviationFuelCost.toLocaleString()} USD
   - Additional Inland Rake Rail Haulage: $${opt.diversionPort.additionalRakeFreight.toLocaleString()} USD
   - Net Demurrage & Efficiency Savings: $${opt.netSavingsUSD.toLocaleString()} USD
   - Net Steelmaking Schedule Acceleration: ${opt.timeSavedDays.toFixed(1)} Days Ahead of Schedule

3. OPERATIONAL DIRECTIVES:
   a) MASTER: Upon receipt of this instruction, alter course to proceed with utmost dispatch
      towards ${opt.diversionPort.name} pilot station. Advise revised ETA via NAVTEX / Inmarsat-C.
   b) PORT AGENT (${opt.diversionPort.name}): Submit Notice of Readiness (NOR) upon anchoring/pilot station.
      Coordinate immediate berthing at designated berth (${opt.diversionPort.berthAvailability}).
   c) RAIL LOGISTICS (CONCOR / ECoR): Allocate and marshal 18 BOXN/BOBR rake rakes at
      port siding within ${opt.diversionPort.rakeTurnaroundHours} hours of cargo discharge for direct evacuation.

4. CHARTER PARTY RECAP PROVISIONS:
   - Diversion executed in accordance with Gencon / Baltic Charter Party Clause 18 (Port Congestion & Liberty to Divert).
   - Any legitimate bunker compensation shall be settled against agreed charter rate adjustments.

AUTHORIZED BY:
  Central Shipping Desk, Steel Authority of India Limited
  New Delhi, Republic of India
================================================================================`;
  };

  const handleCopyDirective = () => {
    if (!selectedOption) return;
    const text = generateDirectiveText(selectedOption);
    navigator.clipboard.writeText(text);
    setDirectiveCopied(true);
    setTimeout(() => setDirectiveCopied(false), 3000);
  };

  const handleDownloadDirective = () => {
    if (!selectedOption) return;
    const text = generateDirectiveText(selectedOption);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SAIL_Port_Diversion_${selectedOption.vesselName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExecuteDirective = () => {
    if (!selectedOption) return;
    setExecutedDirectives((prev) => ({
      ...prev,
      [selectedOption.vesselName]: true,
    }));
    setIsDirectiveModalOpen(false);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              Port Congestion Diversion Optimization
            </h3>
            <p className="text-xs text-slate-400">
              Real-time demurrage avoidance vs. rail haulage trade-off
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <TrendingDown className="w-3.5 h-3.5" />
          Active Demurrage Shield
        </span>
      </div>

      {!selectedOption || options.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center text-slate-400">
          <Navigation className="w-10 h-10 mb-3 opacity-40 text-amber-500" />
          <p className="text-sm font-medium text-slate-200">No active port diversion opportunities</p>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Real-time port congestion monitor is continuously evaluating queues. Vessels will appear here if demurrage avoidance offsets inland rake deviations.
          </p>
        </div>
      ) : (
        <>
          {/* Vessel selector tabs */}
          <div className="flex gap-2 pt-4 pb-2">
            {options.map((opt) => (
              <button
                key={opt.vesselName}
                onClick={() => setSelectedVessel(opt.vesselName)}
                className={`flex-1 text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                  selectedOption.vesselName === opt.vesselName
                    ? 'bg-blue-600/20 border-blue-500/50 text-white font-medium'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">{opt.vesselName}</span>
              {executedDirectives[opt.vesselName] ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  DIVERTED
                </span>
              ) : opt.recommended ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                  OPPORTUNITY
                </span>
              ) : null}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">{opt.cargoType}</div>
          </button>
        ))}
      </div>

      {/* Execution status banner */}
      {isExecuted && (
        <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Port Diversion Directive <strong>DISPATCHED</strong> for {selectedOption.vesselName}. Diverted to{' '}
              {selectedOption.diversionPort.name}.
            </span>
          </div>
          <button
            onClick={() => setIsDirectiveModalOpen(true)}
            className="text-emerald-400 hover:text-emerald-200 underline text-xs font-semibold"
          >
            View Directive
          </button>
        </div>
      )}

      {/* Trade-off Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 flex-1">
        {/* Original Port (Congested) */}
        <div className="p-4 rounded-lg bg-rose-950/10 border border-rose-900/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-rose-400 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Original Port (High Congestion)
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[10px] border border-rose-500/20">
                BL Destination
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {selectedOption.originalPort.name}
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              {selectedOption.originalPort.berthAvailability}
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-400" /> Pre-Berthing Wait:
                </span>
                <span className="font-semibold text-rose-400">
                  {selectedOption.originalPort.waitingDays.toFixed(1)} Days
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Demurrage Rate:</span>
                <span className="text-slate-300 font-mono">
                  {formatDailyRate(selectedOption.originalPort.demurrageRatePerDay)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-medium">Demurrage Penalty:</span>
                <span className="text-rose-400 font-bold font-mono text-sm">
                  {formatCurrency(selectedOption.originalPort.projectedDemurrage)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative Port (Recommended Diversion) */}
        <div className="p-4 rounded-lg bg-emerald-950/10 border border-emerald-900/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <Anchor className="w-4 h-4" />
                Diverted Port (Express Unloading)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] border border-emerald-500/20">
                Recommended
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {selectedOption.diversionPort.name}
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              {selectedOption.diversionPort.berthAvailability}
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Pre-Berthing Wait:
                </span>
                <span className="font-semibold text-emerald-400">
                  {selectedOption.diversionPort.waitingDays.toFixed(1)} Days
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Deviation Bunker:</span>
                <span className="text-slate-300 font-mono">
                  +{formatCurrency(selectedOption.diversionPort.deviationFuelCost)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Train className="w-3.5 h-3.5 text-blue-400" /> Rail Rake Freight Delta:
                </span>
                <span className="text-slate-300 font-mono">
                  +{formatCurrency(selectedOption.diversionPort.additionalRakeFreight)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-medium">Demurrage Penalty:</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">
                  {formatCurrency(selectedOption.diversionPort.projectedDemurrage)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Economics & Action */}
      <div className="mt-4 p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <div className="text-slate-400">Net Financial Savings</div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              +{formatCurrency(selectedOption.netSavingsUSD)}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-700 hidden sm:block" />
          <div>
            <div className="text-slate-400">Blast Furnace Delivery</div>
            <div className="text-sm font-semibold text-blue-400">
              {selectedOption.timeSavedDays.toFixed(1)} Days Earlier
            </div>
          </div>
          <div className="h-8 w-[1px] bg-slate-700 hidden sm:block" />
          <div>
            <div className="text-slate-400">Destination</div>
            <div className="text-xs font-medium text-slate-300">
              {selectedOption.targetPlant}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsDirectiveModalOpen(true)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg transition-all ${
            isExecuted
              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-900/30'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          {isExecuted ? 'View Dispatched Directive' : 'Dispatch Port Diversion Directive'}
        </button>
      </div>
      </>
      )}

      {/* Modal: Port Diversion Directive */}
      {isDirectiveModalOpen && selectedOption && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">
                    SAIL Maritime Port Diversion Directive Notice
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official dispatch to Master, Discharge Port Authorities, and Indian Railways (CONCOR)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDirectiveModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Directive content */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed max-h-[380px] overflow-y-auto whitespace-pre-wrap select-all">
              {generateDirectiveText(selectedOption)}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyDirective}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {directiveCopied ? 'Copied to Clipboard!' : 'Copy Directive'}
                </button>
                <button
                  onClick={handleDownloadDirective}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export .TXT Directive
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDirectiveModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition"
                >
                  Close
                </button>
                {!isExecuted && (
                  <button
                    onClick={handleExecuteDirective}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Authorize & Dispatch Directive
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiversionAnalysis;
