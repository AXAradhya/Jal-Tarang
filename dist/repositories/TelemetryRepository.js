"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryRepository = void 0;
const index_js_1 = require("../db/index.js");
class TelemetryRepository {
    static async getLatestForVessel(vesselId) {
        const res = await index_js_1.pool.query(`SELECT t.*, v.vessel_name
       FROM live_vessel_telemetry t
       LEFT JOIN vessels v ON v.id = t.vessel_id
       WHERE t.vessel_id = $1
       ORDER BY t.timestamp_utc DESC
       LIMIT 1`, [vesselId]);
        return res.rows[0] || null;
    }
    static async getAllActiveVesselPositions() {
        const res = await index_js_1.pool.query(`SELECT v.id AS vessel_id, v.vessel_name, v.imo_number,
              v.current_position_lat AS latitude,
              v.current_position_lon AS longitude,
              v.current_speed_knots AS speed_knots,
              v.current_heading_deg AS heading_deg,
              v.last_position_update AS timestamp_utc,
              v.current_status
       FROM vessels v
       WHERE v.deleted_at IS NULL AND v.current_position_lat IS NOT NULL
       ORDER BY v.vessel_name ASC`);
        return res.rows;
    }
}
exports.TelemetryRepository = TelemetryRepository;
//# sourceMappingURL=TelemetryRepository.js.map