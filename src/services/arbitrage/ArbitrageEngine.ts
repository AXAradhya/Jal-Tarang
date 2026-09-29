/**
 * JAL TARANG — Haldia Sandheads Lighterage vs. Dhamra Rail Arbitrage Engine
 *
 * Implements least-cost discharge routing optimization across 3 multi-modal scenarios
 * for coking coal deliveries to SAIL plants (Durgapur, Bokaro, Rourkela, IISCO):
 *   - Option A: Two Supramax vessels direct to Haldia (draft-compliant, higher freight)
 *   - Option B: One Capesize, two-port discharge (40% Dhamra + 60% Haldia lighterage at Sagar-Sandheads)
 *   - Option C: Full Capesize to Dhamra + Indian Railways FOIS rake rail transport to plant
 */

export interface ArbitrageInput {
  cargoQuantityMt: number;                       // e.g. 120,000 MT
  destinationPlant: 'DURGAPUR' | 'BOKARO' | 'ROURKELA' | 'IISCO' | 'BHILAI';
  originPort?: string;                           // e.g. 'Port Hedland', 'Hay Point'
  capesizeOceanFreightUsdMt?: number;            // Default 14.85 $/MT
  supramaxOceanFreightUsdMt?: number;            // Default 22.10 $/MT
  sandheadsLighteringRateUsdMt?: number;         // Barge lighterage cost (default 3.20 $/MT)
  foisRailRakeAvailabilityPct?: number;          // FOIS availability at Dhamra siding (default 85%)
  haldiaStockyardFillPct?: number;               // Current stockyard fill at Haldia (default 72%)
  usdToInrRate?: number;                         // Default 83.50
}

export interface DischargeOption {
  optionId: 'OPTION_A' | 'OPTION_B' | 'OPTION_C';
  title: string;
  vesselAllocation: string;
  oceanFreightUsdMt: number;
  oceanFreightInrMt: number;
  lighterageCostUsdMt: number;
  lighterageCostInrMt: number;
  portHandlingChargesInrMt: number;
  railFreightInrMt: number;
  totalLandedCostInrMt: number;
  totalLandedCostInrCrore: number;
  transitDaysToPlant: number;
  demurrageRiskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  operationalNotes: string[];
}

export interface ArbitrageResult {
  cargoQuantityMt: number;
  destinationPlant: string;
  usdToInrRate: number;
  recommendedOptionId: 'OPTION_A' | 'OPTION_B' | 'OPTION_C';
  recommendedOptionTitle: string;
  maxSavingsVsWorstOptionInrCrore: number;
  savingsVsDirectHaldiaInrCrore: number;
  savingsPerTonneInr: number;
  options: DischargeOption[];
  railRakeDemandSignal: {
    rakesRequired: number;
    availableRakesDhamra: number;
    rakeAdequacyStatus: 'ADEQUATE' | 'TIGHT' | 'DEFICIT';
  };
  decisionSummary: string;
}

export class ArbitrageEngine {
  /**
   * Published Indian Railways FOIS rake freight rates per MT to SAIL blast furnaces
   */
  private static readonly RAIL_FREIGHT_RATES_INR_MT: Record<string, { fromDhamra: number; fromHaldia: number; fromParadip: number }> = {
    DURGAPUR: { fromDhamra: 1280, fromHaldia: 690, fromParadip: 1350 },
    BOKARO:   { fromDhamra: 1320, fromHaldia: 880, fromParadip: 1410 },
    ROURKELA: { fromDhamra: 940,  fromHaldia: 980, fromParadip: 820 },
    IISCO:    { fromDhamra: 1310, fromHaldia: 730, fromParadip: 1380 },
    BHILAI:   { fromDhamra: 1490, fromHaldia: 1540, fromParadip: 1290 },
  };

  /**
   * Evaluates the 3 discharge scenarios and calculates least-cost multi-modal routing
   */
  public static evaluate(input: ArbitrageInput): ArbitrageResult {
    const qty = input.cargoQuantityMt > 0 ? input.cargoQuantityMt : 120000;
    const plant = input.destinationPlant || 'DURGAPUR';
    const fx = input.usdToInrRate ?? 83.50;

    const capeFreightUsd = input.capesizeOceanFreightUsdMt ?? 14.85;
    const supraFreightUsd = input.supramaxOceanFreightUsdMt ?? 22.10;
    const lighteringUsd = input.sandheadsLighteringRateUsdMt ?? 3.20;
    const rakeAvailPct = input.foisRailRakeAvailabilityPct ?? 85;
    const haldiaFill = input.haldiaStockyardFillPct ?? 72;

    const railRates = this.RAIL_FREIGHT_RATES_INR_MT[plant] || this.RAIL_FREIGHT_RATES_INR_MT['DURGAPUR'];

    // -------------------------------------------------------------
    // OPTION A: 2× Supramax direct to Haldia
    // -------------------------------------------------------------
    const optA_oceanUsd = supraFreightUsd;
    const optA_oceanInr = optA_oceanUsd * fx;
    const optA_lighterageInr = 0;
    const optA_portHandlingInr = 380; // Haldia shallow berth mechanical unloader
    const optA_railInr = railRates.fromHaldia;
    const optA_totalInrMt = optA_oceanInr + optA_lighterageInr + optA_portHandlingInr + optA_railInr;
    const optA_totalCrore = (optA_totalInrMt * qty) / 10000000;

    // -------------------------------------------------------------
    // OPTION B: 1× Capesize, 2-port discharge: 40% Dhamra + 60% Sandheads Lighterage
    // -------------------------------------------------------------
    const optB_oceanUsd = capeFreightUsd + 1.20; // +$1.20 multi-port deviation extra
    const optB_oceanInr = optB_oceanUsd * fx;
    const optB_lighterageInr = (lighteringUsd * fx) * 0.60; // 60% of parcel lightered
    const optB_portHandlingInr = (320 * 0.40) + (380 * 0.60); // weighted port dues
    const optB_railInr = (railRates.fromDhamra * 0.40) + (railRates.fromHaldia * 0.60);
    const optB_totalInrMt = optB_oceanInr + optB_lighterageInr + optB_portHandlingInr + optB_railInr;
    const optB_totalCrore = (optB_totalInrMt * qty) / 10000000;

    // -------------------------------------------------------------
    // OPTION C: Full Capesize to Dhamra deepwater + FOIS Rail Transport
    // -------------------------------------------------------------
    const optC_oceanUsd = capeFreightUsd;
    const optC_oceanInr = optC_oceanUsd * fx;
    const optC_lighterageInr = 0;
    const optC_portHandlingInr = 290; // Dhamra deepwater high-speed unloader (Adani terminal)
    const optC_railInr = railRates.fromDhamra;
    const optC_totalInrMt = optC_oceanInr + optC_lighterageInr + optC_portHandlingInr + optC_railInr;
    const optC_totalCrore = (optC_totalInrMt * qty) / 10000000;

    const optionList: DischargeOption[] = [
      {
        optionId: 'OPTION_A',
        title: 'Two Supramax Direct to Haldia',
        vesselAllocation: '2× 60,000 MT Supramax (Geared)',
        oceanFreightUsdMt: Number(optA_oceanUsd.toFixed(2)),
        oceanFreightInrMt: Math.round(optA_oceanInr),
        lighterageCostUsdMt: 0,
        lighterageCostInrMt: 0,
        portHandlingChargesInrMt: optA_portHandlingInr,
        railFreightInrMt: optA_railInr,
        totalLandedCostInrMt: Math.round(optA_totalInrMt),
        totalLandedCostInrCrore: Number(optA_totalCrore.toFixed(2)),
        transitDaysToPlant: 8,
        demurrageRiskRating: haldiaFill > 80 ? 'HIGH' : 'MEDIUM',
        operationalNotes: [
          'Fits Haldia 8.5m draft restriction without open-sea lightering.',
          `Haldia stockyard utilisation at ${haldiaFill}%. High risk of pre-berthing tidal wait (2–4 days).`,
          'Higher ocean freight rate due to smaller vessel class parceling.',
        ],
      },
      {
        optionId: 'OPTION_B',
        title: 'One Capesize Split: 40% Dhamra + 60% Sandheads Lighterage',
        vesselAllocation: '1× Capesize (120k MT) split discharge',
        oceanFreightUsdMt: Number(optB_oceanUsd.toFixed(2)),
        oceanFreightInrMt: Math.round(optB_oceanInr),
        lighterageCostUsdMt: Number((lighteringUsd * 0.6).toFixed(2)),
        lighterageCostInrMt: Math.round(optB_lighterageInr),
        portHandlingChargesInrMt: Math.round(optB_portHandlingInr),
        railFreightInrMt: Math.round(optB_railInr),
        totalLandedCostInrMt: Math.round(optB_totalInrMt),
        totalLandedCostInrCrore: Number(optB_totalCrore.toFixed(2)),
        transitDaysToPlant: 11,
        demurrageRiskRating: 'HIGH',
        operationalNotes: [
          'Requires offshore double-banking barge transfer at Sagar / Sandheads anchorage.',
          'Subject to Bay of Bengal swell and monsoon weather windows (May–September restricted).',
          'Two separate pilotage fees incurred (Kolkata Port + Dhamra Port).',
        ],
      },
      {
        optionId: 'OPTION_C',
        title: 'Full Capesize to Dhamra + FOIS Rail to Plant',
        vesselAllocation: '1× 120,000 MT Capesize (Gearless)',
        oceanFreightUsdMt: Number(optC_oceanUsd.toFixed(2)),
        oceanFreightInrMt: Math.round(optC_oceanInr),
        lighterageCostUsdMt: 0,
        lighterageCostInrMt: 0,
        portHandlingChargesInrMt: optC_portHandlingInr,
        railFreightInrMt: optC_railInr,
        totalLandedCostInrMt: Math.round(optC_totalInrMt),
        totalLandedCostInrCrore: Number(optC_totalCrore.toFixed(2)),
        transitDaysToPlant: 6,
        demurrageRiskRating: 'LOW',
        operationalNotes: [
          'Dhamra 18.5m deep draft allows full-laden Capesize entry without lightering.',
          'High handling speed unloader (60,000 MT/day) achieves 2-day turnaround.',
          `Requires dedicated FOIS Indian Railways rakes (availability: ${rakeAvailPct}%).`,
        ],
      },
    ];

    // Determine least-cost option
    let recommended = optionList[0];
    for (const opt of optionList) {
      if (opt.totalLandedCostInrMt < recommended.totalLandedCostInrMt) {
        recommended = opt;
      }
    }

    const worstCostCrore = Math.max(...optionList.map(o => o.totalLandedCostInrCrore));
    const savingsVsWorstCrore = worstCostCrore - recommended.totalLandedCostInrCrore;
    const savingsVsDirectCrore = optA_totalCrore - recommended.totalLandedCostInrCrore;
    const savingsPerTonneInr = optA_totalInrMt - recommended.totalLandedCostInrMt;

    // FOIS Rake demand calculation: 1 standard BOXN railway rake holds ~3,800 MT
    const rakesNeeded = Math.ceil(qty / 3800);
    const availableRakes = Math.round(rakesNeeded * (rakeAvailPct / 100));
    const adequacy: 'ADEQUATE' | 'TIGHT' | 'DEFICIT' =
      rakeAvailPct >= 85 ? 'ADEQUATE' : rakeAvailPct >= 65 ? 'TIGHT' : 'DEFICIT';

    const summary = `${recommended.title} is the least-cost multi-modal route for ${plant}, saving ₹${savingsVsDirectCrore.toFixed(2)} Crore (₹${Math.round(savingsPerTonneInr)}/MT) versus direct shipment to Haldia. Rake adequacy at Dhamra is ${adequacy} (${availableRakes}/${rakesNeeded} rakes secured via FOIS).`;

    return {
      cargoQuantityMt: qty,
      destinationPlant: plant,
      usdToInrRate: fx,
      recommendedOptionId: recommended.optionId,
      recommendedOptionTitle: recommended.title,
      maxSavingsVsWorstOptionInrCrore: Number(savingsVsWorstCrore.toFixed(2)),
      savingsVsDirectHaldiaInrCrore: Number(savingsVsDirectCrore.toFixed(2)),
      savingsPerTonneInr: Math.round(savingsPerTonneInr),
      options: optionList,
      railRakeDemandSignal: {
        rakesRequired: rakesNeeded,
        availableRakesDhamra: availableRakes,
        rakeAdequacyStatus: adequacy,
      },
      decisionSummary: summary,
    };
  }
}
