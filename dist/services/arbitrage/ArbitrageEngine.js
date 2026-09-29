"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArbitrageEngine = void 0;
class ArbitrageEngine {
    static RAIL_FREIGHT_RATES_INR_MT = {
        DURGAPUR: { fromDhamra: 1280, fromHaldia: 690, fromParadip: 1350 },
        BOKARO: { fromDhamra: 1320, fromHaldia: 880, fromParadip: 1410 },
        ROURKELA: { fromDhamra: 940, fromHaldia: 980, fromParadip: 820 },
        IISCO: { fromDhamra: 1310, fromHaldia: 730, fromParadip: 1380 },
        BHILAI: { fromDhamra: 1490, fromHaldia: 1540, fromParadip: 1290 },
    };
    static evaluate(input) {
        const qty = input.cargoQuantityMt > 0 ? input.cargoQuantityMt : 120000;
        const plant = input.destinationPlant || 'DURGAPUR';
        const fx = input.usdToInrRate ?? 83.50;
        const capeFreightUsd = input.capesizeOceanFreightUsdMt ?? 14.85;
        const supraFreightUsd = input.supramaxOceanFreightUsdMt ?? 22.10;
        const lighteringUsd = input.sandheadsLighteringRateUsdMt ?? 3.20;
        const rakeAvailPct = input.foisRailRakeAvailabilityPct ?? 85;
        const haldiaFill = input.haldiaStockyardFillPct ?? 72;
        const railRates = this.RAIL_FREIGHT_RATES_INR_MT[plant] || this.RAIL_FREIGHT_RATES_INR_MT['DURGAPUR'];
        const optA_oceanUsd = supraFreightUsd;
        const optA_oceanInr = optA_oceanUsd * fx;
        const optA_lighterageInr = 0;
        const optA_portHandlingInr = 380;
        const optA_railInr = railRates.fromHaldia;
        const optA_totalInrMt = optA_oceanInr + optA_lighterageInr + optA_portHandlingInr + optA_railInr;
        const optA_totalCrore = (optA_totalInrMt * qty) / 10000000;
        const optB_oceanUsd = capeFreightUsd + 1.20;
        const optB_oceanInr = optB_oceanUsd * fx;
        const optB_lighterageInr = (lighteringUsd * fx) * 0.60;
        const optB_portHandlingInr = (320 * 0.40) + (380 * 0.60);
        const optB_railInr = (railRates.fromDhamra * 0.40) + (railRates.fromHaldia * 0.60);
        const optB_totalInrMt = optB_oceanInr + optB_lighterageInr + optB_portHandlingInr + optB_railInr;
        const optB_totalCrore = (optB_totalInrMt * qty) / 10000000;
        const optC_oceanUsd = capeFreightUsd;
        const optC_oceanInr = optC_oceanUsd * fx;
        const optC_lighterageInr = 0;
        const optC_portHandlingInr = 290;
        const optC_railInr = railRates.fromDhamra;
        const optC_totalInrMt = optC_oceanInr + optC_lighterageInr + optC_portHandlingInr + optC_railInr;
        const optC_totalCrore = (optC_totalInrMt * qty) / 10000000;
        const optionList = [
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
        const rakesNeeded = Math.ceil(qty / 3800);
        const availableRakes = Math.round(rakesNeeded * (rakeAvailPct / 100));
        const adequacy = rakeAvailPct >= 85 ? 'ADEQUATE' : rakeAvailPct >= 65 ? 'TIGHT' : 'DEFICIT';
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
exports.ArbitrageEngine = ArbitrageEngine;
//# sourceMappingURL=ArbitrageEngine.js.map