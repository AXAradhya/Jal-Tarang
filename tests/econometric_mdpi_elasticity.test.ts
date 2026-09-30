import { describe, it, expect } from 'vitest';
import { MdpiEconometricService } from '../src/services/forecasting/MdpiEconometricService.js';
import { MaritimeElasticityService } from '../src/services/forecasting/MaritimeElasticityService.js';

describe('MDPI Systems (2024) Decomposition-Ensemble & Maritime Elasticity Engines', () => {
  // 1. MDPI Systems (2024) Framework Tests
  describe('MDPI Systems (2024) Decomposition-Ensemble Architecture', () => {
    it('should execute full 4-stage SVMD-LASSO-MOAVOA workflow and return academic citation', () => {
      const result = MdpiEconometricService.runDecompositionEnsemble('FRT-C5TC', 14.85);

      expect(result).toBeDefined();
      expect(result.freightCode).toBe('FRT-C5TC');
      expect(result.academicCitation.journal).toContain('Systems');
      expect(result.academicCitation.doi).toBe('10.3390/systems12080309');
      expect(result.academicCitation.year).toBe(2024);
    });

    it('should perform Sequential Variational Mode Decomposition into 3 non-stationary frequency modes', () => {
      const result = MdpiEconometricService.runDecompositionEnsemble('FRT-C3TC', 18.20);
      const modes = result.svmdDecomposition.modes;

      expect(modes.length).toBe(3);
      expect(modes[0].modeName).toBe('Mode 1 (Trend)');
      expect(modes[1].modeName).toBe('Mode 2 (Macro Cycle)');
      expect(modes[2].modeName).toBe('Mode 3 (Seasonal Perturbations)');

      // Verify variance explained sums to ~100%
      const totalVar = modes.reduce((acc, m) => acc + m.varianceExplainedPct, 0);
      expect(totalVar).toBeGreaterThanOrEqual(99.0);
      expect(totalVar).toBeLessThanOrEqual(101.0);

      // Verify subseries points are present and non-empty
      expect(modes[0].subseriesPoints.length).toBe(30);
      expect(modes[1].subseriesPoints.length).toBe(30);
      expect(modes[2].subseriesPoints.length).toBe(30);
    });

    it('should evaluate the Model Library (ORELM, BP, GMDH, ANFIS) and apply LASSO L1-regularization sparsity', () => {
      const result = MdpiEconometricService.runDecompositionEnsemble('FRT-C5TC', 14.85);
      const matrix = result.modelLibrarySelection.subseriesMatrix;

      expect(matrix.length).toBe(12); // 3 modes * 4 models

      // Mode 1: ORELM and ANFIS selected, BP and GMDH zeroed out by LASSO
      const mode1Orelm = matrix.find(e => e.modeIndex === 1 && e.predictorCode === 'ORELM')!;
      const mode1Bp = matrix.find(e => e.modeIndex === 1 && e.predictorCode === 'BP')!;
      expect(mode1Orelm.isSelectedByLasso).toBe(true);
      expect(mode1Orelm.lassoWeight).toBeGreaterThan(0);
      expect(mode1Bp.isSelectedByLasso).toBe(false);
      expect(mode1Bp.lassoWeight).toBe(0);

      // Mode 2: ORELM, BP, and ANFIS selected
      const mode2Bp = matrix.find(e => e.modeIndex === 2 && e.predictorCode === 'BP')!;
      expect(mode2Bp.isSelectedByLasso).toBe(true);
      expect(mode2Bp.lassoWeight).toBeGreaterThan(0);

      // Mode 3: ORELM and GMDH selected
      const mode3Gmdh = matrix.find(e => e.modeIndex === 3 && e.predictorCode === 'GMDH')!;
      expect(mode3Gmdh.isSelectedByLasso).toBe(true);
      expect(mode3Gmdh.lassoWeight).toBeGreaterThan(0);
    });

    it('should compute MOAVOA Pareto weights and synthesize an accurate composite forecast', () => {
      const result = MdpiEconometricService.runDecompositionEnsemble('FRT-C5TC', 14.85);
      const moavoa = result.moavoaEnsemble;

      expect(moavoa.vulturePopulationSize).toBe(50);
      expect(moavoa.paretoArchiveSize).toBe(20);
      expect(moavoa.optimalWeights['Mode 1 (Trend)']).toBeCloseTo(0.68, 2);
      expect(moavoa.synthesizedForecastUsdMt).toBeGreaterThan(10.0);
      expect(moavoa.synthesizedForecastUsdMt).toBeLessThan(25.0);
    });

    it('should compute canonical empirical evaluation metrics (MAE, RMSE, MAPE, IA, TIC)', () => {
      const actual = 14.85;
      const predicted = 15.20;
      const metrics = MdpiEconometricService.computeEmpiricalMetrics(actual, predicted);

      expect(metrics.mae).toBeGreaterThan(0);
      expect(metrics.rmse).toBeGreaterThan(metrics.mae); // RMSE >= MAE mathematically
      expect(metrics.mape).toBeGreaterThan(0);
      expect(metrics.ia).toBeGreaterThan(0.95); // High Index of Agreement
      expect(metrics.ia).toBeLessThanOrEqual(1.0);
      expect(metrics.tic).toBeGreaterThan(0);
      expect(metrics.tic).toBeLessThan(0.1); // Low Theil inequality coefficient
      expect(metrics.stdDev).toBeGreaterThan(0);
    });

    it('should demonstrate positive P_indicator improvement over Single ANNs, Equal Weight, and other Multi-Objective algorithms', () => {
      const result = MdpiEconometricService.runDecompositionEnsemble('FRT-C5TC', 14.85);
      const benchmarks = result.benchmarkComparisons;

      expect(benchmarks.length).toBeGreaterThanOrEqual(10);
      // All benchmark comparison P_indicator improvement percentages must be positive (> 0)
      benchmarks.forEach(b => {
        expect(b.pIndicatorRmseImprovementPct).toBeGreaterThan(0);
        expect(b.pIndicatorMapeImprovementPct).toBeGreaterThan(0);
      });
    });
  });

  // 2. Dr. Sapovadia Maritime Elasticity Framework Tests
  describe('Dr. Sapovadia Maritime Demand Elasticity Framework', () => {
    it('should provide academic elasticity metrics (PED, CPED, IED) with operational interpretations', () => {
      const analysis = MaritimeElasticityService.getElasticityAnalysis();

      expect(analysis.academicCitation.author).toContain('Sapovadia');
      expect(analysis.academicCitation.year).toBe(2024);
      expect(analysis.elasticityMetrics.length).toBe(3);

      const ped = analysis.elasticityMetrics.find(m => m.code === 'PED')!;
      expect(ped.value).toBe(-0.22);
      expect(ped.classification).toContain('Inelastic');

      const cped = analysis.elasticityMetrics.find(m => m.code === 'CPED')!;
      expect(cped.value).toBe(0.65);
      expect(cped.classification).toContain('Substitute');

      const ied = analysis.elasticityMetrics.find(m => m.code === 'IED')!;
      expect(ied.value).toBe(1.35);
      expect(ied.classification).toContain('Growth Driver');
    });

    it('should simulate modal shift from Sandheads lighterage to Dhamra direct discharge when freight rates increase', () => {
      const sim = MaritimeElasticityService.simulateModalShift({
        freightRateChangePct: 15.0, // 15% increase in ocean freight
        railTariffChangePct: 0.0,
        baseCargoVolumeMt: 120000,
      });

      expect(sim.predictedDemandChangePct).toBeCloseTo(-0.22 * 15.0, 2); // PED effect: ~-3.3%
      expect(sim.modalReallocation.shiftDirection).toBe('Shift to Dhamra Direct + FOIS Rail');
      expect(sim.modalReallocation.shiftedVolumeMt).toBeGreaterThan(0);
      expect(sim.modalReallocation.dhamraDirectRailMt).toBeGreaterThan(sim.modalReallocation.sandheadsLighterageMt);
      expect(sim.procurementRecommendation.recommendedContractStructure).toContain('Multiple Voyage Contract (COA)');
    });

    it('should recommend expanding spot exposure when freight rates experience a severe cyclical depression', () => {
      const sim = MaritimeElasticityService.simulateModalShift({
        freightRateChangePct: -18.0, // 18% market crash
        railTariffChangePct: 0.0,
        baseCargoVolumeMt: 100000,
      });

      expect(sim.procurementRecommendation.recommendedContractStructure).toBe('Multiple Voyage Contract (COA) 60% / Spot 40%');
      expect(sim.procurementRecommendation.strategicReasoning).toContain('cyclical depression');
    });

    it('should handle zero or neutral inputs safely without division by zero or NaN', () => {
      const sim = MaritimeElasticityService.simulateModalShift({
        freightRateChangePct: 0,
        railTariffChangePct: 0,
        baseCargoVolumeMt: 0,
      });

      expect(sim.predictedDemandChangePct).toBe(0);
      expect(sim.projectedVolumeDemandedMt).toBe(0);
      expect(sim.modalReallocation.shiftedVolumeMt).toBe(0);
      expect(Number.isNaN(sim.financialImpact.estimatedLandedCostDeltaInrPerMt)).toBe(false);
    });
  });

  // 3. Econometric REST API Endpoints Integration
  describe('Econometric REST API Endpoints', () => {
    it('should serve MDPI 2024 decomposition-ensemble data via GET /api/v1/forecasts/econometric/mdpi-2024', async () => {
      const { ensureTestServerRunning } = await import('./testServerHelper.js');
      await ensureTestServerRunning();

      const jwt = (await import('jsonwebtoken')).default;
      const { config } = await import('../src/config/index.js');
      const token = jwt.sign(
        { sub: 'usr-analyst-01', org: 'org-sail-corp', email: 'analyst@sail.in', roles: ['ANALYST'], permissions: ['forecasts:read'] },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      const resp = await fetch('http://localhost:8000/api/v1/forecasts/econometric/mdpi-2024?freightCode=FRT-C5TC', {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.success).toBe(true);
      expect(body.data.svmdDecomposition.modes.length).toBe(3);
      expect(body.data.empiricalMetrics.mae).toBeGreaterThan(0);
    });

    it('should serve Dr. Sapovadia elasticity analysis via GET /api/v1/forecasts/econometric/elasticity-analysis', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const { config } = await import('../src/config/index.js');
      const token = jwt.sign(
        { sub: 'usr-analyst-01', org: 'org-sail-corp', email: 'analyst@sail.in', roles: ['ANALYST'], permissions: ['forecasts:read'] },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      const resp = await fetch('http://localhost:8000/api/v1/forecasts/econometric/elasticity-analysis', {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.success).toBe(true);
      expect(body.data.elasticityMetrics.length).toBe(3);
      expect(body.data.modalSubstitutionBaseline.originBasin).toContain('Queensland');
    });

    it('should simulate modal shift via POST /api/v1/forecasts/econometric/simulate-modal-shift', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const { config } = await import('../src/config/index.js');
      const token = jwt.sign(
        { sub: 'usr-analyst-01', org: 'org-sail-corp', email: 'analyst@sail.in', roles: ['ANALYST'], permissions: ['forecasts:read'] },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      const resp = await fetch('http://localhost:8000/api/v1/forecasts/econometric/simulate-modal-shift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          freightRateChangePct: 12.0,
          railTariffChangePct: -4.0,
          baseCargoVolumeMt: 150000,
        })
      });

      expect(resp.status).toBe(200);
      const body = await resp.json();
      expect(body.success).toBe(true);
      expect(body.data.modalReallocation.shiftDirection).toBe('Shift to Dhamra Direct + FOIS Rail');
      expect(body.data.modalReallocation.shiftedVolumeMt).toBeGreaterThan(0);
    });
  });
});

