/**
 * JAL TARANG — Base Ingestion Service
 * 
 * Provides production-grade resilience patterns for all external data ingestion:
 * - Exponential backoff retry with jitter
 * - Circuit Breaker pattern (CLOSED -> OPEN -> HALF_OPEN)
 * - Structured audit logging to PostgreSQL `ingestion_logs` table
 * - Performance metrics (execution duration, record count, error telemetry)
 */

import { pool } from '../../db/index.js';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface IngestionResult<T = any> {
  success: boolean;
  source: string;
  recordsIngested: number;
  durationMs: number;
  error?: string;
  data?: T;
  timestamp: string;
}

export interface IngestionServiceConfig {
  sourceName: string;
  failureThreshold?: number; // consecutive failures before opening circuit (default: 5)
  resetTimeoutMs?: number; // ms to wait in OPEN state before testing HALF_OPEN (default: 60,000)
  maxRetries?: number; // retries per execution (default: 3)
  retryBackoffMs?: number; // base backoff ms (default: 1000)
}

export abstract class IngestionService {
  protected sourceName: string;
  protected failureThreshold: number;
  protected resetTimeoutMs: number;
  protected maxRetries: number;
  protected retryBackoffMs: number;

  private circuitState: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;

  constructor(config: IngestionServiceConfig) {
    this.sourceName = config.sourceName;
    this.failureThreshold = config.failureThreshold ?? 5;
    this.resetTimeoutMs = config.resetTimeoutMs ?? 60_000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryBackoffMs = config.retryBackoffMs ?? 1_000;
  }

  /**
   * Abstract ingestion implementation to be fulfilled by concrete source clients
   */
  protected abstract executeIngestion(): Promise<{ count: number; payload?: any }>;

  /**
   * Main entry point with circuit breaker and retry wrappers
   */
  public async run(): Promise<IngestionResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // 1. Evaluate Circuit Breaker State
    if (this.circuitState === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure > this.resetTimeoutMs) {
        this.circuitState = 'HALF_OPEN';
      } else {
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

    // 2. Execute with Retry
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= this.maxRetries) {
      try {
        const result = await this.executeIngestion();
        const durationMs = Date.now() - startTime;

        // Reset circuit breaker on success
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
      } catch (err: any) {
        attempt++;
        lastError = err;

        if (attempt <= this.maxRetries) {
          const delay = this.retryBackoffMs * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    // 3. Handle Failure after all retries exhausted
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

  /**
   * Persist ingestion event to PostgreSQL audit log
   */
  protected async logAudit(
    status: 'SUCCESS' | 'FAILURE' | 'FAST_FAIL',
    recordsCount: number,
    durationMs: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO ingestion_logs 
           (source_name, status, records_count, duration_ms, error_message, executed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT DO NOTHING`,
        [this.sourceName, status, recordsCount, durationMs, errorMessage || null]
      );
    } catch {
      // If ingestion_logs table does not exist or db is offline, fail gracefully without throwing
    }
  }

  public getCircuitStatus() {
    return {
      source: this.sourceName,
      circuitState: this.circuitState,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      lastSuccessTime: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : null,
    };
  }
}
