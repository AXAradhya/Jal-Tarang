import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, ShieldCheck, Home } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { SystemRole } from '../../types';

interface RequireRoleProps {
  allowedRoles: SystemRole[];
  children: React.ReactNode;
}

const ROLE_DASHBOARD_MAP: Record<SystemRole, string> = {
  CHARTERING_MANAGER: '/dashboard/chartering',
  PROCUREMENT_MANAGER: '/dashboard/procurement',
  PORT_MANAGER: '/dashboard/ports',
  ANALYST: '/dashboard/analyst',
  ADMIN: '/dashboard/admin',
  SUPER_ADMIN: '/dashboard/admin',
};

export const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
  const { user, activeRole, hasRole } = useAuthStore();

  const isAuthorized = hasRole(allowedRoles);

  if (!isAuthorized) {
    const userDefaultDashboard = ROLE_DASHBOARD_MAP[activeRole] || '/dashboard/chartering';

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-5">
          <div className="mx-auto w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Access Restricted</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your active role <strong className="text-slate-200">({activeRole})</strong> does not have permission to view this command page.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-left space-y-1.5">
            <div className="text-slate-400 text-[11px]">Required Roles:</div>
            <div className="flex flex-wrap gap-1.5">
              {allowedRoles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px]"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Security Mandate Notice */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role Mandate Locked</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Access to this command requires administrative clearance. To switch roles, log out and authenticate with the designated role account.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-center">
            <Link
              to={userDefaultDashboard}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <Home className="w-3.5 h-3.5" />
              Return to Your Role Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireRole;
