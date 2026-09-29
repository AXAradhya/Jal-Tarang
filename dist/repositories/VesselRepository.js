"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VesselRepository = void 0;
const index_js_1 = require("../db/index.js");
class VesselRepository {
    static async findById(id, orgId) {
        const res = await index_js_1.pool.query(`SELECT v.* FROM vessels v
       WHERE v.id = $1 AND ($2::text IS NULL OR v.organization_id = $2 OR v.is_verified = TRUE OR v.organization_id IS NULL)
       LIMIT 1`, [id, orgId || null]);
        return res.rows[0] || null;
    }
    static async findAvailable(orgId) {
        const res = await index_js_1.pool.query(`SELECT v.* FROM vessels v
       WHERE v.status = 'AVAILABLE' AND ($1::text IS NULL OR v.organization_id = $1 OR v.is_verified = TRUE OR v.organization_id IS NULL)
       ORDER BY v.deadweight_tonnes DESC`, [orgId || null]);
        return res.rows;
    }
    static async findByClass(vesselClass, orgId) {
        const res = await index_js_1.pool.query(`SELECT v.* FROM vessels v
       WHERE UPPER(v.vessel_class) = UPPER($1)
         AND ($2::text IS NULL OR v.organization_id = $2 OR v.is_verified = TRUE OR v.organization_id IS NULL)
       ORDER BY v.deadweight_tonnes DESC`, [vesselClass, orgId || null]);
        return res.rows;
    }
}
exports.VesselRepository = VesselRepository;
//# sourceMappingURL=VesselRepository.js.map