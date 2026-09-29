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
        const { page = 1, limit = 25, search, type, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const conditions = ['1=1'];
        const params = [];
        let idx = 1;
        if (search) {
            conditions.push(`(cp.company_name ILIKE $${idx} OR cp.email ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }
        if (type) {
            conditions.push(`cp.counterparty_type = $${idx}`);
            params.push(type);
            idx++;
        }
        if (status) {
            conditions.push(`cp.status = $${idx}`);
            params.push(status);
            idx++;
        }
        const where = conditions.join(' AND ');
        const result = await index_js_1.pool.query(`SELECT cp.id, cp.company_name, cp.company_code, cp.counterparty_type, cp.email,
              cp.phone, cp.website, cp.status, cp.credit_rating, cp.credit_limit_usd, cp.created_at,
              c.name AS country_name, c.iso2
       FROM counterparties cp
       LEFT JOIN countries c ON c.id = cp.country_id
       WHERE ${where}
       ORDER BY cp.company_name ASC
       LIMIT $${idx} OFFSET $${idx + 1}`, [...params, Number(limit), offset]);
        const countRes = await index_js_1.pool.query(`SELECT COUNT(*) FROM counterparties cp WHERE ${where}`, params);
        return res.json({
            success: true,
            data: result.rows,
            meta: { total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit) },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT cp.*, c.name AS country_name, c.iso2
       FROM counterparties cp
       LEFT JOIN countries c ON c.id = cp.country_id
       WHERE cp.id = $1`, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Counterparty not found' } });
        }
        const stats = await index_js_1.pool.query(`SELECT
         COUNT(DISTINCT c.id) AS total_contracts,
         SUM(c.total_freight_usd) AS total_freight_value_usd,
         COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'ACTIVE') AS active_contracts
       FROM contracts c
       WHERE c.charterer_id = $1 OR c.owner_id = $1`, [req.params.id]).catch(() => ({ rows: [{}] }));
        return res.json({ success: true, data: { ...result.rows[0], stats: stats.rows[0] } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.post('/', (0, auth_js_1.authorize)(index_js_2.SystemRole.SUPER_ADMIN, index_js_2.SystemRole.ADMIN, index_js_2.SystemRole.CHARTERING_MANAGER, index_js_2.SystemRole.PROCUREMENT_MANAGER), async (req, res) => {
    try {
        const { companyName, counterpartyType, email, phone, website, countryIso2, creditRating, creditLimitUsd, taxId, registrationNumber } = req.body;
        if (!companyName || !counterpartyType) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'companyName and counterpartyType are required' } });
        }
        const countryRes = await index_js_1.pool.query('SELECT id FROM countries WHERE iso2 = $1', [countryIso2 || 'IN']);
        const code = companyName.substring(0, 6).toUpperCase().replace(/\s/g, '') + '-' + Date.now().toString().slice(-5);
        const result = await index_js_1.pool.query(`INSERT INTO counterparties (company_name, company_code, counterparty_type, email, phone, website,
       country_id, credit_rating, credit_limit_usd, tax_id, registration_number, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ACTIVE')
       RETURNING id, company_name, company_code, counterparty_type, status, created_at`, [companyName, code, counterpartyType, email, phone, website,
            countryRes.rows[0]?.id, creditRating, creditLimitUsd, taxId, registrationNumber]);
        return res.status(201).json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
//# sourceMappingURL=counterparties.js.map