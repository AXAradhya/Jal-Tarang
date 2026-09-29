import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Radio, Brain, TrendingUp, Anchor, Package,
  MapPin, Shield, GitBranch, Database, FileText, Bot,
  Users, ClipboardList, Activity, ChevronLeft,
  ChevronRight, Bell, Search, LogOut, ChevronDown, Cpu,
  BarChart3, Ship, Sun, Moon, ShieldCheck, Check, Lock, Info, Sliders,
  FileEdit, Calculator, Keyboard, Star, Clock, Layers, Sparkles
} from 'lucide-react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api';
import { DataFreshnessBar } from '../common';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { GlassmorphicNotificationPopup } from '../notifications/GlassmorphicNotificationPopup';
import { CommandPalette } from '../search/CommandPalette';
import { RoleWelcomeModal } from '../auth/RoleWelcomeModal';
import { FloatingCopilotChat } from '../copilot/FloatingCopilotChat';
import { SystemRole } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { Breadcrumbs } from './Breadcrumbs';
import { ConnectionHealthBadge } from './ConnectionHealthBadge';
import { RoleSwitcher } from './RoleSwitcher';
import { MobileNavBar } from './MobileNavBar';
import { CriticalStockBanner } from '../common/CriticalStockBanner';
import { KeyboardShortcutsModal } from '../common/KeyboardShortcutsModal';
import { QuickScenarioModal } from '../common/QuickScenarioModal';
import { DemurrageCalculatorModal } from '../common/DemurrageCalculatorModal';
import { ArbitrageModal } from '../common/ArbitrageModal';
import { MonteCarloCoaModal } from '../common/MonteCarloCoaModal';
import { ScratchpadDrawer } from '../common/ScratchpadDrawer';
import { ToastStack } from '../common/ToastStack';
import { useBookmarksStore } from '../../store/bookmarksStore';
import { audioService } from '../../lib/audioService';
import { showToast } from '../../store/toastStore';
import { PageTransitionLoader } from './PageTransitionLoader';

// ─── Nav structure ────────────────────────────────────────────────────────────
interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: React.ReactNode;
  badge?: string | number;
  roles?: SystemRole[];
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Command',
    items: [
      { id: 'dashboard', label: 'Executive Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
      { id: 'control-tower', label: 'Operations Control Tower', path: '/control-tower', icon: <Radio size={16} /> },
      { id: 'notifications', label: 'Notifications & Alerts', path: '/notifications', icon: <Bell size={16} /> },
      { id: 'settings', label: 'System Settings', path: '/settings', icon: <Sliders size={16} /> },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { id: 'decision', label: 'Decision Center', path: '/decision', icon: <Brain size={16} />, roles: ['CHARTERING_MANAGER', 'PROCUREMENT_MANAGER', 'SUPER_ADMIN', 'ADMIN'] },
      { id: 'forecasting', label: 'Freight Forecasting', path: '/forecasting', icon: <TrendingUp size={16} /> },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'cargo', label: 'Cargo Requirement', path: '/cargo', icon: <Package size={16} /> },
      { id: 'chartering', label: 'Chartering & Vessels', path: '/chartering', icon: <Ship size={16} />, roles: ['CHARTERING_MANAGER', 'SUPER_ADMIN', 'ADMIN'] },
      { id: 'procurement', label: 'Procurement', path: '/procurement', icon: <Package size={16} />, roles: ['PROCUREMENT_MANAGER', 'SUPER_ADMIN', 'ADMIN'] },
      { id: 'contracts', label: 'Contracts', path: '/contracts', icon: <Anchor size={16} />, roles: ['CHARTERING_MANAGER', 'PROCUREMENT_MANAGER', 'SUPER_ADMIN', 'ADMIN'] },
      { id: 'ports', label: 'Port Intelligence', path: '/ports', icon: <MapPin size={16} />, roles: ['PORT_MANAGER', 'SUPER_ADMIN', 'ADMIN', 'CHARTERING_MANAGER'] },
    ],
  },
  {
    title: 'Risk & Scenarios',
    items: [
      { id: 'risk', label: 'Risk Engine', path: '/risk', icon: <Shield size={16} /> },
      { id: 'scenarios', label: 'Scenario Center', path: '/scenarios', icon: <GitBranch size={16} /> },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { id: 'freight-market', label: 'Freight Market', path: '/freight', icon: <BarChart3 size={16} /> },
      { id: 'reports', label: 'Reports', path: '/reports', icon: <FileText size={16} /> },
      { id: 'data', label: 'Data & Lineage', path: '/data', icon: <Database size={16} />, roles: ['SUPER_ADMIN', 'ADMIN', 'ANALYST'] },
    ],
  },
  {
    title: 'AI Intelligence',
    items: [
      { id: 'copilot', label: 'JAL TARANG Copilot', path: '/copilot', icon: <Bot size={16} /> },
    ],
  },
  {
    title: 'System Admin',
    items: [
      { id: 'admin-users', label: 'User Management', path: '/admin/users', icon: <Users size={16} />, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { id: 'admin-audit', label: 'Audit Logs', path: '/admin/audit', icon: <ClipboardList size={16} />, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { id: 'admin-jobs', label: 'Background Jobs', path: '/admin/jobs', icon: <Cpu size={16} />, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { id: 'admin-health', label: 'System Health', path: '/admin/health', icon: <Activity size={16} />, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar: React.FC<{ collapsed: boolean; onToggle: () => void }> = ({
  collapsed,
  onToggle,
}) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const userRoles = user?.roles ?? [];
  const { pinnedRoutes } = useBookmarksStore();

  return (
    <aside
      className={cn(
        'flex flex-col h-screen enterprise-sidebar bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 transition-all duration-200 z-30 select-none',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
        <div className="w-7 h-7 rounded-md bg-blue-700 dark:bg-blue-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
          <Anchor size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-1.5">
              <span>JAL TARANG</span>
              <span className="text-[9px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 px-1 py-0.2 rounded">v2.0</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              जल तरंग · Ministry of Steel
            </div>
          </div>
        )}
      </div>

      {/* Pinned Bookmarks Strip */}
      {pinnedRoutes.length > 0 && (
        <div className="px-2 py-1.5 border-b border-slate-200 dark:border-slate-800 space-y-0.5">
          {!collapsed && (
            <div className="px-2.5 py-1 text-[10px] font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1">
              <Star size={10} className="fill-amber-400" />
              <span>Favorites</span>
            </div>
          )}
          {pinnedRoutes.map((path) => {
            const item = ALL_NAV_ITEMS.find((n) => n.path === path);
            if (!item) return null;
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all active:scale-[0.98]',
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                )}
              >
                <span className="flex-shrink-0 text-amber-500">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2.5 px-2 min-h-0 space-y-3">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (!item.roles) return true;
            if (userRoles.includes('SUPER_ADMIN' as any)) return true;
            return item.roles.some((r) => userRoles.includes(r));
          });
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-0.5">
              {!collapsed && (
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path!));
                return (
                  <Link
                    key={item.id}
                    to={item.path!}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 active:scale-[0.98]',
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-sky-300 font-semibold border-l-2 border-blue-600 dark:border-sky-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <span className={cn('flex-shrink-0', isActive ? 'text-blue-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400')}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-sky-300 px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
    </aside>
  );
};

interface TopHeaderProps {
  onOpenShortcuts?: () => void;
  onOpenScratchpad?: () => void;
  onOpenDemurrage?: () => void;
  onOpenScenario?: () => void;
  onOpenArbitrage?: () => void;
  onOpenMonteCarlo?: () => void;
}

// ─── TopHeader ────────────────────────────────────────────────────────────────
const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenShortcuts,
  onOpenScratchpad,
  onOpenDemurrage,
  onOpenScenario,
  onOpenArbitrage,
  onOpenMonteCarlo,
}) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, currency, setCurrency } = useUiStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  // Profile panel iOS-style smooth open and close lifecycle
  const [shouldRenderProfile, setShouldRenderProfile] = useState(false);
  const [profileAnimClass, setProfileAnimClass] = useState('');
  const [profileBackdropClass, setProfileBackdropClass] = useState('');
  const profileAnimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (profileAnimTimeoutRef.current) clearTimeout(profileAnimTimeoutRef.current);

    if (showProfile) {
      setShouldRenderProfile(true);
      setProfileAnimClass('animate-ios-shade-open');
      setProfileBackdropClass('animate-ios-backdrop-open');
    } else if (shouldRenderProfile) {
      setProfileAnimClass('animate-ios-shade-close');
      setProfileBackdropClass('animate-ios-backdrop-close');
      profileAnimTimeoutRef.current = setTimeout(() => {
        setShouldRenderProfile(false);
        setProfileAnimClass('');
        setProfileBackdropClass('');
      }, 220);
    }

    return () => {
      if (profileAnimTimeoutRef.current) clearTimeout(profileAnimTimeoutRef.current);
    };
  }, [showProfile, shouldRenderProfile]);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Live polling for unread operational notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const res = await notificationApi.list();
      return (res?.data || []) as any[];
    },
    refetchInterval: 10000,
  });

  const settings = useSettingsStore((s) => s.settings);
  const unreadNotifCount = (notifData || []).filter((n: any) => !n.isRead && (!settings?.dndEnabled || n.severity === 'CRITICAL')).length;
  const hasCriticalUnread = (notifData || []).some((n: any) => !n.isRead && n.severity === 'CRITICAL');

  const handleCurrencyChange = (newCurr: 'INR' | 'USD') => {
    if (newCurr === currency) return;
    setCurrency(newCurr);
    notificationApi.create({
      title: `Platform Currency Switched to ${newCurr === 'INR' ? 'Indian Rupees (₹)' : 'US Dollars ($)'}`,
      message: `All freight rates, voyage costs, plant stock buffers, and contract values across all 15 modules are now denominated in ${newCurr}.`,
      role: 'ALL',
      severity: 'INFO',
      category: 'SYSTEM',
    }).then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }));
  };

  const activeRole = user?.roles?.[0] ?? 'CHARTERING_MANAGER';
  const roleLabelMap: Record<string, string> = {
    SUPER_ADMIN: 'Super Administrator',
    ADMIN: 'Administrator',
    CHARTERING_MANAGER: 'Chartering Manager',
    PROCUREMENT_MANAGER: 'Procurement Manager',
    PORT_MANAGER: 'Port Logistics Officer',
    ANALYST: 'Market Analyst',
  };

  const [showRoleBriefing, setShowRoleBriefing] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(`sail_role_briefing_seen_${activeRole}`);
  });

  const handleCloseRoleBriefing = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`sail_role_briefing_seen_${activeRole}`, 'true');
    }
    setShowRoleBriefing(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };



  return (
    <>
      <header className="h-14 flex items-center justify-between px-2 sm:px-3 lg:px-4 enterprise-header bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex-shrink-0 z-30 sticky top-0 transition-colors relative w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between w-full min-w-0 gap-1.5 sm:gap-2">
          {/* Left Section: National Identity Emblem & Live Telemetry */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0">
            {/* National Identity Emblem Badge with official tooltip */}
            <div
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/10 via-slate-100 to-emerald-500/10 dark:from-amber-500/15 dark:via-slate-800 dark:to-emerald-500/15 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shadow-2xs select-none flex-shrink-0"
              title="Government of India · Ministry of Steel · JAL TARANG (जल तरंग) Maritime Command"
            >
              <span className="text-sm select-none" role="img" aria-label="India Flag">🇮🇳</span>
            </div>

            {/* Compact Telemetry Pill */}
            <DataFreshnessBar compact={true} />
          </div>

          {/* Center Section: Quick Command Search */}
          <div className="hidden xl:flex items-center justify-center flex-1 max-w-[200px] min-w-0">
            <button
              id="global-search-btn"
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center justify-between gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/90 dark:border-slate-700/70 text-slate-500 dark:text-slate-400 text-xs rounded-lg px-2 py-1 transition-all shadow-2xs group cursor-pointer active:scale-95"
            >
              <div className="flex items-center gap-1.5 truncate min-w-0">
                <Search size={12} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors flex-shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-medium truncate text-[11px]">Search...</span>
              </div>
              <kbd className="inline-flex items-center gap-0.5 text-[9px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 py-0.2 rounded text-slate-500 dark:text-slate-400 shadow-2xs flex-shrink-0">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right Section: Utilities, Currency, Theme & Executive Profile */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Mobile / Tablet Search button */}
            <button
              onClick={() => setShowSearch(true)}
              className="xl:hidden p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-colors flex-shrink-0"
              title="Search Platform (Ctrl+K)"
            >
              <Search size={13} />
            </button>

            {/* Quick Tools Unified Group: Scratchpad, Demurrage & Shortcuts */}
            <div className="hidden lg:flex items-center bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg p-0.5 gap-0.5 flex-shrink-0 shadow-2xs">
              <button
                onClick={onOpenScratchpad}
                title="Open Charterer Scratchpad (Ctrl+N)"
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <FileEdit size={12} />
              </button>
              <button
                onClick={onOpenDemurrage}
                title="Open Demurrage Calculator (Ctrl+L)"
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Calculator size={12} />
              </button>
              <button
                onClick={onOpenArbitrage}
                title="Haldia vs. Dhamra Rail Arbitrage Engine (Feature B)"
                className="hidden xl:flex w-6 h-6 items-center justify-center rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Layers size={12} />
              </button>
              <button
                onClick={onOpenMonteCarlo}
                title="Spot vs. COA Monte Carlo Simulator (10,000 Paths)"
                className="hidden xl:flex w-6 h-6 items-center justify-center rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Sparkles size={12} />
              </button>
              <button
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts (?)"
                className="hidden 2xl:flex w-6 h-6 items-center justify-center rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Keyboard size={12} />
              </button>
            </div>

            <ConnectionHealthBadge />
            <RoleSwitcher />

            {/* Global Currency Switcher Toggle */}
            <div
              id="currency-toggle-group"
              className="flex items-center bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-lg p-0.5 text-xs select-none shadow-2xs flex-shrink-0"
              title="Switch platform currency across all pages (INR ₹ / USD $)"
            >
              <button
                id="currency-btn-inr"
                onClick={() => handleCurrencyChange('INR')}
                className={cn(
                  'px-1.5 py-0.5 rounded-md text-[10.5px] font-bold transition-all flex items-center gap-0.5 cursor-pointer',
                  currency === 'INR'
                    ? 'bg-blue-600 dark:bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                )}
              >
                <span>₹</span>
                <span className="hidden sm:inline text-[9.5px]">INR</span>
              </button>
              <button
                id="currency-btn-usd"
                onClick={() => handleCurrencyChange('USD')}
                className={cn(
                  'px-1.5 py-0.5 rounded-md text-[10.5px] font-bold transition-all flex items-center gap-0.5 cursor-pointer',
                  currency === 'USD'
                    ? 'bg-blue-600 dark:bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                )}
              >
                <span>$</span>
                <span className="hidden sm:inline text-[9.5px]">USD</span>
              </button>
            </div>

            {/* Sleek Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Operations Dark Mode' : 'Switch to Standard Enterprise Light Mode'}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 shadow-2xs cursor-pointer active:scale-90 flex-shrink-0"
            >
              {theme === 'light' ? (
                <Moon key="moon" size={13} className="text-slate-700 animate-theme-icon" />
              ) : (
                <Sun key="sun" size={13} className="text-amber-400 animate-theme-icon" />
              )}
            </button>

            {/* Notifications Dropdown Trigger */}
            <div className="relative flex-shrink-0">
              <button
                id="notifications-btn"
                onClick={() => setShowNotifications((p) => !p)}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all relative border cursor-pointer flex-shrink-0',
                  showNotifications
                    ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-950/60 dark:border-blue-700 dark:text-sky-300 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 shadow-2xs'
                )}
                title={settings?.dndEnabled ? 'Notifications (DND Active: Crucial Only)' : 'Operational Alerts & Notifications'}
              >
                <Bell size={13} />
                {unreadNotifCount > 0 ? (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 text-[8.5px] font-black rounded-full flex items-center justify-center text-white ring-2 ring-white dark:ring-slate-900 shadow-sm',
                      hasCriticalUnread ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
                    )}
                  >
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                ) : settings?.dndEnabled ? (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500 ring-1 ring-white dark:ring-slate-900"
                    title="Do Not Disturb Active"
                  />
                ) : null}
              </button>

              {/* Anchored Top Notification Dropdown */}
              <NotificationCenter
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                activeRole={activeRole}
              />
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 flex-shrink-0" />

            {/* Executive Persona & Squeezed Profile Card */}
            <div className="relative flex-shrink-0 flex items-center h-full mr-1">
              <button
                id="profile-menu-btn"
                onClick={() => setShowProfile((p) => !p)}
                className="h-8 max-h-8 flex items-center gap-1 sm:gap-1.5 px-1 sm:px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/90 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 transition-all text-left group shadow-2xs cursor-pointer flex-shrink-0 select-none"
                title={`Signed in as ${user?.firstName || 'Sanjay'} ${user?.lastName || 'Verma'} (${roleLabelMap[activeRole] || activeRole})`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                    {user?.firstName?.[0] || 'S'}{user?.lastName?.[0] || 'V'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-slate-900" />
                </div>
                
                <div className="hidden xl:flex flex-col text-left leading-none justify-center">
                  <span className="text-[10.5px] font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[75px] 2xl:max-w-[90px]">
                    {user?.firstName || 'Sanjay'} {user?.lastName || 'Verma'}
                  </span>
                  <span className="text-[8.5px] font-medium text-blue-600 dark:text-sky-400 leading-tight truncate max-w-[75px] 2xl:max-w-[90px] mt-0.5">
                    {roleLabelMap[activeRole] || (activeRole || '').replace(/_/g, ' ')}
                  </span>
                </div>

                <ChevronDown size={11} className={cn("text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform flex-shrink-0", showProfile && "rotate-180")} />
              </button>

            {shouldRenderProfile && (
              <>
                {/* Backdrop to close on outside click */}
                <div
                  className={cn("fixed inset-0 z-40 bg-transparent", profileBackdropClass)}
                  onClick={() => setShowProfile(false)}
                  aria-hidden="true"
                />
                <div
                  className={cn("absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 py-1 divide-y divide-slate-100 dark:divide-slate-800 origin-top-right", profileAnimClass)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3.5 py-2.5">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {user?.firstName || 'Sanjay'} {user?.lastName || 'Verma'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user?.email || 'sanjay.verma@sail.gov.in'}
                    </p>
                    <p className="text-[10px] text-blue-600 dark:text-sky-400 font-medium mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                      {user?.organizationName || 'Steel Authority of India Limited'}
                    </p>
                  </div>

                  {/* Verified Role Information & Briefing Trigger */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg mx-2 border border-slate-200/80 dark:border-slate-700/80 my-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
                      <span>Commissioned Mandate</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Lock size={10} /> Locked
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                      <Shield size={13} className="text-blue-600 dark:text-sky-400 shrink-0" />
                      <span>{roleLabelMap[activeRole] || activeRole}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      This role is tied to your cryptographic security credentials. Role reassignment requires Central Administration clearance.
                    </p>
                    <button
                      onClick={() => {
                        setShowProfile(false);
                        setShowRoleBriefing(true);
                      }}
                      className="w-full mt-2.5 py-1.5 px-2 text-center text-xs font-semibold text-blue-600 dark:text-sky-400 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md border border-blue-200 dark:border-slate-700 transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Info size={12} />
                      <span>View Role Mandate & Briefing</span>
                    </button>
                  </div>

                  <div className="p-1 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
                    <Link
                      to="/settings"
                      onClick={() => setShowProfile(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      <Sliders size={13} className="text-blue-600 dark:text-sky-400" />
                      <span>System Settings & Preferences</span>
                    </Link>
                    <Link
                      to="/settings?tab=sessions"
                      onClick={() => setShowProfile(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Active Sessions & Security</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Sign out of session</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Loading beam anchored directly to the bottom line of top bar */}
      <div id="top-bar-loading-line-anchor" className="absolute bottom-0 left-0 right-0 h-[2.5px] pointer-events-none overflow-visible z-50" />
    </header>

      {/* Global Command Search Palette */}
      <CommandPalette
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />

      {/* Role Mandate & Onboarding Briefing Modal */}
      <RoleWelcomeModal
        isOpen={showRoleBriefing}
        onClose={handleCloseRoleBriefing}
        role={activeRole}
        userName={`${user?.firstName || 'Sanjay'} ${user?.lastName || 'Verma'}`}
      />
    </>
  );
};
// ─── Ambient Background Component (Subtle Oceanic Living Canvas) ─────────────
const AmbientBackground: React.FC = () => {
  const enableAnimations = useSettingsStore((s) => s.settings?.enableAnimations ?? true);
  if (!enableAnimations) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none">
      {/* Orb 1: Soft Ocean Blue (Top-Left) */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 md:w-[500px] md:h-[500px] rounded-full bg-gradient-to-br from-sky-400/8 via-blue-500/4 to-transparent dark:from-sky-500/10 dark:via-blue-600/5 dark:to-transparent blur-3xl animate-ambient-orb-1"
      />
      {/* Orb 2: Soft Indigo / Violet (Top-Right) */}
      <div
        className="absolute top-20 -right-32 w-80 h-80 md:w-[460px] md:h-[460px] rounded-full bg-gradient-to-bl from-indigo-500/6 via-purple-500/3 to-transparent dark:from-indigo-500/8 dark:via-purple-600/4 dark:to-transparent blur-3xl animate-ambient-orb-2"
      />
      {/* Orb 3: Soft Emerald / Teal (Bottom-Center) */}
      <div
        className="absolute -bottom-32 left-1/3 w-80 h-80 md:w-[480px] md:h-[480px] rounded-full bg-gradient-to-tr from-teal-400/5 via-emerald-500/3 to-transparent dark:from-teal-500/7 dark:via-emerald-600/3 dark:to-transparent blur-3xl animate-ambient-orb-3"
      />
      {/* Subtle Micro-Grid Overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"
      />
    </div>
  );
};

// ─── AppShell ─────────────────────────────────────────────────────────────────
export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    currency,
    isCopilotOpen,
    setCopilotOpen,
    isDemurrageOpen,
    setDemurrageOpen,
    isArbitrageOpen,
    setArbitrageOpen,
    isMonteCarloOpen,
    setMonteCarloOpen,
    isScratchpadOpen,
    setScratchpadOpen,
  } = useUiStore();
  const { user } = useAuthStore();
  const activeRole = user?.roles?.[0] || 'CHARTERING_MANAGER';
  const settings = useSettingsStore((s) => s.settings);
  const { recordVisit } = useBookmarksStore();

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showScenario, setShowScenario] = useState(false);
  const [showDemurrage, setShowDemurrage] = useState(false);
  const [showArbitrage, setShowArbitrage] = useState(false);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Global Inactivity Session Monitor & Zero-Touch Logout
  const { showWarning, secondsRemaining, staySignedIn, logoutNow } = useSessionTimeout();

  // Apply enterprise visual theme, animation, density, and sound settings globally
  useEffect(() => {
    if (!settings) return;

    // 1. Accent Color Palette
    const paletteMap: Record<string, string> = {
      blue: 'palette-ocean',
      emerald: 'palette-emerald',
      amber: 'palette-amber',
      purple: 'palette-purple',
      rose: 'palette-rose',
    };
    const accentClass = paletteMap[settings.accentColor] || 'palette-ocean';
    document.documentElement.classList.remove('palette-ocean', 'palette-emerald', 'palette-amber', 'palette-purple', 'palette-rose');
    document.documentElement.classList.add(accentClass);

    // 2. Animation toggle
    if (settings.enableAnimations === false) {
      document.documentElement.classList.add('disable-animations');
    } else {
      document.documentElement.classList.remove('disable-animations');
    }

    // 3. Compact mode
    if (settings.compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }

    // 4. Font size
    document.documentElement.classList.remove('font-size-compact', 'font-size-large');
    if (settings.fontSize === 'compact') {
      document.documentElement.classList.add('font-size-compact');
    } else if (settings.fontSize === 'large') {
      document.documentElement.classList.add('font-size-large');
    }

    // 5. Sound effects
    audioService.setMuted(!settings.soundEffects);

    // 6. Glassmorphism blur depth
    const blurMap: Record<string, string> = {
      off: '0px',
      subtle: '6px',
      deep: '16px',
      ultra: '28px',
    };
    document.documentElement.style.setProperty('--glass-blur', blurMap[settings.glassmorphismBlur] || '16px');
  }, [
    settings?.accentColor,
    settings?.enableAnimations,
    settings?.compactMode,
    settings?.fontSize,
    settings?.soundEffects,
    settings?.glassmorphismBlur,
  ]);

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts((p) => !p);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowScenario((p) => !p);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowDemurrage((p) => !p);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setShowScratchpad((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Record visited page for recent history
  useEffect(() => {
    recordVisit(location.pathname, document.title || location.pathname);
  }, [location.pathname]);

  return (
    <div
      className={cn(
        'flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950',
        settings?.fontSize === 'large' && 'text-[15px]',
        settings?.fontSize === 'compact' && 'text-[13px]'
      )}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Subtle Ambient Background Animations */}
        <AmbientBackground />

        {/* Persistent Statutory Critical Stock Alert Banner */}
        <CriticalStockBanner />
        
        <TopHeader
          onOpenShortcuts={() => setShowShortcuts(true)}
          onOpenScratchpad={() => setShowScratchpad(true)}
          onOpenDemurrage={() => setShowDemurrage(true)}
          onOpenScenario={() => setShowScenario(true)}
          onOpenArbitrage={() => setShowArbitrage(true)}
          onOpenMonteCarlo={() => setShowMonteCarlo(true)}
        />

        {/* Dynamic Hierarchical Breadcrumbs */}
        <Breadcrumbs />

        <main
          key={currency}
          className={cn(
            'flex-1 overflow-y-auto min-h-0 bg-transparent relative z-10 pb-16 md:pb-0 flex flex-col',
            settings?.compactMode ? 'p-2.5 md:p-3.5' : 'p-4 md:p-6'
          )}
        >
          <PageTransitionLoader>
            <div className="min-h-full flex-1 flex flex-col">
              {children}
            </div>
          </PageTransitionLoader>
        </main>
      </div>

      {/* Global Floating JAL TARANG Copilot Button & Glassmorphic Chat Center */}
      <FloatingCopilotChat />

      {/* Global Glassmorphic 5s Notification Popup Stream */}
      <GlassmorphicNotificationPopup activeRole={activeRole} />

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavBar
        onOpenSearch={() => setShowSearch(true)}
        onOpenCopilot={() => setCopilotOpen(!isCopilotOpen)}
      />

      {/* Floating Action Feedback Toast Stack */}
      <ToastStack />

      {/* Modals & Slide-overs */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      <QuickScenarioModal
        isOpen={showScenario}
        onClose={() => setShowScenario(false)}
      />

      <DemurrageCalculatorModal
        isOpen={showDemurrage || isDemurrageOpen}
        onClose={() => {
          setShowDemurrage(false);
          setDemurrageOpen(false);
        }}
      />

      <ArbitrageModal
        isOpen={showArbitrage || isArbitrageOpen}
        onClose={() => {
          setShowArbitrage(false);
          setArbitrageOpen(false);
        }}
      />

      <MonteCarloCoaModal
        isOpen={showMonteCarlo || isMonteCarloOpen}
        onClose={() => {
          setShowMonteCarlo(false);
          setMonteCarloOpen(false);
        }}
      />

      <ScratchpadDrawer
        isOpen={showScratchpad || isScratchpadOpen}
        onClose={() => {
          setShowScratchpad(false);
          setScratchpadOpen(false);
        }}
      />

      {/* Global Inactivity Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                <Clock size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Session Inactivity Warning
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated security lockout pending
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You have been inactive. For data confidentiality and compliance with enterprise security mandates, this session will expire in:
            </p>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-center">
              <span className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">
                {secondsRemaining}s
              </span>
              <span className="block text-[10px] text-amber-700/80 dark:text-amber-300/80 mt-0.5 font-medium">
                Remaining before automatic sign-out
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={staySignedIn}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                Stay Signed In
              </button>
              <button
                onClick={logoutNow}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Sign Out Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppShell;
