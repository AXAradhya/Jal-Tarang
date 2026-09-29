"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherRepository = void 0;
const index_js_1 = require("../db/index.js");
class WeatherRepository {
    static async getLatestForPort(portId) {
        const res = await index_js_1.pool.query(`SELECT lw.*, p.port_name
       FROM live_port_weather_feed lw
       JOIN ports p ON p.id = lw.port_id
       WHERE lw.port_id = $1
       ORDER BY lw.recorded_at DESC
       LIMIT 1`, [portId]);
        return res.rows[0] || null;
    }
    static async getEastCoastSummary() {
        const res = await index_js_1.pool.query(`SELECT p.id, p.port_name, p.un_locode, p.latitude, p.longitude, p.is_major_port,
              lw.wave_height_m, lw.wind_speed_knots, lw.visibility_km, lw.temperature_c,
              lw.operational_impact, lw.cyclone_alert_level, lw.recorded_at,
              CASE
                WHEN lw.cyclone_alert_level = 'CYCLONE_WARNING' THEN 'CRITICAL'
                WHEN lw.cyclone_alert_level = 'CAUTION' OR lw.wave_height_m > 3.0 THEN 'WARNING'
                WHEN lw.wave_height_m > 2.0 THEN 'ADVISORY'
                ELSE 'NORMAL'
              END AS alert_status
       FROM ports p
       LEFT JOIN LATERAL (
         SELECT wave_height_m, wind_speed_knots, visibility_km, temperature_c,
                operational_impact, cyclone_alert_level, recorded_at
         FROM live_port_weather_feed WHERE port_id = p.id
         ORDER BY recorded_at DESC LIMIT 1
       ) lw ON TRUE
       WHERE p.is_east_coast_india = TRUE AND p.status = 'OPERATIONAL'
       ORDER BY p.port_name`);
        return res.rows;
    }
}
exports.WeatherRepository = WeatherRepository;
//# sourceMappingURL=WeatherRepository.js.map