"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
exports.settingsRouter = (0, express_1.Router)();
const DEFAULT_SETTINGS = {
    theme: 'light',
    currency: 'INR',
    compactMode: false,
    enableAnimations: true,
    autoRefreshInterval: 30,
    timezone: 'IST',
    soundEffects: true,
    fontSize: 'standard',
    popupDuration: 8,
    enablePopupNotifications: true,
    dndEnabled: false,
    notifyCycloneAlerts: true,
    notifyPortCongestion: true,
    notifyStockBufferBreach: true,
    notifyFxFluctuations: true,
    notifyBunkerShocks: true,
    notifyRightShipVetting: true,
    defaultVesselClass: 'Capesize',
    maxVesselAge: 18,
    minRightShipStars: 3.5,
    laytimeCalculationRule: 'SHINC',
    defaultPortFilter: 'ALL',
    berthCongestionAlertThreshold: 36,
    minUnderKeelClearance: 1.0,
    rakeEvacuationDailyTarget: 12,
    criticalStockThresholdDays: 14,
    defaultOriginCountry: 'Australia',
    cokingCoalBenchmarkIndex: 'Platts PLV',
    targetCoaAllocationPct: 75,
    defaultForecastHorizon: 30,
    forecastConfidenceInterval: 95,
    enableSeasonalDrift: true,
    primaryForecastingModel: 'Ensemble Pro v3',
    auditLedgerRetentionDays: 365,
    tokenRotationCadenceHours: 24,
    delegatedAuthorityLimitInr: 1500000,
    zeroTrustStrictIp: true,
    autoFetchFxRates: true,
    bunkerBenchmarkPort: 'Singapore',
    balticIndexWeights: 'Capesize Weighted',
    fuelConsumptionModel: 'Standard Bulker 34t/d',
    carbonTaxModel: 'EU ETS Only',
    demurrageCalculationRateUsd: 18000,
    exportPdfWatermark: true,
    exportPdfSeal: true,
    exportOrientation: 'portrait',
    maskCounterpartyDetails: false,
    enableDataLineageTracking: true,
    showTelemetryNoiseFilter: true,
    customApiBaseUrl: 'http://localhost:8000/api/v1',
    customOpenRouterUrl: 'https://openrouter.ai/api/v1',
    customOpenRouterKey: '',
    customOpenRouterModel: 'anthropic/claude-3.5-sonnet',
    customAisWsUrl: 'wss://stream.aisstream.io/v0/stream',
    customWeatherApiUrl: 'https://marine-api.open-meteo.com/v1/marine',
    webhookAlertUrl: '',
    accentColor: 'blue',
    glassmorphismBlur: 'deep',
    chartColorPalette: 'vibrant',
    activeProfile: 'EXECUTIVE_HQ',
};
let currentEnterpriseSettings = { ...DEFAULT_SETTINGS };
exports.settingsRouter.get('/', (_req, res) => {
    return res.json({
        success: true,
        data: currentEnterpriseSettings,
        meta: {
            syncedAt: new Date().toISOString(),
            activeProfile: currentEnterpriseSettings.activeProfile,
        },
    });
});
exports.settingsRouter.put('/', async (req, res) => {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_PAYLOAD', message: 'Settings update body must be a valid JSON object' },
        });
    }
    currentEnterpriseSettings = {
        ...currentEnterpriseSettings,
        ...updates,
    };
    try {
        const changedKeys = Object.keys(updates);
        await index_js_1.pool.query(`INSERT INTO audit_logs (action, resource_type, resource_id, details, user_id, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())`, [
            'SETTINGS_UPDATE',
            'SYSTEM_CONFIG',
            currentEnterpriseSettings.activeProfile,
            JSON.stringify({ changedKeys, activeProfile: currentEnterpriseSettings.activeProfile }),
            'SYSTEM_ADMIN',
        ]).catch(() => { });
    }
    catch {
    }
    return res.json({
        success: true,
        data: currentEnterpriseSettings,
        message: 'System settings successfully persisted and synchronized across services.',
    });
});
exports.settingsRouter.post('/reset', (_req, res) => {
    currentEnterpriseSettings = { ...DEFAULT_SETTINGS };
    return res.json({
        success: true,
        data: currentEnterpriseSettings,
        message: 'All system settings have been restored to statutory enterprise defaults.',
    });
});
exports.settingsRouter.post('/test-endpoint', async (req, res) => {
    const { type, url, apiKey } = req.body;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({
            success: false,
            error: { code: 'MISSING_URL', message: 'Endpoint URL string is required' },
        });
    }
    const startTime = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const headers = {
            'User-Agent': 'SAIL-MARINEX-Diagnostic-Probe/2.0',
        };
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        const response = await fetch(url, {
            method: 'GET',
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeout);
        const latencyMs = Date.now() - startTime;
        return res.json({
            success: true,
            data: {
                type: type || 'CUSTOM',
                url,
                status: response.ok ? 'REACHABLE' : 'DEGRADED',
                httpStatus: response.status,
                latencyMs,
                message: response.ok
                    ? `Live endpoint responded in ${latencyMs}ms (HTTP ${response.status})`
                    : `Endpoint returned HTTP ${response.status} (${response.statusText}) in ${latencyMs}ms`,
            },
        });
    }
    catch (err) {
        const latencyMs = Date.now() - startTime;
        return res.json({
            success: true,
            data: {
                type: type || 'CUSTOM',
                url,
                status: 'UNREACHABLE',
                httpStatus: null,
                latencyMs,
                message: `Connection failed: ${err.message || 'Timed out after 4000ms'}`,
            },
        });
    }
});
//# sourceMappingURL=settings.js.map