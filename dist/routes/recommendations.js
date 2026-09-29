"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const index_js_2 = require("../types/index.js");
const router = (0, express_1.Router)();
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    const { limit = 50 } = req.query;
    try {
        const result = await index_js_1.pool.query(`SELECT id, cargo_type, quantity_mt, origin, destination,
              market_action, recommended_strategy, selected_vessel_name,
              selected_vessel_class, voyage_cost_usd, cost_per_mt_usd,
              projected_savings_usd, confidence_score, composite_risk_level,
              created_at
       FROM decision_recommendations
       ORDER BY created_at DESC LIMIT $1`, [limit]);
        return res.json({
            success: true,
            data: result.rows,
            meta: { total: result.rows.length }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});
router.get('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT * FROM decision_recommendations WHERE id = $1`, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Recommendation not found' } });
        }
        return res.json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});
router.post('/:id/approve', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)([index_js_2.SystemRole.SUPER_ADMIN, index_js_2.SystemRole.CHARTERING_MANAGER, index_js_2.SystemRole.PROCUREMENT_MANAGER]), async (req, res) => {
    const { notes } = req.body;
    try {
        const rRes = await index_js_1.pool.query(`SELECT * FROM decision_recommendations WHERE id = $1`, [req.params.id]);
        if (rRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Recommendation not found' } });
        }
        const rec = rRes.rows[0];
        await index_js_1.pool.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
       VALUES ($1, 'RECOMMENDATION_APPROVED', 'DECISION_RECOMMENDATION', $2, $3)`, [req.user?.id || null, rec.id, JSON.stringify({ approvedBy: req.user?.email, notes, timestamp: new Date().toISOString() })]);
        return res.json({
            success: true,
            data: {
                recommendationId: rec.id,
                status: 'APPROVED',
                actionTriggered: 'CHARTER_FIXTURE_PREPARED',
                approvedBy: req.user?.email,
                timestamp: new Date().toISOString()
            },
            message: 'Decision recommendation approved successfully'
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'APPROVAL_FAILED', message: err.message } });
    }
});
exports.default = router;
//# sourceMappingURL=recommendations.js.map