"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkowitzService = void 0;
class MarkowitzService {
    static optimize(input) {
        const rSpot = input.spotExpectedRateUsdMt;
        const varSpot = input.spotRateVariance > 0 ? input.spotRateVariance : Math.pow(rSpot * 0.25, 2);
        const rCoa = input.coaExpectedRateUsdMt;
        const varCoa = input.coaRateVariance ?? Math.pow(rCoa * 0.05, 2);
        const corr = input.correlationSpotCoa ?? 0.30;
        const covar = corr * Math.sqrt(varSpot) * Math.sqrt(varCoa);
        const volume = input.totalQuarterlyVolumeMt;
        const lambda = Math.min(1.0, Math.max(0.0, input.riskAversionFactor ?? 0.50));
        const pointsCount = input.frontierPointsCount ?? 21;
        const frontier = [];
        for (let i = 0; i < pointsCount; i++) {
            const wCoa = i / (pointsCount - 1);
            const wSpot = 1.0 - wCoa;
            const expCost = wSpot * rSpot + wCoa * rCoa;
            const portVariance = Math.pow(wSpot, 2) * varSpot + Math.pow(wCoa, 2) * varCoa + 2 * wSpot * wCoa * covar;
            const portStdDev = Math.sqrt(Math.max(0, portVariance));
            frontier.push({
                coaAllocationPct: Math.round(wCoa * 100),
                spotAllocationPct: Math.round(wSpot * 100),
                expectedPortfolioCostUsdMt: Number(expCost.toFixed(2)),
                portfolioRiskStdDev: Number(portStdDev.toFixed(2)),
                totalCostUsd: Math.round(expCost * volume),
            });
        }
        let bestCoaWeight = 0.5;
        let minUtility = Infinity;
        for (let w = 0; w <= 1.001; w += 0.005) {
            const wCoa = Math.min(1.0, w);
            const wSpot = 1.0 - wCoa;
            const expCost = wSpot * rSpot + wCoa * rCoa;
            const portVariance = Math.pow(wSpot, 2) * varSpot + Math.pow(wCoa, 2) * varCoa + 2 * wSpot * wCoa * covar;
            const portStdDev = Math.sqrt(portVariance);
            const costTerm = expCost / rSpot;
            const riskTerm = portStdDev / Math.sqrt(varSpot);
            const utility = (1.0 - lambda) * costTerm + lambda * riskTerm;
            if (utility < minUtility) {
                minUtility = utility;
                bestCoaWeight = wCoa;
            }
        }
        bestCoaWeight = Math.min(0.85, Math.max(0.15, bestCoaWeight));
        const bestSpotWeight = 1.0 - bestCoaWeight;
        const optCoaPct = Math.round(bestCoaWeight * 100);
        const optSpotPct = 100 - optCoaPct;
        const optRate = (optSpotPct / 100) * rSpot + (optCoaPct / 100) * rCoa;
        const optVar = Math.pow(optSpotPct / 100, 2) * varSpot +
            Math.pow(optCoaPct / 100, 2) * varCoa +
            2 * (optSpotPct / 100) * (optCoaPct / 100) * covar;
        const optStdDev = Math.sqrt(optVar);
        const unhedgedStdDev = Math.sqrt(varSpot);
        const riskReductionPct = ((unhedgedStdDev - optStdDev) / unhedgedStdDev) * 100;
        const recStrategy = `Model recommends locking ${optCoaPct}% of quarterly volume under COA at $${rCoa.toFixed(2)}/MT while retaining ${optSpotPct}% spot exposure. Reduces freight rate standard deviation from $${unhedgedStdDev.toFixed(2)}/MT to $${optStdDev.toFixed(2)}/MT (${riskReductionPct.toFixed(1)}% risk reduction) with expected weighted rate of $${optRate.toFixed(2)}/MT.`;
        return {
            optimalSpotPct: optSpotPct,
            optimalCoaPct: optCoaPct,
            optimalSpotVolumeMt: Math.round((optSpotPct / 100) * volume),
            optimalCoaVolumeMt: Math.round((optCoaPct / 100) * volume),
            portfolioExpectedRateUsdMt: Number(optRate.toFixed(2)),
            portfolioRiskStdDev: Number(optStdDev.toFixed(2)),
            unhedgedSpotRiskStdDev: Number(unhedgedStdDev.toFixed(2)),
            riskReductionPct: Number(riskReductionPct.toFixed(1)),
            totalFreightBudgetUsd: Math.round(optRate * volume),
            efficientFrontier: frontier,
            recommendedStrategy: recStrategy,
        };
    }
}
exports.MarkowitzService = MarkowitzService;
//# sourceMappingURL=MarkowitzService.js.map