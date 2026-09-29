"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionService = void 0;
const index_js_1 = require("../../db/index.js");
class IngestionService {
    sourceName;
    failureThreshold;
    resetTimeoutMs;
    maxRetries;
    retryBackoffMs;
    circuitState = 'CLOSED';
    failureCount = 0;
    lastFailureTime = 0;
    lastSuccessTime = 0;
    constructor(config) {
        this.sourceName = config.sourceName;
        this.failureThreshold = config.failureThreshold ?? 5;
        this.resetTimeoutMs = config.resetTimeoutMs ?? 60_000;
        this.maxRetries = config.maxRetries ?? 3;
        this.retryBackoffMs = config.retryBackoffMs ?? 1_000;
    }
    async run() {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        if (this.circuitState === 'OPEN') {
            const timeSinceFailure = Date.now() - this.lastFailureTime;
            if (timeSinceFailure > this.resetTimeoutMs) {
                this.circuitState = 'HALF_OPEN';
            }
            else {
                const errorMsg = `Circuit breaker for ${this.sourceName} is OPEN. Fast-failing to preserve external API quota.`;
                await this.logAudit('FAST_FAIL', 0, 0, errorMsg);
                return {
                    success: false,
                    source: this.sourceName,
                    recordsIngested: 0,
                    durationMs: 0,
                    error: errorMsg,
                    timestamp,
                };
            }
        }
        let attempt = 0;
        let lastError = null;
        while (attempt <= this.maxRetries) {
            try {
                const result = await this.executeIngestion();
                const durationMs = Date.now() - startTime;
                this.circuitState = 'CLOSED';
                this.failureCount = 0;
                this.lastSuccessTime = Date.now();
                await this.logAudit('SUCCESS', result.count, durationMs);
                return {
                    success: true,
                    source: this.sourceName,
                    recordsIngested: result.count,
                    durationMs,
                    data: result.payload,
                    timestamp,
                };
            }
            catch (err) {
                attempt++;
                lastError = err;
                if (attempt <= this.maxRetries) {
                    const delay = this.retryBackoffMs * Math.pow(2, attempt - 1);
                    await new Promise((r) => setTimeout(r, delay));
                }
            }
        }
        const durationMs = Date.now() - startTime;
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.failureThreshold) {
            this.circuitState = 'OPEN';
        }
        const errorMsg = lastError?.message || 'Unknown ingestion execution error';
        await this.logAudit('FAILURE', 0, durationMs, errorMsg);
        return {
            success: false,
            source: this.sourceName,
            recordsIngested: 0,
            durationMs,
            error: errorMsg,
            timestamp,
        };
    }
    async logAudit(status, recordsCount, durationMs, errorMessage) {
        try {
            await index_js_1.pool.query(`INSERT INTO ingestion_logs 
           (source_name, status, records_count, duration_ms, error_message, executed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT DO NOTHING`, [this.sourceName, status, recordsCount, durationMs, errorMessage || null]);
        }
        catch {
        }
    }
    getCircuitStatus() {
        return {
            source: this.sourceName,
            circuitState: this.circuitState,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
            lastSuccessTime: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : null,
        };
    }
}
exports.IngestionService = IngestionService;
//# sourceMappingURL=IngestionService.js.map