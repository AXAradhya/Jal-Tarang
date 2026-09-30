import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { forecastApi } from '../../api';
import {
  TrendingUp,
  Scale,
  Train,
  Anchor,
  ShieldCheck,
  AlertCircle,
  Percent,
  Sliders,
  DollarSign,
  ArrowRight,
  BookOpen,
  Award,
} from 'lucide-react';

export const MaritimeElasticityWidget: React.FC = () => {
  const [freightChange, setFreightChange] = useState<number>(15);
  const [railChange, setRailChange] = useState<number>(-4);
  const [parcelVolume, setParcelVolume] = useState<number>(120000);

  const { data: elasticityData } = useQuery({
    queryKey: ['elasticityAnalysis'],
    queryFn: () => forecastApi.getElasticityAnalysis(),
    staleTime: 120_000,
  });

  const simMutation = useMutation({
    mutationFn: (payload: any) => forecastApi.simulateModalShift(payload),
  });

  // Trigger simulation on input changes
  React.useEffect(() => {
    simMutation.mutate({
      freightRateChangePct: freightChange,
      railTariffChangePct: railChange,
      baseCargoVolumeMt: parcelVolume,
    });
  }, [freightChange, railChange, parcelVolume]);

  const simResult = simMutation.data;
  const metrics = elasticityData?.elasticityMetrics || [];
  const baseline = elasticityData?.modalSubstitutionBaseline;

  return (
    <div className="space-y-6">
      {/* Academic Citation Header */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-teal-950/60 border border-emerald-800/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Award size={11} /> Maritime Economics (GMU / NFSU 2024)
              </span>
              <span className="text-xs text-slate-400">Dr. Vrajlal Sapovadia</span>
            </div>
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
              Econometric Demand Elasticities & Multimodal Substitution Simulator
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Formulated for the Indian dry bulk shipping sector under the <strong>National Steel Policy 2030</strong> (300 MMT target) and <strong>Sagarmala Programme</strong>. Models cargo sensitivity to freight rates (PED), modal cross-elasticity between Sandheads lighterage and Dhamra FOIS rail (CPED), and economic growth elasticity (IED).
            </p>
          </div>
        </div>
      </div>

      {/* 3 Core Elasticity Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m: any) => (
          <div
            key={m.code}
            className="bg-card border border-border rounded-xl p-4 space-y-2.5 shadow-sm hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary font-mono">{m.code}</span>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-semibold">
                {m.classification}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground tabular-nums">{m.value > 0 ? `+${m.value}` : m.value}</span>
              <span className="text-xs text-muted-foreground">{m.title}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {m.operationalInterpretation}
            </p>
            <div className="pt-2 border-t border-border/60 text-[11px] text-primary/90 flex items-center gap-1 font-medium">
              <ShieldCheck size={12} />
              <span>{m.policyContext}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Sensitivity & Modal Shift Simulator */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Sliders size={16} className="text-primary" />
              <span>Dynamic Modal Substitution & Landed Cost Simulator</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Adjust ocean freight and Indian Railways FOIS rake tariff shifts to simulate volume migration and landed costs.
            </p>
          </div>
        </div>

        {/* Input Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/30 p-4 rounded-xl border border-border/50">
          {/* Freight Rate Change Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Ocean Spot Freight Shift (ΔP Freight):</span>
              <span className={`font-bold font-mono ${freightChange >= 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {freightChange >= 0 ? `+${freightChange}%` : `${freightChange}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="50"
              step="1"
              value={freightChange}
              onChange={(e) => setFreightChange(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>-30% (Slump)</span>
              <span>0% (Parity)</span>
              <span>+50% (Spike)</span>
            </div>
          </div>

          {/* Rail Tariff Change Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">FOIS Rail Tariff Shift (ΔP Rail):</span>
              <span className={`font-bold font-mono ${railChange >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {railChange >= 0 ? `+${railChange}%` : `${railChange}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={railChange}
              onChange={(e) => setRailChange(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>-20% (Concession)</span>
              <span>0% (Standard)</span>
              <span>+20% (Surcharge)</span>
            </div>
          </div>

          {/* Cargo Parcel Size */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Cargo Parcel Volume (MT):</span>
              <span className="font-bold font-mono text-primary">{parcelVolume.toLocaleString()} MT</span>
            </div>
            <input
              type="range"
              min="30000"
              max="200000"
              step="5000"
              value={parcelVolume}
              onChange={(e) => setParcelVolume(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>35k (Handysize)</span>
              <span>75k (Panamax)</span>
              <span>180k (Capesize)</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Results */}
        {simResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
            {/* Modal Reallocation Balance */}
            <div className="lg:col-span-2 bg-muted/20 border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Projected Route Volume Reallocation
                </span>
                <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                  {simResult.modalReallocation.shiftDirection}
                </span>
              </div>

              {/* Progress bars comparison */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Anchor size={13} className="text-sky-400" />
                      Option A: Sandheads Lighterage & Daughter Barges to Haldia
                    </span>
                    <span className="font-bold text-foreground font-mono">
                      {simResult.modalReallocation.sandheadsLighterageMt.toLocaleString()} MT (
                      {(
                        (simResult.modalReallocation.sandheadsLighterageMt /
                          simResult.projectedVolumeDemandedMt) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${(simResult.modalReallocation.sandheadsLighterageMt / simResult.projectedVolumeDemandedMt) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Train size={13} className="text-emerald-400" />
                      Option B: Dhamra Direct Discharge (18m draft) + FOIS Rail Rakes
                    </span>
                    <span className="font-bold text-foreground font-mono">
                      {simResult.modalReallocation.dhamraDirectRailMt.toLocaleString()} MT (
                      {(
                        (simResult.modalReallocation.dhamraDirectRailMt /
                          simResult.projectedVolumeDemandedMt) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${(simResult.modalReallocation.dhamraDirectRailMt / simResult.projectedVolumeDemandedMt) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-background/80 p-2.5 rounded-lg border border-border/60">
                  <div className="text-[10px] text-muted-foreground">Price Elasticity Demand Drift:</div>
                  <div className="font-bold text-foreground text-sm font-mono">
                    {simResult.predictedDemandChangePct > 0 ? `+${simResult.predictedDemandChangePct}%` : `${simResult.predictedDemandChangePct}%`}
                  </div>
                </div>
                <div className="bg-background/80 p-2.5 rounded-lg border border-border/60">
                  <div className="text-[10px] text-muted-foreground">Volume Shifted:</div>
                  <div className="font-bold text-primary text-sm font-mono">
                    {simResult.modalReallocation.shiftedVolumeMt.toLocaleString()} MT
                  </div>
                </div>
                <div className="bg-background/80 p-2.5 rounded-lg border border-border/60">
                  <div className="text-[10px] text-muted-foreground">Landed Cost Delta:</div>
                  <div className="font-bold text-emerald-500 text-sm font-mono">
                    ₹{Math.abs(simResult.financialImpact.estimatedLandedCostDeltaInrPerMt)} / MT
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Procurement Recommendation */}
            <div className="bg-gradient-to-br from-card to-muted/40 border border-border rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={13} /> Recommended Procurement Mix
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  {simResult.procurementRecommendation.recommendedContractStructure}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {simResult.procurementRecommendation.strategicReasoning}
                </p>
              </div>

              <div className="bg-background/90 p-3 rounded-lg border border-border space-y-1">
                <div className="text-[10px] text-muted-foreground">Net Arbitrage Value:</div>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹{(simResult.financialImpact.netSavingsOrSurplusInr / 100000).toFixed(1)} Lakh
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Evaluated across {parcelVolume.toLocaleString()} MT shipment.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
