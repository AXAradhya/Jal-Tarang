"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const index_js_2 = require("../types/index.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate);
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 25, status, vesselId, portId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const conditions = ['v.organization_id = $1'];
        const params = [req.user.organizationId];
        let idx = 2;
        if (status) {
            conditions.push(`v.status = $${idx}`);
            params.push(status);
            idx++;
        }
        if (vesselId) {
            conditions.push(`v.vessel_id = $${idx}`);
            params.push(vesselId);
            idx++;
        }
        if (portId) {
            conditions.push(`(v.departure_port_id = $${idx} OR v.arrival_port_id = $${idx})`);
            params.push(portId);
            idx++;
        }
        const where = conditions.join(' AND ');
        const [countRes, voyRes] = await Promise.all([
            index_js_1.pool.query(`SELECT COUNT(*) FROM voyages v WHERE ${where}`, params),
            index_js_1.pool.query(`SELECT v.id, v.voyage_number, v.voyage_type, v.status, v.etd, v.eta, v.atd, v.ata,
                v.cargo_quantity_mt, v.freight_rate_usd_per_mt, v.total_freight_usd,
                v.total_distance_nm, v.created_at,
                ve.vessel_name, ve.imo_number, ve.vessel_type, ve.deadweight_tonnes,
                dp.port_name AS departure_port, dp.un_locode AS departure_locode,
                ap.port_name AS arrival_port, ap.un_locode AS arrival_locode,
                c.contract_reference
         FROM voyages v
         LEFT JOIN vessels ve ON ve.id = v.vessel_id
         LEFT JOIN ports dp ON dp.id = v.departure_port_id
         LEFT JOIN ports ap ON ap.id = v.arrival_port_id
         LEFT JOIN contracts c ON c.id = v.contract_id
         WHERE ${where}
         ORDER BY v.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`, [...params, Number(limit), offset]),
        ]);
        return res.json({
            success: true,
            data: voyRes.rows,
            meta: { total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / Number(limit)) },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const [voyRes, costsRes, eventsRes] = await Promise.all([
            index_js_1.pool.query(`SELECT v.*,
                ve.vessel_name, ve.imo_number, ve.vessel_type, ve.deadweight_tonnes,
                ve.length_overall_m, ve.beam_m, ve.summer_draft_m,
                dp.port_name AS departure_port, dp.un_locode AS departure_locode,
                ap.port_name AS arrival_port, ap.un_locode AS arrival_locode,
                c.contract_reference, c.charter_type,
                co.company_name AS charterer_name
         FROM voyages v
         LEFT JOIN vessels ve ON ve.id = v.vessel_id
         LEFT JOIN ports dp ON dp.id = v.departure_port_id
         LEFT JOIN ports ap ON ap.id = v.arrival_port_id
         LEFT JOIN contracts c ON c.id = v.contract_id
         LEFT JOIN counterparties co ON co.id = c.charterer_id
         WHERE v.id = $1 AND v.organization_id = $2`, [req.params.id, req.user.organizationId]),
            index_js_1.pool.query(`SELECT cost_category, description, amount_usd, currency, recorded_at
         FROM voyage_costs WHERE voyage_id = $1 ORDER BY amount_usd DESC`, [req.params.id]).catch(() => ({ rows: [] })),
            index_js_1.pool.query(`SELECT event_type, event_description, event_timestamp, port_id, latitude, longitude
         FROM voyage_events WHERE voyage_id = $1 ORDER BY event_timestamp DESC`, [req.params.id]).catch(() => ({ rows: [] })),
        ]);
        if (voyRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Voyage not found' } });
        }
        return res.json({ success: true, data: { ...voyRes.rows[0], costs: costsRes.rows, events: eventsRes.rows } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.patch('/:id/status', (0, auth_js_1.authorize)(index_js_2.SystemRole.SUPER_ADMIN, index_js_2.SystemRole.ADMIN, index_js_2.SystemRole.CHARTERING_MANAGER, index_js_2.SystemRole.PORT_MANAGER), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, atd, ata, remarks } = req.body;
        const validStatuses = ['PLANNED', 'LOADING', 'IN_TRANSIT', 'DISCHARGING', 'COMPLETED', 'CANCELLED', 'DELAYED'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${validStatuses.join(', ')}` } });
        }
        const fields = ['status = $1', 'updated_at = NOW()'];
        const vals = [status];
        let i = 2;
        if (atd) {
            fields.push(`atd = $${i}`);
            vals.push(atd);
            i++;
        }
        if (ata) {
            fields.push(`ata = $${i}`);
            vals.push(ata);
            i++;
        }
        vals.push(id, req.user.organizationId);
        const result = await index_js_1.pool.query(`UPDATE voyages SET ${fields.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1}
       RETURNING id, voyage_number, status, atd, ata, updated_at`, vals);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Voyage not found' } });
        }
        return res.json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/live/tracking', async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT v.id, v.voyage_number, v.status, v.etd, v.eta,
              ve.vessel_name, ve.imo_number, ve.current_position_lat, ve.current_position_lon,
              ve.current_speed_knots, ve.current_heading_deg, ve.last_position_update,
              dp.port_name AS departure_port, ap.port_name AS arrival_port,
              dp.latitude AS dep_lat, dp.longitude AS dep_lon,
              ap.latitude AS arr_lat, ap.longitude AS arr_lon,
              EXTRACT(EPOCH FROM (v.eta - NOW()))/3600 AS eta_hours_remaining
       FROM voyages v
       JOIN vessels ve ON ve.id = v.vessel_id
       LEFT JOIN ports dp ON dp.id = v.departure_port_id
       LEFT JOIN ports ap ON ap.id = v.arrival_port_id
       WHERE v.organization_id = $1 AND v.status IN ('LOADING','IN_TRANSIT','DISCHARGING')
       ORDER BY v.eta ASC`, [req.user.organizationId]);
        return res.json({ success: true, data: result.rows, meta: { count: result.rowCount } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
//# sourceMappingURL=voyages.js.map