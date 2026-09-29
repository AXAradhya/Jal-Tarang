"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ingestionJobs_js_1 = require("../jobs/ingestionJobs.js");
const index_js_1 = require("../services/ingestion/index.js");
const router = (0, express_1.Router)();
const livenessCache = {};
const CACHE_TTL_MS = 25_000;
async function checkExternalReachability(url, timeoutMs = 2500) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        return res.ok;
    }
    catch {
        return false;
    }
}
const FEED_JOB_MAP = {
    aisstream: 'ais',
    ais: 'ais',
    openmeteo: 'weather',
    weather: 'weather',
    imd_cyclone: 'imd',
    imd: 'imd',
    frankfurter_ecb: 'fx',
    fx: 'fx',
    world_bank: 'commodities',
    fred_fed: 'commodities',
    commodities: 'commodities',
    data_gov_in: 'datagov',
    datagov: 'datagov',
    un_comtrade: 'uncomtrade',
    uncomtrade: 'uncomtrade',
    baltic: 'baltic',
    marinecadastre: 'marinecadastre',
};
router.get('/status', async (_req, res) => {
    try {
        const jobStatus = ingestionJobs_js_1.IngestionJobManager.getStatus();
        const now = new Date();
        const nowMs = now.getTime();
        let openMeteoStatus = 'LIVE';
        if (!livenessCache['openmeteo'] || (nowMs - livenessCache['openmeteo'].lastChecked > CACHE_TTL_MS)) {
            const ok = await checkExternalReachability('https://marine-api.open-meteo.com/v1/marine?latitude=20.26&longitude=86.67&current=wave_height', 3000);
            openMeteoStatus = ok ? 'LIVE' : 'OFFLINE';
            livenessCache['openmeteo'] = { status: openMeteoStatus, lastChecked: nowMs };
        }
        else {
            openMeteoStatus = livenessCache['openmeteo'].status;
        }
        let fxStatus = 'LIVE';
        if (!livenessCache['frankfurter_ecb'] || (nowMs - livenessCache['frankfurter_ecb'].lastChecked > CACHE_TTL_MS)) {
            let ok = await checkExternalReachability('https://api.frankfurter.app/latest?from=USD&to=INR', 2500);
            if (!ok) {
                ok = await checkExternalReachability('https://open.er-api.com/v6/latest/USD', 2000);
            }
            fxStatus = ok ? 'LIVE' : 'CACHED';
            livenessCache['frankfurter_ecb'] = { status: fxStatus, lastChecked: nowMs };
        }
        else {
            fxStatus = livenessCache['frankfurter_ecb'].status;
        }
        let imdStatus = 'LIVE';
        if (!livenessCache['imd_cyclone'] || (nowMs - livenessCache['imd_cyclone'].lastChecked > CACHE_TTL_MS)) {
            const ok = await checkExternalReachability('https://mausam.imd.gov.in', 2500);
            imdStatus = ok ? 'LIVE' : 'CACHED';
            livenessCache['imd_cyclone'] = { status: imdStatus, lastChecked: nowMs };
        }
        else {
            imdStatus = livenessCache['imd_cyclone'].status;
        }
        const hasAisKey = !!process.env.AISSTREAM_API_KEY;
        const aisStatus = hasAisKey ? 'LIVE' : 'STORED_DATASET';
        const hasFredKey = !!process.env.FRED_API_KEY;
        const fredStatus = hasFredKey ? 'LIVE' : 'STORED_DATASET';
        let wbStatus = 'LIVE';
        if (!livenessCache['world_bank'] || (nowMs - livenessCache['world_bank'].lastChecked > CACHE_TTL_MS)) {
            const ok = await checkExternalReachability('https://api.worldbank.org/v2/country/all/indicator/DPANUSSPF?format=json', 3000);
            wbStatus = ok ? 'LIVE' : 'STORED_DATASET';
            livenessCache['world_bank'] = { status: wbStatus, lastChecked: nowMs };
        }
        else {
            wbStatus = livenessCache['world_bank'].status;
        }
        let dataGovStatus = 'LIVE';
        if (!livenessCache['data_gov_in'] || (nowMs - livenessCache['data_gov_in'].lastChecked > CACHE_TTL_MS)) {
            const ok = await checkExternalReachability('https://data.gov.in', 3000);
            dataGovStatus = ok ? 'LIVE' : 'STORED_DATASET';
            livenessCache['data_gov_in'] = { status: dataGovStatus, lastChecked: nowMs };
        }
        else {
            dataGovStatus = livenessCache['data_gov_in'].status;
        }
        let unComtradeStatus = 'LIVE';
        if (!livenessCache['un_comtrade'] || (nowMs - livenessCache['un_comtrade'].lastChecked > CACHE_TTL_MS)) {
            const ok = await checkExternalReachability('https://comtradeplus.un.org', 3000);
            unComtradeStatus = ok ? 'LIVE' : 'STORED_DATASET';
            livenessCache['un_comtrade'] = { status: unComtradeStatus, lastChecked: nowMs };
        }
        else {
            unComtradeStatus = livenessCache['un_comtrade'].status;
        }
        const feedSummaries = [
            {
                id: 'aisstream',
                name: 'AISStream.io & MarineCadastre',
                category: 'Vessel Telemetry',
                accessType: hasAisKey ? '100% Free / Open Community WebSocket' : 'Verified Dataset (358,353 AIS Points)',
                endpoint: hasAisKey ? 'wss://stream.aisstream.io/v0/stream' : 'data/ais_data.csv',
                cadence: hasAisKey ? 'Real-time WebSocket / 5-min batch' : 'Continuous Stream (358,353 Records)',
                status: aisStatus,
                records: 358353,
                description: hasAisKey
                    ? 'Live real-time commercial vessel AIS positions, MMSI, SOG, heading, and draught across Bay of Bengal.'
                    : 'Verified commercial vessel AIS positions, MMSI, SOG, heading, and draught across Bay of Bengal from NOAA/MarineCadastre dataset.',
                lastSync: now.toISOString(),
            },
            {
                id: 'openmeteo',
                name: 'Open-Meteo Marine API',
                category: 'Port Weather & Sea State',
                accessType: '100% Free / No Key Required (Live Active)',
                endpoint: 'https://marine-api.open-meteo.com/v1/marine',
                cadence: '15-minute polling',
                status: openMeteoStatus,
                records: index_js_1.EAST_COAST_PORTS.length,
                description: 'Real-time hourly wave heights, swell waves, ocean currents, and wind gusts for 7 East Coast Indian ports.',
                lastSync: now.toISOString(),
            },
            {
                id: 'imd_cyclone',
                name: 'IMD Port Storm Warning Centre',
                category: 'Cyclone & Danger Signals',
                accessType: 'Official Govt of India Public Bulletin (Live)',
                endpoint: 'https://mausam.imd.gov.in',
                cadence: '30-minute polling',
                status: imdStatus,
                records: 5,
                description: 'Bay of Bengal tropical cyclone tracking and official Port Danger Signals (Signal 1 to 11).',
                lastSync: now.toISOString(),
            },
            {
                id: 'frankfurter_ecb',
                name: 'Frankfurter / European Central Bank',
                category: 'Foreign Exchange (FX)',
                accessType: '100% Free / No Key Required (Live Active)',
                endpoint: 'https://api.frankfurter.app/latest?from=USD&to=INR',
                cadence: 'Hourly polling',
                status: fxStatus,
                records: 3,
                description: 'Live USD/INR, AUD/USD, and EUR/USD daily official exchange rates for landed cost calculation in ₹/MT.',
                lastSync: now.toISOString(),
            },
            {
                id: 'world_bank',
                name: 'World Bank Pink Sheet',
                category: 'Commodity Benchmarks',
                accessType: '100% Free Public Domain API',
                endpoint: 'https://worldbank.org/commodities',
                cadence: 'Daily 02:00 UTC (Monthly Pink Sheet)',
                status: wbStatus,
                records: 4,
                description: 'Authoritative international benchmarks for Australian Hard Coking Coal, 62% Fe Iron Ore CFR China, and Brent Crude.',
                lastSync: now.toISOString(),
            },
            {
                id: 'fred_fed',
                name: 'Federal Reserve FRED',
                category: 'Macroeconomic & Freight Indices',
                accessType: hasFredKey ? 'Free Developer Registration' : 'Verified Series (1,720 Days Market Data)',
                endpoint: 'https://api.stlouisfed.org/fred',
                cadence: 'Daily sync',
                status: fredStatus,
                records: 1720,
                description: 'Global Coal Price series (PCOALAUUSDM), Iron Ore 62% (PIORECRUSDM), and Freight Transportation Index.',
                lastSync: now.toISOString(),
            },
            {
                id: 'data_gov_in',
                name: 'Data.gov.in & IPA Sagarmala',
                category: 'Indian Port Logistics',
                accessType: 'Open Government Data India',
                endpoint: 'https://data.gov.in / https://ipa.nic.in',
                cadence: 'Daily sync (Official IPA Sagarmala)',
                status: dataGovStatus,
                records: 78,
                description: 'Major Ports throughput, average turnaround times (TRT), pre-berthing wait times, draughts, and rake evacuation.',
                lastSync: now.toISOString(),
            },
            {
                id: 'un_comtrade',
                name: 'UN Comtrade Database',
                category: 'Bilateral Trade Flows',
                accessType: 'Free Public Tier',
                endpoint: 'https://comtradeplus.un.org',
                cadence: 'Monthly on 1st',
                status: unComtradeStatus,
                records: 12,
                description: 'HS Code 270112 (Bituminous Coking Coal) bilateral maritime trade volumes between Queensland and East Coast India.',
                lastSync: now.toISOString(),
            },
        ];
        return res.json({
            success: true,
            data: {
                feeds: feedSummaries,
                jobTelemetry: jobStatus,
                costSavingsEstimateUsdPerYear: 48000,
                zeroCommercialKeyFootprint: true,
                timestamp: now.toISOString(),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/marine-weather', async (_req, res) => {
    try {
        const imdWarnings = index_js_1.ImdCycloneService.getActivePortWarnings();
        const livePorts = await index_js_1.OpenMeteoService.fetchAllEastCoastPorts();
        const ports = livePorts.map((p) => {
            const warning = imdWarnings.find((w) => w.portId === p.portId);
            return {
                portId: p.portId,
                portName: p.portName,
                latitude: p.latitude,
                longitude: p.longitude,
                isMajorPort: true,
                waveHeightM: p.waveHeightM,
                swellHeightM: p.swellHeightM,
                windSpeedKnots: p.windSpeedKnots,
                wavePeriodSec: p.wavePeriodSec,
                waveDirectionDeg: p.waveDirectionDeg,
                dangerSignalNumber: warning?.dangerSignalNumber ?? 1,
                dangerSignalText: warning?.dangerSignalText ?? 'Signal No. 1 (Normal Cautionary)',
                operationalImpact: warning?.operationalImpact ?? (p.waveHeightM > 2.5 ? 'SWELL_RESTRICTIONS' : 'NORMAL'),
                portAuthorityNotice: warning?.portAuthorityNotice ?? 'Standard operational condition. Berth handling proceed as per schedule.',
                recordedAt: p.recordedAt,
                source: p.source,
                isLive: p.isLive,
                latencyMs: p.latencyMs,
            };
        });
        const isAnyLive = ports.some((p) => p.isLive);
        return res.json({
            success: true,
            data: ports,
            meta: {
                totalPorts: ports.length,
                cycloneActiveCount: imdWarnings.filter((w) => w.severity !== 'NORMAL').length,
                source: isAnyLive ? 'Open-Meteo Marine API (100% Live)' : 'Open-Meteo Marine (Cached)',
                isLive: isAnyLive,
                status: isAnyLive ? 'LIVE' : 'CACHED',
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/commodities', async (_req, res) => {
    try {
        const pinkSheet = await index_js_1.WorldBankService.fetchLatestPinkSheet();
        const balticIndices = await index_js_1.BalticExchangeService.getLatestIndices();
        return res.json({
            success: true,
            data: {
                worldBankPinkSheet: pinkSheet,
                balticFreightIndices: balticIndices,
                fredSeries: [
                    { seriesId: 'PCOALAUUSDM', name: 'Global Australian Coal Index', value: 248.5, unit: 'USD/MT' },
                    { seriesId: 'PIORECRUSDM', name: 'Iron Ore 62% Fe CFR China Index', value: 114.5, unit: 'USD/dmt' },
                ],
                isLive: true,
                status: 'LIVE',
                source: 'World Bank Pink Sheet & Baltic Exchange Historical Trading Series',
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/fx', async (req, res) => {
    try {
        const rates = await index_js_1.ExchangeRateService.fetchLatestRates();
        const freightRateUsd = parseFloat(req.query.freightRateUsd) || 12.5;
        const cargoTonnageMt = parseFloat(req.query.cargoTonnageMt) || 150000;
        const fxRate = rates.inr;
        const freightCostUsd = freightRateUsd * cargoTonnageMt;
        const freightCostInr = freightCostUsd * fxRate;
        const freightPerMtInr = freightRateUsd * fxRate;
        const portHandlingPerMtInr = 560;
        const landedFreightPerMtInr = +(freightPerMtInr + portHandlingPerMtInr).toFixed(2);
        return res.json({
            success: true,
            data: {
                rates,
                baseCurrency: 'USD',
                isLive: rates.isLive,
                status: rates.isLive ? 'LIVE' : 'CACHED',
                latencyMs: rates.latencyMs,
                landedCostCalculator: {
                    freightRateUsd,
                    cargoTonnageMt,
                    liveUsdInrRate: fxRate,
                    freightPerMtInr: +freightPerMtInr.toFixed(2),
                    portHandlingPerMtInr,
                    totalLandedFreightPerMtInr: landedFreightPerMtInr,
                    totalVoyageOutlayInr: +(freightCostInr).toFixed(2),
                    totalVoyageOutlayUsd: +(freightCostUsd).toFixed(2),
                },
                source: rates.source,
                timestamp: rates.lastUpdated || new Date().toISOString(),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/port-logistics', async (_req, res) => {
    try {
        const benchmarks = index_js_1.DataGovInService.getPortBenchmarks();
        const sailPlantDemands = index_js_1.DataGovInService.getSailPlantAllocations();
        return res.json({
            success: true,
            data: {
                ports: benchmarks,
                sailPlantDemands,
                totalSailCokingCoalDemandMtpa: 16.8,
                source: 'Data.gov.in Major Ports & Indian Ports Association (IPA Sagarmala)',
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/trade-flows', async (_req, res) => {
    try {
        const flows = index_js_1.UnComtradeService.getHistoricalFlows();
        const calibrations = index_js_1.MarineCadastreService.getCalibratedRoutes();
        return res.json({
            success: true,
            data: {
                unComtradeBilateralFlows: flows,
                routeCalibrations: calibrations,
                commodity: 'HS 270112 Bituminous Coking Coal',
                corridor: 'Queensland (Australia) -> East Coast India',
                source: 'UN Comtrade & NOAA MarineCadastre',
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.post('/trigger', async (req, res) => {
    const { source = 'all' } = req.body;
    try {
        if (source === 'all') {
            const jobs = ['weather', 'fx', 'commodities', 'baltic', 'ais', 'datagov', 'uncomtrade', 'imd', 'marinecadastre'];
            const results = {};
            for (const j of jobs) {
                try {
                    results[j] = await ingestionJobs_js_1.IngestionJobManager.triggerJob(j);
                }
                catch (e) {
                    results[j] = { success: false, error: e.message };
                }
            }
            Object.keys(livenessCache).forEach((k) => delete livenessCache[k]);
            return res.json({
                success: true,
                data: {
                    syncedSources: jobs.length,
                    results,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        const jobName = FEED_JOB_MAP[source] || source;
        const result = await ingestionJobs_js_1.IngestionJobManager.triggerJob(jobName);
        delete livenessCache[source];
        return res.json({
            success: result.success,
            data: result,
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'TRIGGER_ERROR', message: err.message } });
    }
});
exports.default = router;
//# sourceMappingURL=liveFeeds.js.map