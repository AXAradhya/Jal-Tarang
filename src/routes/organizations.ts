/**
 * JAL TARANG - Organizations API Route
 * Multi-tenant organization governance, settings, and department management.
 */

import { Router, Response } from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { AuthenticatedRequest, SystemRole } from '../types/index.js';

const router = Router();

// GET /api/v1/organizations - List organizations
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.roles?.includes(SystemRole.SUPER_ADMIN);
    let query = `
      SELECT o.id, o.code, o.name, o.is_active, o.created_at, o.updated_at,
             c.name as country_name,
             (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id)::int as user_count
      FROM organizations o
      LEFT JOIN countries c ON c.id = o.country_id
    `;
    const params: any[] = [];

    // Tenant isolation: Non-SUPER_ADMIN can only view their own organization
    if (!isSuperAdmin && req.user?.organizationId) {
      query += ` WHERE o.id = $1`;
      params.push(req.user.organizationId);
    } else {
      query += ` ORDER BY o.name ASC`;
    }

    const result = await pool.query(query, params);
    return res.json({
      success: true,
      data: result.rows,
      meta: { count: result.rows.length }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/v1/organizations - Create new organization (SUPER_ADMIN only)
router.post('/', authenticateToken, requireRole([SystemRole.SUPER_ADMIN]), async (req: AuthenticatedRequest, res: Response) => {
  const { code, name, countryId, settings } = req.body;
  if (!code || !name) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'code and name are required' } });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orgRes = await client.query(
      `INSERT INTO organizations (code, name, country_id) VALUES ($1, $2, $3) RETURNING *`,
      [code.toUpperCase(), name, countryId || null]
    );
    const org = orgRes.rows[0];

    // Seed default settings if provided
    if (settings && typeof settings === 'object') {
      for (const [key, val] of Object.entries(settings)) {
        await client.query(
          `INSERT INTO organization_settings (organization_id, setting_key, setting_value) VALUES ($1, $2, $3)`,
          [org.id, key, JSON.stringify(val)]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(201).json({ success: true, data: org });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, error: { code: 'ORGANIZATION_CREATE_FAILED', message: err.message } });
  } finally {
    client.release();
  }
});

// GET /api/v1/organizations/:id - Get organization details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isSuperAdmin = req.user?.roles?.includes(SystemRole.SUPER_ADMIN);

  if (!isSuperAdmin && req.user?.organizationId !== id) {
    return res.status(403).json({ success: false, error: { code: 'TENANT_ACCESS_DENIED', message: 'Access to this organization is denied' } });
  }

  try {
    const orgRes = await pool.query(
      `SELECT o.*, c.name as country_name FROM organizations o LEFT JOIN countries c ON c.id = o.country_id WHERE o.id = $1`,
      [id]
    );
    if (orgRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Organization not found' } });
    }

    const settingsRes = await pool.query(
      `SELECT setting_key, setting_value FROM organization_settings WHERE organization_id = $1`,
      [id]
    );

    const settings: Record<string, any> = {};
    settingsRes.rows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    return res.json({
      success: true,
      data: {
        ...orgRes.rows[0],
        settings
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// PATCH /api/v1/organizations/:id - Update organization
router.patch('/:id', authenticateToken, requireRole([SystemRole.SUPER_ADMIN, SystemRole.ADMIN]), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isSuperAdmin = req.user?.roles?.includes(SystemRole.SUPER_ADMIN);

  if (!isSuperAdmin && req.user?.organizationId !== id) {
    return res.status(403).json({ success: false, error: { code: 'TENANT_ACCESS_DENIED', message: 'Access denied' } });
  }

  const { name, isActive } = req.body;
  try {
    const result = await pool.query(
      `UPDATE organizations
       SET name = COALESCE($1, name),
           is_active = COALESCE($2, is_active),
           updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [name, isActive, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Organization not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'UPDATE_FAILED', message: err.message } });
  }
});

// GET /api/v1/organizations/:id/users - Get organization users
router.get('/:id/users', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isSuperAdmin = req.user?.roles?.includes(SystemRole.SUPER_ADMIN);

  if (!isSuperAdmin && req.user?.organizationId !== id) {
    return res.status(403).json({ success: false, error: { code: 'TENANT_ACCESS_DENIED', message: 'Access denied' } });
  }

  try {
    const users = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.employee_code, u.is_active, u.created_at,
              ARRAY_AGG(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.organization_id = $1
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      [id]
    );
    return res.json({ success: true, data: users.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// GET & PATCH /api/v1/organizations/:id/settings
router.get('/:id/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT setting_key, setting_value, updated_at FROM organization_settings WHERE organization_id = $1`,
      [id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

router.patch('/:id/settings', authenticateToken, requireRole([SystemRole.SUPER_ADMIN, SystemRole.ADMIN]), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { settingKey, settingValue } = req.body;
  if (!settingKey || settingValue === undefined) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'settingKey and settingValue required' } });
  }

  try {
    const result = await pool.query(
      `INSERT INTO organization_settings (organization_id, setting_key, setting_value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (organization_id, setting_key)
       DO UPDATE SET setting_value = $3, updated_at = NOW()
       RETURNING *`,
      [id, settingKey, JSON.stringify(settingValue)]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SETTINGS_UPDATE_FAILED', message: err.message } });
  }
});

export default router;
