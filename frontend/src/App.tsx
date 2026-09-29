import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useAuthStore } from './store/authStore';
import { SystemRole } from './types';
import { ShieldAlert, ArrowLeft, RefreshCw, LayoutDashboard, Compass } from 'lucide-react';

import { ErrorBoundary } from './components/common';

// Pages (Code-Split with React.lazy)
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const ExecutiveDashboardPage = React.lazy(() => import('./pages/dashboard/ExecutiveDashboardPage'));
const ControlTowerPage = React.lazy(() => import('./pages/dashboard/ControlTowerPage'));
const DecisionCenterPage = React.lazy(() => import('./pages/decision/DecisionCenterPage'));
const ForecastDashboardPage = React.lazy(() => import('./pages/forecasting/ForecastDashboardPage'));
const CharteringDashboardPage = React.lazy(() => import('./pages/chartering/CharteringDashboardPage'));
const ProcurementDashboardPage = React.lazy(() => import('./pages/procurement/ProcurementDashboardPage'));
const CargoRequirementWizardPage = React.lazy(() => import('./pages/cargo/CargoRequirementWizardPage'));
const ContractsPage = React.lazy(() => import('./pages/operations/ContractsPage'));
const PortIntelligencePage = React.lazy(() => import('./pages/ports/PortIntelligencePage'));
const RiskDashboardPage = React.lazy(() => import('./pages/risk/RiskDashboardPage'));
const ScenarioCenterPage = React.lazy(() => import('./pages/scenarios/ScenarioCenterPage'));
const FreightMarketPage = React.lazy(() => import('./pages/freight/FreightMarketPage'));
const CopilotPage = React.lazy(() => import('./pages/copilot/CopilotPage'));
const ReportsPage = React.lazy(() => import('./pages/reports/ReportsPage'));
const DataPage = React.lazy(() => import('./pages/data/DataPage'));
const AdminPage = React.lazy(() => import('./pages/admin/AdminPage'));
const NotificationsPage = React.lazy(() => import('./pages/notifications/NotificationsPage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));

// Role-Specific Dedicated Dashboards
const CharteringDashboard = React.lazy(() => import('./pages/dashboard/CharteringDashboard'));
const ProcurementDashboard = React.lazy(() => import('./pages/dashboard/ProcurementDashboard'));
const PortDashboard = React.lazy(() => import('./pages/dashboard/PortDashboard'));
const AnalystDashboard = React.lazy(() => import('./pages/dashboard/AnalystDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'));

// Role-Specific Dedicated Decision Centers
const CharteringDecisionPage = React.lazy(() => import('./pages/decision/CharteringDecisionPage'));
const ProcurementDecisionPage = React.lazy(() => import('./pages/decision/ProcurementDecisionPage'));
const PortDecisionPage = React.lazy(() => import('./pages/decision/PortDecisionPage'));
const AnalystDecisionPage = React.lazy(() => import('./pages/decision/AnalystDecisionPage'));
const AdminDecisionPage = React.lazy(() => import('./pages/decision/AdminDecisionPage'));

const AccessDenied: React.FC<{ allowedRoles: SystemRole[] }> = ({ allowedRoles }) => {
  const { user } = useAuthStore();
  const currentRole = user?.roles?.[0] || 'ANALYST';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 text-center shadow-lg">
        <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 mb-4">
          <ShieldAlert size={28} />
        </div>
        <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
          403 Clearance Restricted
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Access Restricted
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Your active profile (<span className="font-semibold text-slate-700 dark:text-slate-200">{currentRole.replace(/_/g, ' ')}</span>) does not have clearance for this operational section. Mandates are locked to authenticated personnel.
        </p>

        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-left text-xs border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Required Clearance Level
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {allowedRoles.map((r) => (
              <span key={r} className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-300 font-medium px-2 py-0.5 rounded text-[10px]">
                {r.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <Link
            to="/dashboard"
            className="flex-1 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LayoutDashboard size={14} />
            <span>Return to Dashboard</span>
          </Link>

          <Link
            to="/login"
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <ArrowLeft size={13} />
            <span>Switch Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── Protected Layout & RBAC Guard ──────────────────────────────────────────
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: SystemRole[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-wide">
          Verifying SAIL Security Credentials…
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Ministry of Steel · Session Ingestion
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = user?.roles || [];
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  if (allowedRoles && !isSuperAdmin) {
    const hasRequiredRole = allowedRoles.some((r) => userRoles.includes(r));
    if (!hasRequiredRole) {
      return (
        <AppShell>
          <AccessDenied allowedRoles={allowedRoles} />
        </AppShell>
      );
    }
  }

  return <AppShell>{children}</AppShell>;
};

const PageFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 select-none">
    <div className="relative flex items-center justify-center mb-5">
      <div className="absolute w-20 h-20 rounded-full border border-blue-500/20 dark:border-sky-400/20 animate-ping opacity-30" />
      <div className="absolute w-16 h-16 rounded-full border border-blue-600/30 dark:border-sky-500/30 animate-pulse" />
      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 relative z-10">
        <Compass size={22} className="animate-spin text-white" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs z-20">
        <span className="text-[10px]" role="img" aria-label="India Flag">🇮🇳</span>
      </div>
    </div>
    <div className="inline-flex items-center justify-center text-center leading-none gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-bold text-blue-700 dark:text-sky-300 tracking-wider uppercase mb-2 shadow-2xs">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      JAL TARANG COMMAND
    </div>
    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center tracking-tight">
      Loading Operations Intelligence
    </h2>
    <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-0.5 mb-3">
      Synchronizing real-time telemetry with zero-trust database...
    </p>
    <div className="w-48 bg-slate-200/80 dark:bg-slate-800/80 rounded-full h-1 overflow-hidden p-0.5 shadow-inner">
      <div className="h-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-400 rounded-full animate-pulse w-3/4" />
    </div>
  </div>
);

// ─── Automatic Role Redirectors ──────────────────────────────────────────────
const RoleDashboardRedirect: React.FC = () => {
  const { activeRole } = useAuthStore();
  switch (activeRole) {
    case 'PROCUREMENT_MANAGER':
      return <Navigate to="/dashboard/procurement" replace />;
    case 'PORT_MANAGER':
      return <Navigate to="/dashboard/ports" replace />;
    case 'ANALYST':
      return <Navigate to="/dashboard/analyst" replace />;
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return <Navigate to="/dashboard/admin" replace />;
    case 'CHARTERING_MANAGER':
    default:
      return <Navigate to="/dashboard/chartering" replace />;
  }
};

const RoleDecisionRedirect: React.FC = () => {
  const { activeRole } = useAuthStore();
  switch (activeRole) {
    case 'PROCUREMENT_MANAGER':
      return <Navigate to="/decision/procurement" replace />;
    case 'PORT_MANAGER':
      return <Navigate to="/decision/ports" replace />;
    case 'ANALYST':
      return <Navigate to="/decision/analyst" replace />;
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return <Navigate to="/decision/admin" replace />;
    case 'CHARTERING_MANAGER':
    default:
      return <Navigate to="/decision/chartering" replace />;
  }
};

// ─── Application Router ───────────────────────────────────────────────────────
const App: React.FC = () => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <React.Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Command & Control (Auto-dispatched by user role) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleDashboardRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/executive"
        element={
          <ProtectedRoute>
            <ExecutiveDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/chartering"
        element={
          <ProtectedRoute allowedRoles={['CHARTERING_MANAGER', 'SUPER_ADMIN', 'ADMIN']}>
            <CharteringDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/procurement"
        element={
          <ProtectedRoute allowedRoles={['PROCUREMENT_MANAGER', 'SUPER_ADMIN', 'ADMIN']}>
            <ProcurementDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/ports"
        element={
          <ProtectedRoute allowedRoles={['PORT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'CHARTERING_MANAGER']}>
            <PortDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/analyst"
        element={
          <ProtectedRoute allowedRoles={['ANALYST', 'SUPER_ADMIN', 'ADMIN']}>
            <AnalystDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/control-tower"
        element={
          <ProtectedRoute>
            <ControlTowerPage />
          </ProtectedRoute>
        }
      />

      {/* Intelligence & Strategy Decision Centers */}
      <Route
        path="/decision"
        element={
          <ProtectedRoute>
            <RoleDecisionRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/decision/all"
        element={
          <ProtectedRoute allowedRoles={['CHARTERING_MANAGER', 'PROCUREMENT_MANAGER', 'PORT_MANAGER', 'ANALYST', 'SUPER_ADMIN', 'ADMIN']}>
            <ErrorBoundary fallbackTitle="Decision Intelligence Engine">
              <DecisionCenterPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/decision/chartering"
        element={
          <ProtectedRoute allowedRoles={['CHARTERING_MANAGER', 'SUPER_ADMIN', 'ADMIN']}>
            <ErrorBoundary fallbackTitle="Chartering Decision Engine">
              <CharteringDecisionPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/decision/procurement"
        element={
          <ProtectedRoute allowedRoles={['PROCUREMENT_MANAGER', 'SUPER_ADMIN', 'ADMIN']}>
            <ErrorBoundary fallbackTitle="Procurement Decision Engine">
              <ProcurementDecisionPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/decision/ports"
        element={
          <ProtectedRoute allowedRoles={['PORT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'CHARTERING_MANAGER']}>
            <ErrorBoundary fallbackTitle="Port Mitigation Engine">
              <PortDecisionPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/decision/analyst"
        element={
          <ProtectedRoute allowedRoles={['ANALYST', 'SUPER_ADMIN', 'ADMIN']}>
            <ErrorBoundary fallbackTitle="Econometric Decision Center">
              <AnalystDecisionPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/decision/admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <ErrorBoundary fallbackTitle="Governance Decision Center">
              <AdminDecisionPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/forecasting"
        element={
          <ProtectedRoute>
            <ForecastDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Operations & Cargo */}
      <Route
        path="/cargo"
        element={
          <ProtectedRoute>
            <ErrorBoundary fallbackTitle="Cargo Requirement Wizard">
              <CargoRequirementWizardPage />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chartering"
        element={
          <ProtectedRoute allowedRoles={['CHARTERING_MANAGER', 'SUPER_ADMIN', 'ADMIN']}>
            <CharteringDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/procurement"
        element={
          <ProtectedRoute allowedRoles={['PROCUREMENT_MANAGER', 'SUPER_ADMIN', 'ADMIN']}>
            <ProcurementDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contracts"
        element={
          <ProtectedRoute allowedRoles={['CHARTERING_MANAGER', 'PROCUREMENT_MANAGER', 'SUPER_ADMIN', 'ADMIN']}>
            <ContractsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ports"
        element={
          <ProtectedRoute allowedRoles={['PORT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'CHARTERING_MANAGER']}>
            <PortIntelligencePage />
          </ProtectedRoute>
        }
      />

      {/* Risk & Scenarios */}
      <Route
        path="/risk"
        element={
          <ProtectedRoute>
            <RiskDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scenarios"
        element={
          <ProtectedRoute>
            <ScenarioCenterPage />
          </ProtectedRoute>
        }
      />

      {/* Analytics */}
      <Route
        path="/freight"
        element={
          <ProtectedRoute>
            <FreightMarketPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/data"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'ANALYST']}>
            <DataPage />
          </ProtectedRoute>
        }
      />

      {/* AI Copilot */}
      <Route
        path="/copilot"
        element={
          <ProtectedRoute>
            <CopilotPage />
          </ProtectedRoute>
        }
      />

      {/* Operational Notification Center */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      {/* Administration (Admin & Super Admin only) */}
      <Route
        path="/admin"
        element={<Navigate to="/admin/users" replace />}
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <AdminPage key="users" section="users" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <AdminPage key="audit" section="audit" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/jobs"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <AdminPage key="jobs" section="jobs" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/health"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <AdminPage key="health" section="health" />
          </ProtectedRoute>
        }
      />

      {/* Enterprise System & Governance Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default App;
