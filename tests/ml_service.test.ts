import { describe, it, expect } from 'vitest';
import { mlServiceClient } from '../src/services/MlServiceClient.js';

describe('SAIL MARINEX — Python ML Microservice Integration Tests', () => {
  it('should verify ML Microservice health status', async () => {
    const health = await mlServiceClient.checkHealth();
    expect(health).toBeDefined();
    expect(health.status).toBe('HEALTHY');
    expect(health.isOnline).toBe(true);
    expect(health.loadedModels).toContain('c5tc');
    expect(health.loadedModels).toContain('c3tc');
    expect(health.loadedModels).toContain('p1a');
  });

  it('should generate multi-horizon freight rate forecast with uncertainty bounds', async () => {
    const forecast = await mlServiceClient.getForecast({
      freightCodeId: 'C5TC',
      horizonDays: 30,
      includeExplanation: true,
    });

    expect(forecast).toBeDefined();
    expect(forecast.freightCodeId).toBe('C5TC');
    expect(forecast.horizonDays).toBe(30);
    expect(forecast.predictions.length).toBeGreaterThanOrEqual(5);

    // Verify Baltic target MAPE compliance (< 4% for C5TC)
    expect(forecast.metrics.mape).toBeLessThanOrEqual(4.0);

    // Verify prediction points structure & monotonic bounds
    for (const pt of forecast.predictions) {
      expect(pt.predictedRateUsd).toBeGreaterThan(0);
      expect(pt.lowerBoundUsd).toBeLessThanOrEqual(pt.predictedRateUsd);
      expect(pt.upperBoundUsd).toBeGreaterThanOrEqual(pt.predictedRateUsd);
      expect(pt.confidence).toBeGreaterThan(0.7);
    }
  });

  it('should compute Tree SHAP feature attribution and directional drivers', async () => {
    const explanation = await mlServiceClient.getExplanation('C5TC');

    expect(explanation).toBeDefined();
    expect(explanation.freightCodeId).toBe('C5TC');
    expect(typeof explanation.baseValue).toBe('number');
    expect(typeof explanation.predictedRateUsd).toBe('number');
    expect(explanation.topPositiveDrivers.length).toBeGreaterThan(0);
    expect(explanation.shapValues).toHaveProperty('rate_lag_1d');
    expect(explanation.shapValues).toHaveProperty('bunker_vlsfo_singapore');
  });
});
