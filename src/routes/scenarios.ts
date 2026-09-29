/**
 * JAL TARANG - Scenario Simulation Engine API
 * Stress-testing maritime procurement strategies against market disruptions without mutating production records.
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';
import Decimal from 'decimal.js';

const router = Router();

// GET /api/v1/scenarios - List simulation scenarios
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.email as created_by_email
       FROM scenarios s
       LEFT JOIN users u ON u.id = s.created_by
       ORDER BY s.created_at DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/v1/scenarios - Create new scenario definition
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { code, name, description, scenarioType, disruptionType, category, parameters: explicitParams, ...rest } = req.body;
  const scenCode = (code || `SCEN-${Date.now().toString().slice(-4)}`).toUpperCase();
  const scenName = name || 'Disruption Simulation Scenario';
  const scenType = (scenarioType || disruptionType || category || 'CUSTOM').toUpperCase();
  const mergedParams = explicitParams && Object.keys(explicitParams).length > 0 ? explicitParams : rest;

  try {
    const result = await pool.query(
      `INSERT INTO scenarios (code, name, description, scenario_type, parameters, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [scenCode, scenName, description || null, scenType, JSON.stringify(mergedParams || {}), (req as any).user?.id || null]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'CREATE_FAILED', message: err.message } });
  }
});

// GET /api/v1/scenarios/:id - Get scenario detail
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM scenarios WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Scenario not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/v1/scenarios/:id/run - Run simulation on baseline voyage
router.post('/:id/run', authenticateToken, async (req: Request, res: Response) => {
  const { cargoQuantityMt = 75000, baselineFreightRateUsd = 14.20, baselineBunkerUsd = 620, baselineExchangeRate = 95.88 } = req.body;
  if (Number(cargoQuantityMt) < 0 || Number(baselineFreightRateUsd) < 0 || Number(baselineBunkerUsd) < 0) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Simulation inputs cannot be negative' } });
  }

  try {
    const sRes = await pool.query(`SELECT * FROM scenarios WHERE id = $1`, [req.params.id]);
    if (sRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Scenario not found' } });
    }
    const scenario = sRes.rows[0];
    const params = typeof scenario.parameters === 'string' ? JSON.parse(scenario.parameters) : (scenario.parameters || {});

    // Multipliers & additive factors from custom parameters or intelligent defaults
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

    // Cost calculations
    const simFreightRate = new Decimal(baselineFreightRateUsd).times(freightMultiplier).plus(carbonTaxPerMt).toDecimalPlaces(2).toNumber();
    const simBunkerPrice = new Decimal(baselineBunkerUsd).times(bunkerMultiplier).toDecimalPlaces(2).toNumber();

    const demurrageCostUsd = new Decimal(delayDays).times(demurrageDailyRate).toNumber();
    const detourBunkerCostUsd = new Decimal(detourDays).times(simBunkerPrice * 0.035 * 30).toNumber(); // ~30 MT/day fuel consumption for Capesize
    const totalDelayCostUsd = demurrageCostUsd + detourBunkerCostUsd;

    const baselineTotalCostUsd = new Decimal(baselineFreightRateUsd).times(cargoQuantityMt).toNumber();
    const simulatedTotalCostUsd = new Decimal(simFreightRate).times(cargoQuantityMt).plus(totalDelayCostUsd).toNumber();
    const financialVarianceUsd = simulatedTotalCostUsd - baselineTotalCostUsd;

    const baselineTotalCostInr = baselineTotalCostUsd * baselineExchangeRate;
    const simulatedTotalCostInr = simulatedTotalCostUsd * simulatedExchangeRate;
    const financialVarianceInr = simulatedTotalCostInr - baselineTotalCostInr;

    // Tailored mitigation strategies based on active parameters
    const recommendations: string[] = [];
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
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SIMULATION_FAILED', message: err.message } });
  }
});

// POST /api/v1/scenarios/compare - Compare multiple disruption scenarios
router.post('/compare', authenticateToken, async (req: Request, res: Response) => {
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

// POST /api/v1/scenarios/sensitivity - Sensitivity matrix across speed and bunker price
router.post('/sensitivity', authenticateToken, async (req: Request, res: Response) => {
  const speeds = [11, 12, 13, 14];
  const bunkerPrices = [550, 600, 650, 700];
  const distance = 5200; // NM

  const matrix: any[] = [];
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

export default router;
