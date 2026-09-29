import { create } from 'zustand';
import { useUiStore } from './uiStore';
import { settingsApi } from '../api/settingsApi';

export interface EnterpriseSettings {
  // ─── 1. General & Interface (8) ──────────────────────────────────────────────
  theme: 'light' | 'dark';
  currency: 'INR' | 'USD';
  compactMode: boolean;
  enableAnimations: boolean;
  autoRefreshInterval: number; // seconds: 15, 30, 60, 300
  timezone: 'IST' | 'UTC' | 'SGT';
  soundEffects: boolean;
  fontSize: 'standard' | 'large' | 'compact';

  // ─── 2. Notifications & Real-Time Alerts (9) ─────────────────────────────────
  popupDuration: number; // seconds: 3, 5, 8, 10
  enablePopupNotifications: boolean;
  dndEnabled: boolean; // Do Not Disturb: Only Crucial/CRITICAL notifications arrive
  notifyCycloneAlerts: boolean;
  notifyPortCongestion: boolean;
  notifyStockBufferBreach: boolean;
  notifyFxFluctuations: boolean;
  notifyBunkerShocks: boolean;
  notifyRightShipVetting: boolean;

  // ─── 3. Role-Based Mandates (20 across 5 roles) ──────────────────────────────
  // Chartering Manager (4)
  defaultVesselClass: 'Capesize' | 'Panamax' | 'Supramax' | 'Ultramax';
  maxVesselAge: number; // 15, 18, 20, 25 years
  minRightShipStars: number; // 2.5, 3.0, 3.5, 4.0, 5.0
  laytimeCalculationRule: 'SHINC' | 'SHEX';

  // Port Operations Manager (4)
  defaultPortFilter: 'ALL' | 'Paradip' | 'Vizag' | 'Haldia' | 'Dhamra';
  berthCongestionAlertThreshold: number; // 24, 36, 48, 72 hours
  minUnderKeelClearance: number; // 0.8, 1.0, 1.2, 1.5 meters
  rakeEvacuationDailyTarget: number; // 8, 12, 16, 20 rakes

  // Procurement Manager (4)
  criticalStockThresholdDays: number; // 10, 14, 18, 21 days
  defaultOriginCountry: 'Australia' | 'USA' | 'Indonesia' | 'South Africa';
  cokingCoalBenchmarkIndex: 'Platts PLV' | 'Argus Hard Coking' | 'World Bank Pink';
  targetCoaAllocationPct: number; // 50, 65, 75, 85 %

  // Analyst (4)
  defaultForecastHorizon: number; // 7, 14, 30, 60, 90 days
  forecastConfidenceInterval: number; // 80, 90, 95, 99 %
  enableSeasonalDrift: boolean;
  primaryForecastingModel: 'Ensemble Pro v3' | 'Bi-LSTM' | 'XGBoost' | 'Prophet';

  // Admin / Governance (4)
  auditLedgerRetentionDays: number; // 90, 180, 365, 730 days
  tokenRotationCadenceHours: number; // 6, 12, 24, 48 hours
  delegatedAuthorityLimitInr: number; // 500000, 1500000, 5000000, 10000000 INR
  zeroTrustStrictIp: boolean;

  // ─── 4. Market & Economic Feeds (6) ──────────────────────────────────────────
  autoFetchFxRates: boolean;
  bunkerBenchmarkPort: 'Singapore' | 'Fujairah' | 'Rotterdam';
  balticIndexWeights: 'Equal' | 'Capesize Weighted' | 'Panamax Weighted';
  fuelConsumptionModel: 'Eco-Bulker 28t/d' | 'Standard Bulker 34t/d' | 'Older Bulker 42t/d';
  carbonTaxModel: 'EU ETS Only' | 'Global IMO CII' | 'None';
  demurrageCalculationRateUsd: number; // 15000, 18000, 22000, 25000 $/day

  // ─── 5. Export, Security & Lineage (6) ───────────────────────────────────────
  exportPdfWatermark: boolean;
  exportPdfSeal: boolean;
  exportOrientation: 'portrait' | 'landscape';
  maskCounterpartyDetails: boolean;
  enableDataLineageTracking: boolean;
  showTelemetryNoiseFilter: boolean;

  // ─── 6. Custom API Endpoints & Integrations Hub (7) ──────────────────────────
  customApiBaseUrl: string;
  customOpenRouterUrl: string;
  customOpenRouterKey: string;
  customOpenRouterModel: string;
  customAisWsUrl: string;
  customWeatherApiUrl: string;
  webhookAlertUrl: string;

  // ─── 7. UI Theme & Appearance Studio (3) ─────────────────────────────────────
  accentColor: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  glassmorphismBlur: 'off' | 'subtle' | 'deep' | 'ultra';
  chartColorPalette: 'vibrant' | 'monochrome' | 'accessible';

  // ─── 8. Workspace Profiles & Backup (1) ──────────────────────────────────────
  activeProfile: 'CUSTOM' | 'EXECUTIVE_HQ' | 'PORT_TOWER' | 'CHARTERING_DESK' | 'LOW_BANDWIDTH';
}

export const PROFILE_PRESETS: Record<string, Partial<EnterpriseSettings>> = {
  EXECUTIVE_HQ: {
    activeProfile: 'EXECUTIVE_HQ',
    theme: 'dark',
    currency: 'INR',
    compactMode: false,
    enableAnimations: true,
    autoRefreshInterval: 30,
    accentColor: 'blue',
    glassmorphismBlur: 'deep',
    chartColorPalette: 'vibrant',
    delegatedAuthorityLimitInr: 5000000,
    criticalStockThresholdDays: 21,
    minRightShipStars: 3.5,
  },
  PORT_TOWER: {
    activeProfile: 'PORT_TOWER',
    theme: 'dark',
    currency: 'INR',
    compactMode: true,
    enableAnimations: true,
    autoRefreshInterval: 15,
    accentColor: 'amber',
    glassmorphismBlur: 'deep',
    chartColorPalette: 'vibrant',
    berthCongestionAlertThreshold: 24,
    rakeEvacuationDailyTarget: 16,
    soundEffects: true,
  },
  CHARTERING_DESK: {
    activeProfile: 'CHARTERING_DESK',
    theme: 'light',
    currency: 'USD',
    compactMode: true,
    enableAnimations: true,
    autoRefreshInterval: 15,
    accentColor: 'emerald',
    glassmorphismBlur: 'subtle',
    chartColorPalette: 'vibrant',
    defaultVesselClass: 'Capesize',
    maxVesselAge: 15,
    targetCoaAllocationPct: 65,
    soundEffects: true,
  },
  LOW_BANDWIDTH: {
    activeProfile: 'LOW_BANDWIDTH',
    theme: 'light',
    currency: 'INR',
    compactMode: true,
    enableAnimations: false,
    autoRefreshInterval: 300,
    accentColor: 'blue',
    glassmorphismBlur: 'off',
    chartColorPalette: 'monochrome',
    soundEffects: false,
  },
};

const DEFAULT_SETTINGS: EnterpriseSettings = {
  // General
  theme: 'light',
  currency: 'INR',
  compactMode: false,
  enableAnimations: true,
  autoRefreshInterval: 30,
  timezone: 'IST',
  soundEffects: true,
  fontSize: 'standard',

  // Notifications
  popupDuration: 8,
  enablePopupNotifications: true,
  dndEnabled: false,
  notifyCycloneAlerts: true,
  notifyPortCongestion: true,
  notifyStockBufferBreach: true,
  notifyFxFluctuations: true,
  notifyBunkerShocks: true,
  notifyRightShipVetting: true,

  // Chartering
  defaultVesselClass: 'Capesize',
  maxVesselAge: 18,
  minRightShipStars: 3.5,
  laytimeCalculationRule: 'SHINC',

  // Port
  defaultPortFilter: 'ALL',
  berthCongestionAlertThreshold: 36,
  minUnderKeelClearance: 1.0,
  rakeEvacuationDailyTarget: 12,

  // Procurement
  criticalStockThresholdDays: 14,
  defaultOriginCountry: 'Australia',
  cokingCoalBenchmarkIndex: 'Platts PLV',
  targetCoaAllocationPct: 75,

  // Analyst
  defaultForecastHorizon: 30,
  forecastConfidenceInterval: 95,
  enableSeasonalDrift: true,
  primaryForecastingModel: 'Ensemble Pro v3',

  // Admin
  auditLedgerRetentionDays: 365,
  tokenRotationCadenceHours: 24,
  delegatedAuthorityLimitInr: 1500000,
  zeroTrustStrictIp: true,

  // Market
  autoFetchFxRates: true,
  bunkerBenchmarkPort: 'Singapore',
  balticIndexWeights: 'Capesize Weighted',
  fuelConsumptionModel: 'Standard Bulker 34t/d',
  carbonTaxModel: 'EU ETS Only',
  demurrageCalculationRateUsd: 18000,

  // Export & Security
  exportPdfWatermark: true,
  exportPdfSeal: true,
  exportOrientation: 'portrait',
  maskCounterpartyDetails: false,
  enableDataLineageTracking: true,
  showTelemetryNoiseFilter: true,

  // Custom API Endpoints & Integrations Hub
  customApiBaseUrl: 'http://localhost:8000/api/v1',
  customOpenRouterUrl: 'https://openrouter.ai/api/v1',
  customOpenRouterKey: '',
  customOpenRouterModel: 'anthropic/claude-3.5-sonnet',
  customAisWsUrl: 'wss://stream.aisstream.io/v0/stream',
  customWeatherApiUrl: 'https://marine-api.open-meteo.com/v1/marine',
  webhookAlertUrl: '',

  // UI Theme & Appearance Studio
  accentColor: 'blue',
  glassmorphismBlur: 'deep',
  chartColorPalette: 'vibrant',

  // Workspace Profile
  activeProfile: 'EXECUTIVE_HQ',
};

const STORAGE_KEY = 'sail_marinex_settings_v2';

const loadSavedSettings = (): EnterpriseSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

interface SettingsStoreState {
  settings: EnterpriseSettings;
  isBackendSynced: boolean;
  updateSetting: <K extends keyof EnterpriseSettings>(key: K, value: EnterpriseSettings[K]) => void;
  loadProfile: (profileName: 'EXECUTIVE_HQ' | 'PORT_TOWER' | 'CHARTERING_DESK' | 'LOW_BANDWIDTH') => void;
  importSettingsJson: (jsonString: string) => { success: boolean; error?: string };
  exportSettingsJson: () => string;
  resetCategory: (category: 'general' | 'notifications' | 'chartering' | 'port' | 'procurement' | 'analyst' | 'admin' | 'market' | 'export' | 'api' | 'appearance') => void;
  resetAll: () => void;
  fetchBackendSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: loadSavedSettings(),
  isBackendSynced: false,

  fetchBackendSettings: async () => {
    try {
      const backendSettings = await settingsApi.get();
      if (backendSettings && typeof backendSettings === 'object') {
        const merged = { ...get().settings, ...backendSettings };
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
        set({ settings: merged, isBackendSynced: true });
        if (merged.theme) useUiStore.getState().setTheme(merged.theme);
        if (merged.currency) useUiStore.getState().setCurrency(merged.currency);
      }
    } catch {
      // Offline fallback: keep using localStorage
      set({ isBackendSynced: false });
    }
  },

  updateSetting: (key, value) =>
    set((state) => {
      const updated = { ...state.settings, [key]: value };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      // Sync with uiStore where applicable
      if (key === 'theme') {
        useUiStore.getState().setTheme(value as any);
      }
      if (key === 'currency') {
        useUiStore.getState().setCurrency(value as any);
      }

      // Asynchronously synchronize with backend API
      settingsApi.update({ [key]: value }).catch(() => {});

      return { settings: updated };
    }),

  loadProfile: (profileName) =>
    set((state) => {
      const preset = PROFILE_PRESETS[profileName];
      if (!preset) return state;
      const updated: EnterpriseSettings = {
        ...state.settings,
        ...preset,
        activeProfile: profileName,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      if (preset.theme) useUiStore.getState().setTheme(preset.theme as any);
      if (preset.currency) useUiStore.getState().setCurrency(preset.currency as any);

      // Asynchronously synchronize with backend API
      settingsApi.update(updated).catch(() => {});

      return { settings: updated };
    }),

  importSettingsJson: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object' || !parsed) {
        return { success: false, error: 'Invalid JSON structure' };
      }
      const updated: EnterpriseSettings = { ...DEFAULT_SETTINGS, ...parsed };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      if (updated.theme) useUiStore.getState().setTheme(updated.theme);
      if (updated.currency) useUiStore.getState().setCurrency(updated.currency);

      // Asynchronously synchronize with backend API
      settingsApi.update(updated).catch(() => {});

      set({ settings: updated });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to parse JSON configuration' };
    }
  },

  exportSettingsJson: () => {
    const current = get().settings;
    return JSON.stringify(current, null, 2);
  },

  resetCategory: (category) =>
    set((state) => {
      const updated = { ...state.settings };
      // Map category defaults
      if (category === 'general') {
        updated.theme = DEFAULT_SETTINGS.theme;
        updated.currency = DEFAULT_SETTINGS.currency;
        updated.compactMode = DEFAULT_SETTINGS.compactMode;
        updated.enableAnimations = DEFAULT_SETTINGS.enableAnimations;
        updated.autoRefreshInterval = DEFAULT_SETTINGS.autoRefreshInterval;
        updated.timezone = DEFAULT_SETTINGS.timezone;
        updated.soundEffects = DEFAULT_SETTINGS.soundEffects;
        updated.fontSize = DEFAULT_SETTINGS.fontSize;
      } else if (category === 'notifications') {
        updated.popupDuration = DEFAULT_SETTINGS.popupDuration;
        updated.enablePopupNotifications = DEFAULT_SETTINGS.enablePopupNotifications;
        updated.notifyCycloneAlerts = DEFAULT_SETTINGS.notifyCycloneAlerts;
        updated.notifyPortCongestion = DEFAULT_SETTINGS.notifyPortCongestion;
        updated.notifyStockBufferBreach = DEFAULT_SETTINGS.notifyStockBufferBreach;
        updated.notifyFxFluctuations = DEFAULT_SETTINGS.notifyFxFluctuations;
        updated.notifyBunkerShocks = DEFAULT_SETTINGS.notifyBunkerShocks;
        updated.notifyRightShipVetting = DEFAULT_SETTINGS.notifyRightShipVetting;
      } else if (category === 'chartering') {
        updated.defaultVesselClass = DEFAULT_SETTINGS.defaultVesselClass;
        updated.maxVesselAge = DEFAULT_SETTINGS.maxVesselAge;
        updated.minRightShipStars = DEFAULT_SETTINGS.minRightShipStars;
        updated.laytimeCalculationRule = DEFAULT_SETTINGS.laytimeCalculationRule;
      } else if (category === 'port') {
        updated.defaultPortFilter = DEFAULT_SETTINGS.defaultPortFilter;
        updated.berthCongestionAlertThreshold = DEFAULT_SETTINGS.berthCongestionAlertThreshold;
        updated.minUnderKeelClearance = DEFAULT_SETTINGS.minUnderKeelClearance;
        updated.rakeEvacuationDailyTarget = DEFAULT_SETTINGS.rakeEvacuationDailyTarget;
      } else if (category === 'procurement') {
        updated.criticalStockThresholdDays = DEFAULT_SETTINGS.criticalStockThresholdDays;
        updated.defaultOriginCountry = DEFAULT_SETTINGS.defaultOriginCountry;
        updated.cokingCoalBenchmarkIndex = DEFAULT_SETTINGS.cokingCoalBenchmarkIndex;
        updated.targetCoaAllocationPct = DEFAULT_SETTINGS.targetCoaAllocationPct;
      } else if (category === 'analyst') {
        updated.defaultForecastHorizon = DEFAULT_SETTINGS.defaultForecastHorizon;
        updated.forecastConfidenceInterval = DEFAULT_SETTINGS.forecastConfidenceInterval;
        updated.enableSeasonalDrift = DEFAULT_SETTINGS.enableSeasonalDrift;
        updated.primaryForecastingModel = DEFAULT_SETTINGS.primaryForecastingModel;
      } else if (category === 'admin') {
        updated.auditLedgerRetentionDays = DEFAULT_SETTINGS.auditLedgerRetentionDays;
        updated.tokenRotationCadenceHours = DEFAULT_SETTINGS.tokenRotationCadenceHours;
        updated.delegatedAuthorityLimitInr = DEFAULT_SETTINGS.delegatedAuthorityLimitInr;
        updated.zeroTrustStrictIp = DEFAULT_SETTINGS.zeroTrustStrictIp;
      } else if (category === 'market') {
        updated.autoFetchFxRates = DEFAULT_SETTINGS.autoFetchFxRates;
        updated.bunkerBenchmarkPort = DEFAULT_SETTINGS.bunkerBenchmarkPort;
        updated.balticIndexWeights = DEFAULT_SETTINGS.balticIndexWeights;
        updated.fuelConsumptionModel = DEFAULT_SETTINGS.fuelConsumptionModel;
        updated.carbonTaxModel = DEFAULT_SETTINGS.carbonTaxModel;
        updated.demurrageCalculationRateUsd = DEFAULT_SETTINGS.demurrageCalculationRateUsd;
      } else if (category === 'export') {
        updated.exportPdfWatermark = DEFAULT_SETTINGS.exportPdfWatermark;
        updated.exportPdfSeal = DEFAULT_SETTINGS.exportPdfSeal;
        updated.exportOrientation = DEFAULT_SETTINGS.exportOrientation;
        updated.maskCounterpartyDetails = DEFAULT_SETTINGS.maskCounterpartyDetails;
        updated.enableDataLineageTracking = DEFAULT_SETTINGS.enableDataLineageTracking;
        updated.showTelemetryNoiseFilter = DEFAULT_SETTINGS.showTelemetryNoiseFilter;
      } else if (category === 'api') {
        updated.customApiBaseUrl = DEFAULT_SETTINGS.customApiBaseUrl;
        updated.customOpenRouterUrl = DEFAULT_SETTINGS.customOpenRouterUrl;
        updated.customOpenRouterKey = DEFAULT_SETTINGS.customOpenRouterKey;
        updated.customOpenRouterModel = DEFAULT_SETTINGS.customOpenRouterModel;
        updated.customAisWsUrl = DEFAULT_SETTINGS.customAisWsUrl;
        updated.customWeatherApiUrl = DEFAULT_SETTINGS.customWeatherApiUrl;
        updated.webhookAlertUrl = DEFAULT_SETTINGS.webhookAlertUrl;
      } else if (category === 'appearance') {
        updated.accentColor = DEFAULT_SETTINGS.accentColor;
        updated.glassmorphismBlur = DEFAULT_SETTINGS.glassmorphismBlur;
        updated.chartColorPalette = DEFAULT_SETTINGS.chartColorPalette;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      // Asynchronously synchronize with backend API
      settingsApi.update(updated).catch(() => {});

      return { settings: updated };
    }),

  resetAll: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }

    // Asynchronously synchronize with backend API
    settingsApi.reset().catch(() => {});

    set({ settings: DEFAULT_SETTINGS });
  }
}));

// Automatically trigger backend synchronization on initial startup
if (typeof window !== 'undefined') {
  useSettingsStore.getState().fetchBackendSettings().catch(() => {});
}
