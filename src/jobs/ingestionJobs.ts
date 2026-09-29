/**
 * JAL TARANG — Scheduled Ingestion Jobs & BullMQ Worker Registry
 * 
 * Schedules and orchestrates real-time external data feeds:
 * - Weather: 15-minute polling of Open-Meteo Marine API
 * - FX Rates: Hourly polling of European Central Bank / Frankfurter
 * - Commodities: Daily sync (02:00 UTC) of World Bank Pink Sheet, EIA, and FRED
 * - Baltic Indices: Daily sync (18:00 UTC) of BDI, BCI, C5TC, C3TC
 * - AIS Telemetry: Periodic fleet position refresh
 * - Data.gov.in / IPA: Daily sync of Indian Major Ports logistics & SAIL plant demands
 * - UN Comtrade: Monthly/On-demand bilateral coking coal import flows (HS 270112)
 * - IMD Cyclones: Real-time tropical cyclone tracking & Port Danger Signals
 * - MarineCadastre: Historical Capesize/Panamax transit calibration
 */

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
  IngestionResult,
} from '../services/ingestion/index.js';

export interface JobExecutionState {
  jobName: string;
  schedule: string;
  lastRunAt: string | null;
  lastStatus: 'IDLE' | 'SUCCESS' | 'FAILURE' | 'RUNNING';
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastError: string | null;
  lastDurationMs: number;
}

const JOB_STATES: Record<string, JobExecutionState> = {
  weather: {
    jobName: 'weather',
    schedule: '*/15 * * * * (Every 15 min)',
    lastRunAt: null,
    lastStatus: 'IDLE',
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastError: null,
    lastDurationMs: 0,
  },
  fx: {
    jobName: 'fx',
    schedule: '0 * * * * (Hourly)',
    lastRunAt: null,
    lastStatus: 'IDLE',
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastError: null,
    lastDurationMs: 0,
  },
  commodities: {
    jobName: 'commodities',
    schedule: '0 2 * * * (Daily at 02:00 UTC)',
    lastRunAt: null,
    lastStatus: 'IDLE',
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastError: null,
    lastDurationMs: 0,
  },
  baltic: {
    jobName: 'baltic',
    schedule: '0 18 * * * (Daily at 18:00 UTC)',
    lastRunAt: null,
    lastStatus: 'IDLE',
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastError: null,
    lastDurationMs: 0,
  },
  ais: {
    jobName: 'ais',
    schedule: 'Continuous Stream / 5-min batch',
    lastRunAt: null,
    lastStatus: 'IDLE',
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastError: null,
    lastDurationMs: 0,
  },
  datagov: {
    jobName: 'datagov',
    schedule: '0 4 * * * (Daily 04:00 UTC)',
    lastRunAt: null,
    lastStatus: 'IDLE',
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastError: null,
    lastDurationMs: 0,
  },
  uncomtrade: {
    jobName: 'uncomtrade',
    schedule: '0 6 1 * * (Monthly on 1st)',
    lastRunAt: null,
    lastStatus: 'IDLE',
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastError: null,
    lastDurationMs: 0,
  },
  imd: {
    jobName: 'imd',
    schedule: '*/30 * * * * (Every 30 min)',
    lastRunAt: null,
    lastStatus: 'IDLE',
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastError: null,
    lastDurationMs: 0,
  },
  marinecadastre: {
    jobName: 'marinecadastre',
    schedule: '0 0 * * 0 (Weekly Sunday)',
    lastRunAt: null,
    lastStatus: 'IDLE',
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastError: null,
    lastDurationMs: 0,
  },
};

export class IngestionJobManager {
  /**
   * Triggers a specific ingestion job on-demand or via scheduler
   */
  public static async triggerJob(jobName: string): Promise<IngestionResult> {
    const state = JOB_STATES[jobName];
    if (!state) {
      throw new Error(`Unknown ingestion job: '${jobName}'. Valid jobs: ${Object.keys(JOB_STATES).join(', ')}`);
    }

    state.lastStatus = 'RUNNING';
    state.totalExecutions++;
    const startTime = Date.now();

    try {
      let result: IngestionResult;

      switch (jobName) {
        case 'weather':
          result = await OpenMeteoService.getInstance().run();
          break;
        case 'fx':
          result = await ExchangeRateService.getInstance().run();
          break;
        case 'commodities': {
          const wb = await WorldBankService.getInstance().run();
          const eia = await EiaService.getInstance().run();
          const fred = await FredService.getInstance().run();
          result = {
            success: wb.success || eia.success || fred.success,
            source: 'COMMODITIES_AGGREGATE',
            recordsIngested: wb.recordsIngested + eia.recordsIngested + fred.recordsIngested,
            durationMs: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          };
          break;
        }
        case 'baltic':
          result = await BalticExchangeService.getInstance().run();
          break;
        case 'ais':
          result = await AisStreamService.getInstance().run();
          break;
        case 'datagov':
          result = await DataGovInService.getInstance().run();
          break;
        case 'uncomtrade':
          result = await UnComtradeService.getInstance().run();
          break;
        case 'imd':
          result = await ImdCycloneService.getInstance().run();
          break;
        case 'marinecadastre':
          result = await MarineCadastreService.getInstance().run();
          break;
        default:
          throw new Error(`Job execution mapping missing for ${jobName}`);
      }

      state.lastRunAt = new Date().toISOString();
      state.lastDurationMs = Date.now() - startTime;

      if (result.success) {
        state.lastStatus = 'SUCCESS';
        state.successfulExecutions++;
        state.lastError = null;
      } else {
        state.lastStatus = 'FAILURE';
        state.failedExecutions++;
        state.lastError = result.error || 'Execution returned non-success';
      }

      return result;
    } catch (err: any) {
      state.lastStatus = 'FAILURE';
      state.failedExecutions++;
      state.lastError = err.message;
      state.lastRunAt = new Date().toISOString();
      state.lastDurationMs = Date.now() - startTime;

      return {
        success: false,
        source: jobName,
        recordsIngested: 0,
        durationMs: state.lastDurationMs,
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Retrieves the current execution telemetry and health of all scheduled ingestion jobs
   */
  public static getStatus() {
    return {
      jobs: Object.values(JOB_STATES),
      circuits: {
        openMeteo: OpenMeteoService.getInstance().getCircuitStatus(),
        exchangeRate: ExchangeRateService.getInstance().getCircuitStatus(),
        aisStream: AisStreamService.getInstance().getCircuitStatus(),
        worldBank: WorldBankService.getInstance().getCircuitStatus(),
        eia: EiaService.getInstance().getCircuitStatus(),
        fred: FredService.getInstance().getCircuitStatus(),
        baltic: BalticExchangeService.getInstance().getCircuitStatus(),
        dataGovIn: DataGovInService.getInstance().getCircuitStatus(),
        unComtrade: UnComtradeService.getInstance().getCircuitStatus(),
        imdCyclone: ImdCycloneService.getInstance().getCircuitStatus(),
        marineCadastre: MarineCadastreService.getInstance().getCircuitStatus(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
