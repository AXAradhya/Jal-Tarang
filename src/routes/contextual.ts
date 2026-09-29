/**
 * JAL TARANG — AI Contextual Intelligence API (Feature G)
 *
 * Exposes real-time ambient suggestions, inline field predictions,
 * and on-page recommendation cards (<50ms latency target).
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ContextualSuggestionService, ContextualQueryParams } from '../services/contextual/ContextualSuggestionService.js';

const router = Router();

/**
 * GET /api/v1/contextual-suggestions
 * Generates screen-specific inline suggestions and recommendation cards
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { page, originPort, destinationPort, cargoQuantityMt, vesselClass, targetDate, currentRateUsdMt } = req.query;

    const params: ContextualQueryParams = {
      page: page as any,
      originPort: originPort as string,
      destinationPort: destinationPort as string,
      cargoQuantityMt: cargoQuantityMt ? Number(cargoQuantityMt) : undefined,
      vesselClass: vesselClass as string,
      targetDate: targetDate as string,
      currentRateUsdMt: currentRateUsdMt ? Number(currentRateUsdMt) : undefined,
    };

    const suggestions = ContextualSuggestionService.getSuggestions(params);
    return res.json({ success: true, data: suggestions });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'CONTEXTUAL_SUGGESTION_ERROR', message: err.message },
    });
  }
});

export default router;
