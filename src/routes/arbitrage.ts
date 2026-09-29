/**
 * JAL TARANG — Multi-Modal Discharge Arbitrage API
 *
 * Exposes endpoints for calculating least-cost coking coal discharge options:
 *   - Option A: Two Supramax vessels direct to Haldia
 *   - Option B: One Capesize split discharge (Dhamra + Sagar-Sandheads lighterage)
 *   - Option C: Full Capesize to Dhamra + Indian Railways FOIS rake transit
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ArbitrageEngine, ArbitrageInput } from '../services/arbitrage/ArbitrageEngine.js';

const router = Router();

/**
 * POST /api/v1/arbitrage/evaluate
 * Computes multi-modal landed cost across the three discharge scenarios
 */
router.post('/evaluate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      cargoQuantityMt,
      destinationPlant,
      originPort,
      capesizeOceanFreightUsdMt,
      supramaxOceanFreightUsdMt,
      sandheadsLighteringRateUsdMt,
      foisRailRakeAvailabilityPct,
      haldiaStockyardFillPct,
      usdToInrRate,
    } = req.body;

    const input: ArbitrageInput = {
      cargoQuantityMt: Number(cargoQuantityMt) || 120000,
      destinationPlant: (destinationPlant || 'DURGAPUR').toUpperCase(),
      originPort: originPort || 'Hay Point, Australia',
      capesizeOceanFreightUsdMt: capesizeOceanFreightUsdMt ? Number(capesizeOceanFreightUsdMt) : undefined,
      supramaxOceanFreightUsdMt: supramaxOceanFreightUsdMt ? Number(supramaxOceanFreightUsdMt) : undefined,
      sandheadsLighteringRateUsdMt: sandheadsLighteringRateUsdMt ? Number(sandheadsLighteringRateUsdMt) : undefined,
      foisRailRakeAvailabilityPct: foisRailRakeAvailabilityPct ? Number(foisRailRakeAvailabilityPct) : undefined,
      haldiaStockyardFillPct: haldiaStockyardFillPct ? Number(haldiaStockyardFillPct) : undefined,
      usdToInrRate: usdToInrRate ? Number(usdToInrRate) : undefined,
    };

    const result = ArbitrageEngine.evaluate(input);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'ARBITRAGE_EVALUATION_ERROR', message: err.message },
    });
  }
});

/**
 * GET /api/v1/arbitrage/rail-rates
 * Returns Indian Railways FOIS benchmark rake tariffs to SAIL plants
 */
router.get('/rail-rates', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const rates = {
      DURGAPUR: { fromDhamraInrMt: 1280, fromHaldiaInrMt: 690, fromParadipInrMt: 1350 },
      BOKARO:   { fromDhamraInrMt: 1320, fromHaldiaInrMt: 880, fromParadipInrMt: 1410 },
      ROURKELA: { fromDhamraInrMt: 940,  fromHaldiaInrMt: 980, fromParadipInrMt: 820 },
      IISCO:    { fromDhamraInrMt: 1310, fromHaldiaInrMt: 730, fromParadipInrMt: 1380 },
      BHILAI:   { fromDhamraInrMt: 1490, fromHaldiaInrMt: 1540, fromParadipInrMt: 1290 },
    };
    return res.json({ success: true, data: rates });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: err.message },
    });
  }
});

/**
 * GET /api/v1/arbitrage/summary
 * Quick baseline comparison for standard 120,000 MT Capesize cargo to Durgapur
 */
router.get('/summary', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const defaultResult = ArbitrageEngine.evaluate({
      cargoQuantityMt: 120000,
      destinationPlant: 'DURGAPUR',
    });
    return res.json({ success: true, data: defaultResult });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
});

export default router;
