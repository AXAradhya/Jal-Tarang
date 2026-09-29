import { Request } from 'express';

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CHARTERING_MANAGER = 'CHARTERING_MANAGER',
  PROCUREMENT_MANAGER = 'PROCUREMENT_MANAGER',
  PORT_MANAGER = 'PORT_MANAGER',
  ANALYST = 'ANALYST',
}

export interface UserContext {
  userId: string;
  id?: string;
  organizationId: string;
  email: string;
  roles: SystemRole[];
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: UserContext;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
}
