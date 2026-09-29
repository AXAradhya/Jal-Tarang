import { Router, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db/index.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';

const router = Router();
router.use(authenticate);

// ─── GET /procurement/plant-stock ───────────────────────────────────────────
router.get('/plant-stock', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const plants = [
      { id: 'BSP', plant: 'Bhilai Steel Plant (BSP)', currentDays: 14.5, safeBuffer: 21, material: 'Coking Coal', monthlyConsumptionMt: 420000 },
      { id: 'BSL', plant: 'Bokaro Steel Plant (BSL)', currentDays: 23.0, safeBuffer: 21, material: 'Coking Coal', monthlyConsumptionMt: 360000 },
      { id: 'RSP', plant: 'Rourkela Steel Plant (RSP)', currentDays: 28.2, safeBuffer: 21, material: 'Iron Ore Fines', monthlyConsumptionMt: 290000 },
      { id: 'DSP', plant: 'Durgapur Steel Plant (DSP)', currentDays: 13.8, safeBuffer: 21, material: 'Coking Coal', monthlyConsumptionMt: 210000 },
      { id: 'ISP', plant: 'IISCO Steel Plant (ISP)', currentDays: 19.4, safeBuffer: 21, material: 'Coking Coal & Limestone', monthlyConsumptionMt: 180000 },
    ].map((p) => ({
      ...p,
      status: p.currentDays < 15 ? 'CRITICAL' : p.currentDays < 21 ? 'WATCH' : 'NORMAL',
      cushionDeltaDays: +(p.currentDays - p.safeBuffer).toFixed(1),
    }));

    return res.json({
      success: true,
      data: plants,
      meta: {
        totalPlants: plants.length,
        criticalCount: plants.filter((p) => p.status === 'CRITICAL').length,
        watchCount: plants.filter((p) => p.status === 'WATCH').length,
        evaluatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'PLANT_STOCK_ERROR', message: err.message } });
  }
});

// ─── GET /procurement ─────────────────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 25, status, priority, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = ['pr.organization_id = $1'];
    const params: any[] = [req.user!.organizationId];
    let idx = 2;

    if (search) {
      conditions.push(`(pr.requirement_reference ILIKE $${idx} OR com.commodity_name ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (status) { conditions.push(`pr.status = $${idx}`); params.push(status); idx++; }
    if (priority) { conditions.push(`pr.priority = $${idx}`); params.push(priority); idx++; }

    const where = conditions.join(' AND ');
    const [countRes, procRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM procurement_requirements pr WHERE ${where}`, params),
      pool.query(
        `SELECT pr.id, pr.requirement_reference, pr.quantity_required_mt, pr.quantity_procured_mt,
                pr.target_price_usd_per_mt, pr.budget_usd, pr.actual_spend_usd, pr.status, pr.priority,
                pr.required_by_date, pr.delivery_port_id, pr.created_at,
                com.commodity_name, com.commodity_code, com.hs_code,
                ct.cargo_type_name, ct.cargo_category,
                dp.port_name AS delivery_port, dp.un_locode AS delivery_locode,
                u.display_name AS created_by_name,
                COUNT(DISTINCT pq.id) AS quote_count,
                MIN(pq.quoted_price_usd_per_mt) AS best_quote_price
         FROM procurement_requirements pr
         LEFT JOIN commodities com ON com.id = pr.commodity_id
         LEFT JOIN cargo_types ct ON ct.id = com.cargo_type_id
         LEFT JOIN ports dp ON dp.id = pr.delivery_port_id
         LEFT JOIN users u ON u.id = pr.created_by
         LEFT JOIN procurement_quotes pq ON pq.requirement_id = pr.id AND pq.status = 'ACTIVE'
         WHERE ${where}
         GROUP BY pr.id, pr.requirement_reference, pr.quantity_required_mt, pr.quantity_procured_mt,
                  pr.target_price_usd_per_mt, pr.budget_usd, pr.actual_spend_usd, pr.status, pr.priority,
                  pr.required_by_date, pr.delivery_port_id, pr.created_at,
                  com.commodity_name, com.commodity_code, com.hs_code,
                  ct.cargo_type_name, ct.cargo_category, dp.port_name, dp.un_locode, u.display_name
         ORDER BY pr.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, Number(limit), offset]
      ),
    ]);

    return res.json({
      success: true,
      data: procRes.rows,
      meta: { total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / Number(limit)) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /procurement/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [reqRes, quotesRes, ordersRes] = await Promise.all([
      pool.query(
        `SELECT pr.*,
                com.commodity_name, com.commodity_code, com.hs_code, com.moisture_limit_percent,
                ct.cargo_type_name, ct.cargo_category,
                dp.port_name AS delivery_port, dp.un_locode AS delivery_locode,
                u.display_name AS created_by_name
         FROM procurement_requirements pr
         LEFT JOIN commodities com ON com.id = pr.commodity_id
         LEFT JOIN cargo_types ct ON ct.id = com.cargo_type_id
         LEFT JOIN ports dp ON dp.id = pr.delivery_port_id
         LEFT JOIN users u ON u.id = pr.created_by
         WHERE pr.id = $1 AND pr.organization_id = $2`,
        [req.params.id, req.user!.organizationId]
      ),
      pool.query(
        `SELECT pq.id, pq.quote_reference, pq.quoted_price_usd_per_mt, pq.quantity_offered_mt,
                pq.validity_date, pq.status, pq.delivery_terms, pq.payment_terms,
                cp.company_name AS supplier_name, cp.country_id AS supplier_country
         FROM procurement_quotes pq
         LEFT JOIN counterparties cp ON cp.id = pq.supplier_id
         WHERE pq.requirement_id = $1 ORDER BY pq.quoted_price_usd_per_mt ASC`,
        [req.params.id]
      ),
      pool.query(
        `SELECT po.id, po.po_number, po.quantity_mt, po.unit_price_usd_per_mt, po.total_value_usd,
                po.status, po.expected_delivery_date
         FROM purchase_orders po WHERE po.requirement_id = $1`,
        [req.params.id]
      ).catch(() => ({ rows: [] })),
    ]);

    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Procurement requirement not found' } });
    }
    return res.json({ success: true, data: { ...reqRes.rows[0], quotes: quotesRes.rows, purchaseOrders: ordersRes.rows } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── POST /procurement ────────────────────────────────────────────────────────
router.post('/', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.PROCUREMENT_MANAGER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      commodityId, quantityRequiredMt, targetPriceUsdPerMt, budgetUsd,
      requiredByDate, deliveryPortId, priority, qualitySpecs, notes
    } = req.body;

    if (!commodityId || !quantityRequiredMt || !deliveryPortId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'commodityId, quantityRequiredMt, deliveryPortId are required' } });
    }

    // Atomic collision-free requirement reference generation
    const uniqueSuffix = `${Date.now().toString().slice(-6)}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const ref = `SAIL-PRQ-${new Date().getFullYear()}-${uniqueSuffix}`;

    const result = await pool.query(
      `INSERT INTO procurement_requirements (organization_id, requirement_reference, commodity_id,
       quantity_required_mt, target_price_usd_per_mt, budget_usd, required_by_date,
       delivery_port_id, priority, quality_specs, notes, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'OPEN')
       RETURNING id, requirement_reference, quantity_required_mt, status, created_at`,
      [req.user!.organizationId, ref, commodityId, quantityRequiredMt,
       targetPriceUsdPerMt, budgetUsd, requiredByDate, deliveryPortId,
       priority || 'MEDIUM', JSON.stringify(qualitySpecs || {}), notes, req.user!.userId]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── POST /procurement/:id/quotes ─────────────────────────────────────────────
router.post('/:id/quotes', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.PROCUREMENT_MANAGER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { supplierId, quotedPriceUsdPerMt, quantityOfferedMt, validityDate, deliveryTerms, paymentTerms } = req.body;

    if (!supplierId || !quotedPriceUsdPerMt) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'supplierId and quotedPriceUsdPerMt are required' } });
    }

    const refRes = await pool.query('SELECT COUNT(*) FROM procurement_quotes WHERE requirement_id = $1', [id]);
    const qRef = `QUO-${id.substring(0, 8).toUpperCase()}-${String(parseInt(refRes.rows[0].count) + 1).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO procurement_quotes (requirement_id, quote_reference, supplier_id, quoted_price_usd_per_mt,
       quantity_offered_mt, validity_date, delivery_terms, payment_terms, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ACTIVE')
       RETURNING id, quote_reference, quoted_price_usd_per_mt, status, created_at`,
      [id, qRef, supplierId, quotedPriceUsdPerMt, quantityOfferedMt,
       validityDate, deliveryTerms, paymentTerms, req.user!.userId]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /procurement/dashboard/summary ───────────────────────────────────────
router.get('/dashboard/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'OPEN') AS open_requirements,
         COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') AS in_progress,
         COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
         COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled,
         SUM(quantity_required_mt) FILTER (WHERE status IN ('OPEN','IN_PROGRESS')) AS total_open_quantity_mt,
         SUM(budget_usd) FILTER (WHERE status IN ('OPEN','IN_PROGRESS')) AS total_open_budget_usd,
         SUM(actual_spend_usd) AS total_actual_spend_usd,
         AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400) FILTER (WHERE status = 'OPEN') AS avg_age_days
       FROM procurement_requirements WHERE organization_id = $1`,
      [req.user!.organizationId]
    );

    const topCommodities = await pool.query(
      `SELECT com.commodity_name, SUM(pr.quantity_required_mt) AS total_qty, COUNT(*) AS requirement_count
       FROM procurement_requirements pr
       JOIN commodities com ON com.id = pr.commodity_id
       WHERE pr.organization_id = $1 AND pr.status != 'CANCELLED'
       GROUP BY com.commodity_name ORDER BY total_qty DESC LIMIT 10`,
      [req.user!.organizationId]
    );

    return res.json({
      success: true,
      data: {
        summary: result.rows[0],
        topCommodities: topCommodities.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
