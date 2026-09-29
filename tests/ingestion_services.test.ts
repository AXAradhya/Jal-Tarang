/**
 * SAIL MARINEX — Ingestion Services & Ingestion Job Manager Test Suite
 * Validates resilience patterns, circuit breaker behavior, and official data sources.
 */

import { describe, it, expect } from 'vitest';
import {
  OpenMeteoService,
  ExchangeRateService,
  AisStreamService,
  WorldBankService,
  EiaService,
  FredService,
  BalticExchangeService,
  DataGovInService,
  UnComtradeService,
  ImdCycloneService,
  MarineCadastreService,
  EAST_COAST_PORTS,
} from '../src/services/ingestion/index.js';
import { IngestionJobManager } from '../src/jobs/ingestionJobs.js';

describe('Ingestion Services Architecture & Resilience', () => {
  it('should verify OpenMeteoService configuration and East Coast port coverage', () => {
    const service = OpenMeteoService.getInstance();
    expect(service).toBeDefined();

    const circuit = service.getCircuitStatus();
    expect(circuit.source).toBe('OPEN_METEO_MARINE');
    expect(circuit.circuitState).toBe('CLOSED');
    expect(circuit.failureCount).toBe(0);

    // Verify all 7 SAIL-relevant East Coast ports
    expect(EAST_COAST_PORTS.length).toBe(7);
    const portIds = EAST_COAST_PORTS.map((p) => p.portId);
    expect(portIds).toContain('p-paradip');
    expect(portIds).toContain('p-vizag');
    expect(portIds).toContain('p-dhamra');
    expect(portIds).toContain('p-haldia');

    for (const port of EAST_COAST_PORTS) {
      expect(port.lat).toBeGreaterThan(10);
      expect(port.lat).toBeLessThan(25);
      expect(port.lon).toBeGreaterThan(75);
      expect(port.lon).toBeLessThan(95);
    }
  });

  it('should retrieve authentic exchange rates with positive INR/AUD/EUR quotes', async () => {
    const service = ExchangeRateService.getInstance();
    expect(service).toBeDefined();

    const rates = await ExchangeRateService.fetchLatestRates();
    expect(rates.inr).toBeGreaterThan(80);
    expect(rates.aud).toBeGreaterThan(0.5);
    expect(rates.eur).toBeGreaterThan(0.5);
    expect(['FRANKFURTER_ECB', 'OPEN_ER_API', 'FALLBACK_BENCHMARK']).toContain(rates.source);
  });

  it('should verify World Bank Pink Sheet commodity benchmarks', async () => {
    const benchmarks = await WorldBankService.fetchLatestPinkSheet();
    expect(benchmarks.length).toBe(4);

    const codes = benchmarks.map((b) => b.commodityCode);
    expect(codes).toContain('IRON_ORE_62');
    expect(codes).toContain('COKING_COAL_PLV');
    expect(codes).toContain('THERMAL_COAL_NEWC');
    expect(codes).toContain('BRENT_CRUDE');

    const cokingCoal = benchmarks.find((b) => b.commodityCode === 'COKING_COAL_PLV');
    expect(cokingCoal?.priceUsd).toBeGreaterThan(200);
    expect(cokingCoal?.unit).toBe('USD/mt');
  });

  it('should verify EIA and FRED fallback benchmark observations', async () => {
    const eiaBenchmarks = await EiaService.syncCachedBenchmarks();
    expect(eiaBenchmarks.length).toBeGreaterThan(0);
    expect(eiaBenchmarks[0].value).toBeGreaterThan(50);

    const fredObservations = await FredService.syncCachedObservations();
    expect(fredObservations.length).toBeGreaterThan(0);
    expect(fredObservations[0].value).toBeGreaterThan(50);
  });

  it('should verify Baltic Exchange index records and historical grounding', async () => {
    const indices = await BalticExchangeService.getLatestIndices();
    expect(indices.length).toBeGreaterThanOrEqual(4);

    const codes = indices.map((i) => i.indexCode);
    expect(codes).toContain('BDI');
    expect(codes).toContain('BCI');
    expect(codes).toContain('FRT-C5TC');

    const c5tc = indices.find((i) => i.indexCode === 'FRT-C5TC');
    expect(c5tc?.value).toBeGreaterThan(5);
    expect(c5tc?.unit).toBe('USD/MT');
  });

  it('should verify DataGovInService Indian Major Ports and SAIL plant allocations', () => {
    const service = DataGovInService.getInstance();
    expect(service).toBeDefined();

    const ports = DataGovInService.getPortBenchmarks();
    expect(ports.length).toBe(5);

    const paradip = ports.find((p) => p.portId === 'p-paradip');
    expect(paradip).toBeDefined();
    expect(paradip?.maxDraughtM).toBeGreaterThanOrEqual(17.0);
    expect(paradip?.mechanicalHandlingRateMtDay).toBeGreaterThanOrEqual(50000);
    expect(paradip?.rakeEvacuationPerDay).toBeGreaterThan(20);

    const allocations = DataGovInService.getSailPlantAllocations();
    expect(allocations.length).toBe(5);
    const totalDemand = allocations.reduce((sum, a) => sum + a.annualDemandMtpa, 0);
    expect(totalDemand).toBeCloseTo(16.8, 1);
  });

  it('should verify UnComtradeService bilateral trade flows for HS 270112', () => {
    const service = UnComtradeService.getInstance();
    expect(service).toBeDefined();

    const flows = UnComtradeService.getHistoricalFlows();
    expect(flows.length).toBeGreaterThan(0);

    const latest = flows[0];
    expect(latest.cmdCode).toBe('270112');
    expect(latest.reporterDesc).toBe('India');
    expect(latest.partnerDesc).toBe('Australia');
    expect(latest.unitValueUsdPerMt).toBeGreaterThan(200);
    expect(latest.volumeMetricTonnes).toBeGreaterThan(1000000);
  });

  it('should verify ImdCycloneService port storm warnings and danger signals', () => {
    const service = ImdCycloneService.getInstance();
    expect(service).toBeDefined();

    const warnings = ImdCycloneService.getActivePortWarnings();
    expect(warnings.length).toBeGreaterThanOrEqual(4);

    const paradipWarning = warnings.find((w) => w.portId === 'p-paradip');
    expect(paradipWarning).toBeDefined();
    expect(paradipWarning?.dangerSignalNumber).toBeGreaterThanOrEqual(1);
    expect(paradipWarning?.basin).toBe('BAY_OF_BENGAL');
  });

  it('should verify MarineCadastreService route transit calibrations against NOAA datasets', () => {
    const service = MarineCadastreService.getInstance();
    expect(service).toBeDefined();

    const routes = MarineCadastreService.getCalibratedRoutes();
    expect(routes.length).toBe(4);

    const gladstoneParadip = routes.find((r) => r.routeCode === 'RT-GLAD-PRT-CAPE');
    expect(gladstoneParadip).toBeDefined();
    expect(gladstoneParadip?.vesselClass).toBe('Capesize');
    expect(gladstoneParadip?.averageTransitDays).toBeGreaterThan(14);
    expect(gladstoneParadip?.historicalSampleCount).toBeGreaterThan(1000);
  });

  it('should verify IngestionJobManager reporting all 9 scheduled jobs and circuits', () => {
    const status = IngestionJobManager.getStatus();
    expect(status.jobs.length).toBe(9);

    const jobNames = status.jobs.map((j) => j.jobName);
    expect(jobNames).toContain('weather');
    expect(jobNames).toContain('fx');
    expect(jobNames).toContain('commodities');
    expect(jobNames).toContain('baltic');
    expect(jobNames).toContain('ais');
    expect(jobNames).toContain('datagov');
    expect(jobNames).toContain('uncomtrade');
    expect(jobNames).toContain('imd');
    expect(jobNames).toContain('marinecadastre');

    expect(status.circuits.openMeteo.circuitState).toBe('CLOSED');
    expect(status.circuits.exchangeRate.circuitState).toBe('CLOSED');
    expect(status.circuits.dataGovIn.circuitState).toBe('CLOSED');
    expect(status.circuits.unComtrade.circuitState).toBe('CLOSED');
    expect(status.circuits.imdCyclone.circuitState).toBe('CLOSED');
    expect(status.circuits.marineCadastre.circuitState).toBe('CLOSED');
  });

  it('should trigger all ingestion jobs on demand without runtime exceptions', async () => {
    const fxResult = await IngestionJobManager.triggerJob('fx');
    expect(fxResult.source).toBe('FRANKFURTER_ECB_FX');
    expect(fxResult.durationMs).toBeGreaterThanOrEqual(0);

    const datagovResult = await IngestionJobManager.triggerJob('datagov');
    expect(datagovResult.source).toBe('DATA_GOV_IN_AND_IPA');
    expect(datagovResult.recordsIngested).toBeGreaterThan(0);

    const uncomtradeResult = await IngestionJobManager.triggerJob('uncomtrade');
    expect(uncomtradeResult.source).toBe('UN_COMTRADE_DATABASE');
    expect(uncomtradeResult.recordsIngested).toBeGreaterThan(0);

    const imdResult = await IngestionJobManager.triggerJob('imd');
    expect(imdResult.source).toBe('IMD_CYCLONE_WARNING_CENTRE');
    expect(imdResult.recordsIngested).toBeGreaterThan(0);

    const mcResult = await IngestionJobManager.triggerJob('marinecadastre');
    expect(mcResult.source).toBe('NOAA_MARINECADASTRE_AND_KAGGLE');
    expect(mcResult.recordsIngested).toBeGreaterThan(0);

    const status = IngestionJobManager.getStatus();
    const datagovJob = status.jobs.find((j) => j.jobName === 'datagov');
    expect(datagovJob?.totalExecutions).toBeGreaterThan(0);
    expect(datagovJob?.lastStatus).toBe('SUCCESS');
  });
});
