"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate);
router.get('/dashboard', async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const [fleetStats, voyageStats, freightStats, portStats, procurementStats, recentAlerts, topRoutes] = await Promise.all([
            index_js_1.pool.query(`SELECT
           COUNT(*) AS total_vessels,
           COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_vessels,
           COUNT(*) FILTER (WHERE status = 'IN_REPAIR') AS in_repair,
           COUNT(*) FILTER (WHERE status = 'IDLE') AS idle_vessels,
           COUNT(*) FILTER (WHERE current_port_id IS NOT NULL) AS in_port,
           SUM(deadweight_tonnes) AS total_fleet_dwt
         FROM vessels`),
            index_js_1.pool.query(`SELECT
           COUNT(*) AS total_voyages,
           COUNT(*) FILTER (WHERE status = 'IN_TRANSIT') AS active_voyages,
           COUNT(*) FILTER (WHERE status = 'COMPLETED' AND created_at >= NOW() - INTERVAL '30 days') AS completed_30d,
           SUM(total_freight_usd) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS freight_revenue_30d,
           AVG(freight_rate_usd_per_mt) FILTER (WHERE status = 'COMPLETED') AS avg_freight_rate,
           SUM(cargo_quantity_mt) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS cargo_moved_30d_mt
         FROM voyages WHERE organization_id = $1`, [orgId]),
            index_js_1.pool.query(`SELECT DATE_TRUNC('week', fr.rate_date) AS week,
                AVG(fr.freight_rate_usd) AS avg_rate,
                MIN(fr.freight_rate_usd) AS min_rate,
                MAX(fr.freight_rate_usd) AS max_rate,
                COUNT(*) AS data_points
         FROM freight_rates fr
         WHERE fr.rate_date >= NOW() - INTERVAL '90 days'
         GROUP BY DATE_TRUNC('week', fr.rate_date)
         ORDER BY week ASC`).catch(() => ({ rows: [] })),
            index_js_1.pool.query(`SELECT p.port_name, p.un_locode, p.status,
                lw.wave_height_m, lw.wind_speed_knots, lw.operational_impact, lw.cyclone_alert_level
         FROM ports p
         LEFT JOIN LATERAL (
           SELECT wave_height_m, wind_speed_knots, operational_impact, cyclone_alert_level
           FROM live_port_weather_feed WHERE port_id = p.id ORDER BY recorded_at DESC LIMIT 1
         ) lw ON TRUE
         WHERE p.is_east_coast_india = TRUE AND p.status = 'OPERATIONAL'
         ORDER BY p.port_name`).catch(() => ({ rows: [] })),
            index_js_1.pool.query(`SELECT
           COUNT(*) FILTER (WHERE status = 'OPEN') AS open_requirements,
           COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') AS in_progress,
           SUM(quantity_required_mt) FILTER (WHERE status IN ('OPEN','IN_PROGRESS')) AS pending_qty_mt,
           SUM(budget_usd) FILTER (WHERE status IN ('OPEN','IN_PROGRESS')) AS pending_budget_usd,
           SUM(actual_spend_usd) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS spend_30d_usd
         FROM procurement_requirements WHERE organization_id = $1`, [orgId]).catch(() => ({ rows: [{}] })),
            index_js_1.pool.query(`SELECT id, alert_type, severity, title, message, is_acknowledged, created_at
         FROM alerts
         WHERE organization_id = $1 AND is_acknowledged = FALSE AND created_at >= NOW() - INTERVAL '7 days'
         ORDER BY severity DESC, created_at DESC LIMIT 10`, [orgId]).catch(() => ({ rows: [] })),
            index_js_1.pool.query(`SELECT mr.route_name, mr.route_code, mr.distance_nm,
                op.port_name AS origin_port, dp.port_name AS dest_port,
                COUNT(v.id) AS voyage_count,
                SUM(v.cargo_quantity_mt) AS total_cargo_mt,
                AVG(v.freight_rate_usd_per_mt) AS avg_freight_rate
         FROM voyages v
         JOIN maritime_routes mr ON mr.id = v.route_id
         JOIN ports op ON op.id = mr.origin_port_id
         JOIN ports dp ON dp.id = mr.destination_port_id
         WHERE v.organization_id = $1 AND v.created_at >= NOW() - INTERVAL '365 days'
         GROUP BY mr.id, mr.route_name, mr.route_code, mr.distance_nm, op.port_name, dp.port_name
         ORDER BY total_cargo_mt DESC LIMIT 10`, [orgId]).catch(() => ({ rows: [] })),
        ]);
        return res.json({
            success: true,
            data: {
                fleet: fleetStats.rows[0] || {},
                voyages: voyageStats.rows[0] || {},
                freightTrend: freightStats.rows,
                portStatuses: portStats.rows,
                procurement: procurementStats.rows[0] || {},
                alerts: recentAlerts.rows,
                topRoutes: topRoutes.rows,
                generatedAt: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/freight-trends', async (req, res) => {
    try {
        const { routeId, granularity = 'weekly', days = 180 } = req.query;
        const allowedTrunc = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };
        const truncUnit = allowedTrunc[String(granularity).toLowerCase()] || 'week';
        const safeDays = Math.max(1, Math.min(3650, parseInt(String(days), 10) || 180));
        const conditions = [`fr.rate_date >= NOW() - ($1 || ' days')::INTERVAL`];
        const params = [`${safeDays}`];
        let idx = 2;
        if (routeId) {
            conditions.push(`fr.route_id = $${idx}`);
            params.push(routeId);
            idx++;
        }
        const result = await index_js_1.pool.query(`SELECT DATE_TRUNC('${truncUnit}', fr.rate_date) AS period,
              mr.route_code, mr.route_name,
              op.port_name AS origin, dp.port_name AS destination,
              AVG(fr.freight_rate_usd) AS avg_rate,
              MIN(fr.freight_rate_usd) AS min_rate,
              MAX(fr.freight_rate_usd) AS max_rate,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY fr.freight_rate_usd) AS median_rate,
              COUNT(*) AS data_points
       FROM freight_rates fr
       LEFT JOIN maritime_routes mr ON mr.id = fr.route_id
       LEFT JOIN ports op ON op.id = mr.origin_port_id
       LEFT JOIN ports dp ON dp.id = mr.destination_port_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY DATE_TRUNC('${truncUnit}', fr.rate_date), mr.route_code, mr.route_name, op.port_name, dp.port_name
       ORDER BY mr.route_code, period`, params);
        return res.json({ success: true, data: result.rows, meta: { granularity: truncUnit, days: safeDays, count: result.rows.length } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/vessel-performance', async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT v.id, v.vessel_name, v.imo_number, v.vessel_type, v.vessel_class, v.deadweight_tonnes,
              COUNT(voy.id) AS total_voyages,
              COUNT(voy.id) FILTER (WHERE voy.status = 'COMPLETED') AS completed_voyages,
              SUM(voy.cargo_quantity_mt) FILTER (WHERE voy.status = 'COMPLETED') AS total_cargo_moved_mt,
              SUM(voy.total_freight_usd) FILTER (WHERE voy.status = 'COMPLETED') AS total_freight_revenue,
              AVG(voy.freight_rate_usd_per_mt) FILTER (WHERE voy.status = 'COMPLETED') AS avg_freight_rate,
              AVG(EXTRACT(EPOCH FROM (voy.ata - voy.atd))/86400) FILTER (WHERE voy.ata IS NOT NULL AND voy.atd IS NOT NULL) AS avg_voyage_days,
              v.status AS vessel_status
       FROM vessels v
       LEFT JOIN voyages voy ON voy.vessel_id = v.id AND voy.organization_id = $1
       GROUP BY v.id, v.vessel_name, v.imo_number, v.vessel_type, v.vessel_class, v.deadweight_tonnes, v.status
       ORDER BY total_freight_revenue DESC NULLS LAST`, [req.user.organizationId]);
        return res.json({ success: true, data: result.rows });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/cargo-statistics', async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const [byCategory, byCommodity, monthly] = await Promise.all([
            index_js_1.pool.query(`SELECT ct.cargo_category, ct.cargo_sub_category,
                COUNT(cp.id) AS parcel_count,
                SUM(cp.quantity_mt) AS total_qty_mt,
                SUM(cp.total_value_usd) AS total_value_usd,
                AVG(cp.quantity_mt) AS avg_quantity_mt
         FROM cargo_parcels cp
         JOIN cargo_types ct ON ct.id = cp.cargo_type_id
         WHERE cp.organization_id = $1
         GROUP BY ct.cargo_category, ct.cargo_sub_category
         ORDER BY total_qty_mt DESC`, [orgId]),
            index_js_1.pool.query(`SELECT com.commodity_name, com.commodity_code,
                SUM(cp.quantity_mt) AS total_qty_mt, COUNT(cp.id) AS parcel_count
         FROM cargo_parcels cp
         JOIN commodities com ON com.id = cp.commodity_id
         WHERE cp.organization_id = $1
         GROUP BY com.commodity_name, com.commodity_code
         ORDER BY total_qty_mt DESC LIMIT 20`, [orgId]),
            index_js_1.pool.query(`SELECT DATE_TRUNC('month', created_at) AS month,
                COUNT(*) AS parcels, SUM(quantity_mt) AS qty_mt, SUM(total_value_usd) AS value_usd
         FROM cargo_parcels
         WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '12 months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY month`, [orgId]),
        ]);
        return res.json({
            success: true,
            data: {
                byCategory: byCategory.rows,
                byCommodity: byCommodity.rows,
                monthlyTrend: monthly.rows,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/port-performance', async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT p.id, p.port_name, p.un_locode, p.is_east_coast_india, p.is_major_port,
              COUNT(DISTINCT voy.id) FILTER (WHERE voy.arrival_port_id = p.id) AS arrivals,
              COUNT(DISTINCT voy.id) FILTER (WHERE voy.departure_port_id = p.id) AS departures,
              SUM(voy.cargo_quantity_mt) FILTER (WHERE voy.arrival_port_id = p.id) AS total_cargo_received_mt,
              SUM(voy.cargo_quantity_mt) FILTER (WHERE voy.departure_port_id = p.id) AS total_cargo_dispatched_mt,
              AVG(EXTRACT(EPOCH FROM (voy.ata - voy.eta))/3600) FILTER (WHERE voy.ata IS NOT NULL) AS avg_delay_hours,
              lw.wave_height_m, lw.operational_impact
       FROM ports p
       LEFT JOIN voyages voy ON (voy.departure_port_id = p.id OR voy.arrival_port_id = p.id)
         AND voy.organization_id = $1
       LEFT JOIN LATERAL (
         SELECT wave_height_m, operational_impact FROM live_port_weather_feed
         WHERE port_id = p.id ORDER BY recorded_at DESC LIMIT 1
       ) lw ON TRUE
       WHERE p.status = 'OPERATIONAL'
       GROUP BY p.id, p.port_name, p.un_locode, p.is_east_coast_india, p.is_major_port, lw.wave_height_m, lw.operational_impact
       ORDER BY total_cargo_received_mt DESC NULLS LAST`, [req.user.organizationId]);
        return res.json({ success: true, data: result.rows });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/recommendations', async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT r.id, r.recommendation_type, r.title, r.description, r.priority_score,
              r.estimated_savings_usd, r.confidence_score, r.status,
              r.vessel_id, ve.vessel_name,
              r.route_id, mr.route_name,
              r.created_at, r.valid_until
       FROM recommendations r
       LEFT JOIN vessels ve ON ve.id = r.vessel_id
       LEFT JOIN maritime_routes mr ON mr.id = r.route_id
       WHERE r.organization_id = $1 AND r.status = 'ACTIVE' AND (r.valid_until IS NULL OR r.valid_until > NOW())
       ORDER BY r.priority_score DESC, r.created_at DESC LIMIT 50`, [req.user.organizationId]).catch(() => ({ rows: [] }));
        return res.json({ success: true, data: result.rows, meta: { count: result.rows.length } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map