import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  DollarSign,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  X,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { formatCurrency, formatRateMt } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';

interface CoAPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (coaPlan: any) => void;
}

export const CoAPlannerModal: React.FC<CoAPlannerModalProps> = ({ isOpen, onClose, onSave }) => {
  const { currency } = useUiStore();

  const [totalVolumeMt, setTotalVolumeMt] = useState<number>(1000000); // 1 Million MT
  const [durationMonths, setDurationMonths] = useState<number>(6); // 6 Months
  const [cargoType, setCargoType] = useState<string>('Hard Coking Coal (Bowen Basin)');
  const [originPort, setOriginPort] = useState<string>('Hay Point Port (Australia)');
  const [destinationPort, setDestinationPort] = useState<string>('Paradip Port (East Coast India)');
  const [vesselClass, setVesselClass] = useState<'CAPESIZE' | 'PANAMAX'>('CAPESIZE');
  const [frequency, setFrequency] = useState<'BIWEEKLY' | 'MONTHLY' | 'EVERY_21_DAYS'>('MONTHLY');

  // Parcel capacity per class
  const parcelCapacityMt = vesselClass === 'CAPESIZE' ? 165000 : 75000;
  const spotBenchmarkUsd = vesselClass === 'CAPESIZE' ? 12.80 : 14.50;

  // Multi-voyage calculations
  const simulation = useMemo(() => {
    const voyagesNeeded = Math.ceil(totalVolumeMt / parcelCapacityMt);
    const coaVolumePerVoyage = Math.round(totalVolumeMt / voyagesNeeded);

    // CoA volume discount typically ranges from 5% to 9% over spot equivalent
    const coaDiscountPct = 6.8;
    const coaRateUsd = Math.round((spotBenchmarkUsd * (1 - coaDiscountPct / 100)) * 100) / 100;
    const savingsPerMt = Math.round((spotBenchmarkUsd - coaRateUsd) * 100) / 100;
    const totalSavingsUsd = Math.round(savingsPerMt * totalVolumeMt);
    const totalSavingsInr = Math.round(totalSavingsUsd * 86.85);

    // Generate schedule
    const schedule = [];
    const startDate = new Date();
    const daysBetweenVoyages = Math.floor((durationMonths * 30) / voyagesNeeded);

    for (let i = 1; i <= voyagesNeeded; i++) {
      const laycanStart = new Date(startDate.getTime() + (i - 1) * daysBetweenVoyages * 86400000);
      const laycanEnd = new Date(laycanStart.getTime() + 7 * 86400000); // 7-day laycan spread
      schedule.push({
        voyageNo: i,
        parcelMt: coaVolumePerVoyage,
        laycan: `${laycanStart.toLocaleDateString('default', { day: 'numeric', month: 'short' })} – ${laycanEnd.toLocaleDateString('default', { day: 'numeric', month: 'short' })}`,
        estimatedRateUsd: coaRateUsd,
      });
    }

    return {
      voyagesNeeded,
      coaVolumePerVoyage,
      coaDiscountPct,
      coaRateUsd,
      savingsPerMt,
      totalSavingsUsd,
      totalSavingsInr,
      schedule
    };
  }, [totalVolumeMt, durationMonths, vesselClass, parcelCapacityMt, spotBenchmarkUsd]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-primary/10 text-primary rounded-xl">
              <Layers className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Multi-Voyage Contract (CoA) Strategic Planner
              </h3>
              <p className="text-xs text-muted-foreground">
                Model multi-voyage Contracts of Affreightment (CoA) to hedge spot rate volatility and secure volume discounts (Section 1.1 FR-008).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Volume */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Total Contract Volume (MT):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={50000}
                  min={200000}
                  max={5000000}
                  value={totalVolumeMt}
                  onChange={(e) => setTotalVolumeMt(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs font-bold font-mono text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Typical SAIL mill tender: 800k–2.5M MT
              </span>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Contract Period (Months):
              </label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value={3}>3 Months (Short-Term CoA)</option>
                <option value={6}>6 Months (Medium-Term CoA)</option>
                <option value={12}>12 Months (Annual Supply CoA)</option>
              </select>
            </div>

            {/* Vessel Class */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Vessel Class:
              </label>
              <select
                value={vesselClass}
                onChange={(e) => setVesselClass(e.target.value as any)}
                className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="CAPESIZE">Capesize (~165,000 MT / voyage)</option>
                <option value="PANAMAX">Panamax (~75,000 MT / voyage)</option>
              </select>
            </div>

            {/* Origin */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Origin Port:</label>
              <select
                value={originPort}
                onChange={(e) => setOriginPort(e.target.value)}
                className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="Hay Point Port (Australia)">Hay Point (Australia)</option>
                <option value="Dalrymple Bay (Australia)">Dalrymple Bay (Australia)</option>
                <option value="Hampton Roads (USA)">Hampton Roads / Norfolk (USA)</option>
                <option value="Nacala Coal Terminal (Mozambique)">Nacala (Mozambique)</option>
                <option value="East Kalimantan (Indonesia)">East Kalimantan (Indonesia)</option>
              </select>
            </div>

            {/* Destination */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Discharge Port:</label>
              <select
                value={destinationPort}
                onChange={(e) => setDestinationPort(e.target.value)}
                className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="Paradip Port (East Coast India)">Paradip Port (East Coast India)</option>
                <option value="Dhamra Port (East Coast India)">Dhamra Port (East Coast India)</option>
                <option value="Visakhapatnam Port (Outer Harbour)">Visakhapatnam Port (Outer Harbour)</option>
                <option value="Gangavaram Port">Gangavaram Port</option>
                <option value="Haldia / Sagar Sandheads">Haldia / Sagar Sandheads</option>
              </select>
            </div>

            {/* Cargo Type */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Cargo Grade:</label>
              <input
                type="text"
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Strategic Comparison Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-sm">
                <Sparkles className="w-6 h-6" />
              </span>
              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  Projected CoA Economy of Scale
                </span>
                <div className="text-xl font-extrabold text-foreground font-mono mt-0.5">
                  ${simulation.coaRateUsd.toFixed(2)} / MT{' '}
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    ({simulation.coaDiscountPct}% below spot benchmark of ${spotBenchmarkUsd.toFixed(2)})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Structured as {simulation.voyagesNeeded} sequenced voyages across {durationMonths} months.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Total Expected Procurement Savings:</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(simulation.totalSavingsUsd, { currencyOverride: 'USD' })}
              </span>
              <span className="text-xs font-bold text-muted-foreground font-mono block">
                ≈ {formatCurrency(simulation.totalSavingsInr, { currencyOverride: 'INR' })}
              </span>
            </div>
          </div>

          {/* Simulated Voyage Delivery Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                Sequenced Voyage Program ({simulation.voyagesNeeded} Lifting Laycans)
              </h4>
              <span className="text-[11px] text-muted-foreground">
                Parcel sizing compliant with discharge port draft limits
              </span>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Lift #</th>
                    <th className="py-2.5 px-3 font-semibold">Laycan Window</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Parcel Size (MT)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Target Rate ($/MT)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Freight Outlay ($)</th>
                    <th className="py-2.5 px-3 font-semibold">Hedge Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {simulation.schedule.map((item) => (
                    <tr key={item.voyageNo} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-bold text-primary font-mono">
                        Voyage #{item.voyageNo}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {item.laycan}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {item.parcelMt.toLocaleString()} MT
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                        ${item.estimatedRateUsd.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(Math.round(item.parcelMt * item.estimatedRateUsd), { currencyOverride: 'USD' })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[10px] font-semibold">
                          Locked under CoA
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Mitigation Assessment */}
          <div className="p-3.5 bg-muted/20 border border-border rounded-xl space-y-1.5 text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Contract of Affreightment (CoA) Governance & Risk Clauses:
            </span>
            <p className="text-muted-foreground leading-relaxed">
              • <strong>Bunker Escalation Clause:</strong> Rates adjusted quarterly against Singapore VLSFO benchmark with a ±$25/MT neutral collar.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              • <strong>Tonnage Replacement Guarantee:</strong> Shipowner contractually obligated to provide substitute sister vessel within 5 calendar days in event of mechanical breakdown.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              • <strong>Port Congestion Demurrage Cap:</strong> Standard reversible laytime (30,000 MT/WWDSHEX at Paradip) protected by demurrage capping at $18,000/day.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/40">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border text-xs font-semibold rounded-lg text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onSave) {
                  onSave({
                    contractType: 'COA',
                    totalVolumeMt,
                    durationMonths,
                    cargoType,
                    originPort,
                    destinationPort,
                    vesselClass,
                    ...simulation
                  });
                }
                onClose();
              }}
              className="px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-sm hover:opacity-90 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Generate & Submit CoA Fixture Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoAPlannerModal;
