import { describe, it, expect } from 'vitest';
import { MonteCarloService } from '../src/services/simulation/MonteCarloService.js';
import { MarkowitzService } from '../src/services/optimization/MarkowitzService.js';
import { ArbitrageEngine } from '../src/services/arbitrage/ArbitrageEngine.js';
import { TidalDraftService } from '../src/services/ports/TidalDraftService.js';
import { BackhaulMatcherService } from '../src/services/chartering/BackhaulMatcherService.js';
import { ContextualSuggestionService } from '../src/services/contextual/ContextualSuggestionService.js';

describe('SAGAR DRISHTI Advanced AI Engines (SIH PS ID 26006)', () => {
  // 1. Monte Carlo Spot vs COA Simulator
  describe('Monte Carlo Spot vs COA Simulator (10,000 Paths)', () => {
    it('should simulate 10,000 stochastic paths and produce statistically sound distribution metrics', async () => {
      const res = await MonteCarloService.simulate({
        currentSpotRateUsdPerMt: 14.85,
        cargoQuantityMt: 75000,
        tenorMonths: 12,
        annualizedVolatility: 0.28,
        numSimulations: 10000,
        usdToInrRate: 83.50,
      });

      expect(res).toBeDefined();
      expect(res.numSimulations).toBe(10000);
      expect(res.tenorMonths).toBe(12);
      expect(res.currentSpotRateUsdPerMt).toBe(14.85);
      expect(res.recommendedCoaRateUsdPerMt).toBeLessThan(14.85); // Tenor discount applied
      expect(res.expectedSpotExpenditureUsd).toBeGreaterThan(0);
      expect(res.valueAtRisk95Usd).toBeGreaterThan(0);
      expect(res.probabilityCoaOutperformsSpotPct).toBeGreaterThanOrEqual(0);
      expect(res.percentilesUsd.p95).toBeGreaterThan(0);
    });
  });

  // 2. Markowitz Modern Portfolio Theory Optimizer
  describe('Markowitz Mean-Variance Portfolio Optimizer', () => {
    it('should calculate an efficient frontier allocating volume between COA and Spot', () => {
      const res = MarkowitzService.optimize({
        spotExpectedRateUsdMt: 15.20,
        spotRateVariance: 5.8,
        coaExpectedRateUsdMt: 13.90,
        totalQuarterlyVolumeMt: 2100000,
        riskAversionFactor: 0.5,
      });

      expect(res).toBeDefined();
      expect(res.optimalCoaPct).toBeGreaterThanOrEqual(40);
      expect(res.optimalCoaPct).toBeLessThanOrEqual(95);
      expect(res.optimalSpotPct).toBe(100 - res.optimalCoaPct);
      expect(res.efficientFrontier.length).toBeGreaterThan(0);
      expect(res.totalFreightBudgetUsd).toBeGreaterThan(0);
    });
  });

  // 3. Haldia–Dhamra Multi-Modal Arbitrage Engine
  describe('Haldia Sandheads Lighterage vs. Dhamra Rail Arbitrage Engine', () => {
    it('should compute landed costs across Option A, B, and C and demonstrate Dhamra cost advantage', async () => {
      const res = await ArbitrageEngine.evaluate({
        cargoQuantityMt: 120000,
        destinationPlant: 'DURGAPUR',
        capesizeOceanFreightUsdMt: 14.85,
        supramaxOceanFreightUsdMt: 22.10,
        sandheadsLighteringRateUsdMt: 3.20,
        foisRailRakeAvailabilityPct: 85,
      });

      expect(res).toBeDefined();
      expect(res.options.length).toBe(3);
      expect(res.recommendedOptionId).toBeDefined();
      expect(res.savingsPerTonneInr).toBeGreaterThan(0);
      expect(res.decisionSummary).toContain('Dhamra');
    });
  });

  // 4. Hooghly River Hydrodynamic Tidal Draft Predictor
  describe('Hooghly River Tidal Draft Predictor', () => {
    it('should forecast 14 daily tidal windows and identify spring tide windows for Haldia entry', () => {
      const res = TidalDraftService.predict({
        targetArrivalDate: '2026-10-15',
        vesselDraftM: 9.2,
        cargoQuantityMt: 55000,
      });

      expect(res).toBeDefined();
      expect(res.dailyWindows.length).toBe(14);
      expect(res.recommendedLaycanDate).toBeDefined();
      expect(res.pilotageAdvisory).toBeDefined();
      expect(res.dailyWindows[0].governingBar).toBeDefined();
    });
  });

  // 5. Dynamic Triangulated Backhaul Matcher
  describe('Triangulated Backhaul Matcher (PS Clause c)', () => {
    it('should pair returning bulk carriers at Paradip with Indian bulk export parcels', () => {
      const res = BackhaulMatcherService.match({
        dischargePort: 'Paradip',
        vesselClass: 'PANAMAX',
        ballastAvailableDate: '2026-10-20',
        intendedOriginRegion: 'AUSTRALIA',
      });

      expect(res).toBeDefined();
      expect(res.unhedgedBallastLeg.ballastDistanceNm).toBe(4200);
      expect(res.matchedOpportunities.length).toBeGreaterThan(0);
      expect(res.topRecommendation).not.toBeNull();
      expect(res.topRecommendation?.freightCreditOffsetUsdMt).toBeGreaterThan(0);
      expect(res.topRecommendation?.ballastDistanceSavedNm).toBeGreaterThan(0);
    });
  });

  // 6. Contextual Suggestion Layer
  describe('Contextual Suggestion Layer', () => {
    it('should generate proactive suggestions and smart alerts for the chartering page', () => {
      const res = ContextualSuggestionService.getSuggestions({
        page: 'chartering',
      });

      expect(res).toBeDefined();
      expect(res.inlineFieldSuggestions.length).toBeGreaterThan(0);
      expect(res.smartBanners.length).toBeGreaterThan(0);
      expect(res.smartBanners[0].title).toBeDefined();
    });
  });
});
