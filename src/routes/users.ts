import { Router, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { pool } from '../db/index.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';

const router = Router();
router.use(authenticate);

// ─── GET /users ───────────────────────────────────────────────────────────────
router.get('/', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 25, search, status, role } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = ['u.organization_id = $1'];
    const params: any[] = [req.user!.organizationId];
    let idx = 2;

    if (search) {
      conditions.push(`(u.email ILIKE $${idx} OR u.display_name ILIKE $${idx} OR u.employee_code ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (status) { conditions.push(`u.status = $${idx}`); params.push(status); idx++; }
    if (role) {
      conditions.push(`EXISTS (
        SELECT 1 FROM user_roles ur2
        JOIN roles r2 ON r2.id = ur2.role_id
        WHERE ur2.user_id = u.id AND ur2.is_active = TRUE AND r2.role_name = $${idx}
      )`);
      params.push(role);
      idx++;
    }

    const where = conditions.join(' AND ');

    const [countRes, usersRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(DISTINCT u.id) FROM users u WHERE ${where}`,
        params
      ),
      pool.query(
        `SELECT u.id, u.employee_code, u.first_name, u.last_name, u.display_name, u.email, u.phone,
                u.status, u.timezone, u.locale, u.created_at, u.updated_at,
                array_agg(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL) AS roles,
                array_agg(DISTINCT r.display_name) FILTER (WHERE r.display_name IS NOT NULL) AS role_display_names
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
         LEFT JOIN roles r ON r.id = ur.role_id
         WHERE ${where}
         GROUP BY u.id, u.employee_code, u.first_name, u.last_name, u.display_name, u.email, u.phone,
                  u.status, u.timezone, u.locale, u.created_at, u.updated_at
         ORDER BY u.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, Number(limit), offset]
      ),
    ]);

    return res.json({
      success: true,
      data: usersRes.rows,
      meta: { total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / Number(limit)) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /users/:id ───────────────────────────────────────────────────────────
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Can view own profile or admins can view any
    const isOwnProfile = req.user!.userId === id;
    const isAdmin = req.user!.roles.some(r => [SystemRole.SUPER_ADMIN, SystemRole.ADMIN].includes(r));
    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
    }

    const result = await pool.query(
      `SELECT u.id, u.employee_code, u.first_name, u.middle_name, u.last_name, u.display_name,
              u.email, u.phone, u.status, u.timezone, u.locale, u.created_at, u.updated_at,
              o.legal_name AS organization_name, o.organization_code,
              d.department_name,
              uc.last_login_at, uc.password_changed_at,
              array_agg(DISTINCT jsonb_build_object('roleId', r.id, 'roleName', r.role_name, 'displayName', r.display_name)) 
                FILTER (WHERE r.id IS NOT NULL) AS roles
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       LEFT JOIN departments d ON d.id = u.department_id
       LEFT JOIN user_credentials uc ON uc.user_id = u.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id, u.employee_code, u.first_name, u.middle_name, u.last_name, u.display_name,
                u.email, u.phone, u.status, u.timezone, u.locale, u.created_at, u.updated_at,
                o.legal_name, o.organization_code, d.department_name, uc.last_login_at, uc.password_changed_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── POST /users ──────────────────────────────────────────────────────────────
router.post('/', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeCode, firstName, lastName, email, phone, timezone, locale, roleNames, departmentId } = req.body;
    if (!employeeCode || !firstName || !lastName || !email) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'employeeCode, firstName, lastName, email are required' } });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const displayName = `${firstName} ${lastName}`;
      const userRes = await client.query(
        `INSERT INTO users (organization_id, employee_code, first_name, last_name, display_name, email, phone, timezone, locale, department_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
         RETURNING id, employee_code, email, display_name, status, created_at`,
        [req.user!.organizationId, employeeCode, firstName, lastName, displayName, email.toLowerCase(), phone || null, timezone || 'Asia/Kolkata', locale || 'en-IN', departmentId || null]
      );
      const newUser = userRes.rows[0];

      // Default password: Welcome@123 (must be changed on first login)
      const defaultHash = await bcrypt.hash('Welcome@123', 12);
      await client.query(
        `INSERT INTO user_credentials (user_id, password_hash, must_change_password) VALUES ($1, $2, TRUE)`,
        [newUser.id, defaultHash]
      );

      // Assign roles
      if (roleNames && Array.isArray(roleNames) && roleNames.length > 0) {
        for (const roleName of roleNames) {
          await client.query(
            `INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
             SELECT $1, id, $2, TRUE FROM roles WHERE role_name = $3`,
            [newUser.id, req.user!.userId, roleName]
          );
        }
      }

      await client.query('COMMIT');
      return res.status(201).json({ success: true, data: { ...newUser, roles: roleNames || [], message: 'Default password: Welcome@123 (must change on first login)' } });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Employee code or email already exists' } });
    }
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── PATCH /users/:id ─────────────────────────────────────────────────────────
router.patch('/:id', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, timezone, locale, status } = req.body;

    const fields: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (firstName !== undefined) { fields.push(`first_name = $${i}`); vals.push(firstName); i++; }
    if (lastName !== undefined) { fields.push(`last_name = $${i}`); vals.push(lastName); i++; }
    if (phone !== undefined) { fields.push(`phone = $${i}`); vals.push(phone); i++; }
    if (timezone !== undefined) { fields.push(`timezone = $${i}`); vals.push(timezone); i++; }
    if (locale !== undefined) { fields.push(`locale = $${i}`); vals.push(locale); i++; }
    if (status !== undefined) { fields.push(`status = $${i}`); vals.push(status); i++; }
    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } });
    }
    fields.push(`updated_at = NOW()`);
    vals.push(id);
    const result = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, email, display_name, status`, vals);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── DELETE /users/:id ────────────────────────────────────────────────────────
router.delete('/:id', authorize(SystemRole.SUPER_ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user!.userId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot delete your own account' } });
    }
    await pool.query(`UPDATE users SET status = 'DEACTIVATED', deleted_at = NOW() WHERE id = $1`, [id]);
    return res.json({ success: true, data: { message: 'User deactivated successfully' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── POST /users/:id/roles ─────────────────────────────────────────────────────
router.post('/:id/roles', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { roleNames } = req.body;
    if (!roleNames || !Array.isArray(roleNames)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'roleNames array is required' } });
    }

    // Deactivate existing roles
    await pool.query(`UPDATE user_roles SET is_active = FALSE WHERE user_id = $1`, [id]);

    for (const roleName of roleNames) {
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
         SELECT $1, id, $2, TRUE FROM roles WHERE role_name = $3
         ON CONFLICT (user_id, role_id) DO UPDATE SET is_active = TRUE, assigned_by = $2`,
        [id, req.user!.userId, roleName]
      );
    }
    return res.json({ success: true, data: { message: 'Roles updated successfully', roles: roleNames } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
