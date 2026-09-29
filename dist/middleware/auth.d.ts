import { Request, Response, NextFunction } from 'express';
import { UserContext, SystemRole } from '../types/index.js';
export interface AuthenticatedRequest extends Request {
    user?: UserContext;
}
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...allowedRoles: SystemRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requirePermission: (...permissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: SystemRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
