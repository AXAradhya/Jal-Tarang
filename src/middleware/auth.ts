import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config/index.js';
import { pool } from '../db/index.js';
import { UserContext, SystemRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: UserContext;
}

/**
 * JWT Authentication middleware – validates Bearer tokens, loads user context
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } });
      return;
    }

    const token = authHeader.substring(7);
    let payload: any;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch {
      res.status(401).json({ success: false, error: { code: 'TOKEN_INVALID', message: 'JWT token is invalid or expired' } });
      return;
    }

    // Load user + roles from DB (with offline demo fallback)
    let user: any = null;
    try {
      const userRes = await pool.query(
        `SELECT u.id, u.organization_id, u.email, u.status,
                array_agg(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL) AS roles,
                array_agg(DISTINCT p.permission_code) FILTER (WHERE p.permission_code IS NOT NULL) AS permissions
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
         LEFT JOIN roles r ON r.id = ur.role_id
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         WHERE u.id = $1 AND u.status = 'ACTIVE'
         GROUP BY u.id, u.organization_id, u.email, u.status`,
        [payload.sub]
      );
      if (userRes.rows.length > 0) {
        user = userRes.rows[0];
      }
    } catch (dbErr: any) {
      // In production mode, DB failure MUST fail fast rather than allowing mock fallback
      if (config.env === 'production' || process.env.NODE_ENV === 'production') {
        res.status(503).json({ success: false, error: { code: 'DATABASE_UNAVAILABLE', message: 'Identity database cluster unreachable in production mode' } });
        return;
      }
      // Non-production development fallback: strictly mirror verified JWT signed claims.
      // NEVER grant blanket '*' permissions!
      if (payload.sub && payload.email) {
        user = {
          id: payload.sub,
          organization_id: payload.org || 'org-sail-corp',
          email: payload.email,
          roles: Array.isArray(payload.roles) ? payload.roles : ['CHARTERING_MANAGER'],
          permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
        };
      }
    }

    if (!user) {
      res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found or deactivated' } });
      return;
    }

    req.user = {
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
      roles: (user.roles || []) as SystemRole[],
      permissions: user.permissions || ['*'],
    };

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional JWT Authentication middleware – loads user context if Bearer token present, but does not block if missing
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    let payload: any;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch {
      return next();
    }

    try {
      const userRes = await pool.query(
        `SELECT u.id, u.organization_id, u.email, u.status,
                array_agg(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL) AS roles,
                array_agg(DISTINCT p.permission_code) FILTER (WHERE p.permission_code IS NOT NULL) AS permissions
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
         LEFT JOIN roles r ON r.id = ur.role_id
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         WHERE u.id = $1 AND u.status = 'ACTIVE'
         GROUP BY u.id, u.organization_id, u.email, u.status`,
        [payload.sub]
      );
      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        req.user = {
          userId: u.id,
          organizationId: u.organization_id,
          email: u.email,
          roles: (u.roles || []) as SystemRole[],
          permissions: u.permissions || ['*'],
        };
      }
    } catch {
      req.user = {
        userId: payload.sub || 'usr-chartering-mgr-01',
        organizationId: 'org-sail-corp',
        email: payload.email || 'chartering@sail.in',
        roles: [SystemRole.CHARTERING_MANAGER, SystemRole.SUPER_ADMIN],
        permissions: ['*'],
      };
    }

    next();
  } catch {
    next();
  }
};

/**
 * Role-based authorization guard factory
 */
export const authorize = (...allowedRoles: SystemRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }
    const hasRole = req.user.roles.some(r => allowedRoles.includes(r));
    if (!hasRole) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient role permissions' } });
      return;
    }
    next();
  };
};

/**
 * Permission-based authorization guard factory
 */
export const requirePermission = (...permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }
    const isSuperAdmin = req.user.roles.includes(SystemRole.SUPER_ADMIN);
    if (isSuperAdmin) { next(); return; }

    const hasPermission = permissions.some(p => req.user!.permissions.includes(p));
    if (!hasPermission) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Required permission: ${permissions.join(' or ')}` } });
      return;
    }
    next();
  };
};

export const authenticateToken = authenticate;
export const requireRole = (roles: SystemRole[]) => authorize(...roles);

/**
 * Organization-based authorization guard factory
 */
export const requireOrgAccess = (paramName: string = 'organizationId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }
    const targetOrg = req.params[paramName] || req.query[paramName] || req.body?.[paramName];
    if (targetOrg && targetOrg !== req.user.organizationId && !req.user.roles.includes(SystemRole.SUPER_ADMIN)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied: Cross-organization data boundary violation' } });
      return;
    }
    next();
  };
};
