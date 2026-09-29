import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
  Send,
  FileCheck2,
  Copy,
  Check,
  Download,
  X,
  Loader2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useUiStore } from '../../../store/uiStore';
import { formatCurrency, formatRateMt, formatDailyRate } from '../../../lib/utils';

export interface StrategyComparisonProps {
  vessel?: any;
  loadPort?: any;
  dischPort?: any;
  cargoQty?: number;
  marketRateUsdMt?: number;
  className?: string;
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const StrategyComparison: React.FC<StrategyComparisonProps> = ({
  vessel,
  loadPort,
  dischPort,
  cargoQty = 160000,
  marketRateUsdMt = 12.50,
  className,
}) => {
  const { currency } = useUiStore();

  // Active Execution States
  const [activeStrategy, setActiveStrategy] = useState<'COA' | 'SPOT' | 'TIME_CHARTER'>('COA');
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [showFixtureModal, setShowFixtureModal] = useState(false);

  // Counter Offer State
  const [counterOfferDispatched, setCounterOfferDispatched] = useState<any | null>(null);
  const [fixtureExecuted, setFixtureExecuted] = useState<any | null>(null);

  // Counter Offer Form States
  const [counterRate, setCounterRate] = useState<number>(11.20);
  const [laycanWindow, setLaycanWindow] = useState('15 Oct – 25 Oct 2026');
  const [demurrageRate, setDemurrageRate] = useState(24000);
  const [despatchRate, setDespatchRate] = useState(12000);
  const [validityTime, setValidityTime] = useState('18:00 IST Today');
  const [remarks, setRemarks] = useState('Subject to stem & steel plant receiver approval');
  const [copied, setCopied] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  // Fixture Note Form States
  const [signatoryName, setSignatoryName] = useState('Aradhya (Chartering Manager)');
  const [designation, setDesignation] = useState('DGM (Shipping & Chartering), SAIL');
  const [complianceAccepted, setComplianceAccepted] = useState(true);
  const [isSigning, setIsSigning] = useState(false);

  const vesselName = vessel?.vessel_name || vessel?.vesselName || 'MV Ocean Ambition';
  const vesselClass = vessel?.vessel_class || vessel?.vesselClass || 'Capesize';
  const loadPortName = loadPort?.port_name || 'Gladstone Port, Australia';
  const dischPortName = dischPort?.port_name || 'Paradip Port, India';

  // Savings Calculations
  const ownerQuotationTotal = cargoQty * marketRateUsdMt;
  const counterTotal = cargoQty * counterRate;
  const savings = Math.max(0, ownerQuotationTotal - counterTotal);

  // Dynamic Baltic Telex Text
  const telexText = `URGENT / CHARTERING COUNTER-OFFER
DATE:         ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
TO:           OWNERS / DISPONENT OWNERS OF "${vesselName.toUpperCase()}"
FROM:         STEEL AUTHORITY OF INDIA LIMITED (SAIL) - CHARTERING DEPT
RE:           FIXTURE RE-NEGOTIATION - COAL PARCEL ${cargoQty.toLocaleString()} MT 10% MOLOO
----------------------------------------------------------------------
WE REFER TO YOUR FIRM OFFER OF USD ${marketRateUsdMt.toFixed(2)}/MT.
SAIL HEREBY CONFIRMS COMMERCIAL COUNTER-OFFER ON FOLLOWING STRICT TERMS:

1. VESSEL:       ${vesselName.toUpperCase()} (${vesselClass.toUpperCase()})
2. CHARTERERS:   STEEL AUTHORITY OF INDIA LIMITED (SAIL)
3. CARGO:        ${cargoQty.toLocaleString()} MT +/- 10% MOLOO HARD COKING COAL
4. LOAD PORT:    1-2 SAFE BERTH(S) ${loadPortName.toUpperCase()}
5. DISCH PORT:   1-2 SAFE BERTH(S) ${dischPortName.toUpperCase()}
6. LAYCAN:       ${laycanWindow}
7. FREIGHT RATE: USD ${counterRate.toFixed(2)} / METRIC TON FIOST BSS 1:1
8. DEMURRAGE:    USD ${demurrageRate.toLocaleString()} / DAY OR PRORATA
9. DESPATCH:     USD ${despatchRate.toLocaleString()} / DAY (DHD - HALF DEMURRAGE)
10. GOVERNING:   GENCON 1994 AS AMENDED WITH SAIL STANDARD RIDER CLAUSES
11. VALIDITY:    VALID UNTIL ${validityTime}
12. SPECIAL:     ${remarks}

AUTHORIZATION: DEPUTY GENERAL MANAGER (CHARTERING), SAIL SHIPPING DIVISION
----------------------------------------------------------------------`;

  const fixtureNoteText = `======================================================================
                 OFFICIAL CHARTERPARTY FIXTURE NOTE
              STEEL AUTHORITY OF INDIA LIMITED (SAIL)
Ref: SAIL/CHTR/FXT/2026/Q4-089                     Date: ${new Date().toLocaleDateString('en-IN')}
======================================================================
IT IS MUTUALLY AGREED BETWEEN:
CHARTERERS:  STEEL AUTHORITY OF INDIA LIMITED (SAIL), NEW DELHI, INDIA
OWNERS:      DISPONENT OWNERS OF MV ${vesselName.toUpperCase()}

1. VESSEL PARTICULARS:
   - Name: ${vesselName} | Class: ${vesselClass}
   - Flag: Singapore | Class Society: Lloyd's Register
2. CARGO & VOYAGE:
   - Commodity: Prime Hard Coking Coal in Bulk (${cargoQty.toLocaleString()} MT)
   - Loading Port: ${loadPortName}
   - Discharging Port: ${dischPortName}
3. COMMERCIAL FREIGHT:
   - Agreed Rate: USD ${counterRate.toFixed(2)} / MT (Total Committed: USD ${counterTotal.toLocaleString()})
   - Demurrage: USD ${demurrageRate.toLocaleString()}/day | Despatch: USD ${despatchRate.toLocaleString()}/day
4. GOVERNING LAW & JURISDICTION:
   - Indian Maritime Arbitration Council (IMAC), New Delhi.

AUTHORIZED SIGNATURE: ${signatoryName} [${designation}]
COMPLIANCE STATUS: Cleared under Public Procurement Policy & Board Powers.
======================================================================`;

  const handleCopyTelex = () => {
    navigator.clipboard.writeText(telexText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDispatchCounter = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setCounterOfferDispatched({
        counterRate,
        savings,
        laycan: laycanWindow,
        timestamp: new Date().toLocaleTimeString(),
      });
      setShowCounterOfferModal(false);
    }, 400);
  };

  const handleSignFixture = () => {
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      setFixtureExecuted({
        ref: 'SAIL/CHTR/FXT/2026/Q4-089',
        vessel: vesselName,
        rate: counterRate,
        signatory: signatoryName,
        timestamp: new Date().toLocaleTimeString(),
      });
      setShowFixtureModal(false);
    }, 400);
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Execution Banners */}
      {counterOfferDispatched && !fixtureExecuted && (
        <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Firm Counter-Offer Dispatched to Broker · {formatRateMt(counterOfferDispatched.counterRate)}
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-300">
                Targeted Savings: <strong>{formatCurrency(counterOfferDispatched.savings)}</strong> · Dispatched at {counterOfferDispatched.timestamp} IST
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCounterOfferModal(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
          >
            Revise Terms / View Telex
          </button>
        </div>
      )}

      {fixtureExecuted && (
        <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white">
                Official Charter Fixture Executed: #{fixtureExecuted.ref}
              </div>
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                Vessel: <strong>{fixtureExecuted.vessel}</strong> · Rate: <strong>{formatRateMt(fixtureExecuted.rate)}</strong> · Authorized by {fixtureExecuted.signatory}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => downloadTextFile('SAIL_Executed_Fixture_Note.txt', fixtureNoteText)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs flex items-center gap-1"
          >
            <Download size={13} />
            <span>Download Legal Note</span>
          </button>
        </div>
      )}

      {/* Strategy Comparison Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Chartering Strategy Optimization Engine
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Contract of Affreightment (COA) vs. Spot Fixture vs. Time Charter economics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCounterOfferModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Send size={13} />
              <span>Generate Counter-Offer</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFixtureModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileCheck2 size={13} />
              <span>Approve & Issue Fixture</span>
            </button>
          </div>
        </div>

        {/* 3 Strategy Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Strategy 1: COA */}
          <div
            onClick={() => setActiveStrategy('COA')}
            className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
              activeStrategy === 'COA'
                ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 dark:text-white">Contract of Affreightment</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                RECOMMENDED
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {marketRateUsdMt > 0 ? formatRateMt(Number((marketRateUsdMt * 0.95).toFixed(2))) : '—'}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed mb-3">
              Multi-voyage volume commitment securing locked freight and priority berthing at Paradip.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Commitment:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {marketRateUsdMt > 0 ? formatCurrency(marketRateUsdMt * 0.95 * (cargoQty || 160000)) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Expected Savings:</span>
                <span>
                  {marketRateUsdMt > 0
                    ? `${formatCurrency(marketRateUsdMt * 0.05 * (cargoQty || 160000))} (5.0%)`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Strategy 2: Spot */}
          <div
            onClick={() => setActiveStrategy('SPOT')}
            className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
              activeStrategy === 'SPOT'
                ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 dark:text-white">Spot Voyage Fixture</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                FLEXIBLE
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {formatRateMt(marketRateUsdMt)}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed mb-3">
              Single voyage fixture matching immediate laycan window. Subject to spot volatility.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Commitment:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(cargoQty * marketRateUsdMt)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Market Volatility:</span>
                <span className="font-semibold text-amber-500">Medium (±4.2%)</span>
              </div>
            </div>
          </div>

          {/* Strategy 3: Time Charter */}
          <div
            onClick={() => setActiveStrategy('TIME_CHARTER')}
            className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
              activeStrategy === 'TIME_CHARTER'
                ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 dark:text-white">Time Charter (Trip)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                DEDICATED
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {formatDailyRate(24500)}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed mb-3">
              Charter hire on daily basis. Charterer bears bunker risk and port operational delays.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Implied / MT:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{formatRateMt(12.95)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Bunker Risk:</span>
                <span className="font-semibold text-rose-500">On Charterer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COUNTER-OFFER MODAL */}
      {showCounterOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Commercial Counter-Offer & Baltic Telex Dispatch
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target Vessel: <strong>{vesselName}</strong> ({vesselClass})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCounterOfferModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Savings Calculator Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-slate-850 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Projected Savings for SAIL</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(savings)}
                  </div>
                </div>
                <div className="text-right text-[11px]">
                  <div className="text-slate-400">Owner Quote: {formatRateMt(marketRateUsdMt)}</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400">Counter: {formatRateMt(counterRate)}</div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Counter Freight Rate ($/MT)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={counterRate}
                    onChange={(e) => setCounterRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Laycan Window</label>
                  <input
                    type="text"
                    value={laycanWindow}
                    onChange={(e) => setLaycanWindow(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Demurrage ($/Day)</label>
                  <input
                    type="number"
                    value={demurrageRate}
                    onChange={(e) => setDemurrageRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Offer Validity</label>
                  <input
                    type="text"
                    value={validityTime}
                    onChange={(e) => setValidityTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Telex Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Generated Baltic Commercial Telex</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyTelex}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 flex items-center gap-1"
                    >
                      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadTextFile(`SAIL_Counter_Offer_${vesselName}.txt`, telexText)}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 flex items-center gap-1"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto max-h-36 select-all border border-slate-800">
                  {telexText}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Logged in SAIL Commercial Audit Ledger</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCounterOfferModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDispatchCounter}
                  disabled={isDispatching}
                  className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {isDispatching ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Dispatch Counter-Offer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIXTURE NOTE MODAL */}
      {showFixtureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <FileCheck2 size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Approve & Issue Charterparty Fixture Note
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official fixture recap & legal agreement execution under IMAC New Delhi jurisdiction
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFixtureModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500">Fixture Reference</div>
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                    SAIL/CHTR/FXT/2026/Q4-089
                  </div>
                </div>
                <div className="text-right font-bold text-slate-900 dark:text-white">
                  Total Value: {formatCurrency(counterTotal)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Authorizing Signatory</label>
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Corporate Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={complianceAccepted}
                    onChange={(e) => setComplianceAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600"
                  />
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    I confirm this charter fixture complies with SAIL Delegated Financial Powers, standard Gencon terms, and IMAC dispute resolution protocols.
                  </span>
                </label>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto max-h-36 select-all border border-slate-800">
                {fixtureNoteText}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <button
                type="button"
                onClick={() => downloadTextFile('SAIL_Fixture_Note_Q4_089.txt', fixtureNoteText)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1 text-xs font-semibold"
              >
                <Download size={13} />
                <span>Export Note</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFixtureModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSignFixture}
                  disabled={isSigning || !complianceAccepted}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-xs text-xs"
                >
                  {isSigning ? <Loader2 size={14} className="animate-spin" /> : <FileCheck2 size={14} />}
                  <span>Sign & Execute Fixture Note</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
