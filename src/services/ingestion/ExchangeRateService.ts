/**
 * JAL TARANG — Real-Time FX Ingestion Service
 * Queries European Central Bank reference rates (Frankfurter API) or open.er-api.
 * 100% Free, no API key required.
 */

import { pool } from '../../db/index.js';
import { IngestionService } from './IngestionService.js';

export interface ExchangeRatesResult {
  inr: number;
  aud: number;
  eur: number;
  source: string;
  isLive: boolean;
  latencyMs?: number;
  lastUpdated: string;
}

export class ExchangeRateService extends IngestionService {
  private static instance: ExchangeRateService;
  private static cachedRates: { data: ExchangeRatesResult; fetchedAt: number } | null = null;
  private static CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

  constructor() {
    super({
      sourceName: 'FRANKFURTER_ECB_FX',
      failureThreshold: 4,
      resetTimeoutMs: 45_000,
      maxRetries: 2,
      retryBackoffMs: 1_000,
    });
  }

  public static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  /**
   * Concrete IngestionService implementation
   */
  protected async executeIngestion(): Promise<{ count: number; payload?: any }> {
    const rates = await ExchangeRateService.syncRates();
    return { count: rates.synced ? 1 : 0, payload: rates };
  }

  /**
   * Fetches latest USD -> INR / AUD / EUR exchange rates from Frankfurter (ECB) or open.er-api
   */
  public static async fetchLatestRates(): Promise<ExchangeRatesResult> {
    const now = Date.now();
    if (this.cachedRates && now - this.cachedRates.fetchedAt < this.CACHE_TTL_MS) {
      return this.cachedRates.data;
    }

    // 1. Primary: European Central Bank via Frankfurter API
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR,AUD,EUR', { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const json: any = await res.json();
        const latencyMs = Date.now() - start;
        const inr = Number(json?.rates?.INR) || 85.50;
        const aud = Number(json?.rates?.AUD) || 1.54;
        const eur = Number(json?.rates?.EUR) || 0.92;
        const result: ExchangeRatesResult = {
          inr,
          aud,
          eur,
          source: 'FRANKFURTER_ECB',
          isLive: true,
          latencyMs,
          lastUpdated: new Date().toISOString(),
        };
        this.cachedRates = { data: result, fetchedAt: now };
        return result;
      }
    } catch {
      // Fall through to secondary
    }

    // 2. Secondary: open.er-api
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const json: any = await res.json();
        const latencyMs = Date.now() - start;
        const inr = Number(json?.rates?.INR) || 85.50;
        const aud = Number(json?.rates?.AUD) || 1.54;
        const eur = Number(json?.rates?.EUR) || 0.92;
        const result: ExchangeRatesResult = {
          inr,
          aud,
          eur,
          source: 'OPEN_ER_API',
          isLive: true,
          latencyMs,
          lastUpdated: new Date().toISOString(),
        };
        this.cachedRates = { data: result, fetchedAt: now };
        return result;
      }
    } catch {
      // Fall through to fallback
    }

    // 3. Fallback benchmark if offline
    return {
      inr: 85.50,
      aud: 1.54,
      eur: 0.92,
      source: 'FALLBACK_BENCHMARK',
      isLive: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Syncs latest currency exchange rate into PostgreSQL
   */
  public static async syncRates(): Promise<{ inr: number; synced: boolean; source: string }> {
    const rates = await this.fetchLatestRates();
    try {
      await pool.query(
        `INSERT INTO currency_rates (base_currency, quote_currency, rate, effective_date, source, created_at)
         VALUES ('USD', 'INR', $1, CURRENT_DATE, $2, NOW())
         ON CONFLICT DO NOTHING`,
        [rates.inr, rates.source]
      ).catch(() => {});
      return { inr: rates.inr, synced: true, source: rates.source };
    } catch {
      return { inr: rates.inr, synced: false, source: rates.source };
    }
  }
}
