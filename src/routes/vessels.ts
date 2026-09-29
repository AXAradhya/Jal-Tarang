import { Router, Response } from 'express';
import { pool } from '../db/index.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';

const router = Router();
router.use(authenticate);

// ─── GET /vessels ─────────────────────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 25, search, vesselType, flag, minDwt, maxDwt, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const orgId = req.user?.organizationId || 'org-sail-corp';
    const conditions: string[] = ['(v.organization_id = $1 OR v.is_verified = TRUE OR v.organization_id IS NULL)'];
    const params: any[] = [orgId];
    let idx = 2;

    if (search) {
      conditions.push(`(v.vessel_name ILIKE $${idx} OR v.imo_number ILIKE $${idx} OR v.call_sign ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (vesselType) { conditions.push(`v.vessel_type = $${idx}`); params.push(vesselType); idx++; }
    if (flag) { conditions.push(`v.flag_country_id = (SELECT id FROM countries WHERE iso2 = $${idx})`); params.push(flag); idx++; }
    if (minDwt) { conditions.push(`v.deadweight_tonnes >= $${idx}`); params.push(Number(minDwt)); idx++; }
    if (maxDwt) { conditions.push(`v.deadweight_tonnes <= $${idx}`); params.push(Number(maxDwt)); idx++; }
    if (status) { conditions.push(`v.status = $${idx}`); params.push(status); idx++; }

    const where = conditions.join(' AND ');

    const [countRes, vesselRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM vessels v WHERE ${where}`, params),
      pool.query(
        `SELECT v.id, v.imo_number, v.vessel_name, v.call_sign, v.vessel_type, v.vessel_class,
                v.deadweight_tonnes, v.gross_tonnage, v.net_tonnage, v.length_overall_m,
                v.beam_m, v.summer_draft_m, v.year_built, v.status, v.current_position_lat,
                v.current_position_lon, v.current_speed_knots, v.current_heading_deg,
                v.last_position_update, v.current_port_id,
                c.name AS flag_country, c.iso2 AS flag_iso2, c.iso3 AS flag_iso3,
                p.port_name AS current_port_name,
                vo.company_name AS vessel_owner,
                vm.company_name AS vessel_manager
         FROM vessels v
         LEFT JOIN countries c ON c.id = v.flag_country_id
         LEFT JOIN ports p ON p.id = v.current_port_id
         LEFT JOIN vessel_owners vo ON vo.id = v.owner_id
         LEFT JOIN vessel_managers vm ON vm.id = v.manager_id
         WHERE ${where}
         ORDER BY v.vessel_name ASC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, Number(limit), offset]
      ),
    ]);

    return res.json({
      success: true,
      data: vesselRes.rows,
      meta: { total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / Number(limit)) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /vessels/classes ─────────────────────────────────────────────────────
router.get('/classes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT vessel_class, COUNT(*) AS count,
              ROUND(AVG(deadweight_tonnes)) AS avg_dwt,
              ROUND(AVG(summer_draft_m)::numeric, 1) AS avg_draft,
              ROUND(AVG(length_overall_m)::numeric, 1) AS avg_loa
       FROM vessels
       WHERE status = 'ACTIVE' OR status = 'AVAILABLE'
       GROUP BY vessel_class
       ORDER BY avg_dwt DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /vessels/available ───────────────────────────────────────────────────
router.get('/available', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'org-sail-corp';
    const result = await pool.query(
      `SELECT v.id, v.imo_number, v.vessel_name, v.vessel_class, v.deadweight_tonnes,
              v.summer_draft_m, v.length_overall_m, v.beam_m, v.status,
              v.current_position_lat, v.current_position_lon, v.current_speed_knots, v.current_heading_deg,
              p.port_name AS current_port_name
       FROM vessels v
       LEFT JOIN ports p ON p.id = v.current_port_id
       WHERE (v.status = 'AVAILABLE' OR v.status = 'ACTIVE')
         AND (v.organization_id = $1 OR v.is_verified = TRUE OR v.organization_id IS NULL)
       ORDER BY v.deadweight_tonnes DESC`,
      [orgId]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /vessels/stats ───────────────────────────────────────────────────────
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'org-sail-corp';
    const result = await pool.query(
      `SELECT COUNT(*) AS total_vessels,
              COUNT(*) FILTER (WHERE status = 'AVAILABLE') AS available_vessels,
              COUNT(*) FILTER (WHERE status = 'IN_TRANSIT') AS in_transit_vessels,
              COUNT(*) FILTER (WHERE status = 'AT_PORT' OR status = 'DISCHARGING') AS at_port_vessels,
              COALESCE(SUM(deadweight_tonnes), 0) AS total_dwt,
              ROUND(AVG(deadweight_tonnes)) AS avg_dwt
       FROM vessels
       WHERE (organization_id = $1 OR is_verified = TRUE OR organization_id IS NULL)`,
      [orgId]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /vessels/:id ─────────────────────────────────────────────────────────
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'org-sail-corp';
    const result = await pool.query(
      `SELECT v.*,
              c.name AS flag_country, c.iso2 AS flag_iso2,
              p.port_name AS current_port_name, p.un_locode AS current_port_locode,
              vo.company_name AS vessel_owner, vo.email AS owner_email,
              vm.company_name AS vessel_manager,
              vclass.class_society, vclass.hull_form, vclass.cargo_capacity_cbm,
              vclass.hatch_count, vclass.crane_count, vclass.crane_capacity_mt,
              array_agg(DISTINCT jsonb_build_object('surveyType', vsr.survey_type, 'surveyDate', vsr.survey_date, 'nextDueDate', vsr.next_due_date, 'surveyAuthority', vsr.survey_authority, 'result', vsr.result))
                FILTER (WHERE vsr.id IS NOT NULL) AS surveys
       FROM vessels v
       LEFT JOIN countries c ON c.id = v.flag_country_id
       LEFT JOIN ports p ON p.id = v.current_port_id
       LEFT JOIN vessel_owners vo ON vo.id = v.owner_id
       LEFT JOIN vessel_managers vm ON vm.id = v.manager_id
       LEFT JOIN vessel_technical_specs vclass ON vclass.vessel_id = v.id
       LEFT JOIN vessel_surveys vsr ON vsr.vessel_id = v.id
       WHERE v.id = $1 AND (v.organization_id = $2 OR v.is_verified = TRUE OR v.organization_id IS NULL)
       GROUP BY v.id, c.name, c.iso2, p.port_name, p.un_locode, vo.company_name, vo.email,
                vm.company_name, vclass.class_society, vclass.hull_form, vclass.cargo_capacity_cbm,
                vclass.hatch_count, vclass.crane_count, vclass.crane_capacity_mt`,
      [req.params.id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vessel not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── POST /vessels ─────────────────────────────────────────────────────────────
router.post('/', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.CHARTERING_MANAGER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      imoNumber, vesselName, callSign, mmsiNumber, vesselType, vesselClass,
      deadweightTonnes, grossTonnage, netTonnage, lengthOverallM, beamM, summerDraftM,
      yearBuilt, flagCountryIso2, ownerId, managerId, status
    } = req.body;

    if (!imoNumber || !vesselName || !vesselType) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'imoNumber, vesselName, vesselType are required' } });
    }

    const flagRes = await pool.query('SELECT id FROM countries WHERE iso2 = $1', [flagCountryIso2 || 'IN']);
    const flagId = flagRes.rows[0]?.id || null;

    const result = await pool.query(
      `INSERT INTO vessels (imo_number, vessel_name, call_sign, mmsi_number, vessel_type, vessel_class,
       deadweight_tonnes, gross_tonnage, net_tonnage, length_overall_m, beam_m, summer_draft_m,
       year_built, flag_country_id, owner_id, manager_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id, imo_number, vessel_name, vessel_type, deadweight_tonnes, status, created_at`,
      [imoNumber, vesselName, callSign, mmsiNumber, vesselType, vesselClass,
       deadweightTonnes, grossTonnage, netTonnage, lengthOverallM, beamM, summerDraftM,
       yearBuilt, flagId, ownerId, managerId, status || 'ACTIVE']
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'IMO number already exists' } });
    }
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── PATCH /vessels/:id ───────────────────────────────────────────────────────
router.patch('/:id', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.CHARTERING_MANAGER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updatable = ['vessel_name', 'call_sign', 'status', 'current_port_id', 'current_position_lat', 'current_position_lon', 'current_speed_knots', 'current_heading_deg'];
    const fieldMap: Record<string, string> = {
      vesselName: 'vessel_name', callSign: 'call_sign', status: 'status',
      currentPortId: 'current_port_id', currentPositionLat: 'current_position_lat',
      currentPositionLon: 'current_position_lon', currentSpeedKnots: 'current_speed_knots',
      currentHeadingDeg: 'current_heading_deg'
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
    if (req.body.currentPositionLat || req.body.currentPositionLon) {
      fields.push(`last_position_update = NOW()`);
    }
    vals.push(id);

    const result = await pool.query(
      `UPDATE vessels SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, imo_number, vessel_name, status, updated_at`,
      vals
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vessel not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /vessels/feasibility/check ──────────────────────────────────────────
router.post('/feasibility/check', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vesselId, portId, cargoQuantityMt } = req.body;
    if (!vesselId || !portId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'vesselId and portId are required' } });
    }

    const [vRes, pRes] = await Promise.all([
      pool.query(
        `SELECT v.imo_number, v.vessel_name, v.vessel_type, v.deadweight_tonnes, v.length_overall_m,
                v.beam_m, v.summer_draft_m, v.gross_tonnage
         FROM vessels v WHERE v.id = $1`,
        [vesselId]
      ),
      pool.query(
        `SELECT p.port_name, p.un_locode, p.max_vessel_loa_m, p.max_vessel_beam_m,
                p.max_vessel_draft_m, p.max_vessel_dwt, p.is_east_coast_india,
                array_agg(jsonb_build_object('berthName', b.berth_name, 'maxLoa', b.max_loa_m, 'maxBeam', b.max_beam_m, 'maxDraft', b.max_draft_m, 'maxDwt', b.max_dwt)) AS berths
         FROM ports p
         LEFT JOIN berths b ON b.port_id = p.id AND b.status = 'OPERATIONAL'
         WHERE p.id = $1
         GROUP BY p.id, p.port_name, p.un_locode, p.max_vessel_loa_m, p.max_vessel_beam_m, p.max_vessel_draft_m, p.max_vessel_dwt, p.is_east_coast_india`,
        [portId]
      ),
    ]);

    if (vRes.rows.length === 0) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vessel not found' } });
    if (pRes.rows.length === 0) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Port not found' } });

    const v = vRes.rows[0];
    const p = pRes.rows[0];
    const violations: string[] = [];

    const loaOk = !p.max_vessel_loa_m || v.length_overall_m <= p.max_vessel_loa_m;
    const beamOk = !p.max_vessel_beam_m || v.beam_m <= p.max_vessel_beam_m;
    const draftOk = !p.max_vessel_draft_m || v.summer_draft_m <= p.max_vessel_draft_m;
    const dwtOk = !p.max_vessel_dwt || v.deadweight_tonnes <= p.max_vessel_dwt;
    const cargoOk = !cargoQuantityMt || cargoQuantityMt <= v.deadweight_tonnes;

    if (!loaOk) violations.push(`LOA violation: ${v.length_overall_m}m > ${p.max_vessel_loa_m}m port limit`);
    if (!beamOk) violations.push(`Beam violation: ${v.beam_m}m > ${p.max_vessel_beam_m}m port limit`);
    if (!draftOk) violations.push(`Draft violation: ${v.summer_draft_m}m > ${p.max_vessel_draft_m}m port limit`);
    if (!dwtOk) violations.push(`DWT violation: ${v.deadweight_tonnes}MT > ${p.max_vessel_dwt}MT port limit`);
    if (!cargoOk) violations.push(`Cargo violation: ${cargoQuantityMt}MT exceeds vessel DWT ${v.deadweight_tonnes}MT`);

    const isFeasible = loaOk && beamOk && draftOk && dwtOk && cargoOk;
    const feasibilityScore = [loaOk, beamOk, draftOk, dwtOk, cargoOk].filter(Boolean).length / 5 * 100;

    return res.json({
      success: true,
      data: {
        isFeasible,
        feasibilityScore: Math.round(feasibilityScore),
        vessel: { id: vesselId, imoNumber: v.imo_number, name: v.vessel_name, type: v.vessel_type, dwt: v.deadweight_tonnes },
        port: { id: portId, name: p.port_name, locode: p.un_locode, isEastCoastIndia: p.is_east_coast_india },
        checks: { loaCompatible: loaOk, beamCompatible: beamOk, draftCompatible: draftOk, dwtCompatible: dwtOk, cargoCompatible: cargoOk },
        violations,
        availableBerths: (p.berths || []).filter((b: any) =>
          (!b.maxLoa || v.length_overall_m <= b.maxLoa) &&
          (!b.maxBeam || v.beam_m <= b.maxBeam) &&
          (!b.maxDraft || v.summer_draft_m <= b.maxDraft)
        ),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /vessels/:id/voyages ──────────────────────────────────────────────────
router.get('/:id/voyages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const result = await pool.query(
      `SELECT v.id, v.voyage_number, v.voyage_type, v.status, v.departure_port_id, v.arrival_port_id,
              v.etd, v.eta, v.atd, v.ata, v.cargo_quantity_mt, v.freight_rate_usd_per_mt,
              v.total_freight_usd, v.total_distance_nm, v.vessel_id,
              dp.port_name AS departure_port, dp.un_locode AS departure_locode,
              ap.port_name AS arrival_port, ap.un_locode AS arrival_locode
       FROM voyages v
       LEFT JOIN ports dp ON dp.id = v.departure_port_id
       LEFT JOIN ports ap ON ap.id = v.arrival_port_id
       WHERE v.vessel_id = $1
       ORDER BY v.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, Number(limit), offset]
    );
    const countRes = await pool.query('SELECT COUNT(*) FROM voyages WHERE vessel_id = $1', [req.params.id]);
    return res.json({
      success: true,
      data: result.rows,
      meta: { total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
