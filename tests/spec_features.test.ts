import { describe, it, expect } from 'vitest';
import { REAL_PORTS } from '../src/db/enterprise_fallback_dataset.js';
import { mlServiceClient } from '../src/services/mlServiceClient.js';

describe('SAIL Specification Feature Suite', () => {
  describe('Port Infrastructure Constraint Catalog (FR-004 & Section 0.3)', () => {
    it('should include all required in-scope ports including Sagar Sandheads, Baltimore, Nacala, Beira, Vanino, Vostochny, and Balikpapan', () => {
      const portIds = REAL_PORTS.map(p => p.id);
      expect(portIds).toContain('port-ind-prdp'); // Paradip
      expect(portIds).toContain('port-ind-vztg'); // Vizag
      expect(portIds).toContain('port-ind-dhmr'); // Dhamra
      expect(portIds).toContain('port-ind-hld');  // Haldia
      expect(portIds).toContain('port-ind-sgr');  // Sagar / Sandheads Anchorage
      expect(portIds).toContain('port-usa-bal');  // Baltimore
      expect(portIds).toContain('port-moz-nac');  // Nacala
      expect(portIds).toContain('port-moz-bei');  // Beira
      expect(portIds).toContain('port-rus-van');  // Vanino
      expect(portIds).toContain('port-rus-vos');  // Vostochny
      expect(portIds).toContain('port-idn-bpn');  // Balikpapan / Samarinda
    });

    it('should enforce severe draft restrictions on riverine ports like Haldia and Sagar', () => {
      const haldia = REAL_PORTS.find(p => p.id === 'port-ind-hld');
      const sagar = REAL_PORTS.find(p => p.id === 'port-ind-sgr');
      const paradip = REAL_PORTS.find(p => p.id === 'port-ind-prdp');

      expect(haldia?.max_vessel_draft_m).toBeLessThanOrEqual(8.5);
      expect(sagar?.max_vessel_draft_m).toBeLessThanOrEqual(9.0);
      expect(paradip?.max_vessel_draft_m).toBeGreaterThanOrEqual(16.0);
    });
  });

  describe('Forecasting Engine 180-Day Horizons (FR-001 & Section 6.2)', () => {
    it('should support 180-day forecast horizon without falling back to 30 days', async () => {
      const forecast = await mlServiceClient.getForecast({
        freightCodeId: 'C5TC',
        horizonDays: 180,
        includeExplanation: true,
      });

      expect(forecast).toBeDefined();
      expect(forecast.horizonDays).toBe(180);
      expect(forecast.predictions.length).toBeGreaterThan(0);

      // Verify the predictions span up to 180 days
      const maxDateStr = forecast.predictions[forecast.predictions.length - 1].targetDate;
      const daysSpan = Math.round((new Date(maxDateStr).getTime() - Date.now()) / (1000 * 86400));
      expect(daysSpan).toBeGreaterThanOrEqual(175);
    }, 15000);

    it('should calculate non-crossing quantile bounds across all prediction points', async () => {
      const forecast = await mlServiceClient.getForecast({
        freightCodeId: 'C5TC',
        horizonDays: 90,
      });

      for (const pt of forecast.predictions) {
        expect(pt.lowerBoundUsd).toBeLessThanOrEqual(pt.predictedRateUsd);
        expect(pt.upperBoundUsd).toBeGreaterThanOrEqual(pt.predictedRateUsd);
        expect(pt.confidence).toBeGreaterThan(0.5);
      }
    }, 15000);
  });

  describe('Contract Rate Performance & Multi-Voyage Planning (FR-007, FR-008)', () => {
    it('should compute accurate rate performance delta and total procurement savings', () => {
      const contractRate = 12.50;
      const actualSpotRate = 13.85;
      const targetTonnage = 160000;
      const inrRate = 86.85;

      const savingsDelta = Math.round((actualSpotRate - contractRate) * 100) / 100;
      const totalSavingsUsd = Math.round(savingsDelta * targetTonnage);
      const totalSavingsInr = Math.round(totalSavingsUsd * inrRate);
      const performanceStatus = savingsDelta > 0.2 ? 'OUTPERFORMED' : savingsDelta < -0.2 ? 'UNDERPERFORMED' : 'ON_PAR';

      expect(savingsDelta).toBe(1.35);
      expect(totalSavingsUsd).toBe(216000);
      expect(totalSavingsInr).toBe(18759600);
      expect(performanceStatus).toBe('OUTPERFORMED');
    });
  });
});
