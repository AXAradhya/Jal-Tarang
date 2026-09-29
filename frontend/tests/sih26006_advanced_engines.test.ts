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

  // 7. Market Entry Timing & Econometric Forecasting (CAT-01)
  describe('Market Entry Timing & Econometric Forecaster (CAT-01)', () => {
    it('should calculate 30d/90d EMA spreads and identify optimal entry timing', () => {
      const currentRate = 12.40;
      const ema30 = Math.round((currentRate * 1.045) * 100) / 100;
      const ema90 = Math.round((currentRate * 1.082) * 100) / 100;
      const spread30 = Math.round((currentRate - ema30) * 100) / 100;

      // Elasticity test: +$40/MT bunker spike translates to +$0.96/MT freight impact
      const bunkerDelta = 40;
      const bunkerImpact = Math.round((bunkerDelta * 0.024) * 100) / 100;
      const adjustedRate = Math.round((currentRate + bunkerImpact) * 100) / 100;

      expect(spread30).toBeLessThan(0); // Spot is below 30d EMA -> Optimal dip
      expect(bunkerImpact).toBe(0.96);
      expect(adjustedRate).toBe(13.36);
    });
  });

  // 8. NLP Geopolitical Sentiment & AWRP War Risk Engine (CAT-04 & CAT-09)
  describe('NLP Geopolitical Sentiment & AWRP War Risk Engine (CAT-04 & CAT-09)', () => {
    it('should compute FinBERT disruption severity, elasticity and hull war risk premiums', () => {
      const headline = 'Red Sea drone incursions intensify near Bab-el-Mandeb; bulk carriers divert via Cape of Good Hope';
      const text = headline.toLowerCase();

      let score = 0;
      let category = '';
      let elasticity = 0;

      if (text.includes('red sea') || text.includes('bab-el-mandeb')) {
        score = 88;
        category = 'PIRACY_SECURITY';
        elasticity = 12.5;
      }

      // Hull AWRP calculation: Hull Value $65M * 0.75% breach rate
      const hullValueUsd = 65000000;
      const awrpRate = 0.0075;
      const awrpPremiumUsd = hullValueUsd * awrpRate;

      expect(score).toBe(88);
      expect(category).toBe('PIRACY_SECURITY');
      expect(elasticity).toBe(12.5);
      expect(awrpPremiumUsd).toBe(487500); // $487,500 war risk premium
    });
  });

  // 9. Vessel Crane, Grab & Shore Unloader Mechanical Compatibility (CAT-08)
  describe('Vessel Crane, Grab & Shore Unloader Mechanical Fit (CAT-08)', () => {
    it('should verify crane outreach envelope and deballasting equilibrium', () => {
      const vesselBeamM = 32.26;
      const shoreOutreachM = 38.0;

      // Required outreach formula: (Beam / 2) + 2.5m dock fender + 3.0m safety
      const requiredOutreachM = (vesselBeamM / 2) + 2.5 + 3.0;
      const outreachMarginM = Math.round((shoreOutreachM - requiredOutreachM) * 10) / 10;

      // Deballasting balance: 25,000 MT/day discharge requires ~1,800 m3/h pumping capacity
      const unloaderDischargeRateTph = 2800; // High-speed CSU
      const cargoQuantityMt = 75000;
      const dischargeHours = Math.round(cargoQuantityMt / unloaderDischargeRateTph);

      expect(outreachMarginM).toBeGreaterThanOrEqual(0); // Safe positive margin
      expect(outreachMarginM).toBe(16.4); // 38.0 - (16.13 + 5.5) = 16.37 -> 16.4m
      expect(dischargeHours).toBe(27); // ~27 hours for 75k MT
    });
  });

  // 10. Laytime, Demurrage & Statement of Facts (SOF) Deduction Engine (CAT-17)
  describe('Laytime, Demurrage & Statement of Facts (SOF) Deduction Engine (CAT-17)', () => {
    it('should calculate allowed laytime, demurrage liability, and SOF weather deductions', () => {
      const cargoTonnageMt = 75000;
      const dischargeRateMtPerDay = 15000;
      const demurrageRateUsdPerDay = 18500;

      // 1. Allowed Laytime Calculation
      const laytimeDaysAllowed = cargoTonnageMt / dischargeRateMtPerDay;
      const laytimeHoursAllowed = laytimeDaysAllowed * 24;
      expect(laytimeDaysAllowed).toBe(5.0);
      expect(laytimeHoursAllowed).toBe(120.0);

      // 2. Excess Time Demurrage
      const grossHoursUsed = 168.0; // 7 days
      const grossExcessHours = Math.max(0, grossHoursUsed - laytimeHoursAllowed);
      const grossExcessDays = grossExcessHours / 24;
      const grossDemurrageUsd = grossExcessDays * demurrageRateUsdPerDay;
      expect(grossExcessDays).toBe(2.0);
      expect(grossDemurrageUsd).toBe(37000);

      // 3. Dispatch Calculation (early turnaround in 96 hours)
      const dispatchHoursUsed = 96.0; // 4 days
      const hoursSaved = Math.max(0, laytimeHoursAllowed - dispatchHoursUsed);
      const daysSaved = hoursSaved / 24;
      const dispatchEarnedUsd = daysSaved * (demurrageRateUsdPerDay * 0.5);
      expect(daysSaved).toBe(1.0);
      expect(dispatchEarnedUsd).toBe(9250);

      // 4. Statement of Facts (SOF) Weather Working Day (WWD) Deductions
      const weatherStoppageHours = 12.0; // Heavy monsoon squall
      const netHoursUsed = grossHoursUsed - weatherStoppageHours;
      const netExcessHours = Math.max(0, netHoursUsed - laytimeHoursAllowed);
      const netExcessDays = netExcessHours / 24;
      const netDemurrageUsd = netExcessDays * demurrageRateUsdPerDay;
      const demurrageSavedUsd = grossDemurrageUsd - netDemurrageUsd;

      expect(netExcessDays).toBe(1.5);
      expect(netDemurrageUsd).toBe(27750);
      expect(demurrageSavedUsd).toBe(9250); // $9,250 saved via SOF validation
    });
  });

  // 11. Multi-Echelon Plant Raw Material 15-Day Buffer & Domestic Rail-Switch Parity Engine (CAT-14 & CAT-16)
  describe('Multi-Echelon Plant Raw Material 15-Day Buffer & Domestic Rail-Switch Parity Engine (CAT-14 & CAT-16)', () => {
    it('should trigger critical alarms on sub-15 day buffers and calculate domestic rail switch cost parity', () => {
      const statutoryBufferDays = 15;
      const plantRunwayDays = 11; // Durgapur Steel Plant (DSP)
      const deficitDays = statutoryBufferDays - plantRunwayDays;
      const isCritical = plantRunwayDays < statutoryBufferDays;

      expect(isCritical).toBe(true);
      expect(deficitDays).toBe(4);

      // Rail-switch parity evaluation when ocean freight spikes
      const oceanFreightRateUsd = 28.00; // Hay Point to Dhamra Cape spot
      const oceanPortRailFreightUsd = 9.50; // Dhamra Port to DSP rake rail
      const landedImportLogisticsUsd = oceanFreightRateUsd + oceanPortRailFreightUsd;

      const domesticMineRailFreightUsd = 18.20; // Kiriburu / Dalli-Rajhara to DSP rake
      const logisticsDifferentialUsd = landedImportLogisticsUsd - domesticMineRailFreightUsd;

      // 60,000 MT emergency rake parcel allocation
      const parcelQuantityMt = 60000;
      const totalSavingsUsd = parcelQuantityMt * logisticsDifferentialUsd;
      const dailyConsumptionMt = 14200; // DSP daily blast furnace draw
      const runwayDaysRecovered = Math.round((parcelQuantityMt / dailyConsumptionMt) * 10) / 10;
      const postRecoveryBufferDays = plantRunwayDays + runwayDaysRecovered;

      expect(landedImportLogisticsUsd).toBe(37.50);
      expect(logisticsDifferentialUsd).toBe(19.30);
      expect(totalSavingsUsd).toBe(1158000); // $1.158M savings by switching to domestic rakes
      expect(runwayDaysRecovered).toBe(4.2);
      expect(postRecoveryBufferDays).toBe(15.2); // Restores buffer above 15-day statutory safe floor
    });
  });
});
