import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Sliders,
  Bell,
  Shield,
  Ship,
  MapPin,
  Package,
  TrendingUp,
  Database,
  Lock,
  Moon,
  Sun,
  DollarSign,
  Zap,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  RotateCcw,
  Search,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  AlertTriangle,
  Layers,
  Sparkles,
  Info,
  Radio,
  Download,
  Upload,
  Server,
  Wifi,
  Palette,
  Laptop,
  Smartphone,
  ShieldCheck,
  LogOut,
  Trash2,
  Key,
  Globe,
  ShieldAlert
} from 'lucide-react';
import { useSettingsStore, EnterpriseSettings, PROFILE_PRESETS } from '../../store/settingsStore';
import { useSessionStore } from '../../store/sessionStore';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { settingsApi } from '../../api';
import { cn, formatDate } from '../../lib/utils';
import { SystemRole } from '../../types';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    isBackendSynced,
    fetchBackendSettings,
    updateSetting,
    loadProfile,
    importSettingsJson,
    exportSettingsJson,
    resetCategory,
    resetAll,
  } = useSettingsStore();
  const { user, switchRole } = useAuthStore();
  const activeRole = (user?.roles?.[0] || 'CHARTERING_MANAGER') as SystemRole;

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'roles' | 'market' | 'export' | 'api' | 'appearance' | 'profiles' | 'sessions'>('general');
  const [selectedRole, setSelectedRole] = useState<SystemRole>(activeRole);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [confirmRevokeOthers, setConfirmRevokeOthers] = useState(false);

  // Access Denied / Role Mandate Clearance Modal
  const isRoleMandateLocked = selectedRole !== activeRole;
  const [accessDeniedModal, setAccessDeniedModal] = useState<{
    open: boolean;
    targetRole: SystemRole | null;
    targetRoleLabel: string;
  }>({
    open: false,
    targetRole: null,
    targetRoleLabel: '',
  });

  const {
    sessions,
    isLoading: isSessionsLoading,
    timeoutMinutes,
    fetchSessions,
    revokeSession,
    revokeOtherSessions,
    setTimeoutMinutes,
  } = useSessionStore();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['general', 'notifications', 'roles', 'market', 'export', 'api', 'appearance', 'profiles', 'sessions'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Custom API & Integration diagnostics state
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingApis, setIsTestingApis] = useState(false);
  const [apiDiagnostics, setApiDiagnostics] = useState<Record<string, { status: 'idle' | 'testing' | 'ok' | 'err'; latency?: number; message?: string }>>({});
  const [webhookTestNotice, setWebhookTestNotice] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const showSavedNotification = (label: string) => {
    setSavedNotice(`Setting "${label}" updated and committed to backend audit ledger.`);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleToggle = (key: keyof EnterpriseSettings, label: string) => {
    const nextVal = !settings[key];
    updateSetting(key, nextVal as any);
    showSavedNotification(label);
  };

  const handleChange = (key: keyof EnterpriseSettings, val: any, label: string) => {
    updateSetting(key, val);
    showSavedNotification(label);
  };

  // Run live connection test for configured APIs via backend diagnostic probe
  const handleTestAllApis = async () => {
    setIsTestingApis(true);
    setApiDiagnostics({
      backend: { status: 'testing' },
      weather: { status: 'testing' },
      openRouter: { status: 'testing' },
    });

    // 1. Test Backend Server
    try {
      const bUrl = settings.customApiBaseUrl
        ? settings.customApiBaseUrl.replace(/\/api\/v1\/?$/, '') + '/health'
        : 'http://localhost:8000/health';
      const res = await settingsApi.testEndpoint({
        type: 'BACKEND',
        url: bUrl,
      });
      setApiDiagnostics((prev) => ({
        ...prev,
        backend: {
          status: res.status === 'REACHABLE' ? 'ok' : 'err',
          latency: res.latencyMs,
          message: res.message,
        },
      }));
    } catch (err: any) {
      setApiDiagnostics((prev) => ({
        ...prev,
        backend: { status: 'err', message: err.message || 'Connection refused or offline' },
      }));
    }

    // 2. Test Marine Weather API
    try {
      const wUrl = settings.customWeatherApiUrl || 'https://marine-api.open-meteo.com/v1/marine';
      const weatherRes = await settingsApi.testEndpoint({
        type: 'WEATHER',
        url: `${wUrl}?latitude=20.29&longitude=86.67&hourly=wave_height`,
      });
      setApiDiagnostics((prev) => ({
        ...prev,
        weather: {
          status: weatherRes.status === 'REACHABLE' ? 'ok' : 'err',
          latency: weatherRes.latencyMs,
          message: weatherRes.message,
        },
      }));
    } catch (err: any) {
      setApiDiagnostics((prev) => ({
        ...prev,
        weather: { status: 'err', message: err.message || 'Network timeout or CORS blocked' },
      }));
    }

    // 3. Test OpenRouter / LLM Config
    try {
      if (settings.customOpenRouterModel) {
        if (settings.customOpenRouterKey) {
          const orRes = await settingsApi.testEndpoint({
            type: 'OPENROUTER',
            url: `${settings.customOpenRouterUrl || 'https://openrouter.ai/api/v1'}/models`,
            apiKey: settings.customOpenRouterKey,
          });
          setApiDiagnostics((prev) => ({
            ...prev,
            openRouter: {
              status: orRes.status === 'REACHABLE' ? 'ok' : 'err',
              latency: orRes.latencyMs,
              message: orRes.message,
            },
          }));
        } else {
          setApiDiagnostics((prev) => ({
            ...prev,
            openRouter: {
              status: 'idle',
              message: 'Using Local Deterministic Grounded Fallback (Key not set)',
            },
          }));
        }
      }
    } catch (err: any) {
      setApiDiagnostics((prev) => ({
        ...prev,
        openRouter: { status: 'err', message: err.message || 'Probe failed' },
      }));
    }

    setIsTestingApis(false);
  };

  // Test Webhook Dispatch via live backend probe
  const handleTestWebhook = async () => {
    if (!settings.webhookAlertUrl) {
      setWebhookTestNotice('Please enter a Webhook URL first.');
      setTimeout(() => setWebhookTestNotice(null), 3500);
      return;
    }
    setWebhookTestNotice('Probing Webhook endpoint…');
    try {
      const res = await settingsApi.testEndpoint({
        type: 'WEBHOOK',
        url: settings.webhookAlertUrl,
      });
      setWebhookTestNotice(res.message);
    } catch (err: any) {
      setWebhookTestNotice(`Webhook test failed: ${err.message || 'Unknown error'}`);
    }
    setTimeout(() => setWebhookTestNotice(null), 4500);
  };

  // Export JSON configuration download
  const handleExportJson = () => {
    const jsonStr = exportSettingsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sail_marinex_config_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSavedNotification('Exported Configuration JSON');
  };

  // Import JSON configuration upload
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = importSettingsJson(text);
      if (res.success) {
        setImportStatus({ success: true, message: 'Settings successfully restored from JSON file!' });
        showSavedNotification('Imported Configuration');
      } else {
        setImportStatus({ success: false, message: res.error || 'Failed to import settings.' });
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─── Settings Filter ────────────────────────────────────────────────────────
  const filterMatches = (title: string, desc: string) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ─── Header & Search ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden ios-card-hover">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <SettingsIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Enterprise System & Governance Settings
                </h1>
                <span className="inline-flex items-center justify-center text-center leading-none text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-800 tracking-wide">
                  60+ Active Parameters
                </span>
                {isBackendSynced ? (
                  <span className="inline-flex items-center justify-center text-center leading-none gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Backend Synced
                  </span>
                ) : (
                  <button
                    onClick={() => fetchBackendSettings()}
                    className="inline-flex items-center justify-center text-center leading-none gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer tracking-wide"
                    title="Click to synchronize with backend server"
                  >
                    <RotateCcw size={10} />
                    Sync with Server
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Fine-tune operational defaults, alert thresholds, role mandates, and export protocols.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter 48 settings…"
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
              />
            </div>
            <button
              onClick={resetAll}
              title="Reset all settings to factory default"
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Live Saved Alert Banner */}
        {savedNotice && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {/* ─── Category Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'general', label: 'General & Interface', count: 8, icon: <Sliders size={14} /> },
          { id: 'notifications', label: 'Notifications & Alerts', count: 8, icon: <Bell size={14} /> },
          { id: 'roles', label: 'Role-Based Mandates', count: 20, icon: <Shield size={14} /> },
          { id: 'sessions', label: 'Active Sessions & Security', count: sessions.length || 3, icon: <ShieldCheck size={14} /> },
          { id: 'market', label: 'Market & Economic Feeds', count: 6, icon: <TrendingUp size={14} /> },
          { id: 'export', label: 'Export & Security', count: 6, icon: <FileText size={14} /> },
          { id: 'api', label: 'API & Integrations', count: 7, icon: <Radio size={14} /> },
          { id: 'appearance', label: 'Theme Studio', count: 3, icon: <Palette size={14} /> },
          { id: 'profiles', label: 'Profiles & Backup', count: 5, icon: <Database size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ios-tab-spring border',
              activeTab === tab.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── TAB 1: General & Interface (8 Settings) ─────────────────────────── */}
      {activeTab === 'general' && (
        <div className="space-y-4 animate-ios-page-enter">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders size={16} className="text-blue-600 dark:text-sky-400" />
              <span>Platform Interface & Display Defaults (8 Settings)</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {/* 1. Theme */}
              {filterMatches('Theme Mode', 'Switch between standard enterprise light and dark mode') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Platform Color Theme</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-300 rounded font-mono">
                        {settings.theme.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Switch between Standard Enterprise Light Mode and Operations Dark Mode.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => handleChange('theme', 'light', 'Platform Theme')}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition',
                        settings.theme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      )}
                    >
                      <Sun size={12} className="text-amber-500" /> Light
                    </button>
                    <button
                      onClick={() => handleChange('theme', 'dark', 'Platform Theme')}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition',
                        settings.theme === 'dark' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
                      )}
                    >
                      <Moon size={12} className="text-sky-400" /> Dark
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Currency */}
              {filterMatches('Base Currency', 'Default currency across landed costs') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Default Valuation Currency</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-mono">
                        {settings.currency}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Primary denomination for freight rates, contracts, demurrage, and landed cost.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => handleChange('currency', 'INR', 'Base Currency')}
                      className={cn(
                        'px-3 py-1 rounded-lg font-bold transition',
                        settings.currency === 'INR' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                      )}
                    >
                      ₹ INR
                    </button>
                    <button
                      onClick={() => handleChange('currency', 'USD', 'Base Currency')}
                      className={cn(
                        'px-3 py-1 rounded-lg font-bold transition',
                        settings.currency === 'USD' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                      )}
                    >
                      $ USD
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Compact Mode */}
              {filterMatches('Compact Dashboard Layout', 'Reduce card paddings and maximize screen real estate') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Compact Density Mode</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Condenses data tables, KPIs, and grid spacing for high-density multi-monitor command rooms.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={() => handleToggle('compactMode', 'Compact Mode')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 4. iOS Fluid Animations */}
              {filterMatches('iOS Fluid Animations', 'Enable spring physics and fluid page transitions') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles size={13} className="text-sky-500" />
                      <span>iOS Fluid Spring Animations</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Enables physics-based spring page transitions, hover lifts, and fluid modal zooms.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableAnimations}
                    onChange={() => handleToggle('enableAnimations', 'iOS Animations')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 5. Auto Refresh Interval */}
              {filterMatches('Telemetry Refresh Interval', 'Cadence for polling live port and vessel telemetry') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Real-Time Refresh Interval</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Frequency of background polling for live AIS telemetry and weather feeds.
                    </p>
                  </div>
                  <select
                    value={settings.autoRefreshInterval}
                    onChange={(e) => handleChange('autoRefreshInterval', Number(e.target.value), 'Refresh Interval')}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value={15}>Every 15 Seconds (Real-time)</option>
                    <option value={30}>Every 30 Seconds (Default)</option>
                    <option value={60}>Every 60 Seconds</option>
                    <option value={300}>Every 5 Minutes (Low Bandwidth)</option>
                  </select>
                </div>
              )}

              {/* 6. Timezone */}
              {filterMatches('Operational Timezone', 'Display timestamps in Indian Standard Time or UTC') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Platform Timezone</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Timezone applied across dispatch logs, vessel ETA projections, and audit events.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(['IST', 'UTC', 'SGT'] as const).map((tz) => (
                      <button
                        key={tz}
                        onClick={() => handleChange('timezone', tz, 'Operational Timezone')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                          settings.timezone === tz ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                        )}
                      >
                        {tz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Sound Effects */}
              {filterMatches('Audio Notification Chimes', 'Play subtle synthesized chime when critical alerts trigger') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {settings.soundEffects ? <Volume2 size={14} className="text-emerald-500" /> : <VolumeX size={14} className="text-slate-400" />}
                      <span>Audio Alert Chimes</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Plays subtle Web Audio chime synthesizer on critical cyclone and stock alerts.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEffects}
                    onChange={() => handleToggle('soundEffects', 'Sound Effects')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 8. Font Size */}
              {filterMatches('Font Scale', 'Adjust typography sizing across cards and tables') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Typography Scale</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Display text scale for executive presentations vs high-density operational views.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(['compact', 'standard', 'large'] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => handleChange('fontSize', sz, 'Font Scale')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition',
                          settings.fontSize === sz ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                        )}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Notifications & Real-Time Alerts (8 Settings) ─────────────── */}
      {activeTab === 'notifications' && (
        <div className="space-y-4 animate-ios-page-enter">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell size={16} className="text-blue-600 dark:text-sky-400" />
              <span>Real-Time Notifications & Glassmorphic Popups (8 Settings)</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {/* 9. Popup Duration */}
              {filterMatches('Popup Display Duration', 'Auto-dismiss seconds for glassmorphic alert popups') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Alert Popup Duration</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-300 rounded font-mono">
                        {settings.popupDuration} Seconds
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Seconds before the floating glassmorphic notification automatically dismisses.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {[3, 5, 8, 10].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => handleChange('popupDuration', sec, 'Popup Duration')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                          settings.popupDuration === sec ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                        )}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. Enable Popup Notifications */}
              {filterMatches('Glassmorphic Notification Stream', 'Show floating bottom-right notification popups') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Glassmorphic Popups Stream</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Renders the translucent glassmorphic notifications popup stream across dashboard views.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enablePopupNotifications}
                    onChange={() => handleToggle('enablePopupNotifications', 'Popup Notifications Stream')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 10b. Do Not Disturb (DND Mode) */}
              {filterMatches('Do Not Disturb (DND)', 'Only crucial notifications arrive when DND is active') && (
                <div className="py-3.5 flex items-center justify-between gap-4 bg-purple-50/60 dark:bg-purple-950/25 -mx-3 px-3.5 rounded-xl border border-purple-200/80 dark:border-purple-900/50 my-1">
                  <div>
                    <div className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Moon size={14} className="text-purple-600 dark:text-purple-400" />
                      <span>Do Not Disturb (DND Mode)</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-200/80 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 rounded font-mono">
                        {settings.dndEnabled ? 'ACTIVE: CRUCIAL ONLY' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-purple-700/80 dark:text-purple-300/80 mt-0.5">
                      When activated, only <strong>CRITICAL (Crucial)</strong> operational alerts will trigger popups and audio chimes. All routine informational alerts and warnings are silenced.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dndEnabled}
                    onChange={() => handleToggle('dndEnabled', 'Do Not Disturb (Crucial Alerts Only)')}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 11. Cyclone Alerts */}
              {filterMatches('Cyclone Storm Alerts', 'IMD Bay of Bengal depression and port danger signal notices') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-rose-500" />
                      <span>IMD Cyclone & Gale Warnings</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Priority dispatch for Bay of Bengal tropical storm alerts and Port Danger Signals 1–11.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyCycloneAlerts}
                    onChange={() => handleToggle('notifyCycloneAlerts', 'Cyclone Alerts')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 12. Port Congestion Alerts */}
              {filterMatches('Port Congestion Alerts', 'Notify when waiting queue exceeds operational threshold') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Port Berth Queue Alerts</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Notifies when pre-berthing wait time exceeds threshold at Paradip, Vizag, or Haldia.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyPortCongestion}
                    onChange={() => handleToggle('notifyPortCongestion', 'Port Congestion Alerts')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 13. Stock Buffer Breach Alerts */}
              {filterMatches('Plant Stock Buffer Breach', 'Alert when coal stockpile falls below statutory days') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Stock Buffer Depletion Alerts</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Fires critical alerts when plant coking coal reserves fall below safety runway limits.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyStockBufferBreach}
                    onChange={() => handleToggle('notifyStockBufferBreach', 'Stock Buffer Alerts')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 14. FX Volatility Alerts */}
              {filterMatches('USD/INR FX Fluctuations', 'Alert when currency shifts by more than 0.5% in 24 hours') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Foreign Exchange Volatility Alerts</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Triggers landed cost re-indexation advisory when USD/INR volatility spikes.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyFxFluctuations}
                    onChange={() => handleToggle('notifyFxFluctuations', 'FX Alerts')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 15. Bunker Price Shocks */}
              {filterMatches('VLSFO Bunker Price Shocks', 'Notify when Singapore/Fujairah bunker fuel changes') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Bunker Price Shock Alerts</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Notifies chartering desk when VLSFO marine fuel moves by &gt; $10/MT.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyBunkerShocks}
                    onChange={() => handleToggle('notifyBunkerShocks', 'Bunker Alerts')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 16. RightShip Vetting Notices */}
              {filterMatches('RightShip Safety Rating Vetting', 'Alert when candidate vessel star rating changes') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">RightShip Vetting Downgrades</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Flags candidate bulkers failing the statutory 3.5-star safety rating.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyRightShipVetting}
                    onChange={() => handleToggle('notifyRightShipVetting', 'RightShip Vetting Alerts')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Role-Based Mandates (20 Settings across 5 roles) ─────────── */}
      {activeTab === 'roles' && (
        <div className="space-y-4 animate-ios-page-enter">
          {/* Sub-Role Selector Banner */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto">
            {[
              { role: 'CHARTERING_MANAGER' as SystemRole, label: 'Chartering Desk', icon: <Ship size={13} /> },
              { role: 'PORT_MANAGER' as SystemRole, label: 'Port Operations', icon: <MapPin size={13} /> },
              { role: 'PROCUREMENT_MANAGER' as SystemRole, label: 'Procurement', icon: <Package size={13} /> },
              { role: 'ANALYST' as SystemRole, label: 'Analytics & Forecasting', icon: <TrendingUp size={13} /> },
              { role: 'ADMIN' as SystemRole, label: 'Central Administration', icon: <Shield size={13} /> },
            ].map((r) => (
              <button
                key={r.role}
                onClick={() => setSelectedRole(r.role)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer',
                  selectedRole === r.role
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {r.icon}
                <span>{r.label}</span>
                {activeRole === r.role && (
                  <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1 rounded">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Locked Clearance Notice Banner */}
          {isRoleMandateLocked && (
            <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Lock size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900 dark:text-amber-200">Read-Only Mandate Profile</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                      Clearance Restricted
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    You are signed in as <strong>{activeRole.replace(/_/g, ' ')}</strong>. Settings for <strong>{selectedRole.replace(/_/g, ' ')}</strong> are displayed in read-only mode.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAccessDeniedModal({ open: true, targetRole: selectedRole, targetRoleLabel: selectedRole.replace(/_/g, ' ') })}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <ShieldAlert size={13} />
                <span>Access Clearance Details</span>
              </button>
            </div>
          )}

          {/* Role Mandate Settings Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 relative">
            {isRoleMandateLocked && (
              <div
                onClick={() => setAccessDeniedModal({ open: true, targetRole: selectedRole, targetRoleLabel: selectedRole.replace(/_/g, ' ') })}
                className="absolute inset-0 z-30 cursor-not-allowed bg-transparent"
                title="Mandate configuration locked — Click for access clearance details"
              />
            )}
            <div className={cn('space-y-4 transition-all', isRoleMandateLocked && 'opacity-40 filter grayscale-[25%] pointer-events-none select-none')}>
            {/* Chartering Manager (4 settings) */}
            {selectedRole === 'CHARTERING_MANAGER' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Ship size={16} className="text-blue-600 dark:text-sky-400" />
                      <span>Chartering Manager Mandate Controls</span>
                    </h2>
                    <p className="text-xs text-slate-500">Commercial parameters and vessel vetting rules for bulk fixtures.</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {/* 17 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Default Vessel Class Focus</div>
                      <p className="text-slate-500">Primary candidate bulker category highlighted on fixtures list.</p>
                    </div>
                    <select
                      value={settings.defaultVesselClass}
                      onChange={(e) => handleChange('defaultVesselClass', e.target.value as any, 'Default Vessel Class')}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="Capesize">Capesize (120k–180k MT)</option>
                      <option value="Panamax">Panamax (65k–85k MT)</option>
                      <option value="Supramax">Supramax (50k–65k MT)</option>
                      <option value="Ultramax">Ultramax (60k–68k MT)</option>
                    </select>
                  </div>

                  {/* 18 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Maximum Vessel Age Gate</div>
                      <p className="text-slate-500">Statutory age ceiling for international coking coal fixtures.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[15, 18, 20, 25].map((age) => (
                        <button
                          key={age}
                          onClick={() => handleChange('maxVesselAge', age, 'Max Vessel Age')}
                          className={cn(
                            'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                            settings.maxVesselAge === age ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          {age} Yrs
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 19 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Minimum RightShip Star Rating</div>
                      <p className="text-slate-500">Industry standard safety threshold required for tender nomination.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[2.5, 3.0, 3.5, 4.0, 5.0].map((stars) => (
                        <button
                          key={stars}
                          onClick={() => handleChange('minRightShipStars', stars, 'Min RightShip Stars')}
                          className={cn(
                            'px-2 py-1 rounded-lg font-bold text-xs transition',
                            settings.minRightShipStars === stars ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          ★ {stars}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 20 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Laytime Calculation Covenants</div>
                      <p className="text-slate-500">Default laytime covenant applied in Gencon charter parties.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {(['SHINC', 'SHEX'] as const).map((rule) => (
                        <button
                          key={rule}
                          onClick={() => handleChange('laytimeCalculationRule', rule, 'Laytime Calculation')}
                          className={cn(
                            'px-3 py-1 rounded-lg font-bold text-xs transition',
                            settings.laytimeCalculationRule === rule ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          {rule} {rule === 'SHINC' ? '(Sundays/Holidays Included)' : '(Excluded)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Port Operations Manager (4 settings) */}
            {selectedRole === 'PORT_MANAGER' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin size={16} className="text-blue-600 dark:text-sky-400" />
                      <span>Port Operations Mandate Controls</span>
                    </h2>
                    <p className="text-xs text-slate-500">Berth turnaround, draft safety margins, and railway rake evacuation targets.</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {/* 21 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Primary Home Port Filter</div>
                      <p className="text-slate-500">Default port view loaded on port intelligence consoles.</p>
                    </div>
                    <select
                      value={settings.defaultPortFilter}
                      onChange={(e) => handleChange('defaultPortFilter', e.target.value as any, 'Default Port')}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="ALL">All Major Ports</option>
                      <option value="Paradip">Paradip Port (Odisha)</option>
                      <option value="Vizag">Visakhapatnam (Vizag)</option>
                      <option value="Haldia">Haldia Dock Complex</option>
                      <option value="Dhamra">Dhamra Port</option>
                    </select>
                  </div>

                  {/* 22 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Berth Congestion Alert Threshold</div>
                      <p className="text-slate-500">Hours of pre-berthing wait queue before triggering diversion advisories.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[24, 36, 48, 72].map((hrs) => (
                        <button
                          key={hrs}
                          onClick={() => handleChange('berthCongestionAlertThreshold', hrs, 'Congestion Threshold')}
                          className={cn(
                            'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                            settings.berthCongestionAlertThreshold === hrs ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          {hrs}h
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 23 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Minimum Under-Keel Clearance (UKC)</div>
                      <p className="text-slate-500">Safety margin between vessel bottom and seabed during tidal navigation.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[0.8, 1.0, 1.2, 1.5].map((m) => (
                        <button
                          key={m}
                          onClick={() => handleChange('minUnderKeelClearance', m, 'UKC Margin')}
                          className={cn(
                            'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                            settings.minUnderKeelClearance === m ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 24 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Daily BOXN Rake Evacuation Target</div>
                      <p className="text-slate-500">Daily railway rakes dispatched to prevent coal yard gridlock.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[8, 12, 16, 20].map((rakes) => (
                        <button
                          key={rakes}
                          onClick={() => handleChange('rakeEvacuationDailyTarget', rakes, 'Rake Target')}
                          className={cn(
                            'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                            settings.rakeEvacuationDailyTarget === rakes ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          {rakes} Rakes
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Procurement Manager (4 settings) */}
            {selectedRole === 'PROCUREMENT_MANAGER' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Package size={16} className="text-blue-600 dark:text-sky-400" />
                      <span>Procurement Manager Mandate Controls</span>
                    </h2>
                    <p className="text-xs text-slate-500">Safety buffers, coal origin baselines, and COA commitment targets.</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {/* 25 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Critical Stock Buffer Threshold</div>
                      <p className="text-slate-500">Minimum days of coal consumption before triggering emergency rakes.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[10, 14, 18, 21].map((days) => (
                        <button
                          key={days}
                          onClick={() => handleChange('criticalStockThresholdDays', days, 'Critical Stock Days')}
                          className={cn(
                            'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                            settings.criticalStockThresholdDays === days ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          {days} Days
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 26 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Preferred Coking Coal Origin</div>
                      <p className="text-slate-500">Baseline international supply origin for delivered CFR pricing models.</p>
                    </div>
                    <select
                      value={settings.defaultOriginCountry}
                      onChange={(e) => handleChange('defaultOriginCountry', e.target.value as any, 'Default Origin')}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="Australia">Australia (Gladstone / Hay Point)</option>
                      <option value="USA">USA (Baltimore / Hampton Roads)</option>
                      <option value="Indonesia">Indonesia (Balikpapan)</option>
                      <option value="South Africa">South Africa (Richards Bay)</option>
                    </select>
                  </div>

                  {/* 27 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Commodity Pricing Benchmark Index</div>
                      <p className="text-slate-500">Benchmark index used to evaluate Platts parity and supplier premia.</p>
                    </div>
                    <select
                      value={settings.cokingCoalBenchmarkIndex}
                      onChange={(e) => handleChange('cokingCoalBenchmarkIndex', e.target.value as any, 'Benchmark Index')}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="Platts PLV">S&P Global Platts Premium Low-Vol</option>
                      <option value="Argus Hard Coking">Argus Hard Coking Coal FOB</option>
                      <option value="World Bank Pink">World Bank Pink Sheet Australian Benchmark</option>
                    </select>
                  </div>

                  {/* 28 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Target COA Allocation Ratio</div>
                      <p className="text-slate-500">Long-term contract of affreightment target vs spot market chartering.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[50, 65, 75, 85].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => handleChange('targetCoaAllocationPct', pct, 'COA Target')}
                          className={cn(
                            'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                            settings.targetCoaAllocationPct === pct ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          {pct}% COA
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analyst (4 settings) */}
            {selectedRole === 'ANALYST' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-600 dark:text-sky-400" />
                      <span>Quantitative Analyst Mandate Controls</span>
                    </h2>
                    <p className="text-xs text-slate-500">Econometric forward curve horizons, confidence bands, and ML algorithms.</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {/* 29 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Default Forecast Time Horizon</div>
                      <p className="text-slate-500">Standard projection forward window displayed on freight curves.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[7, 14, 30, 60, 90].map((d) => (
                        <button
                          key={d}
                          onClick={() => handleChange('defaultForecastHorizon', d, 'Forecast Horizon')}
                          className={cn(
                            'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                            settings.defaultForecastHorizon === d ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          {d}D
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 30 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Statistical Confidence Interval</div>
                      <p className="text-slate-500">Uncertainty envelope displayed around time-series rate predictions.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[80, 90, 95, 99].map((ci) => (
                        <button
                          key={ci}
                          onClick={() => handleChange('forecastConfidenceInterval', ci, 'Confidence Interval')}
                          className={cn(
                            'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                            settings.forecastConfidenceInterval === ci ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          {ci}% CI
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 31 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Econometric Seasonal Drift Adjustment</div>
                      <p className="text-slate-500">Applies monsoon and Chinese New Year seasonal smoothing factors.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableSeasonalDrift}
                      onChange={() => handleToggle('enableSeasonalDrift', 'Seasonal Drift')}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* 32 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Primary Machine Learning Engine</div>
                      <p className="text-slate-500">Core algorithm driving multi-horizon freight rate estimations.</p>
                    </div>
                    <select
                      value={settings.primaryForecastingModel}
                      onChange={(e) => handleChange('primaryForecastingModel', e.target.value as any, 'Primary Model')}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="Ensemble Pro v3">Ensemble Pro v3 (Weighted Bi-LSTM + XGBoost)</option>
                      <option value="Bi-LSTM">Bidirectional LSTM (Deep Recurrent Neural Net)</option>
                      <option value="XGBoost">XGBoost Extreme Gradient Boosting</option>
                      <option value="Prophet">Meta Prophet Bayesian Time-Series</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Admin (4 settings) */}
            {selectedRole === 'ADMIN' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield size={16} className="text-blue-600 dark:text-sky-400" />
                      <span>Central Administration & Security Governance</span>
                    </h2>
                    <p className="text-xs text-slate-500">Immutable ledger retention, token rotations, and authority thresholds.</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {/* 33 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Audit Ledger Retention Window</div>
                      <p className="text-slate-500">Retention period for immutable cryptographic audit logs.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[90, 180, 365, 730].map((days) => (
                        <button
                          key={days}
                          onClick={() => handleChange('auditLedgerRetentionDays', days, 'Audit Retention')}
                          className={cn(
                            'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                            settings.auditLedgerRetentionDays === days ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          {days} Days
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 34 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Zero-Trust Token Rotation Cadence</div>
                      <p className="text-slate-500">Frequency of cryptographic session and microservice JWT token re-issuance.</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[6, 12, 24, 48].map((hrs) => (
                        <button
                          key={hrs}
                          onClick={() => handleChange('tokenRotationCadenceHours', hrs, 'Token Cadence')}
                          className={cn(
                            'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                            settings.tokenRotationCadenceHours === hrs ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                          )}
                        >
                          {hrs} Hours
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 35 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Delegated Authority Tier 1 Ceiling</div>
                      <p className="text-slate-500">Maximum commitment value permissible without Board-level escalation.</p>
                    </div>
                    <select
                      value={settings.delegatedAuthorityLimitInr}
                      onChange={(e) => handleChange('delegatedAuthorityLimitInr', Number(e.target.value), 'Delegated Authority')}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value={500000}>₹5.00 Lakh (Officer Level)</option>
                      <option value={1500000}>₹15.00 Lakh (Desk Manager Level)</option>
                      <option value={5000000}>₹50.00 Lakh (Executive Director)</option>
                      <option value={10000000}>₹1.00 Crore (Board Authority)</option>
                    </select>
                  </div>

                  {/* 36 */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Strict Subnet IP Binding</div>
                      <p className="text-slate-500">Requires all active sessions to match verified corporate VPN subnets.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.zeroTrustStrictIp}
                      onChange={() => handleToggle('zeroTrustStrictIp', 'Strict IP Binding')}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Market & Economic Feeds (6 Settings) ─────────────────────── */}
      {activeTab === 'market' && (
        <div className="space-y-4 animate-ios-page-enter">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600 dark:text-sky-400" />
              <span>Maritime Market, Fuel & Economic Feeds (6 Settings)</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {/* 37 */}
              {filterMatches('Auto-Fetch Foreign Exchange', 'Sync live European Central Bank USD/INR rate') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Automated FX Rate Ingestion</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Automatically synchronizes Frankfurt ECB and open exchange rate fixes hourly.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoFetchFxRates}
                    onChange={() => handleToggle('autoFetchFxRates', 'Auto-Fetch FX Rates')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 38 */}
              {filterMatches('Primary Bunker Benchmark Port', 'Baseline port for VLSFO fuel costs') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Primary Bunker Benchmark Port</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Baseline refueling hub used for voyage economics and TCE netback calculations.
                    </p>
                  </div>
                  <select
                    value={settings.bunkerBenchmarkPort}
                    onChange={(e) => handleChange('bunkerBenchmarkPort', e.target.value as any, 'Bunker Port')}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="Singapore">Singapore (Hub Baseline)</option>
                    <option value="Fujairah">Fujairah (Middle East Corridor)</option>
                    <option value="Rotterdam">Rotterdam (Atlantic Corridor)</option>
                  </select>
                </div>
              )}

              {/* 39 */}
              {filterMatches('Baltic Index Weighting', 'Weighting formula for composite freight indicators') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Baltic Index Weighting Profile</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Relative weight allocated to Capesize C5TC vs Panamax P1A indices.
                    </p>
                  </div>
                  <select
                    value={settings.balticIndexWeights}
                    onChange={(e) => handleChange('balticIndexWeights', e.target.value as any, 'Baltic Weights')}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="Capesize Weighted">Capesize Weighted (70% C5TC / 30% P1A)</option>
                    <option value="Equal">Equal Weighting (50% / 50%)</option>
                    <option value="Panamax Weighted">Panamax Weighted (30% C5TC / 70% P1A)</option>
                  </select>
                </div>
              )}

              {/* 40 */}
              {filterMatches('Fuel Consumption Model', 'Fuel burn assumptions for voyage TCE calculations') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Vessel Fuel Consumption Baseline</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Tons of VLSFO burned per day at eco-speed (11.5 kts laden / 12.0 kts ballast).
                    </p>
                  </div>
                  <select
                    value={settings.fuelConsumptionModel}
                    onChange={(e) => handleChange('fuelConsumptionModel', e.target.value as any, 'Fuel Model')}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="Eco-Bulker 28t/d">Modern Eco-Bulker (28 MT / day)</option>
                    <option value="Standard Bulker 34t/d">Standard Modern Bulker (34 MT / day)</option>
                    <option value="Older Bulker 42t/d">Conventional Bulker (42 MT / day)</option>
                  </select>
                </div>
              )}

              {/* 41 */}
              {filterMatches('Maritime Carbon Emissions Model', 'EU ETS and IMO CII carbon tax simulation') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Maritime Carbon Emissions Levy</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Emission allowance taxation incorporated into landed coking coal valuations.
                    </p>
                  </div>
                  <select
                    value={settings.carbonTaxModel}
                    onChange={(e) => handleChange('carbonTaxModel', e.target.value as any, 'Carbon Tax Model')}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="EU ETS Only">EU ETS Active (€64.20/t CO2)</option>
                    <option value="Global IMO CII">Global IMO CII Carbon Rating Framework</option>
                    <option value="None">None (Domestic Indian Waters Exemption)</option>
                  </select>
                </div>
              )}

              {/* 42 */}
              {filterMatches('Demurrage Default Rate', 'Standard daily demurrage penalty rate in USD') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Charter Party Demurrage Benchmark</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Daily demurrage and despatch penalty rate used in voyage risk evaluations.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {[15000, 18000, 22000, 25000].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleChange('demurrageCalculationRateUsd', rate, 'Demurrage Rate')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                          settings.demurrageCalculationRateUsd === rate ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                        )}
                      >
                        ${rate.toLocaleString()}/d
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: Export, Security & Lineage (6 Settings) ──────────────────── */}
      {activeTab === 'export' && (
        <div className="space-y-4 animate-ios-page-enter">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={16} className="text-blue-600 dark:text-sky-400" />
              <span>Dossier Export, Security & Data Lineage (6 Settings)</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {/* 43 */}
              {filterMatches('PDF Official Watermark', 'Include faint diagonal security watermark in exported PDFs') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Exported PDF Security Watermark</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Draws subtle "OFFICIAL · JAL TARANG · RESTRICTED" watermark diagonally across pages.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.exportPdfWatermark}
                    onChange={() => handleToggle('exportPdfWatermark', 'PDF Watermark')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 44 */}
              {filterMatches('Cryptographic Verification Seal', 'Include digital signature box and SHA256 checksum in PDFs') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Cryptographic Verification Seal</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Embeds official digital verification box with SHA-256 audit hash and compliance badge.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.exportPdfSeal}
                    onChange={() => handleToggle('exportPdfSeal', 'Cryptographic Seal')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 45 */}
              {filterMatches('PDF Page Orientation', 'Default orientation for downloaded executive dossiers') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Default PDF Page Orientation</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Orientation formatting applied to generated PDF tables and executive dossiers.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(['portrait', 'landscape'] as const).map((ori) => (
                      <button
                        key={ori}
                        onClick={() => handleChange('exportOrientation', ori, 'PDF Orientation')}
                        className={cn(
                          'px-3 py-1 rounded-lg font-semibold capitalize text-xs transition',
                          settings.exportOrientation === ori ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs' : 'text-slate-500'
                        )}
                      >
                        {ori}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 46 */}
              {filterMatches('Mask Counterparty KYC Data', 'Redact bank details and sensitive counterparty fields') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Mask Sensitive Counterparty Details</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Redacts banking escrow accounts and KYC documents for non-executive viewer roles.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maskCounterpartyDetails}
                    onChange={() => handleToggle('maskCounterpartyDetails', 'Mask Counterparty KYC')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 47 */}
              {filterMatches('Data Lineage Tracking', 'Record field-level provenance and transformation traces') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Field-Level Data Lineage Tracking</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Logs end-to-end cryptographic lineage traces from raw API ingestion to dashboard KPIs.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableDataLineageTracking}
                    onChange={() => handleToggle('enableDataLineageTracking', 'Data Lineage Tracking')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* 48 */}
              {filterMatches('AIS Telemetry Jitter Filter', 'Filter out stationary non-commercial vessels') && (
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">AIS Telemetry Jitter Filter</div>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Filters noise from fishing flotillas, tugs, and stationary mooring craft in Bay of Bengal.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showTelemetryNoiseFilter}
                    onChange={() => handleToggle('showTelemetryNoiseFilter', 'AIS Jitter Filter')}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: Custom API Endpoints & Integrations Hub (7 Settings) ──────── */}
      {activeTab === 'api' && (
        <div className="space-y-4 animate-ios-page-enter">
          {/* Real-Time API Diagnostics Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Radio size={16} className="text-blue-600 dark:text-sky-400" />
                  <span>Custom API Endpoints & Integrations Hub</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure custom backend clusters, OpenRouter AI models, AIS streams, and webhook alerts.
                </p>
              </div>
              <button
                onClick={handleTestAllApis}
                disabled={isTestingApis}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition disabled:opacity-50 cursor-pointer ios-btn-spring"
              >
                <Wifi size={13} className={isTestingApis ? 'animate-spin' : ''} />
                <span>{isTestingApis ? 'Pinging Endpoints…' : 'Ping & Test Connections'}</span>
              </button>
            </div>

            {/* Diagnostic Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Backend Server</span>
                  {apiDiagnostics.backend?.status === 'ok' && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">ONLINE</span>
                  )}
                  {apiDiagnostics.backend?.status === 'err' && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">OFFLINE</span>
                  )}
                  {apiDiagnostics.backend?.status === 'testing' && (
                    <span className="text-[10px] font-bold text-blue-600 animate-pulse">TESTING…</span>
                  )}
                  {!apiDiagnostics.backend && (
                    <span className="text-[10px] text-slate-400">UNTESTED</span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-500 truncate">
                  {apiDiagnostics.backend?.message || settings.customApiBaseUrl}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Open-Meteo Marine</span>
                  {apiDiagnostics.weather?.status === 'ok' && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">CONNECTED</span>
                  )}
                  {apiDiagnostics.weather?.status === 'err' && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">ERROR</span>
                  )}
                  {apiDiagnostics.weather?.status === 'testing' && (
                    <span className="text-[10px] font-bold text-blue-600 animate-pulse">TESTING…</span>
                  )}
                  {!apiDiagnostics.weather && (
                    <span className="text-[10px] text-slate-400">UNTESTED</span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-500 truncate">
                  {apiDiagnostics.weather?.message || 'Open-Meteo Public Wave Radar'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">AI Model Grounding</span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-800">
                    {settings.customOpenRouterModel.split('/')[1] || settings.customOpenRouterModel}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">
                  {apiDiagnostics.openRouter?.message || 'Deterministic Rule Engine Fallback'}
                </p>
              </div>
            </div>

            {/* API Settings Form */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs pt-2">
              {/* Primary API Base URL */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="max-w-md">
                  <div className="font-semibold text-slate-900 dark:text-white">Primary Backend API Base URL</div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Target URL for all 30+ REST enterprise route groups (vessels, ports, freight, audit).
                  </p>
                </div>
                <div className="w-full sm:w-80 flex items-center gap-2">
                  <input
                    type="text"
                    value={settings.customApiBaseUrl}
                    onChange={(e) => handleChange('customApiBaseUrl', e.target.value, 'API Base URL')}
                    placeholder="http://localhost:8000/api/v1"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button
                    onClick={() => handleChange('customApiBaseUrl', 'http://localhost:8000/api/v1', 'Reset API URL')}
                    title="Reset to localhost"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {/* OpenRouter AI Model & Key */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="max-w-md">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>OpenRouter AI Model & Endpoint</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-300 rounded font-mono">LLM Grounding</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Primary reasoning engine for JAL TARANG Copilot. Automatically falls back to deterministic rule engine if key is absent.
                  </p>
                </div>
                <div className="w-full sm:w-80 space-y-2">
                  <select
                    value={settings.customOpenRouterModel}
                    onChange={(e) => handleChange('customOpenRouterModel', e.target.value, 'AI Model')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Recommended)</option>
                    <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B Instruct</option>
                    <option value="deepseek/deepseek-r1">DeepSeek R1 (Reasoning)</option>
                    <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                  </select>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.customOpenRouterKey}
                      onChange={(e) => handleChange('customOpenRouterKey', e.target.value, 'OpenRouter API Key')}
                      placeholder="sk-or-v1-..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* AIS Stream WebSocket */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="max-w-md">
                  <div className="font-semibold text-slate-900 dark:text-white">AIS Stream WebSocket URL</div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Live commercial vessel telemetry feed for Bay of Bengal and Indian Ocean traffic.
                  </p>
                </div>
                <input
                  type="text"
                  value={settings.customAisWsUrl}
                  onChange={(e) => handleChange('customAisWsUrl', e.target.value, 'AIS WebSocket URL')}
                  placeholder="wss://stream.aisstream.io/v0/stream"
                  className="w-full sm:w-80 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Marine Weather API URL */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="max-w-md">
                  <div className="font-semibold text-slate-900 dark:text-white">Port Ocean Weather API URL</div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Source for swell wave heights, wind gusts, and ocean current forecasts.
                  </p>
                </div>
                <input
                  type="text"
                  value={settings.customWeatherApiUrl}
                  onChange={(e) => handleChange('customWeatherApiUrl', e.target.value, 'Weather API URL')}
                  placeholder="https://marine-api.open-meteo.com/v1/marine"
                  className="w-full sm:w-80 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Webhook Alert Dispatch */}
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="max-w-md">
                  <div className="font-semibold text-slate-900 dark:text-white">Enterprise Webhook Dispatch URL</div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Forward critical cyclone alerts and stock buffer breaches to Slack, Teams, or PagerDuty.
                  </p>
                </div>
                <div className="w-full sm:w-80 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.webhookAlertUrl}
                      onChange={(e) => handleChange('webhookAlertUrl', e.target.value, 'Webhook Alert URL')}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button
                      onClick={handleTestWebhook}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold whitespace-nowrap transition cursor-pointer"
                    >
                      Test
                    </button>
                  </div>
                  {webhookTestNotice && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in">
                      {webhookTestNotice}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 7: UI Theme & Appearance Studio (3 Settings) ────────────────── */}
      {activeTab === 'appearance' && (
        <div className="space-y-4 animate-ios-page-enter">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette size={16} className="text-blue-600 dark:text-sky-400" />
              <span>Theme Studio & Appearance Customizer (3 Settings)</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {/* Accent Color Palette */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Executive Accent Colorway</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-300">
                      {settings.accentColor}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Curated color palette applied to primary buttons, interactive cards, and active tab indicators.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'blue', label: 'Admiralty Blue', bg: 'bg-blue-600' },
                    { id: 'emerald', label: 'Maritime Emerald', bg: 'bg-emerald-600' },
                    { id: 'amber', label: 'Sunset Amber', bg: 'bg-amber-600' },
                    { id: 'purple', label: 'Amethyst Royal', bg: 'bg-purple-600' },
                    { id: 'rose', label: 'Steel Rose', bg: 'bg-rose-600' },
                  ].map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleChange('accentColor', color.id as any, `Accent: ${color.label}`)}
                      title={color.label}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all flex items-center justify-center text-white cursor-pointer',
                        color.bg,
                        settings.accentColor === color.id
                          ? 'ring-4 ring-offset-2 ring-blue-500 scale-110 shadow-md'
                          : 'opacity-80 hover:opacity-100'
                      )}
                    >
                      {settings.accentColor === color.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glassmorphism Blur Strength */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Glassmorphism Blur Strength</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {settings.glassmorphismBlur}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Frosted glass backdrop-filter intensity for navigation, copilot popup, and alert shades.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {[
                    { id: 'off', label: 'Solid (Off)' },
                    { id: 'subtle', label: 'Subtle (12px)' },
                    { id: 'deep', label: 'Deep (24px)' },
                    { id: 'ultra', label: 'Ultra (40px)' },
                  ].map((blur) => (
                    <button
                      key={blur.id}
                      onClick={() => handleChange('glassmorphismBlur', blur.id as any, `Blur: ${blur.label}`)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                        settings.glassmorphismBlur === blur.id
                          ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs'
                          : 'text-slate-500'
                      )}
                    >
                      {blur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Color Palette */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Chart & Data Visualization Palette</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {settings.chartColorPalette}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Color gradients applied across freight trajectories, plant stock cushions, and confidence bands.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {[
                    { id: 'vibrant', label: 'Vibrant Marine' },
                    { id: 'monochrome', label: 'Executive Slate' },
                    { id: 'accessible', label: 'High Contrast' },
                  ].map((pal) => (
                    <button
                      key={pal.id}
                      onClick={() => handleChange('chartColorPalette', pal.id as any, `Palette: ${pal.label}`)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-bold text-xs transition',
                        settings.chartColorPalette === pal.id
                          ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-sky-300 shadow-xs'
                          : 'text-slate-500'
                      )}
                    >
                      {pal.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 8: Workspace Profiles & Backup (5 Actions) ──────────────────── */}
      {activeTab === 'profiles' && (
        <div className="space-y-5 animate-ios-page-enter">
          {/* Workspace Profiles Switcher */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database size={16} className="text-blue-600 dark:text-sky-400" />
                <span>Pre-Configured Workspace Profiles</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Switch operational postures instantly with pre-tuned thresholds, telemetry cadences, and colorways.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  id: 'EXECUTIVE_HQ',
                  name: 'SAIL Executive HQ',
                  desc: 'Dark theme, ₹ INR valuation, ₹50L board ceiling, 21-day safety stock buffer, deep glassmorphism.',
                  badge: 'Board & Ministry',
                  badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-sky-300 dark:border-blue-800',
                },
                {
                  id: 'PORT_TOWER',
                  name: 'Port Operations Tower',
                  desc: '15-second real-time telemetry, sound chimes active, 24h congestion trigger, rake targets.',
                  badge: 'Paradip & Vizag',
                  badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
                },
                {
                  id: 'CHARTERING_DESK',
                  name: 'Chartering Trading Desk',
                  desc: 'Light mode, $ USD valuation, Capesize focus, 15-year vessel age gate, 65% COA ratio.',
                  badge: 'Commercial Shipping',
                  badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
                },
                {
                  id: 'LOW_BANDWIDTH',
                  name: 'Low Bandwidth / Vessel Bridge',
                  desc: 'Animations disabled, 5-minute polling, monochrome charts, minimal network footprint.',
                  badge: 'Ocean Transit Mode',
                  badgeColor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                },
              ].map((p) => {
                const isActive = settings.activeProfile === p.id;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3',
                      isActive
                        ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</h3>
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold border', p.badgeColor)}>
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        loadProfile(p.id as any);
                        showSavedNotification(`Applied Profile: ${p.name}`);
                      }}
                      className={cn(
                        'w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer',
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      {isActive ? <Check size={12} /> : null}
                      <span>{isActive ? 'Active Profile' : 'Apply Profile'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backup, Export & Import JSON */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-blue-600 dark:text-sky-400" />
                <span>Configuration Backup & JSON Migration</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Export all 50+ enterprise parameters to an immutable signed JSON file or restore from a backup.
              </p>
            </div>

            {importStatus && (
              <div
                className={cn(
                  'p-3 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-xs animate-in fade-in',
                  importStatus.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200'
                )}
              >
                {importStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{importStatus.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export JSON Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Download size={14} className="text-blue-600" />
                    <span>Export Configuration (JSON)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Downloads an exact JSON snapshot containing all authority limits, API URLs, alert timers, and role mandates.
                  </p>
                </div>
                <button
                  onClick={handleExportJson}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ios-btn-spring shadow-xs"
                >
                  <Download size={13} />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              {/* Import JSON Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Upload size={14} className="text-emerald-600" />
                    <span>Import Configuration (JSON)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Upload a previously exported configuration file to instantly restore all dashboard settings.
                  </p>
                </div>
                <label className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ios-btn-spring shadow-xs text-center">
                  <Upload size={13} />
                  <span>Upload & Restore JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: Active Sessions & Security ─────────────────────────────────── */}
      {activeTab === 'sessions' && (
        <div className="space-y-5 animate-ios-page-enter">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-blue-900/10 via-sky-800/10 to-transparent border border-blue-200/80 dark:border-blue-900/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/25 shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Active Device Sessions & Terminal Access Controls</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    ISO/IEC 27001 Compliant
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  Manage active browser and workstation sessions authenticated under <strong className="text-slate-800 dark:text-slate-200">{user?.email || 'operator@sail.in'}</strong>. Terminate unrecognized remote sessions or configure automated inactivity lockouts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => fetchSessions()}
                disabled={isSessionsLoading}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw size={12} className={cn(isSessionsLoading && 'animate-spin')} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Inactivity Timeout Configuration Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600 dark:text-sky-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Automated Inactivity Timeout (Zero-Touch Logout)
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                Current: {timeoutMinutes} Minutes
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              To safeguard confidential Ministry of Steel procurement tenders and freight contract rates, the system monitors mouse, keyboard, and touch interaction. When inactive for the selected period, a 60-second warning countdown will appear before terminating the session.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
              {[
                { min: 15, label: '15 Minutes', desc: 'Strict Compliance' },
                { min: 30, label: '30 Minutes', desc: 'Recommended' },
                { min: 60, label: '1 Hour', desc: 'Standard Shift' },
                { min: 120, label: '2 Hours', desc: 'Extended Analysis' },
                { min: 480, label: '8 Hours', desc: 'Full Operational Shift' },
              ].map((opt) => (
                <button
                  key={opt.min}
                  onClick={() => setTimeoutMinutes(opt.min)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                    timeoutMinutes === opt.min
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-700 shadow-xs'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-bold', timeoutMinutes === opt.min ? 'text-blue-700 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200')}>
                      {opt.label}
                    </span>
                    {timeoutMinutes === opt.min && <Check size={12} className="text-blue-600 dark:text-sky-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Sessions List Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Laptop size={15} className="text-blue-600 dark:text-sky-400" />
                  <span>Authenticated Terminals & Workstations ({sessions.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time list of all physical devices actively holding cryptographic JWT access tokens.
                </p>
              </div>

              {sessions.filter((s) => !s.isCurrent).length > 0 && (
                <div>
                  {confirmRevokeOthers ? (
                    <div className="flex items-center gap-2 animate-in fade-in">
                      <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Terminate all others?</span>
                      <button
                        onClick={async () => {
                          await revokeOtherSessions();
                          setConfirmRevokeOthers(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Yes, Terminate
                      </button>
                      <button
                        onClick={() => setConfirmRevokeOthers(false)}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRevokeOthers(true)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Trash2 size={12} />
                      <span>Terminate All Other Sessions</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sessions list */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.map((sess) => {
                const isMobile = sess.device.toLowerCase().includes('phone') || sess.os.toLowerCase().includes('ios') || sess.os.toLowerCase().includes('android');
                const isTablet = sess.device.toLowerCase().includes('ipad') || sess.device.toLowerCase().includes('tablet');

                return (
                  <div
                    key={sess.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 -mx-3 px-3 rounded-xl transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs',
                        sess.isCurrent
                          ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-sky-300'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      )}>
                        {isTablet ? (
                          <Smartphone size={18} />
                        ) : isMobile ? (
                          <Smartphone size={18} />
                        ) : (
                          <Laptop size={18} />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {sess.device}
                          </h4>
                          {sess.isCurrent ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Current Working Session
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Remote Active Session
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{sess.browser}</span>
                          <span>•</span>
                          <span>{sess.os}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Globe size={11} className="text-slate-400" />
                            {sess.ipAddress}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                          <MapPin size={10} className="text-slate-400 shrink-0" />
                          <span className="truncate">{sess.location}</span>
                          <span>·</span>
                          <span>Signed in {new Date(sess.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Activity Status</span>
                        <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {sess.isCurrent ? 'Active Now' : formatDate(sess.lastActiveAt)}
                        </span>
                      </div>

                      {sess.isCurrent ? (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 select-none">
                          In Use
                        </div>
                      ) : (
                        <button
                          onClick={() => revokeSession(sess.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <LogOut size={12} />
                          <span>Revoke Session</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security & Audit Compliance Footer Card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <Shield size={16} className="text-blue-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white block">Enterprise Cryptographic Security Policy</span>
              <p>
                Each authenticated session is bound to an asymmetric JWT token signed with SHA-256 and stored in secure browser memory. Revoking a remote session invalidates the cryptographic grant and forces the remote browser to immediately drop active WebSocket subscriptions and redirect to login.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACCESS DENIED / ROLE MANDATE CLEARANCE MODAL ─────────────────────── */}
      {accessDeniedModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert size={24} />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Access Denied: Role Mandate Restricted
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                You are currently signed in under the <strong className="text-blue-600 dark:text-sky-400">{activeRole.replace(/_/g, ' ')}</strong> mandate.
                Direct operational modifications to <strong className="text-slate-900 dark:text-white">{accessDeniedModal.targetRoleLabel}</strong> parameters, thresholds, or gates require dedicated role credentials or central administrative elevation.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Active User Mandate:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{activeRole.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Target Mandate:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{accessDeniedModal.targetRoleLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Security Enforcement:</span>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">CVC ZERO-TRUST ISOLATION</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAccessDeniedModal({ open: false, targetRole: null, targetRoleLabel: '' })}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Dismiss / Read-Only
              </button>
              {accessDeniedModal.targetRole && (
                <button
                  onClick={() => {
                    if (accessDeniedModal.targetRole) {
                      switchRole(accessDeniedModal.targetRole);
                      setSelectedRole(accessDeniedModal.targetRole);
                      setAccessDeniedModal({ open: false, targetRole: null, targetRoleLabel: '' });
                      showSavedNotification(`Mandate switched to ${accessDeniedModal.targetRoleLabel}`);
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Assume Role Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
