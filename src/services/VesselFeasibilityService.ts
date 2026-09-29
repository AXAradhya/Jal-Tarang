/**
 * JAL TARANG — Vessel & Berth Feasibility Matching Service
 *
 * Evaluates physical vessel dimensions (LOA, Beam, Summer Draft, DWT)
 * and mechanical crane/gear capabilities (geared vs gearless, shore unloader rates)
 * against port and berth constraints across India's East Coast port cluster.
 */

export interface FeasibilityCheckParams {
  vessel: {
    loa: number;          // Length Overall in meters
    beam: number;         // Beam in meters
    summerDraft: number;  // Summer draft in meters
    dwt: number;          // Deadweight tonnage in MT
    hasGear?: boolean;    // True if vessel has onboard cranes/grabs (e.g. 4x30T cranes)
    gearDetails?: string; // Crane specs e.g. "4 x 30 MT SWL electro-hydraulic cranes"
  };
  portConstraints: {
    maxLoa?: number;
    maxBeam?: number;
    maxDraft?: number;
    channelDraft?: number;
    berthDraft?: number;
    maxDwt?: number;
    requiresGearedVessel?: boolean; // True if berth has no shore unloader or slow cranes
    shoreCraneHandlingRateMtDay?: number; // e.g. 8,000 MT/day slow vs 25,000 MT/day high-speed
    demurrageRateUsdDay?: number; // Default $30,000/day
  };
  cargoQuantityMt?: number; // Default 50,000 MT for Supramax / 120,000 MT for Capesize
}

export interface FeasibilityResult {
  isFeasible: boolean;
  loaCompatible: boolean;
  beamCompatible: boolean;
  draftCompatible: boolean;
  dwtCompatible: boolean;
  gearCompatible: boolean;
  handlingRateFeasible: boolean;
  craneDemurrageAnalysis?: {
    berthHandlingRateMtDay: number;
    dischargeDurationDays: number;
    baselineDurationDays: number;
    extraDemurrageDays: number;
    demurrageImpactUsd: number;
    netSavingsFromGearedVesselUsd: number;
    recommendation: string;
  };
  violations: string[];
  operationalWarnings: string[];
}

export type VesselCompatibilityResult = FeasibilityResult;

export class VesselFeasibilityService {
  /**
   * Assesses vessel physical dimensions and crane/gear compatibility against port constraints
   */
  public static checkCompatibility(params: FeasibilityCheckParams): FeasibilityResult {
    const { vessel, portConstraints, cargoQuantityMt = 50000 } = params;
    const violations: string[] = [];
    const operationalWarnings: string[] = [];

    // 1. Check LOA
    const loaPositive = vessel.loa > 0;
    const loaCompatible = loaPositive && (!portConstraints.maxLoa || vessel.loa <= portConstraints.maxLoa);
    if (!loaPositive) {
      violations.push(`LOA violation: Vessel LOA must be greater than 0m (received ${vessel.loa}m)`);
    } else if (!loaCompatible) {
      violations.push(`LOA violation: Vessel LOA ${vessel.loa}m exceeds maximum allowed ${portConstraints.maxLoa}m`);
    }

    // 2. Check Beam
    const beamPositive = vessel.beam > 0;
    const beamCompatible = beamPositive && (!portConstraints.maxBeam || vessel.beam <= portConstraints.maxBeam);
    if (!beamPositive) {
      violations.push(`Beam violation: Vessel Beam must be greater than 0m (received ${vessel.beam}m)`);
    } else if (!beamCompatible) {
      violations.push(`Beam violation: Vessel Beam ${vessel.beam}m exceeds maximum allowed ${portConstraints.maxBeam}m`);
    }

    // 3. Check Draft (channel and berth)
    const draftPositive = vessel.summerDraft > 0;
    const effectiveMaxDraft = Math.min(
      portConstraints.maxDraft ?? Infinity,
      portConstraints.channelDraft ?? Infinity,
      portConstraints.berthDraft ?? Infinity
    );
    const draftCompatible = draftPositive && (effectiveMaxDraft === Infinity || vessel.summerDraft <= effectiveMaxDraft);
    if (!draftPositive) {
      violations.push(`Draft violation: Vessel draft must be greater than 0m (received ${vessel.summerDraft}m)`);
    } else if (!draftCompatible) {
      violations.push(`Draft violation: Vessel draft ${vessel.summerDraft}m exceeds effective limit ${effectiveMaxDraft}m`);
    }

    // 4. Check DWT
    const dwtPositive = vessel.dwt > 0;
    const dwtCompatible = dwtPositive && (!portConstraints.maxDwt || vessel.dwt <= portConstraints.maxDwt);
    if (!dwtPositive) {
      violations.push(`DWT violation: Vessel DWT must be greater than 0 MT (received ${vessel.dwt} MT)`);
    } else if (!dwtCompatible) {
      violations.push(`DWT violation: Vessel DWT ${vessel.dwt} MT exceeds maximum allowed ${portConstraints.maxDwt} MT`);
    }

    // 5. Check Gear / Crane Capability (Feature D)
    let gearCompatible = true;
    let handlingRateFeasible = true;
    let craneDemurrageAnalysis: FeasibilityResult['craneDemurrageAnalysis'] = undefined;

    const requiresGear = portConstraints.requiresGearedVessel === true;
    const hasGear = vessel.hasGear === true;

    if (requiresGear && !hasGear) {
      gearCompatible = false;
      violations.push(
        `Gear violation: Berth requires geared vessel with onboard cranes/grabs. Vessel is gearless, causing discharge inability or catastrophic demurrage.`
      );
    } else if (!requiresGear && hasGear) {
      operationalWarnings.push(
        `Berth has functional high-speed shore unloaders. Geared vessel onboard cranes will be idle ($1.50–$2.00/MT time-charter premium incurred). Consider gearless bulk carrier if available.`
      );
    }

    // Mathematical evaluation of crane handling rate vs demurrage
    if (portConstraints.shoreCraneHandlingRateMtDay) {
      const handlingRate = portConstraints.shoreCraneHandlingRateMtDay;
      const standardRate = 25000; // Standard high-speed bulk terminal unloader rate (MT/day)
      const demurrageRateDay = portConstraints.demurrageRateUsdDay ?? 30000;

      const actualDurationDays = cargoQuantityMt / handlingRate;
      const baselineDurationDays = cargoQuantityMt / standardRate;
      const extraDays = Math.max(0, actualDurationDays - baselineDurationDays);
      const extraDemurrageUsd = extraDays * demurrageRateDay;

      // Geared Supramax TCE premium is ~$2.00/MT
      const gearedPremiumUsd = 2.0 * cargoQuantityMt;
      const netSavingsUsd = extraDemurrageUsd - gearedPremiumUsd;

      craneDemurrageAnalysis = {
        berthHandlingRateMtDay: handlingRate,
        dischargeDurationDays: Number(actualDurationDays.toFixed(2)),
        baselineDurationDays: Number(baselineDurationDays.toFixed(2)),
        extraDemurrageDays: Number(extraDays.toFixed(2)),
        demurrageImpactUsd: Math.round(extraDemurrageUsd),
        netSavingsFromGearedVesselUsd: Math.round(netSavingsUsd),
        recommendation: handlingRate < 12000
          ? `Slow shore crane (${handlingRate.toLocaleString()} MT/day). Extra demurrage: $${Math.round(extraDemurrageUsd).toLocaleString()}. Chartering geared Supramax achieves net savings of $${Math.round(netSavingsUsd).toLocaleString()} per voyage.`
          : `Fast shore discharge (${handlingRate.toLocaleString()} MT/day). Berth accommodates gearless vessels efficiently.`,
      };

      if (handlingRate < 6000 && !hasGear) {
        handlingRateFeasible = false;
        operationalWarnings.push(`Severe handling rate bottleneck (${handlingRate} MT/day). Unberthing turnaround exceeds 8 days.`);
      }
    }

    const isFeasible = loaCompatible && beamCompatible && draftCompatible && dwtCompatible && gearCompatible;

    return {
      isFeasible,
      loaCompatible,
      beamCompatible,
      draftCompatible,
      dwtCompatible,
      gearCompatible,
      handlingRateFeasible,
      craneDemurrageAnalysis,
      violations,
      operationalWarnings,
    };
  }
}
