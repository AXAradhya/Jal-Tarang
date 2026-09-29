"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const index_js_2 = require("../types/index.js");
const TidalDraftService_js_1 = require("../services/ports/TidalDraftService.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate);
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 25, search, isEastCoast, country, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const conditions = ['1=1'];
        const params = [];
        let idx = 1;
        if (search) {
            conditions.push(`(p.port_name ILIKE $${idx} OR p.un_locode ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }
        if (isEastCoast !== undefined) {
            conditions.push(`p.is_east_coast_india = $${idx}`);
            params.push(isEastCoast === 'true');
            idx++;
        }
        if (country) {
            conditions.push(`c.iso2 = $${idx}`);
            params.push(country);
            idx++;
        }
        if (status) {
            conditions.push(`p.status = $${idx}`);
            params.push(status);
            idx++;
        }
        const where = conditions.join(' AND ');
        const [countRes, portsRes] = await Promise.all([
            index_js_1.pool.query(`SELECT COUNT(DISTINCT p.id) FROM ports p LEFT JOIN countries c ON c.id = p.country_id WHERE ${where}`, params),
            index_js_1.pool.query(`SELECT p.id, p.port_name, p.port_code, p.un_locode, p.latitude, p.longitude,
                p.max_vessel_loa_m, p.max_vessel_beam_m, p.max_vessel_draft_m, p.max_vessel_dwt,
                p.annual_capacity_mt, p.status, p.is_east_coast_india, p.is_major_port,
                p.tidal_window_hours, p.pilotage_required, p.created_at,
                c.name AS country_name, c.iso2, c.iso3,
                sr.state_name,
                COUNT(DISTINCT b.id) AS berth_count,
                COUNT(DISTINCT t.id) AS terminal_count
         FROM ports p
         LEFT JOIN countries c ON c.id = p.country_id
         LEFT JOIN states_regions sr ON sr.id = p.state_id
         LEFT JOIN berths b ON b.port_id = p.id AND b.status = 'OPERATIONAL'
         LEFT JOIN terminals t ON t.port_id = p.id AND t.status = 'OPERATIONAL'
         WHERE ${where}
         GROUP BY p.id, p.port_name, p.port_code, p.un_locode, p.latitude, p.longitude,
                  p.max_vessel_loa_m, p.max_vessel_beam_m, p.max_vessel_draft_m, p.max_vessel_dwt,
                  p.annual_capacity_mt, p.status, p.is_east_coast_india, p.is_major_port,
                  p.tidal_window_hours, p.pilotage_required, p.created_at,
                  c.name, c.iso2, c.iso3, sr.state_name
         ORDER BY p.is_east_coast_india DESC, p.port_name ASC
         LIMIT $${idx} OFFSET $${idx + 1}`, [...params, Number(limit), offset]),
        ]);
        return res.json({
            success: true,
            data: portsRes.rows,
            meta: { total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / Number(limit)) },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/east-coast', async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT p.id, p.port_name, p.port_code, p.un_locode, p.latitude, p.longitude,
              p.max_vessel_loa_m, p.max_vessel_beam_m, p.max_vessel_draft_m, p.max_vessel_dwt,
              p.annual_capacity_mt, p.status, p.is_major_port, p.tidal_window_hours,
              sr.state_name,
              COUNT(DISTINCT b.id) AS operational_berths,
              lw.wave_height_m, lw.wind_speed_knots, lw.operational_impact, lw.cyclone_alert_level, lw.recorded_at AS weather_recorded_at
       FROM ports p
       LEFT JOIN states_regions sr ON sr.id = p.state_id
       LEFT JOIN berths b ON b.port_id = p.id AND b.status = 'OPERATIONAL'
       LEFT JOIN LATERAL (
         SELECT wave_height_m, wind_speed_knots, operational_impact, cyclone_alert_level, recorded_at
         FROM live_port_weather_feed WHERE port_id = p.id ORDER BY recorded_at DESC LIMIT 1
       ) lw ON TRUE
       WHERE p.is_east_coast_india = TRUE AND p.status = 'OPERATIONAL'
       GROUP BY p.id, p.port_name, p.port_code, p.un_locode, p.latitude, p.longitude,
                p.max_vessel_loa_m, p.max_vessel_beam_m, p.max_vessel_draft_m, p.max_vessel_dwt,
                p.annual_capacity_mt, p.status, p.is_major_port, p.tidal_window_hours,
                sr.state_name, lw.wave_height_m, lw.wind_speed_knots, lw.operational_impact,
                lw.cyclone_alert_level, lw.recorded_at
       ORDER BY p.port_name ASC`);
        return res.json({ success: true, data: result.rows, meta: { count: result.rowCount } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
const getPortConstraintsHandler = async (req, res) => {
    try {
        const { portId } = req.params;
        const portRes = await index_js_1.pool.query(`SELECT p.id, p.port_name, p.un_locode, p.port_code,
              COALESCE(pc.max_draft_m, p.max_vessel_draft_m, 14.5) AS max_draft_m,
              COALESCE(pc.max_loa_m, p.max_vessel_loa_m, 292.0) AS max_loa_m,
              COALESCE(pc.max_beam_m, p.max_vessel_beam_m, 45.0) AS max_beam_m,
              COALESCE(pc.max_dwt_mt, p.max_vessel_dwt, 180000) AS max_dwt_mt,
              COALESCE(pc.channel_draft_m, p.max_vessel_draft_m, 14.5) AS channel_draft_m,
              p.tidal_window_hours, p.pilotage_required, p.is_east_coast_india
       FROM ports p
       LEFT JOIN port_constraints pc ON pc.port_id = p.id AND (pc.valid_to IS NULL OR pc.valid_to > NOW())
       WHERE p.id = $1 OR p.un_locode = $1 OR p.port_code = $1 LIMIT 1`, [portId]);
        if (portRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Port constraints not found' } });
        }
        return res.json({ success: true, data: portRes.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
};
router.get('/constraints/:portId', getPortConstraintsHandler);
router.get('/:portId/constraints', getPortConstraintsHandler);
router.get('/:id', async (req, res) => {
    try {
        const [portRes, berthsRes, terminalsRes, weatherRes] = await Promise.all([
            index_js_1.pool.query(`SELECT p.*, c.name AS country_name, c.iso2, c.iso3, sr.state_name
         FROM ports p
         LEFT JOIN countries c ON c.id = p.country_id
         LEFT JOIN states_regions sr ON sr.id = p.state_id
         WHERE p.id = $1`, [req.params.id]),
            index_js_1.pool.query(`SELECT id, berth_name, berth_code, berth_type, max_loa_m, max_beam_m, max_draft_m,
                max_dwt, length_m, water_depth_m, status, cargo_types_handled
         FROM berths WHERE port_id = $1 ORDER BY berth_name`, [req.params.id]),
            index_js_1.pool.query(`SELECT id, terminal_name, terminal_type, operator_name, annual_capacity_mt, status
         FROM terminals WHERE port_id = $1 ORDER BY terminal_name`, [req.params.id]),
            index_js_1.pool.query(`SELECT wave_height_m, wave_period_sec, wind_speed_knots, temperature_c, visibility_km,
                operational_impact, cyclone_alert_level, recorded_at
         FROM live_port_weather_feed WHERE port_id = $1 ORDER BY recorded_at DESC LIMIT 5`, [req.params.id]),
        ]);
        if (portRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Port not found' } });
        }
        return res.json({
            success: true,
            data: {
                ...portRes.rows[0],
                berths: berthsRes.rows,
                terminals: terminalsRes.rows,
                recentWeather: weatherRes.rows,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.post('/', (0, auth_js_1.authorize)(index_js_2.SystemRole.SUPER_ADMIN, index_js_2.SystemRole.ADMIN, index_js_2.SystemRole.PORT_MANAGER), async (req, res) => {
    try {
        const { portName, portCode, unLocode, latitude, longitude, countryIso2, stateCode, maxVesselLoaM, maxVesselBeamM, maxVesselDraftM, maxVesselDwt, annualCapacityMt, isEastCoastIndia, isMajorPort, tidalWindowHours, pilotageRequired } = req.body;
        if (!portName || !unLocode) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'portName and unLocode are required' } });
        }
        const countryRes = await index_js_1.pool.query('SELECT id FROM countries WHERE iso2 = $1', [countryIso2 || 'IN']);
        const stateRes = await index_js_1.pool.query('SELECT id FROM states_regions WHERE state_code = $1 AND country_id = $2', [stateCode, countryRes.rows[0]?.id]);
        const result = await index_js_1.pool.query(`INSERT INTO ports (port_name, port_code, un_locode, latitude, longitude, country_id, state_id,
       max_vessel_loa_m, max_vessel_beam_m, max_vessel_draft_m, max_vessel_dwt,
       annual_capacity_mt, is_east_coast_india, is_major_port, tidal_window_hours, pilotage_required, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'OPERATIONAL')
       RETURNING id, port_name, un_locode, status, created_at`, [portName, portCode, unLocode, latitude, longitude,
            countryRes.rows[0]?.id, stateRes.rows[0]?.id || null,
            maxVesselLoaM, maxVesselBeamM, maxVesselDraftM, maxVesselDwt,
            annualCapacityMt, isEastCoastIndia || false, isMajorPort || false,
            tidalWindowHours || 24, pilotageRequired || true]);
        return res.status(201).json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'UN/LOCODE or port code already exists' } });
        }
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/:id/weather', async (req, res) => {
    try {
        const { limit = 24 } = req.query;
        const result = await index_js_1.pool.query(`SELECT wave_height_m, wave_period_sec, wind_speed_knots, temperature_c, visibility_km,
              swell_height_m, current_speed_knots, precipitation_mm,
              operational_impact, cyclone_alert_level, recorded_at
       FROM live_port_weather_feed WHERE port_id = $1 ORDER BY recorded_at DESC LIMIT $2`, [req.params.id, Number(limit)]);
        return res.json({ success: true, data: result.rows, meta: { portId: req.params.id, count: result.rowCount } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/:id/berths', async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT b.id, b.berth_name, b.berth_code, b.berth_type, b.max_loa_m, b.max_beam_m,
              b.max_draft_m, b.max_dwt, b.length_m, b.water_depth_m, b.status, b.cargo_types_handled,
              b.crane_count, b.crane_capacity_mt, b.conveyor_capacity_mtph
       FROM berths b WHERE b.port_id = $1 ORDER BY b.berth_name`, [req.params.id]);
        return res.json({ success: true, data: result.rows, meta: { count: result.rowCount } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.post('/haldia/tidal-prediction', async (req, res) => {
    try {
        const { targetArrivalDate, vesselDraftM, cargoQuantityMt, demurrageRateUsdDay, dailyCharterRateUsdDay, siltationCorrectionM, requiredUkcM, } = req.body;
        const result = TidalDraftService_js_1.TidalDraftService.predict({
            targetArrivalDate: targetArrivalDate || new Date().toISOString().split('T')[0],
            vesselDraftM: Number(vesselDraftM) || 8.2,
            cargoQuantityMt: cargoQuantityMt ? Number(cargoQuantityMt) : 55000,
            demurrageRateUsdDay: demurrageRateUsdDay ? Number(demurrageRateUsdDay) : undefined,
            dailyCharterRateUsdDay: dailyCharterRateUsdDay ? Number(dailyCharterRateUsdDay) : undefined,
            siltationCorrectionM: siltationCorrectionM !== undefined ? Number(siltationCorrectionM) : undefined,
            requiredUkcM: requiredUkcM !== undefined ? Number(requiredUkcM) : undefined,
        });
        return res.json({ success: true, data: result });
    }
    catch (err) {
        return res.status(400).json({ success: false, error: { code: 'TIDAL_PREDICTION_ERROR', message: err.message } });
    }
});
router.get('/haldia/bars', async (_req, res) => {
    try {
        const bars = [
            {
                id: 'bar-auckland',
                name: 'Auckland Bar (Hooghly Estuary)',
                riverSystem: 'Hooghly River / Sagar approaches',
                datumDepthM: 4.8,
                governingStatus: 'PRIMARY_GOVERNING_BAR',
                description: 'Primary seaward shallow bar. Governs maximum entry draft for Kolkata and Haldia vessel convoys.',
            },
            {
                id: 'bar-jellingham',
                name: 'Jellingham Shoal / Channel',
                riverSystem: 'Haldia approaches',
                datumDepthM: 4.9,
                governingStatus: 'SECONDARY_BAR',
                description: 'Main approach channel bar to Haldia Oil Jetty and Bulk Berths.',
            },
            {
                id: 'bar-balari',
                name: 'Balari Bar (Upper Hooghly)',
                riverSystem: 'Upper Hooghly',
                datumDepthM: 4.5,
                governingStatus: 'UPPER_RIVER_BAR',
                description: 'Governs Kolkata Dock System transit; requires extensive capital dredging.',
            },
        ];
        return res.json({ success: true, data: bars });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
//# sourceMappingURL=ports.js.map