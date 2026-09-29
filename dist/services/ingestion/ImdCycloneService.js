"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImdCycloneService = void 0;
const IngestionService_js_1 = require("./IngestionService.js");
class ImdCycloneService extends IngestionService_js_1.IngestionService {
    static instance;
    constructor() {
        super({
            sourceName: 'IMD_CYCLONE_WARNING_CENTRE',
            failureThreshold: 3,
            resetTimeoutMs: 60_000,
            maxRetries: 2,
            retryBackoffMs: 2_000,
        });
    }
    static getInstance() {
        if (!ImdCycloneService.instance) {
            ImdCycloneService.instance = new ImdCycloneService();
        }
        return ImdCycloneService.instance;
    }
    static getActivePortWarnings() {
        const now = new Date().toISOString();
        return [
            {
                portId: 'p-paradip',
                portName: 'Paradip Port',
                dangerSignalNumber: 3,
                dangerSignalText: 'Local Cautionary Signal No. 3 (LC-3)',
                basin: 'BAY_OF_BENGAL',
                severity: 'CAUTION',
                maxWindKnots: 28,
                expectedSwellM: 2.3,
                operationalImpact: 'SWELL_RESTRICTIONS',
                portAuthorityNotice: 'Vessels at outer anchorage advised to keep main engines on 1-hour notice. Capesize berthing restricted during high swell.',
                effectiveFromUtc: now,
                source: 'INDIA_METEOROLOGICAL_DEPARTMENT_RSMC',
            },
            {
                portId: 'p-dhamra',
                portName: 'Dhamra Port',
                dangerSignalNumber: 3,
                dangerSignalText: 'Local Cautionary Signal No. 3 (LC-3)',
                basin: 'BAY_OF_BENGAL',
                severity: 'CAUTION',
                maxWindKnots: 24,
                expectedSwellM: 2.1,
                operationalImpact: 'SWELL_RESTRICTIONS',
                portAuthorityNotice: 'Pilotage operations subject to swell condition inspection.',
                effectiveFromUtc: now,
                source: 'INDIA_METEOROLOGICAL_DEPARTMENT_RSMC',
            },
            {
                portId: 'p-haldia',
                portName: 'Haldia Dock Complex',
                dangerSignalNumber: 1,
                dangerSignalText: 'Distant Cautionary Signal No. 1 (DC-1)',
                basin: 'BAY_OF_BENGAL',
                severity: 'NORMAL',
                maxWindKnots: 18,
                expectedSwellM: 1.4,
                operationalImpact: 'NORMAL',
                portAuthorityNotice: 'Normal dock operations proceeding. Estuary draft advisory in effect.',
                effectiveFromUtc: now,
                source: 'INDIA_METEOROLOGICAL_DEPARTMENT_RSMC',
            },
            {
                portId: 'p-vizag',
                portName: 'Visakhapatnam Port',
                dangerSignalNumber: 1,
                dangerSignalText: 'Distant Cautionary Signal No. 1 (DC-1)',
                basin: 'BAY_OF_BENGAL',
                severity: 'NORMAL',
                maxWindKnots: 15,
                expectedSwellM: 1.5,
                operationalImpact: 'NORMAL',
                portAuthorityNotice: 'Harbour inner and outer basin operational without weather delays.',
                effectiveFromUtc: now,
                source: 'INDIA_METEOROLOGICAL_DEPARTMENT_RSMC',
            },
            {
                portId: 'p-mormugao',
                portName: 'Mormugao Port',
                dangerSignalNumber: 1,
                dangerSignalText: 'Signal No. 1 (Normal Cautionary)',
                basin: 'ARABIAN_SEA',
                severity: 'NORMAL',
                maxWindKnots: 12,
                expectedSwellM: 1.1,
                operationalImpact: 'NORMAL',
                portAuthorityNotice: 'Normal berth handling.',
                effectiveFromUtc: now,
                source: 'INDIA_METEOROLOGICAL_DEPARTMENT_RSMC',
            },
        ];
    }
    async executeIngestion() {
        const warnings = ImdCycloneService.getActivePortWarnings();
        return {
            count: warnings.length,
            payload: {
                warnings,
                activeCycloneCount: 0,
                basinStatus: 'MONITORING_MONSOON_TROUGH',
                timestamp: new Date().toISOString(),
            },
        };
    }
}
exports.ImdCycloneService = ImdCycloneService;
//# sourceMappingURL=ImdCycloneService.js.map