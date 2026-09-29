import { Router, Response } from 'express';
import { pool } from '../db/index.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';

const router = Router();
router.use(authenticate);

// ─── GET /counterparties ───────────────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 25, search, type, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let idx = 1;

    if (search) { conditions.push(`(cp.company_name ILIKE $${idx} OR cp.email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (type) { conditions.push(`cp.counterparty_type = $${idx}`); params.push(type); idx++; }
    if (status) { conditions.push(`cp.status = $${idx}`); params.push(status); idx++; }

    const where = conditions.join(' AND ');
    const result = await pool.query(
      `SELECT cp.id, cp.company_name, cp.company_code, cp.counterparty_type, cp.email,
              cp.phone, cp.website, cp.status, cp.credit_rating, cp.credit_limit_usd, cp.created_at,
              c.name AS country_name, c.iso2
       FROM counterparties cp
       LEFT JOIN countries c ON c.id = cp.country_id
       WHERE ${where}
       ORDER BY cp.company_name ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, Number(limit), offset]
    );
    const countRes = await pool.query(`SELECT COUNT(*) FROM counterparties cp WHERE ${where}`, params);

    return res.json({
      success: true,
      data: result.rows,
      meta: { total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /counterparties/:id ───────────────────────────────────────────────────
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT cp.*, c.name AS country_name, c.iso2
       FROM counterparties cp
       LEFT JOIN countries c ON c.id = cp.country_id
       WHERE cp.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Counterparty not found' } });
    }

    // Get transaction stats
    const stats = await pool.query(
      `SELECT
         COUNT(DISTINCT c.id) AS total_contracts,
         SUM(c.total_freight_usd) AS total_freight_value_usd,
         COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'ACTIVE') AS active_contracts
       FROM contracts c
       WHERE c.charterer_id = $1 OR c.owner_id = $1`,
      [req.params.id]
    ).catch(() => ({ rows: [{}] }));

    return res.json({ success: true, data: { ...result.rows[0], stats: stats.rows[0] } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── POST /counterparties ──────────────────────────────────────────────────────
router.post('/', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.CHARTERING_MANAGER, SystemRole.PROCUREMENT_MANAGER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { companyName, counterpartyType, email, phone, website, countryIso2, creditRating, creditLimitUsd, taxId, registrationNumber } = req.body;
    if (!companyName || !counterpartyType) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'companyName and counterpartyType are required' } });
    }

    const countryRes = await pool.query('SELECT id FROM countries WHERE iso2 = $1', [countryIso2 || 'IN']);
    const code = companyName.substring(0, 6).toUpperCase().replace(/\s/g, '') + '-' + Date.now().toString().slice(-5);

    const result = await pool.query(
      `INSERT INTO counterparties (company_name, company_code, counterparty_type, email, phone, website,
       country_id, credit_rating, credit_limit_usd, tax_id, registration_number, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ACTIVE')
       RETURNING id, company_name, company_code, counterparty_type, status, created_at`,
      [companyName, code, counterpartyType, email, phone, website,
       countryRes.rows[0]?.id, creditRating, creditLimitUsd, taxId, registrationNumber]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
