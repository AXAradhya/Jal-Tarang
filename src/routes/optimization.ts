/**
 * JAL TARANG — Quantitative Optimization & Simulation API
 *
 * Exposes endpoints for:
 *   - 10,000-path Monte Carlo Spot vs. COA freight simulation
 *   - Modern Portfolio Theory (Markowitz) mean-variance allocation and Efficient Frontier
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { MonteCarloService, MonteCarloSimulationInput } from '../services/simulation/MonteCarloService.js';
import { MarkowitzService, MarkowitzOptimizationInput } from '../services/optimization/MarkowitzService.js';

const router = Router();

/**
 * POST /api/v1/optimization/monte-carlo
 * Executes 10,000-path stochastic simulation of spot vs COA economics
 */
router.post('/monte-carlo', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      currentSpotRateUsdPerMt,
      cargoQuantityMt,
      tenorMonths,
      annualizedVolatility,
      numSimulations,
      usdToInrRate,
      fixedCoaRateDiscountPct,
    } = req.body;

    const input: MonteCarloSimulationInput = {
      currentSpotRateUsdPerMt: Number(currentSpotRateUsdPerMt) || 15.50,
      cargoQuantityMt: Number(cargoQuantityMt) || 120000,
      tenorMonths: tenorMonths ? (Number(tenorMonths) as 3 | 6 | 12) : 6,
      annualizedVolatility: annualizedVolatility ? Number(annualizedVolatility) : undefined,
      numSimulations: numSimulations ? Number(numSimulations) : 10000,
      usdToInrRate: usdToInrRate ? Number(usdToInrRate) : undefined,
      fixedCoaRateDiscountPct: fixedCoaRateDiscountPct !== undefined ? Number(fixedCoaRateDiscountPct) : undefined,
    };

    const result = MonteCarloService.simulate(input);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'MONTE_CARLO_SIMULATION_ERROR', message: err.message },
    });
  }
});

/**
 * POST /api/v1/optimization/markowitz
 * Solves Modern Portfolio Theory efficient frontier for quarterly spot/COA volume allocation
 */
router.post('/markowitz', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      spotExpectedRateUsdMt,
      spotRateVariance,
      coaExpectedRateUsdMt,
      coaRateVariance,
      correlationSpotCoa,
      totalQuarterlyVolumeMt,
      riskAversionFactor,
      frontierPointsCount,
    } = req.body;

    const input: MarkowitzOptimizationInput = {
      spotExpectedRateUsdMt: Number(spotExpectedRateUsdMt) || 15.50,
      spotRateVariance: Number(spotRateVariance) || Math.pow(15.50 * 0.28, 2),
      coaExpectedRateUsdMt: Number(coaExpectedRateUsdMt) || 14.00,
      coaRateVariance: coaRateVariance !== undefined ? Number(coaRateVariance) : undefined,
      correlationSpotCoa: correlationSpotCoa !== undefined ? Number(correlationSpotCoa) : undefined,
      totalQuarterlyVolumeMt: Number(totalQuarterlyVolumeMt) || 2100000,
      riskAversionFactor: riskAversionFactor !== undefined ? Number(riskAversionFactor) : 0.50,
      frontierPointsCount: frontierPointsCount ? Number(frontierPointsCount) : 21,
    };

    const result = MarkowitzService.optimize(input);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'MARKOWITZ_OPTIMIZATION_ERROR', message: err.message },
    });
  }
});

/**
 * GET /api/v1/optimization/benchmarks
 * Returns standard quarterly benchmarks for SAIL procurement routes
 */
router.get('/benchmarks', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const mcBenchmark = MonteCarloService.simulate({
      currentSpotRateUsdPerMt: 15.50,
      cargoQuantityMt: 2100000, // Q3 Australian coal volume
      tenorMonths: 6,
    });

    const mkwBenchmark = MarkowitzService.optimize({
      spotExpectedRateUsdMt: 15.50,
      spotRateVariance: Math.pow(15.50 * 0.28, 2),
      coaExpectedRateUsdMt: 14.00,
      totalQuarterlyVolumeMt: 2100000,
      riskAversionFactor: 0.50,
    });

    return res.json({
      success: true,
      data: {
        monteCarlo: mcBenchmark,
        markowitz: mkwBenchmark,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'BENCHMARK_ERROR', message: err.message },
    });
  }
});

export default router;
