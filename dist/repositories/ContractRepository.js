"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationRepository = exports.UserRepository = exports.ContractRepository = void 0;
const index_js_1 = require("../db/index.js");
class ContractRepository {
    static async findByOrg(orgId, limit = 20) {
        const res = await index_js_1.pool.query(`SELECT c.*, v.vessel_name, lp.port_name AS load_port_name, dp.port_name AS disch_port_name
       FROM contracts c
       LEFT JOIN vessels v ON v.id = c.vessel_id
       LEFT JOIN ports lp ON lp.id = c.loading_port_id
       LEFT JOIN ports dp ON dp.id = c.discharging_port_id
       WHERE c.organization_id = $1
       ORDER BY c.created_at DESC LIMIT $2`, [orgId, limit]);
        return res.rows;
    }
}
exports.ContractRepository = ContractRepository;
class UserRepository {
    static async findById(id) {
        const res = await index_js_1.pool.query(`SELECT u.id, u.organization_id, u.email, u.first_name, u.last_name, u.display_name, u.status
       FROM users u WHERE u.id = $1 LIMIT 1`, [id]);
        return res.rows[0] || null;
    }
    static async findByEmail(email) {
        const res = await index_js_1.pool.query(`SELECT u.id, u.organization_id, u.email, u.first_name, u.last_name, u.display_name, u.status
       FROM users u WHERE LOWER(u.email) = LOWER($1) LIMIT 1`, [email]);
        return res.rows[0] || null;
    }
}
exports.UserRepository = UserRepository;
class OrganizationRepository {
    static async findById(id) {
        const res = await index_js_1.pool.query(`SELECT o.* FROM organizations o WHERE o.id = $1 LIMIT 1`, [id]);
        return res.rows[0] || null;
    }
}
exports.OrganizationRepository = OrganizationRepository;
//# sourceMappingURL=ContractRepository.js.map