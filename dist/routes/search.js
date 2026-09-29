"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    const q = req.query.q;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.status(400).json({ success: false, error: { code: 'QUERY_TOO_SHORT', message: 'Search term must be at least 2 characters' } });
    }
    if (q.trim().length > 200) {
        return res.status(400).json({ success: false, error: { code: 'QUERY_TOO_LONG', message: 'Search term must not exceed 200 characters' } });
    }
    const searchTerm = `%${q.trim()}%`;
    try {
        const ports = await index_js_1.pool.query(`SELECT 'PORT' as entity_type, id, code, name as title, country_id,
              CONCAT('Port in East Coast / Global, Code: ', code) as description
       FROM ports
       WHERE code ILIKE $1 OR name ILIKE $1
       LIMIT 10`, [searchTerm]);
        const vessels = await index_js_1.pool.query(`SELECT 'VESSEL' as entity_type, id, imo_number as code, name as title,
              CONCAT(vessel_class, ' | DWT: ', dwt, ' | Flag: ', flag) as description
       FROM vessels
       WHERE name ILIKE $1 OR imo_number ILIKE $1 OR mmsi ILIKE $1
       LIMIT 10`, [searchTerm]);
        const freightCodes = await index_js_1.pool.query(`SELECT 'FREIGHT_CODE' as entity_type, id, code, description as title,
              CONCAT('Origin: ', origin_code, ' -> Dest: ', destination_code, ' [', vessel_class_code, ']') as description
       FROM freight_codes
       WHERE code ILIKE $1 OR description ILIKE $1
       LIMIT 10`, [searchTerm]);
        const cargoTypes = await index_js_1.pool.query(`SELECT 'CARGO' as entity_type, id, code, name as title,
              CONCAT('Bulk Category: ', cargo_category_id) as description
       FROM cargo_types
       WHERE code ILIKE $1 OR name ILIKE $1
       LIMIT 10`, [searchTerm]);
        const user = req.user;
        const userOrgId = user?.organizationId || 'org-sail-corp';
        const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
        const contractsQuery = isSuperAdmin
            ? `SELECT 'CONTRACT' as entity_type, id, contract_number as code,
              CONCAT('Contract #', contract_number) as title,
              CONCAT(contract_type, ' | Status: ', status, ' | Rate: $', rate_usd) as description
         FROM contracts
         WHERE contract_number ILIKE $1
         LIMIT 10`
            : `SELECT 'CONTRACT' as entity_type, id, contract_number as code,
              CONCAT('Contract #', contract_number) as title,
              CONCAT(contract_type, ' | Status: ', status, ' | Rate: $', rate_usd) as description
         FROM contracts
         WHERE contract_number ILIKE $1 AND organization_id = $2
         LIMIT 10`;
        const contractsParams = isSuperAdmin ? [searchTerm] : [searchTerm, userOrgId];
        const contracts = await index_js_1.pool.query(contractsQuery, contractsParams);
        const routes = await index_js_1.pool.query(`SELECT 'ROUTE' as entity_type, id, code, name as title,
              CONCAT('Distance: ', distance_nm, ' NM | Duration: ', typical_duration_days, ' days') as description
       FROM routes
       WHERE code ILIKE $1 OR name ILIKE $1
       LIMIT 10`, [searchTerm]);
        const merged = [
            ...ports.rows,
            ...vessels.rows,
            ...freightCodes.rows,
            ...cargoTypes.rows,
            ...contracts.rows,
            ...routes.rows
        ];
        return res.json({
            success: true,
            data: {
                query: q,
                totalMatches: merged.length,
                results: merged
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SEARCH_FAILED', message: err.message } });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map