"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackhaulMatcherService = void 0;
class BackhaulMatcherService {
    static EXPORT_CARGO_POOLS = [
        {
            id: 'EXP-FE-001',
            cargoType: 'Iron Ore Pellets / Fines (62% Fe)',
            loadPort: 'Vizag Outer Harbor',
            dischargePort: 'Qingdao / Rizhao, China',
            region: 'AUSTRALIA',
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
    static match(input) {
        const disch = input.dischargePort;
        const vClass = input.vesselClass;
        const date = input.ballastAvailableDate || new Date().toISOString().split('T')[0];
        const region = input.intendedOriginRegion || 'AUSTRALIA';
        const ballastDistance = region === 'AUSTRALIA' ? 4200 : region === 'INDONESIA' ? 2200 : 4900;
        const ballastBunkerCost = Math.round((ballastDistance / 12 / 24) * 32 * 620);
        const ballastDays = Number((ballastDistance / (12 * 24)).toFixed(1));
        const opportunities = [];
        for (const pool of this.EXPORT_CARGO_POOLS) {
            if (pool.compatibleClasses.includes(vClass)) {
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
exports.BackhaulMatcherService = BackhaulMatcherService;
//# sourceMappingURL=BackhaulMatcherService.js.map