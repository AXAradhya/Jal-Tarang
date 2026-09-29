import { Router, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db/index.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';

const router = Router();
router.use(authenticate);

// ─── GET /cargo ───────────────────────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 25, search, cargoCategory, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = ['cp.organization_id = $1'];
    const params: any[] = [req.user!.organizationId];
    let idx = 2;

    if (search) {
      conditions.push(`(cp.cargo_reference_no ILIKE $${idx} OR ct.cargo_type_name ILIKE $${idx} OR com.commodity_name ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (cargoCategory) { conditions.push(`ct.cargo_category = $${idx}`); params.push(cargoCategory); idx++; }
    if (status) { conditions.push(`cp.status = $${idx}`); params.push(status); idx++; }

    const where = conditions.join(' AND ');

    const [countRes, cargoRes] = await Promise.all([
      pool.query(`SELECT COUNT(DISTINCT cp.id) FROM cargo_parcels cp LEFT JOIN cargo_types ct ON ct.id = cp.cargo_type_id WHERE ${where}`, params),
      pool.query(
        `SELECT cp.id, cp.cargo_reference_no, cp.quantity_mt, cp.quantity_cbm, cp.unit_price_usd,
                cp.total_value_usd, cp.status, cp.readiness_date, cp.laycan_start, cp.laycan_end,
                cp.load_port_id, cp.discharge_port_id, cp.created_at,
                ct.cargo_type_name, ct.cargo_category, ct.cargo_sub_category,
                com.commodity_name, com.commodity_code, com.hs_code,
                lp.port_name AS load_port, lp.un_locode AS load_locode,
                dp.port_name AS discharge_port, dp.un_locode AS discharge_locode
         FROM cargo_parcels cp
         LEFT JOIN cargo_types ct ON ct.id = cp.cargo_type_id
         LEFT JOIN commodities com ON com.id = cp.commodity_id
         LEFT JOIN ports lp ON lp.id = cp.load_port_id
         LEFT JOIN ports dp ON dp.id = cp.discharge_port_id
         WHERE ${where}
         ORDER BY cp.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, Number(limit), offset]
      ),
    ]);

    return res.json({
      success: true,
      data: cargoRes.rows,
      meta: { total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / Number(limit)) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /cargo/:id ───────────────────────────────────────────────────────────
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT cp.*,
              ct.cargo_type_name, ct.cargo_category, ct.cargo_sub_category, ct.requires_specialized_vessel,
              com.commodity_name, com.commodity_code, com.hs_code, com.moisture_limit_percent,
              lp.port_name AS load_port, lp.un_locode AS load_locode,
              dp.port_name AS discharge_port, dp.un_locode AS discharge_locode,
              u.display_name AS created_by_name
       FROM cargo_parcels cp
       LEFT JOIN cargo_types ct ON ct.id = cp.cargo_type_id
       LEFT JOIN commodities com ON com.id = cp.commodity_id
       LEFT JOIN ports lp ON lp.id = cp.load_port_id
       LEFT JOIN ports dp ON dp.id = cp.discharge_port_id
       LEFT JOIN users u ON u.id = cp.created_by
       WHERE cp.id = $1 AND cp.organization_id = $2`,
      [req.params.id, req.user!.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Cargo parcel not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── POST /cargo ──────────────────────────────────────────────────────────────
router.post('/', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.PROCUREMENT_MANAGER, SystemRole.CHARTERING_MANAGER, SystemRole.ANALYST, SystemRole.PORT_MANAGER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      cargoTypeId, commodityId, quantityMt, quantityCbm, unitPriceUsd,
      totalValueUsd, readinessDate, laycanStart, laycanEnd,
      loadPortId, dischargePortId, moisturePercent, densityKgM3,
      qualitySpec, specialRequirements
    } = req.body;

    if (!cargoTypeId || !quantityMt || !loadPortId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'cargoTypeId, quantityMt, and loadPortId are required' } });
    }

    // Auto-generate collision-free cargo reference number with high entropy
    const uniqueEntropy = `${Date.now().toString(36).slice(-4)}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const seqRes = await pool.query(`SELECT nextval('cargo_reference_seq')::TEXT AS seq`).catch(() => ({ rows: [{ seq: uniqueEntropy }] }));
    const cargoRef = `CRG-${new Date().getFullYear()}-${seqRes.rows[0].seq}`;

    const result = await pool.query(
      `INSERT INTO cargo_parcels (organization_id, cargo_reference_no, cargo_type_id, commodity_id,
       quantity_mt, quantity_cbm, unit_price_usd, total_value_usd, readiness_date,
       laycan_start, laycan_end, load_port_id, discharge_port_id, moisture_percent,
       density_kg_m3, quality_spec, special_requirements, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'PENDING')
       RETURNING id, cargo_reference_no, quantity_mt, status, created_at`,
      [req.user!.organizationId, cargoRef, cargoTypeId, commodityId, quantityMt, quantityCbm,
       unitPriceUsd, totalValueUsd, readinessDate, laycanStart, laycanEnd,
       loadPortId, dischargePortId, moisturePercent, densityKgM3,
       JSON.stringify(qualitySpec || {}), specialRequirements, req.user!.userId]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE_RESOURCE', message: 'A parcel with this reference or code already exists. Please retry submission.' } });
    }
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── PATCH /cargo/:id ─────────────────────────────────────────────────────────
router.patch('/:id', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.PROCUREMENT_MANAGER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const fieldMap: Record<string, string> = {
      quantityMt: 'quantity_mt', quantityCbm: 'quantity_cbm',
      unitPriceUsd: 'unit_price_usd', totalValueUsd: 'total_value_usd',
      status: 'status', readinessDate: 'readiness_date',
      laycanStart: 'laycan_start', laycanEnd: 'laycan_end',
      dischargePortId: 'discharge_port_id', specialRequirements: 'special_requirements'
    };

    const fields: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
      if (req.body[key] !== undefined) {
        fields.push(`${col} = $${i}`);
        vals.push(req.body[key]);
        i++;
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update' } });
    }
    fields.push(`updated_at = NOW()`);
    vals.push(id, req.user!.organizationId);

    const result = await pool.query(
      `UPDATE cargo_parcels SET ${fields.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1}
       RETURNING id, cargo_reference_no, quantity_mt, status, updated_at`,
      vals
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Cargo parcel not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /cargo/types/list ────────────────────────────────────────────────────
router.get('/types/list', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, cargo_type_code, cargo_type_name, cargo_category, cargo_sub_category,
              requires_specialized_vessel, hazmat_class, max_moisture_percent, stowage_factor_m3_mt
       FROM cargo_types ORDER BY cargo_category, cargo_type_name`
    );
    return res.json({ success: true, data: result.rows, meta: { count: result.rowCount } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /cargo/commodities/list ───────────────────────────────────────────────
router.get('/commodities/list', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, cargoTypeId, category } = req.query;
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let idx = 1;
    if (search) {
      conditions.push(`(c.commodity_name ILIKE $${idx} OR c.commodity_code ILIKE $${idx} OR c.hs_code ILIKE $${idx} OR c.description ILIKE $${idx} OR ct.cargo_category ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (cargoTypeId) {
      conditions.push(`c.cargo_type_id = $${idx}`);
      params.push(cargoTypeId);
      idx++;
    }
    if (category && category !== 'ALL') {
      conditions.push(`(ct.cargo_category ILIKE $${idx} OR c.cargo_category ILIKE $${idx})`);
      params.push(`%${category}%`);
      idx++;
    }
    const result = await pool.query(
      `SELECT c.id, c.commodity_code, c.commodity_name, c.hs_code, c.icon, c.description,
              c.origin_regions, c.benchmark_price_usd_mt, c.benchmark_price_inr_mt,
              c.price_change_24h_pct, c.price_trend, c.index_source,
              c.moisture_limit_percent, c.bulk_density_kg_m3, c.stowage_factor,
              c.typical_parcel_mt, c.hazmat_un_number,
              COALESCE(ct.cargo_type_name, c.cargo_type_name, c.commodity_name) AS cargo_type_name,
              COALESCE(ct.cargo_category, c.cargo_category, 'Dry Bulk') AS cargo_category
       FROM commodities c
       LEFT JOIN cargo_types ct ON ct.id = c.cargo_type_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.commodity_name LIMIT 200`,
      params
    );
    return res.json({ success: true, data: result.rows, meta: { count: result.rowCount } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /cargo/commodities/ticker ─────────────────────────────────────────────
router.get('/commodities/ticker', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM commodities ORDER BY commodity_name`);
    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      baseCurrency: 'USD',
      usdToInrRate: 84.50,
      data: result.rows,
      meta: { count: result.rowCount }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
