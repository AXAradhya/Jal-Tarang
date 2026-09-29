"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const DecisionEngine_js_1 = require("../services/decision/DecisionEngine.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate);
router.post('/analyze', async (req, res) => {
    try {
        const userContext = req.user
            ? { organizationId: req.user.organizationId, userId: req.user.userId }
            : undefined;
        const result = await DecisionEngine_js_1.DecisionEngine.analyze(req.body, userContext);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: err.message.replace('VALIDATION_ERROR: ', '') },
            });
        }
        if (err.message?.startsWith('NOT_FOUND')) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: err.message.replace('NOT_FOUND: ', '') },
            });
        }
        return res.status(500).json({
            success: false,
            error: { code: 'DECISION_ENGINE_ERROR', message: err.message },
        });
    }
});
router.get('/history', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const orgId = req.user?.organizationId || 'org-sail-corp';
        const result = await index_js_1.pool.query(`SELECT dr.id, dr.recommended_strategy, dr.confidence_score,
              dr.tce_usd_day, dr.landed_cost_usd_mt, dr.voyage_pnl_usd,
              dr.total_voyage_days, dr.risk_count, dr.created_at,
              lp.port_name AS loading_port, dp.port_name AS discharging_port,
              v.vessel_name, ct.cargo_type_name,
              dr.cargo_quantity_mt,
              u.display_name AS created_by_name
       FROM decision_recommendations dr
       LEFT JOIN ports lp ON lp.id = dr.loading_port_id
       LEFT JOIN ports dp ON dp.id = dr.discharging_port_id
       LEFT JOIN vessels v ON v.id = dr.vessel_id
       LEFT JOIN cargo_types ct ON ct.id = dr.cargo_type_id
       LEFT JOIN users u ON u.id = dr.created_by
       WHERE dr.organization_id = $1
       ORDER BY dr.created_at DESC
       LIMIT $2 OFFSET $3`, [orgId, Number(limit), offset]);
        const countRes = await index_js_1.pool.query(`SELECT COUNT(*) FROM decision_recommendations WHERE organization_id = $1`, [orgId]);
        return res.json({
            success: true,
            data: result.rows,
            meta: { total: parseInt(countRes.rows[0]?.count || '0'), page: Number(page), limit: Number(limit) },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/recommendations', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const orgId = req.user?.organizationId || 'org-sail-corp';
        const result = await index_js_1.pool.query(`SELECT dr.id, dr.recommended_strategy, dr.confidence_score,
              dr.tce_usd_day, dr.landed_cost_usd_mt, dr.voyage_pnl_usd,
              dr.total_voyage_days, dr.risk_count, dr.created_at,
              lp.port_name AS loading_port, dp.port_name AS discharging_port,
              v.vessel_name, ct.cargo_type_name,
              dr.cargo_quantity_mt,
              u.display_name AS created_by_name
       FROM decision_recommendations dr
       LEFT JOIN ports lp ON lp.id = dr.loading_port_id
       LEFT JOIN ports dp ON dp.id = dr.discharging_port_id
       LEFT JOIN vessels v ON v.id = dr.vessel_id
       LEFT JOIN cargo_types ct ON ct.id = dr.cargo_type_id
       LEFT JOIN users u ON u.id = dr.created_by
       WHERE dr.organization_id = $1
       ORDER BY dr.created_at DESC
       LIMIT $2`, [orgId, Number(limit)]);
        return res.json({ success: true, data: result.rows });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/risks', async (req, res) => {
    try {
        const { destinationPortId, destinationPortName, contractDuration = 'SPOT', vesselDraftM } = req.query;
        let portInfo = null;
        if (destinationPortId) {
            const portRes = await index_js_1.pool.query(`SELECT p.id, p.port_name, p.un_locode, pc.max_draft_m, pc.channel_draft_m, pc.tidal_window_hours
         FROM ports p
         LEFT JOIN port_constraints pc ON pc.port_id = p.id
         WHERE p.id = $1 OR p.un_locode = $1 LIMIT 1`, [destinationPortId]);
            portInfo = portRes.rows[0];
        }
        else if (destinationPortName) {
            const portRes = await index_js_1.pool.query(`SELECT p.id, p.port_name, p.un_locode, pc.max_draft_m, pc.channel_draft_m, pc.tidal_window_hours
         FROM ports p
         LEFT JOIN port_constraints pc ON pc.port_id = p.id
         WHERE p.port_name ILIKE $1 LIMIT 1`, [`%${destinationPortName}%`]);
            portInfo = portRes.rows[0];
        }
        const portName = portInfo?.port_name || destinationPortName || 'East Coast Port';
        const isHaldia = portName.toLowerCase().includes('haldia');
        const destDraft = portInfo?.max_draft_m ? Number(portInfo.max_draft_m) : (isHaldia ? 8.5 : 17.5);
        const requestedDraft = Number(vesselDraftM) || (isHaldia ? 12.0 : 14.5);
        const isDraftRestricted = requestedDraft > destDraft;
        const risks = [
            {
                category: 'PORT_CONGESTION',
                severity: isHaldia ? 'HIGH' : 'LOW',
                title: `Port Turnaround at ${portName}`,
                description: isHaldia
                    ? 'Lock-gate navigation limits daily vessel transits. Pre-berthing waiting time averages 4.5 days.'
                    : `Pre-berthing waiting time is currently normal (1.2 to 2.4 days) across all dry-bulk berths at ${portName}.`,
            },
            {
                category: 'VESSEL_FEASIBILITY',
                severity: isDraftRestricted ? 'MEDIUM' : 'LOW',
                title: isDraftRestricted ? `Vessel Draft Restriction (${destDraft}m limit)` : 'Vessel Draft Accommodated',
                description: isDraftRestricted
                    ? `Draft exceeds destination berth limit (${destDraft}m). Deep draft vessels require lighterage or alternate port.`
                    : `All designated dry bulk vessel draft profiles are structurally accommodated at destination berths (${destDraft}m max).`,
            },
            {
                category: 'FREIGHT_VOLATILITY',
                severity: contractDuration === 'SPOT' ? 'MEDIUM' : 'LOW',
                title: 'Freight Index Volatility',
                description: contractDuration === 'SPOT'
                    ? 'Spot market exposure carries 6-10% weekly variance. Consider locking a 90-day CoA discount.'
                    : 'Selected contract duration hedges against short-term spot volatility spikes.',
            },
            {
                category: 'WEATHER',
                severity: 'LOW',
                title: 'Bay of Bengal Meteorological Status',
                description: 'No active tropical cyclone alerts along shipping corridors. Fair sailing condition predicted.',
            },
        ];
        const overallRiskScore = isHaldia ? 68 : (isDraftRestricted ? 48 : 24);
        return res.json({
            success: true,
            data: {
                overallRiskScore,
                risks,
                evaluatedAt: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'RISK_EVALUATION_ERROR', message: err.message } });
    }
});
router.get('/market-windows', async (req, res) => {
    try {
        const { freightCodeId, baseFreightRate } = req.query;
        let rate = Number(baseFreightRate);
        if (!rate || isNaN(rate)) {
            if (freightCodeId) {
                const rateRes = await index_js_1.pool.query(`SELECT rate_usd FROM freight_rates WHERE freight_code = $1 ORDER BY rate_date DESC LIMIT 1`, [freightCodeId]);
                rate = rateRes.rows[0]?.rate_usd ? Number(rateRes.rows[0].rate_usd) : 14.50;
            }
            else {
                rate = 14.50;
            }
        }
        const entryWindows = [
            {
                id: 'win-1',
                startDate: 'Day +10',
                endDate: 'Day +15',
                type: 'SAVINGS',
                deltaPercent: -7.4,
                predictedRateUsdMt: Math.round((rate * 0.926) * 100) / 100,
                confidence: 89,
                rationale: 'Seasonal tonnage buildup in Pacific Basin creates surplus spot supply; optimal booking window.',
            },
            {
                id: 'win-2',
                startDate: 'Day +22',
                endDate: 'Day +28',
                type: 'PREMIUM',
                deltaPercent: 8.2,
                predictedRateUsdMt: Math.round((rate * 1.082) * 100) / 100,
                confidence: 76,
                rationale: 'Anticipated iron ore export surge from Port Hedland will absorb Capesize & Panamax fleet.',
            },
        ];
        return res.json({
            success: true,
            data: {
                baseRateUsdMt: rate,
                entryWindows,
                evaluatedAt: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'MARKET_WINDOWS_ERROR', message: err.message } });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const orgId = req.user?.organizationId || 'org-sail-corp';
        const result = await index_js_1.pool.query(`SELECT dr.*, lp.port_name AS loading_port, dp.port_name AS discharging_port,
              v.vessel_name, ct.cargo_type_name, u.display_name AS created_by_name
       FROM decision_recommendations dr
       LEFT JOIN ports lp ON lp.id = dr.loading_port_id
       LEFT JOIN ports dp ON dp.id = dr.discharging_port_id
       LEFT JOIN vessels v ON v.id = dr.vessel_id
       LEFT JOIN cargo_types ct ON ct.id = dr.cargo_type_id
       LEFT JOIN users u ON u.id = dr.created_by
       WHERE dr.id = $1 AND dr.organization_id = $2`, [req.params.id, orgId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Decision record not found' } });
        }
        return res.json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
//# sourceMappingURL=decision.js.map