"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortRepository = void 0;
const index_js_1 = require("../db/index.js");
class PortRepository {
    static async findById(id) {
        const res = await index_js_1.pool.query(`SELECT p.*, c.name AS country_name
       FROM ports p
       LEFT JOIN countries c ON c.id = p.country_id
       WHERE p.id = $1 AND p.deleted_at IS NULL LIMIT 1`, [id]);
        return res.rows[0] || null;
    }
    static async findEastCoast() {
        const res = await index_js_1.pool.query(`SELECT p.id, p.port_name, p.port_code, p.un_locode, p.latitude, p.longitude,
              p.max_vessel_loa_m, p.max_vessel_beam_m, p.max_vessel_draft_m, p.max_vessel_dwt,
              p.annual_capacity_mt, p.status, p.is_major_port, p.tidal_window_hours
       FROM ports p
       WHERE p.is_east_coast_india = TRUE AND p.status = 'OPERATIONAL'
       ORDER BY p.port_name ASC`);
        return res.rows;
    }
    static async search(query, limit = 20) {
        const res = await index_js_1.pool.query(`SELECT p.id, p.port_name, p.port_code, p.un_locode, p.latitude, p.longitude,
              p.max_vessel_loa_m, p.max_vessel_beam_m, p.max_vessel_draft_m, p.max_vessel_dwt,
              p.is_east_coast_india, c.name AS country_name
       FROM ports p
       LEFT JOIN countries c ON c.id = p.country_id
       WHERE p.port_name ILIKE $1 OR p.un_locode ILIKE $1
       LIMIT $2`, [`%${query}%`, limit]);
        return res.rows;
    }
}
exports.PortRepository = PortRepository;
//# sourceMappingURL=PortRepository.js.map