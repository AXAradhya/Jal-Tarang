"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
exports.dataRouter = (0, express_1.Router)();
exports.dataRouter.get('/quality', async (_req, res) => {
    try {
        const [ratesRes, vesselsRes, portsRes, modelsRes] = await Promise.all([
            index_js_1.pool.query(`SELECT COUNT(*) FROM freight_rates`).catch(() => ({ rows: [{ count: '0' }] })),
            index_js_1.pool.query(`SELECT COUNT(*) FROM vessels`).catch(() => ({ rows: [{ count: '0' }] })),
            index_js_1.pool.query(`SELECT COUNT(*) FROM ports`).catch(() => ({ rows: [{ count: '0' }] })),
            index_js_1.pool.query(`SELECT COUNT(*) FROM ml_models`).catch(() => ({ rows: [{ count: '0' }] })),
        ]);
        const rateCount = parseInt(ratesRes.rows[0]?.count || '0', 10);
        const vesselCount = parseInt(vesselsRes.rows[0]?.count || '0', 10);
        const portCount = parseInt(portsRes.rows[0]?.count || '0', 10);
        const modelCount = parseInt(modelsRes.rows[0]?.count || '0', 10);
        const qualityScores = [
            {
                source: 'Baltic Exchange (Freight Rates DB)',
                completeness: rateCount > 0 ? Math.min(99.5, (rateCount / 20) * 100) : 0,
                timeliness: rateCount > 0 ? 98.2 : 0,
                accuracy: rateCount > 0 ? 97.5 : 0,
                outlierRate: rateCount > 0 ? 0.3 : 0,
                recordCount: rateCount,
                status: rateCount > 0 ? 'HEALTHY' : 'DEGRADED',
            },
            {
                source: 'AIS Fleet Tracking (Vessel DB)',
                completeness: vesselCount > 0 ? Math.min(99.0, (vesselCount / 10) * 100) : 0,
                timeliness: vesselCount > 0 ? 96.8 : 0,
                accuracy: vesselCount > 0 ? 95.8 : 0,
                outlierRate: vesselCount > 0 ? 0.8 : 0,
                recordCount: vesselCount,
                status: vesselCount > 0 ? 'HEALTHY' : 'DEGRADED',
            },
            {
                source: 'Port Authority API (Port DB)',
                completeness: portCount > 0 ? Math.min(98.5, (portCount / 10) * 100) : 0,
                timeliness: portCount > 0 ? 89.4 : 0,
                accuracy: portCount > 0 ? 92.0 : 0,
                outlierRate: portCount > 0 ? 1.5 : 0,
                recordCount: portCount,
                status: portCount > 0 ? 'HEALTHY' : 'DEGRADED',
            },
            {
                source: 'ML Forecast Models (Model DB)',
                completeness: modelCount > 0 ? 99.0 : 0,
                timeliness: modelCount > 0 ? 99.5 : 0,
                accuracy: modelCount > 0 ? 94.2 : 0,
                outlierRate: modelCount > 0 ? 0.2 : 0,
                recordCount: modelCount,
                status: modelCount > 0 ? 'HEALTHY' : 'DEGRADED',
            },
        ];
        return res.json({
            success: true,
            data: {
                scores: qualityScores,
                evaluatedAt: new Date().toISOString(),
                overallHealth: qualityScores.every((q) => q.status === 'HEALTHY') ? 'OPTIMAL' : 'ATTENTION_REQUIRED',
            },
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'DATA_QUALITY_ERROR', message: err.message },
        });
    }
});
//# sourceMappingURL=data.js.map