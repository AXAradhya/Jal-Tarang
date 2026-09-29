"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoyageRepository = void 0;
const index_js_1 = require("../db/index.js");
class VoyageRepository {
    static async list(limit = 50) {
        const res = await index_js_1.pool.query(`SELECT v.id, v.voyage_number, v.status, v.eta, v.etd, v.created_at,
              ves.vessel_name,
              lp.port_name AS load_port_name,
              dp.port_name AS discharge_port_name,
              ct.cargo_type_name AS cargo_name
       FROM voyages v
       LEFT JOIN vessels ves ON ves.id = v.vessel_id
       LEFT JOIN ports lp ON lp.id = v.load_port_id
       LEFT JOIN ports dp ON dp.id = v.discharge_port_id
       LEFT JOIN cargo_types ct ON ct.id = v.cargo_type_id
       WHERE v.deleted_at IS NULL
       ORDER BY v.created_at DESC
       LIMIT $1`, [limit]);
        return res.rows;
    }
    static async findById(id) {
        const res = await index_js_1.pool.query(`SELECT v.*,
              ves.vessel_name,
              lp.port_name AS load_port_name,
              dp.port_name AS discharge_port_name,
              ct.cargo_type_name AS cargo_name
       FROM voyages v
       LEFT JOIN vessels ves ON ves.id = v.vessel_id
       LEFT JOIN ports lp ON lp.id = v.load_port_id
       LEFT JOIN ports dp ON dp.id = v.discharge_port_id
       LEFT JOIN cargo_types ct ON ct.id = v.cargo_type_id
       WHERE v.id = $1 AND v.deleted_at IS NULL
       LIMIT 1`, [id]);
        return res.rows[0] || null;
    }
    static async findByVessel(vesselId, limit = 20) {
        const res = await index_js_1.pool.query(`SELECT v.* FROM voyages v WHERE v.vessel_id = $1 ORDER BY v.created_at DESC LIMIT $2`, [vesselId, limit]);
        return res.rows;
    }
}
exports.VoyageRepository = VoyageRepository;
//# sourceMappingURL=VoyageRepository.js.map