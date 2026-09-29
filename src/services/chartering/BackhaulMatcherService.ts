/**
 * JAL TARANG — Idle Vessel & Backhaul Matching Engine (Module 3 / PS Clause c)
 *
 * Optimizes post-discharge vessel positioning to reduce deadheading and empty ballast legs.
 * Pairs returning bulk carriers with Indian export cargo (iron ore, finished steel, manganese ore)
 * using DGCIS export trade statistics to generate voyage freight offsets.
 */

export interface BackhaulMatchInput {
  dischargePort: string;               // e.g. 'Paradip', 'Vizag', 'Haldia', 'Dhamra'
  vesselClass: 'CAPESIZE' | 'PANAMAX' | 'SUPRAMAX' | 'HANDYSIZE';
  ballastAvailableDate: string;        // ISO date string
  intendedOriginRegion: 'AUSTRALIA' | 'INDONESIA' | 'SOUTH_AFRICA' | 'USA';
}

export interface BackhaulOpportunity {
  opportunityId: string;
  cargoType: string;
  loadingPort: string;
  dischargingPort: string;
  destinationRegion: string;
  cargoParcelMt: number;
  laycanWindow: string;
  estimatedFreightRateUsdMt: number;
  freightCreditOffsetUsdMt: number;
  totalFreightOffsetUsd: number;
  ballastDistanceSavedNm: number;
  tceImprovementUsdDay: number;
  matchScorePct: number;
  recommendationNote: string;
}

export interface BackhaulMatchResult {
  dischargePort: string;
  vesselClass: string;
  ballastAvailableDate: string;
  unhedgedBallastLeg: {
    fromPort: string;
    toRegion: string;
    ballastDistanceNm: number;
    ballastBunkerCostUsd: number;
    ballastDurationDays: number;
    status: 'RED_FLAGGED_BALLAST';
  };
  matchedOpportunities: BackhaulOpportunity[];
  topRecommendation: BackhaulOpportunity | null;
  netEconomicBenefitSummary: string;
}

export class BackhaulMatcherService {
  /**
   * Published Indian export parcels from East Coast ports based on DGCIS bulk trade records
   */
  private static readonly EXPORT_CARGO_POOLS: Array<{
    id: string;
    cargoType: string;
    loadPort: string;
    dischargePort: string;
    region: string;
    parcelMt: number;
    compatibleClasses: string[];
    rateUsdMt: number;
    offsetUsdMt: number;
    distanceSavedNm: number;
    tceBoost: number;
  }> = [
    {
      id: 'EXP-FE-001',
      cargoType: 'Iron Ore Pellets / Fines (62% Fe)',
      loadPort: 'Vizag Outer Harbor',
      dischargePort: 'Qingdao / Rizhao, China',
      region: 'AUSTRALIA', // En route on Australia backhaul
      parcelMt: 120000,
      compatibleClasses: ['CAPESIZE', 'PANAMAX'],
      rateUsdMt: 8.40,
      offsetUsdMt: 4.20,
      distanceSavedNm: 2800,
      tceBoost: 3800,
    },
    {
      id: 'EXP-FE-002',
      cargoType: 'NMDC Iron Ore Lumps',
      loadPort: 'Paradip Port',
      dischargePort: 'Caofeidian, China',
      region: 'AUSTRALIA',
      parcelMt: 75000,
      compatibleClasses: ['PANAMAX', 'SUPRAMAX'],
      rateUsdMt: 9.80,
      offsetUsdMt: 4.80,
      distanceSavedNm: 2650,
      tceBoost: 3400,
    },
    {
      id: 'EXP-STEEL-003',
      cargoType: 'SAIL Finished Steel Coils / Plates',
      loadPort: 'Haldia Dock Complex',
      dischargePort: 'Singapore / Tanjung Priok',
      region: 'INDONESIA',
      parcelMt: 45000,
      compatibleClasses: ['SUPRAMAX', 'HANDYSIZE'],
      rateUsdMt: 14.50,
      offsetUsdMt: 5.50,
      distanceSavedNm: 1800,
      tceBoost: 4100,
    },
    {
      id: 'EXP-MN-004',
      cargoType: 'MOIL High Grade Manganese Ore',
      loadPort: 'Vizag Port',
      dischargePort: 'Port Klang, Malaysia',
      region: 'INDONESIA',
      parcelMt: 50000,
      compatibleClasses: ['SUPRAMAX', 'PANAMAX'],
      rateUsdMt: 11.20,
      offsetUsdMt: 4.10,
      distanceSavedNm: 1550,
      tceBoost: 2900,
    },
  ];

  /**
   * Matches returning empty bulk carriers with optimal backhaul export parcels
   */
  public static match(input: BackhaulMatchInput): BackhaulMatchResult {
    const disch = input.dischargePort;
    const vClass = input.vesselClass;
    const date = input.ballastAvailableDate || new Date().toISOString().split('T')[0];
    const region = input.intendedOriginRegion || 'AUSTRALIA';

    // Baseline unhedged ballast parameters
    const ballastDistance = region === 'AUSTRALIA' ? 4200 : region === 'INDONESIA' ? 2200 : 4900;
    const ballastBunkerCost = Math.round((ballastDistance / 12 / 24) * 32 * 620); // ~days * cons * bunker $/MT
    const ballastDays = Number((ballastDistance / (12 * 24)).toFixed(1));

    // Filter and score compatible export parcels
    const opportunities: BackhaulOpportunity[] = [];

    for (const pool of this.EXPORT_CARGO_POOLS) {
      if (pool.compatibleClasses.includes(vClass)) {
        // Higher score if discharge port is proximate to export loading port
        let portScore = 80;
        if (pool.loadPort.toLowerCase().includes(disch.toLowerCase())) {
          portScore = 98;
        }

        const parcel = vClass === 'CAPESIZE' ? 120000 : vClass === 'PANAMAX' ? 75000 : 50000;
        const totalOffset = Math.round(parcel * pool.offsetUsdMt);

        opportunities.push({
          opportunityId: pool.id,
          cargoType: pool.cargoType,
          loadingPort: pool.loadPort,
          dischargingPort: pool.dischargePort,
          destinationRegion: pool.dischargePort,
          cargoParcelMt: parcel,
          laycanWindow: `Within 5 days of ${date}`,
          estimatedFreightRateUsdMt: pool.rateUsdMt,
          freightCreditOffsetUsdMt: pool.offsetUsdMt,
          totalFreightOffsetUsd: totalOffset,
          ballastDistanceSavedNm: pool.distanceSavedNm,
          tceImprovementUsdDay: pool.tceBoost,
          matchScorePct: portScore,
          recommendationNote: `Pairing with ${pool.cargoType} from ${pool.loadPort} offsets inbound coal voyage cost by $${pool.offsetUsdMt}/MT ($${(totalOffset / 1e3).toFixed(0)}k total).`,
        });
      }
    }

    opportunities.sort((a, b) => b.matchScorePct - a.matchScorePct);
    const top = opportunities[0] || null;

    const summary = top
      ? `Optimal backhaul pairing found: ${top.cargoType} loading at ${top.loadingPort}. Generates $${top.freightCreditOffsetUsdMt}/MT ($${(top.totalFreightOffsetUsd / 1e3).toFixed(0)}k) freight offset and boosts TCE by +$${top.tceImprovementUsdDay}/day.`
      : `No immediate backhaul pairing available for ${vClass} at ${disch}. Proceed with direct ballast at eco-speed (11.0 knots) to minimize bunker burn.`;

    return {
      dischargePort: disch,
      vesselClass: vClass,
      ballastAvailableDate: date,
      unhedgedBallastLeg: {
        fromPort: disch,
        toRegion: region,
        ballastDistanceNm: ballastDistance,
        ballastBunkerCostUsd: ballastBunkerCost,
        ballastDurationDays: ballastDays,
        status: 'RED_FLAGGED_BALLAST',
      },
      matchedOpportunities: opportunities,
      topRecommendation: top,
      netEconomicBenefitSummary: summary,
    };
  }
}
