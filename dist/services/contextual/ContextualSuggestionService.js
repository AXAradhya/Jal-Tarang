"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextualSuggestionService = void 0;
const TidalDraftService_js_1 = require("../ports/TidalDraftService.js");
const ArbitrageEngine_js_1 = require("../arbitrage/ArbitrageEngine.js");
const MonteCarloService_js_1 = require("../simulation/MonteCarloService.js");
class ContextualSuggestionService {
    static getSuggestions(params) {
        const page = params.page || 'general';
        const dest = (params.destinationPort || 'HALDIA').toUpperCase();
        const qty = Number(params.cargoQuantityMt) || 120000;
        const targetDate = params.targetDate || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0];
        const inlineFieldSuggestions = [];
        const onPageCards = [];
        const smartBanners = [];
        const tooltips = {};
        if (dest.includes('HALDIA') || dest.includes('KOLKATA')) {
            const tide = TidalDraftService_js_1.TidalDraftService.predict({
                targetArrivalDate: targetDate,
                vesselDraftM: 8.5,
                cargoQuantityMt: qty,
            });
            inlineFieldSuggestions.push({
                fieldName: 'laycanStartDate',
                suggestedValue: tide.recommendedLaycanDate,
                confidenceScorePct: 94,
                economicImpact: `Saves $${tide.demurrageAvoidedUsd.toLocaleString()} in tidal demurrage`,
                rationale: `Spring tide window opens on ${tide.recommendedLaycanDate} (${tide.recommendedDraftM}m permissible draft vs ${tide.targetDatePermissibleDraftM}m on current date).`,
            });
            if (qty >= 80000) {
                inlineFieldSuggestions.push({
                    fieldName: 'recommendedVesselClass',
                    suggestedValue: 'Dhamra Capesize + Rail (Arbitrage)',
                    confidenceScorePct: 91,
                    economicImpact: '₹320/MT cheaper than 2× Supramax',
                    rationale: 'Haldia 8.5m draft prevents single-vessel discharge of >80k MT. Option C via Dhamra rail bypasses lightering.',
                });
                const arb = ArbitrageEngine_js_1.ArbitrageEngine.evaluate({
                    cargoQuantityMt: qty,
                    destinationPlant: 'DURGAPUR',
                });
                onPageCards.push({
                    id: 'card-dhamra-arb',
                    category: 'ARBITRAGE',
                    title: 'Dhamra Multi-Modal Arbitrage Unlocked',
                    subtitle: `Dhamra Capesize + FOIS Rail to Durgapur delivers ₹${arb.savingsVsDirectHaldiaInrCrore} Cr benefit vs. Haldia direct.`,
                    projectedSavingsInrCrore: arb.savingsVsDirectHaldiaInrCrore,
                    actionText: 'Switch Routing to Dhamra',
                    actionEndpoint: '/api/v1/arbitrage/evaluate',
                    badge: 'OPTIMAL',
                });
            }
            tooltips['destinationPortId'] =
                'Haldia Draft Alert: Governed by Auckland Bar (4.8m datum). Maximum spring tide permissible draft is 8.5m. Deep-draft Capesize require Sandheads lightering or Dhamra diversion.';
        }
        else if (dest.includes('VIZAG') || dest.includes('VISAKHAPATNAM')) {
            inlineFieldSuggestions.push({
                fieldName: 'recommendedVesselClass',
                suggestedValue: 'Capesize (Gearless)',
                confidenceScorePct: 96,
                economicImpact: 'Lowest landed TCE ($14.85/MT)',
                rationale: 'Vizag Outer Harbor draft (16.5m–18.5m) and mechanical shore unloaders accommodate gearless Capesize with zero demurrage.',
            });
            tooltips['destinationPortId'] =
                'Vizag Port: Outer harbor accommodates vessels up to 200,000 DWT and 18.5m draft. Fast discharge handling rates exceed 35,000 MT/day.';
        }
        const mc = MonteCarloService_js_1.MonteCarloService.simulate({
            currentSpotRateUsdPerMt: params.currentRateUsdMt || 15.50,
            cargoQuantityMt: qty,
            tenorMonths: 6,
        });
        if (mc.recommendationSignal === 'STRONG_COA' || mc.recommendationSignal === 'LEAN_COA') {
            inlineFieldSuggestions.push({
                fieldName: 'suggestedRateCeilingUsd',
                suggestedValue: mc.recommendedCoaRateUsdPerMt,
                confidenceScorePct: 88,
                economicImpact: `Saves ₹${mc.expectedNetSavingsInrCrore} Cr vs spot volatility`,
                rationale: `Monte Carlo 10,000-path simulation indicates ${mc.probabilityCoaOutperformsSpotPct}% probability that 6-month COA at $${mc.recommendedCoaRateUsdPerMt}/MT outperforms unhedged spot procurement.`,
            });
            onPageCards.push({
                id: 'card-coa-lock',
                category: 'MARKET_TIMING',
                title: 'Lock 6-Month COA Tranche Now',
                subtitle: `Expected freight savings: ₹${mc.expectedNetSavingsInrCrore} Cr with ${mc.probabilityCoaOutperformsSpotPct}% confidence.`,
                projectedSavingsInrCrore: mc.expectedNetSavingsInrCrore,
                actionText: 'Review COA Breakeven Curve',
                actionEndpoint: '/api/v1/optimization/monte-carlo',
                badge: 'RECOMMENDED',
            });
        }
        const currentMonth = new Date().getMonth() + 1;
        if (currentMonth >= 4 && currentMonth <= 5) {
            smartBanners.push({
                id: 'banner-cyclone-pre-monsoon',
                severity: 'WARNING',
                title: 'Bay of Bengal Pre-Monsoon Cyclone Advisory',
                description: 'IMD warning for enhanced tropical depression formation in South-East Bay of Bengal. Paradip and Dhamra outer anchorage may experience 3–5 day pilotage suspensions.',
                quickAction: {
                    label: 'Inspect Weather Congestion',
                    actionType: 'RE_ROUTE',
                    payload: { targetPort: 'VIZAG' },
                },
            });
        }
        else if (currentMonth >= 10 && currentMonth <= 12) {
            smartBanners.push({
                id: 'banner-cyclone-post-monsoon',
                severity: 'WARNING',
                title: 'Bay of Bengal Post-Monsoon Cyclone Season Active',
                description: 'Severe cyclonic storm tracks active off Odisha and Andhra coastlines. Maintain 48-hour bunker reserve and evaluate shelter anchorages.',
            });
        }
        else {
            smartBanners.push({
                id: 'banner-monsoon-pacific-window',
                severity: 'OPPORTUNITY',
                title: 'Bay of Bengal Maritime Transition & Chartering Window',
                description: 'Monsoon swells moderating off Paradip & Vizag. Spot Capesize rates softening before Q4 raw material restocking surge — optimal window to execute spot fixtures or lock 12-month COA.',
                quickAction: {
                    label: 'Lock Spot Fixture',
                    actionType: 'LOCK_COA',
                    payload: { tenorMonths: 12 },
                },
            });
        }
        tooltips['cargoQuantityMt'] =
            'Optimal Parcel Sizing: Capesize parcels (120k–180k MT) yield 32% lower ocean freight $/MT than Supramax (50k–65k MT). Verify discharge berth draft limits before chartering.';
        tooltips['bunkerPriceUsdMt'] =
            'VLSFO Bunker Fuel Spread: Singapore vs Fujairah spread currently $18/MT. Recommend bunkering at Singapore on Australia–India eastbound ballast legs.';
        return {
            timestamp: new Date().toISOString(),
            page,
            inlineFieldSuggestions,
            onPageCards,
            smartBanners,
            predictiveTooltips: tooltips,
        };
    }
}
exports.ContextualSuggestionService = ContextualSuggestionService;
//# sourceMappingURL=ContextualSuggestionService.js.map