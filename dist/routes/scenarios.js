"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const decimal_js_1 = __importDefault(require("decimal.js"));
const router = (0, express_1.Router)();
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT s.*, u.email as created_by_email
       FROM scenarios s
       LEFT JOIN users u ON u.id = s.created_by
       ORDER BY s.created_at DESC`);
        return res.json({ success: true, data: result.rows });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});
router.post('/', auth_js_1.authenticateToken, async (req, res) => {
    const { code, name, description, scenarioType, disruptionType, category, parameters: explicitParams, ...rest } = req.body;
    const scenCode = (code || `SCEN-${Date.now().toString().slice(-4)}`).toUpperCase();
    const scenName = name || 'Disruption Simulation Scenario';
    const scenType = (scenarioType || disruptionType || category || 'CUSTOM').toUpperCase();
    const mergedParams = explicitParams && Object.keys(explicitParams).length > 0 ? explicitParams : rest;
    try {
        const result = await index_js_1.pool.query(`INSERT INTO scenarios (code, name, description, scenario_type, parameters, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [scenCode, scenName, description || null, scenType, JSON.stringify(mergedParams || {}), req.user?.id || null]);
        return res.status(201).json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'CREATE_FAILED', message: err.message } });
    }
});
router.get('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT * FROM scenarios WHERE id = $1`, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Scenario not found' } });
        }
        return res.json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});
router.post('/:id/run', auth_js_1.authenticateToken, async (req, res) => {
    const { cargoQuantityMt = 75000, baselineFreightRateUsd = 14.20, baselineBunkerUsd = 620, baselineExchangeRate = 95.88 } = req.body;
    if (Number(cargoQuantityMt) < 0 || Number(baselineFreightRateUsd) < 0 || Number(baselineBunkerUsd) < 0) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Simulation inputs cannot be negative' } });
    }
    try {
        const sRes = await index_js_1.pool.query(`SELECT * FROM scenarios WHERE id = $1`, [req.params.id]);
        if (sRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Scenario not found' } });
        }
        const scenario = sRes.rows[0];
        const params = typeof scenario.parameters === 'string' ? JSON.parse(scenario.parameters) : (scenario.parameters || {});
        const fuelShockPct = parseFloat(params.fuelShockPct ?? (params.bunkerMultiplier ? (params.bunkerMultiplier - 1) * 100 : (scenario.scenario_type === 'FUEL_SPIKE' ? 25 : 0)));
        const bunkerMultiplier = 1 + (fuelShockPct / 100);
        const freightShockPct = parseFloat(params.freightShockPct ?? (params.freightMultiplier ? (params.freightMultiplier - 1) * 100 : (scenario.scenario_type === 'FREIGHT_SURGE' ? 30 : scenario.scenario_type === 'RATE_VOLATILITY' ? 20 : 0)));
        const freightMultiplier = 1 + (freightShockPct / 100);
        const delayDays = parseInt(params.congestionDelayDays ?? (scenario.scenario_type === 'HIGH_CONGESTION' || scenario.scenario_type === 'PORT_CONGESTION' ? 6 : scenario.scenario_type === 'WEATHER_CYCLONE' ? 5 : 0));
        const detourDays = parseInt(params.detourDays ?? (scenario.scenario_type === 'CANAL_CLOSURE' ? 14 : 0));
        const totalExtraDays = delayDays + detourDays;
        const demurrageDailyRate = parseFloat(params.demurrageDailyRateUsd ?? 18500);
        const carbonTaxPerMt = parseFloat(params.carbonTaxPerMt ?? (scenario.scenario_type === 'CARBON_TAX' ? 8.50 : 0));
        const fxShockPct = parseFloat(params.exchangeRateShockPct ?? (scenario.scenario_type === 'CURRENCY_SHOCK' ? 10 : 0));
        const simulatedExchangeRate = baselineExchangeRate * (1 + fxShockPct / 100);
        const simFreightRate = new decimal_js_1.default(baselineFreightRateUsd).times(freightMultiplier).plus(carbonTaxPerMt).toDecimalPlaces(2).toNumber();
        const simBunkerPrice = new decimal_js_1.default(baselineBunkerUsd).times(bunkerMultiplier).toDecimalPlaces(2).toNumber();
        const demurrageCostUsd = new decimal_js_1.default(delayDays).times(demurrageDailyRate).toNumber();
        const detourBunkerCostUsd = new decimal_js_1.default(detourDays).times(simBunkerPrice * 0.035 * 30).toNumber();
        const totalDelayCostUsd = demurrageCostUsd + detourBunkerCostUsd;
        const baselineTotalCostUsd = new decimal_js_1.default(baselineFreightRateUsd).times(cargoQuantityMt).toNumber();
        const simulatedTotalCostUsd = new decimal_js_1.default(simFreightRate).times(cargoQuantityMt).plus(totalDelayCostUsd).toNumber();
        const financialVarianceUsd = simulatedTotalCostUsd - baselineTotalCostUsd;
        const baselineTotalCostInr = baselineTotalCostUsd * baselineExchangeRate;
        const simulatedTotalCostInr = simulatedTotalCostUsd * simulatedExchangeRate;
        const financialVarianceInr = simulatedTotalCostInr - baselineTotalCostInr;
        const recommendations = [];
        if (delayDays > 3) {
            recommendations.push(`Divert upcoming shipment to secondary terminal (e.g. Dhamra Port) to save estimated $${Math.round(demurrageCostUsd * 0.6).toLocaleString()} in demurrage.`);
        }
        if (fuelShockPct > 15) {
            recommendations.push(`Execute bunker financial swap at Singapore Platts benchmark to cap fuel exposure at $${Math.round(simBunkerPrice * 0.95)}/MT.`);
        }
        if (detourDays > 0) {
            recommendations.push(`Cape of Good Hope rerouting adds ${detourDays} days: secure buffer stockpiles at Bokaro & Bhilai via Sagarmala railway rakes.`);
        }
        if (freightShockPct > 15) {
            recommendations.push(`Forward curve backwardation detected: accelerate long-term 3-year COA tender before spot rally steepens.`);
        }
        if (fxShockPct > 5) {
            recommendations.push(`Hedge currency exposure: book forward foreign exchange contract at ₹${baselineExchangeRate.toFixed(2)} with State Bank of India.`);
        }
        if (recommendations.length === 0) {
            recommendations.push('Voyage parameters within normal tolerance: maintain standard laytime and spot monitoring protocol.');
        }
        return res.json({
            success: true,
            data: {
                scenarioId: scenario.id,
                scenarioCode: scenario.code,
                scenarioType: scenario.scenario_type,
                simulationInputs: {
                    cargoQuantityMt,
                    baselineFreightRateUsd,
                    baselineBunkerUsd,
                    baselineExchangeRate,
                },
                impactMetrics: {
                    adjustedFreightRateUsd: simFreightRate,
                    adjustedBunkerPriceUsd: simBunkerPrice,
                    simulatedExchangeRate: parseFloat(simulatedExchangeRate.toFixed(2)),
                    additionalWaitingDays: delayDays,
                    additionalTransitDays: detourDays,
                    totalExtraDays,
                    demurrageIncurredUsd: demurrageCostUsd,
                    detourCostUsd: detourBunkerCostUsd,
                    carbonTaxSurchargeUsd: Math.round(carbonTaxPerMt * cargoQuantityMt),
                    baselineTotalVoyageCostUsd: baselineTotalCostUsd,
                    simulatedTotalVoyageCostUsd: simulatedTotalCostUsd,
                    financialExposureVarianceUsd: financialVarianceUsd,
                    baselineTotalVoyageCostInr: baselineTotalCostInr,
                    simulatedTotalVoyageCostInr: simulatedTotalCostInr,
                    financialExposureVarianceInr: financialVarianceInr,
                    costIncreasePercentage: baselineTotalCostUsd > 0 ? Math.round(((simulatedTotalCostUsd - baselineTotalCostUsd) / baselineTotalCostUsd) * 1000) / 10 : 0
                },
                mitigationRecommendations: recommendations,
                simulatedAt: new Date().toISOString()
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SIMULATION_FAILED', message: err.message } });
    }
});
router.post('/compare', auth_js_1.authenticateToken, async (req, res) => {
    const { cargoQuantityMt = 75000, baselineRateUsd = 14.50 } = req.body;
    const scenarios = [
        { type: 'BASE_CASE', name: 'Standard Operation', rate: baselineRateUsd, delay: 0, costDelta: 0 },
        { type: 'FUEL_SPIKE', name: 'Global Bunker +30%', rate: baselineRateUsd * 1.22, delay: 0, costDelta: Math.round(cargoQuantityMt * baselineRateUsd * 0.22) },
        { type: 'HIGH_CONGESTION', name: 'East Coast Cyclone Delay (5 days)', rate: baselineRateUsd, delay: 5, costDelta: 5 * 15000 },
        { type: 'SUPPLY_SHOCK', name: 'Capesize Regional Shortage', rate: baselineRateUsd * 1.35, delay: 2, costDelta: Math.round(cargoQuantityMt * baselineRateUsd * 0.35 + (2 * 15000)) }
    ];
    return res.json({
        success: true,
        data: {
            cargoQuantityMt,
            baselineRateUsd,
            scenariosComparison: scenarios
        }
    });
});
router.post('/sensitivity', auth_js_1.authenticateToken, async (req, res) => {
    const speeds = [11, 12, 13, 14];
    const bunkerPrices = [550, 600, 650, 700];
    const distance = 5200;
    const matrix = [];
    speeds.forEach(spd => {
        bunkerPrices.forEach(bp => {
            const days = distance / (spd * 24);
            const tonsPerDay = 20 + Math.pow(spd / 12, 3) * 8;
            const fuelCost = days * tonsPerDay * bp;
            matrix.push({
                speedKnots: spd,
                bunkerPriceUsd: bp,
                sailingDays: Math.round(days * 10) / 10,
                fuelConsumptionMt: Math.round(days * tonsPerDay),
                totalFuelCostUsd: Math.round(fuelCost)
            });
        });
    });
    return res.json({ success: true, data: matrix });
});
exports.default = router;
//# sourceMappingURL=scenarios.js.map