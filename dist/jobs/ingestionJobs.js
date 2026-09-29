"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionJobManager = void 0;
const index_js_1 = require("../services/ingestion/index.js");
const JOB_STATES = {
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
class IngestionJobManager {
    static async triggerJob(jobName) {
        const state = JOB_STATES[jobName];
        if (!state) {
            throw new Error(`Unknown ingestion job: '${jobName}'. Valid jobs: ${Object.keys(JOB_STATES).join(', ')}`);
        }
        state.lastStatus = 'RUNNING';
        state.totalExecutions++;
        const startTime = Date.now();
        try {
            let result;
            switch (jobName) {
                case 'weather':
                    result = await index_js_1.OpenMeteoService.getInstance().run();
                    break;
                case 'fx':
                    result = await index_js_1.ExchangeRateService.getInstance().run();
                    break;
                case 'commodities': {
                    const wb = await index_js_1.WorldBankService.getInstance().run();
                    const eia = await index_js_1.EiaService.getInstance().run();
                    const fred = await index_js_1.FredService.getInstance().run();
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
                    result = await index_js_1.BalticExchangeService.getInstance().run();
                    break;
                case 'ais':
                    result = await index_js_1.AisStreamService.getInstance().run();
                    break;
                case 'datagov':
                    result = await index_js_1.DataGovInService.getInstance().run();
                    break;
                case 'uncomtrade':
                    result = await index_js_1.UnComtradeService.getInstance().run();
                    break;
                case 'imd':
                    result = await index_js_1.ImdCycloneService.getInstance().run();
                    break;
                case 'marinecadastre':
                    result = await index_js_1.MarineCadastreService.getInstance().run();
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
            }
            else {
                state.lastStatus = 'FAILURE';
                state.failedExecutions++;
                state.lastError = result.error || 'Execution returned non-success';
            }
            return result;
        }
        catch (err) {
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
    static getStatus() {
        return {
            jobs: Object.values(JOB_STATES),
            circuits: {
                openMeteo: index_js_1.OpenMeteoService.getInstance().getCircuitStatus(),
                exchangeRate: index_js_1.ExchangeRateService.getInstance().getCircuitStatus(),
                aisStream: index_js_1.AisStreamService.getInstance().getCircuitStatus(),
                worldBank: index_js_1.WorldBankService.getInstance().getCircuitStatus(),
                eia: index_js_1.EiaService.getInstance().getCircuitStatus(),
                fred: index_js_1.FredService.getInstance().getCircuitStatus(),
                baltic: index_js_1.BalticExchangeService.getInstance().getCircuitStatus(),
                dataGovIn: index_js_1.DataGovInService.getInstance().getCircuitStatus(),
                unComtrade: index_js_1.UnComtradeService.getInstance().getCircuitStatus(),
                imdCyclone: index_js_1.ImdCycloneService.getInstance().getCircuitStatus(),
                marineCadastre: index_js_1.MarineCadastreService.getInstance().getCircuitStatus(),
            },
            timestamp: new Date().toISOString(),
        };
    }
}
exports.IngestionJobManager = IngestionJobManager;
//# sourceMappingURL=ingestionJobs.js.map