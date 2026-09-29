"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const MonteCarloService_js_1 = require("../services/simulation/MonteCarloService.js");
const MarkowitzService_js_1 = require("../services/optimization/MarkowitzService.js");
const router = (0, express_1.Router)();
router.post('/monte-carlo', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { currentSpotRateUsdPerMt, cargoQuantityMt, tenorMonths, annualizedVolatility, numSimulations, usdToInrRate, fixedCoaRateDiscountPct, } = req.body;
        const input = {
            currentSpotRateUsdPerMt: Number(currentSpotRateUsdPerMt) || 15.50,
            cargoQuantityMt: Number(cargoQuantityMt) || 120000,
            tenorMonths: tenorMonths ? Number(tenorMonths) : 6,
            annualizedVolatility: annualizedVolatility ? Number(annualizedVolatility) : undefined,
            numSimulations: numSimulations ? Number(numSimulations) : 10000,
            usdToInrRate: usdToInrRate ? Number(usdToInrRate) : undefined,
            fixedCoaRateDiscountPct: fixedCoaRateDiscountPct !== undefined ? Number(fixedCoaRateDiscountPct) : undefined,
        };
        const result = MonteCarloService_js_1.MonteCarloService.simulate(input);
        return res.json({ success: true, data: result });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: { code: 'MONTE_CARLO_SIMULATION_ERROR', message: err.message },
        });
    }
});
router.post('/markowitz', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { spotExpectedRateUsdMt, spotRateVariance, coaExpectedRateUsdMt, coaRateVariance, correlationSpotCoa, totalQuarterlyVolumeMt, riskAversionFactor, frontierPointsCount, } = req.body;
        const input = {
            spotExpectedRateUsdMt: Number(spotExpectedRateUsdMt) || 15.50,
            spotRateVariance: Number(spotRateVariance) || Math.pow(15.50 * 0.28, 2),
            coaExpectedRateUsdMt: Number(coaExpectedRateUsdMt) || 14.00,
            coaRateVariance: coaRateVariance !== undefined ? Number(coaRateVariance) : undefined,
            correlationSpotCoa: correlationSpotCoa !== undefined ? Number(correlationSpotCoa) : undefined,
            totalQuarterlyVolumeMt: Number(totalQuarterlyVolumeMt) || 2100000,
            riskAversionFactor: riskAversionFactor !== undefined ? Number(riskAversionFactor) : 0.50,
            frontierPointsCount: frontierPointsCount ? Number(frontierPointsCount) : 21,
        };
        const result = MarkowitzService_js_1.MarkowitzService.optimize(input);
        return res.json({ success: true, data: result });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: { code: 'MARKOWITZ_OPTIMIZATION_ERROR', message: err.message },
        });
    }
});
router.get('/benchmarks', auth_js_1.authenticateToken, async (_req, res) => {
    try {
        const mcBenchmark = MonteCarloService_js_1.MonteCarloService.simulate({
            currentSpotRateUsdPerMt: 15.50,
            cargoQuantityMt: 2100000,
            tenorMonths: 6,
        });
        const mkwBenchmark = MarkowitzService_js_1.MarkowitzService.optimize({
            spotExpectedRateUsdMt: 15.50,
            spotRateVariance: Math.pow(15.50 * 0.28, 2),
            coaExpectedRateUsdMt: 14.00,
            totalQuarterlyVolumeMt: 2100000,
            riskAversionFactor: 0.50,
        });
        return res.json({
            success: true,
            data: {
                monteCarlo: mcBenchmark,
                markowitz: mkwBenchmark,
            },
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'BENCHMARK_ERROR', message: err.message },
        });
    }
});
exports.default = router;
//# sourceMappingURL=optimization.js.map