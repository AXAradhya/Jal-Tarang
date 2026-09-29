import { Router, Request, Response, NextFunction } from 'express';
import { mlServiceClient } from '../services/MlServiceClient.js';
import { query } from '../db/index.js';
import { config } from '../config/index.js';

const router = Router();

const verifyInternalAccess = (req: Request, res: Response, next: NextFunction): void => {
  const internalSecret = req.headers['x-internal-secret'];
  const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || config.jwt.secret;
  
  // Allow internal service if valid internal secret header OR loopback caller
  const clientIp = req.ip || req.socket.remoteAddress || '';
  const isLoopback = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.includes('127.0.0.1');

  if (internalSecret === expectedSecret || isLoopback) {
    next();
    return;
  }
  res.status(403).json({ success: false, error: 'Access denied: unauthorized internal service call' });
};

router.use(verifyInternalAccess);

/**
 * Feature Supplier for Python ML Service
 * GET /internal/api/v1/features/:freightCodeId?days=90
 */
router.get('/api/v1/features/:freightCodeId', async (req: Request, res: Response) => {
  try {
    const { freightCodeId } = req.params;
    const days = parseInt((req.query.days as string) || '90', 10);

    // Fetch from database or provide synthesized market feature state
    const dbFeatures = await query(
      `SELECT feature_name, feature_value 
       FROM ml_features 
       WHERE freight_code_id = $1::uuid OR freight_code_id = $1
       ORDER BY feature_date DESC LIMIT 50`,
      [freightCodeId]
    );

    const features: Record<string, number> = {};
    if (dbFeatures.rows && dbFeatures.rows.length > 0) {
      for (const row of dbFeatures.rows) {
        features[row.feature_name] = parseFloat(row.feature_value);
      }
    } else {
      // Default domain-aligned features for East Coast India routes
      features['bunker_vlsfo_singapore'] = 618.5;
      features['bunker_vlsfo_paradip'] = 642.0;
      features['bunker_price_change_7d'] = 8.5;
      features['ballast_vessel_count'] = 14.0;
      features['fleet_dwt_utilization'] = 0.89;
      features['port_wait_hours_paradip'] = 18.5;
      features['port_wait_hours_vizag'] = 12.0;
      features['berth_occupancy_ratio'] = 0.82;
      features['wave_height_bay_of_bengal'] = 2.4;
      features['cyclone_alert_index'] = 1.0;
      features['bdi_index'] = 1945.0;
      features['coking_coal_fob_australia'] = 252.0;
      features['china_steel_pmi'] = 50.8;
    }

    return res.json({
      success: true,
      freightCodeId,
      days,
      features,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ML Service Health
 * GET /internal/ml/health
 */
router.get('/ml/health', async (req: Request, res: Response) => {
  const health = await mlServiceClient.checkHealth();
  return res.json(health);
});

/**
 * ML Inference Forecast
 * POST /internal/ml/forecast
 */
router.post('/ml/forecast', async (req: Request, res: Response) => {
  try {
    const { freightCodeId, horizonDays, modelVersion, includeExplanation } = req.body;
    if (!freightCodeId) {
      return res.status(400).json({ success: false, error: 'freightCodeId is required' });
    }

    const forecast = await mlServiceClient.getForecast({
      freightCodeId,
      horizonDays: horizonDays || 30,
      modelVersion,
      includeExplanation: Boolean(includeExplanation),
    });

    return res.json(forecast);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * SHAP Explainability
 * POST /internal/ml/explain
 */
router.post('/ml/explain', async (req: Request, res: Response) => {
  try {
    const { freightCodeId, features } = req.body;
    if (!freightCodeId) {
      return res.status(400).json({ success: false, error: 'freightCodeId is required' });
    }

    const explanation = await mlServiceClient.getExplanation(freightCodeId, features);
    return res.json(explanation);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Retrain Model with Optuna
 * POST /internal/ml/train
 */
router.post('/ml/train', async (req: Request, res: Response) => {
  try {
    const { freightCodeId, modelType, useOptuna, optunaTrials, testSplitDays } = req.body;
    if (!freightCodeId) {
      return res.status(400).json({ success: false, error: 'freightCodeId is required' });
    }

    const trainResult = await mlServiceClient.trainModel({
      freightCodeId,
      modelType: modelType || 'ensemble',
      useOptuna: useOptuna !== false,
      optunaTrials: optunaTrials || 10,
      testSplitDays: testSplitDays || 60,
    });

    return res.json(trainResult);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
