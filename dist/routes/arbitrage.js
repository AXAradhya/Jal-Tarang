"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const ArbitrageEngine_js_1 = require("../services/arbitrage/ArbitrageEngine.js");
const router = (0, express_1.Router)();
router.post('/evaluate', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { cargoQuantityMt, destinationPlant, originPort, capesizeOceanFreightUsdMt, supramaxOceanFreightUsdMt, sandheadsLighteringRateUsdMt, foisRailRakeAvailabilityPct, haldiaStockyardFillPct, usdToInrRate, } = req.body;
        const input = {
            cargoQuantityMt: Number(cargoQuantityMt) || 120000,
            destinationPlant: (destinationPlant || 'DURGAPUR').toUpperCase(),
            originPort: originPort || 'Hay Point, Australia',
            capesizeOceanFreightUsdMt: capesizeOceanFreightUsdMt ? Number(capesizeOceanFreightUsdMt) : undefined,
            supramaxOceanFreightUsdMt: supramaxOceanFreightUsdMt ? Number(supramaxOceanFreightUsdMt) : undefined,
            sandheadsLighteringRateUsdMt: sandheadsLighteringRateUsdMt ? Number(sandheadsLighteringRateUsdMt) : undefined,
            foisRailRakeAvailabilityPct: foisRailRakeAvailabilityPct ? Number(foisRailRakeAvailabilityPct) : undefined,
            haldiaStockyardFillPct: haldiaStockyardFillPct ? Number(haldiaStockyardFillPct) : undefined,
            usdToInrRate: usdToInrRate ? Number(usdToInrRate) : undefined,
        };
        const result = ArbitrageEngine_js_1.ArbitrageEngine.evaluate(input);
        return res.json({ success: true, data: result });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: { code: 'ARBITRAGE_EVALUATION_ERROR', message: err.message },
        });
    }
});
router.get('/rail-rates', auth_js_1.authenticateToken, async (_req, res) => {
    try {
        const rates = {
            DURGAPUR: { fromDhamraInrMt: 1280, fromHaldiaInrMt: 690, fromParadipInrMt: 1350 },
            BOKARO: { fromDhamraInrMt: 1320, fromHaldiaInrMt: 880, fromParadipInrMt: 1410 },
            ROURKELA: { fromDhamraInrMt: 940, fromHaldiaInrMt: 980, fromParadipInrMt: 820 },
            IISCO: { fromDhamraInrMt: 1310, fromHaldiaInrMt: 730, fromParadipInrMt: 1380 },
            BHILAI: { fromDhamraInrMt: 1490, fromHaldiaInrMt: 1540, fromParadipInrMt: 1290 },
        };
        return res.json({ success: true, data: rates });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'DATABASE_ERROR', message: err.message },
        });
    }
});
router.get('/summary', auth_js_1.authenticateToken, async (_req, res) => {
    try {
        const defaultResult = ArbitrageEngine_js_1.ArbitrageEngine.evaluate({
            cargoQuantityMt: 120000,
            destinationPlant: 'DURGAPUR',
        });
        return res.json({ success: true, data: defaultResult });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: err.message },
        });
    }
});
exports.default = router;
//# sourceMappingURL=arbitrage.js.map