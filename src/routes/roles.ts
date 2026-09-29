import { Router, Response } from 'express';
import { pool } from '../db/index.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';

const router = Router();
router.use(authenticate);

// ─── GET /roles ────────────────────────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.role_name, r.display_name, r.description, r.hierarchy_level, r.is_system_role,
              COUNT(DISTINCT ur.user_id) FILTER (WHERE ur.is_active = TRUE) AS active_user_count,
              array_agg(DISTINCT p.permission_code) FILTER (WHERE p.permission_code IS NOT NULL) AS permissions
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       GROUP BY r.id, r.role_name, r.display_name, r.description, r.hierarchy_level, r.is_system_role
       ORDER BY r.hierarchy_level ASC`
    );
    return res.json({ success: true, data: result.rows, meta: { count: result.rowCount } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /roles/:id ─────────────────────────────────────────────────────────────
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [roleRes, usersRes, permsRes] = await Promise.all([
      pool.query('SELECT * FROM roles WHERE id = $1', [req.params.id]),
      pool.query(
        `SELECT u.id, u.display_name, u.email, u.status, ur.assigned_at
         FROM user_roles ur JOIN users u ON u.id = ur.user_id
         WHERE ur.role_id = $1 AND ur.is_active = TRUE LIMIT 50`,
        [req.params.id]
      ),
      pool.query(
        `SELECT p.permission_code, p.display_name, p.resource, p.action, p.description
         FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role_id = $1 ORDER BY p.resource, p.action`,
        [req.params.id]
      ),
    ]);

    if (roleRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } });
    }
    return res.json({ success: true, data: { ...roleRes.rows[0], users: usersRes.rows, permissions: permsRes.rows } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /permissions ──────────────────────────────────────────────────────────
router.get('/permissions/all', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, permission_code, display_name, resource, action, description
       FROM permissions ORDER BY resource, action`
    );
    return res.json({ success: true, data: result.rows, meta: { count: result.rowCount } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
