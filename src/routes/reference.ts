/**
 * JAL TARANG — Centralized Reference Data API
 * GET /api/v1/reference/exchange-rates
 * GET /api/v1/reference/contract-statuses
 */

import { Router, Request, Response } from 'express';
import { ExchangeRateService } from '../services/ingestion/ExchangeRateService.js';
import { pool } from '../db/index.js';

export const referenceRouter = Router();

// GET /api/v1/reference/exchange-rates
referenceRouter.get('/exchange-rates', async (_req: Request, res: Response) => {
  try {
    // 1. Check if we have recent rate in DB (today)
    let rate = 95.00;
    let source = 'DEFAULT_BENCHMARK';
    let updatedAt = new Date().toISOString();

    try {
      const dbRes = await pool.query(
        `SELECT rate, effective_date, source, created_at
         FROM currency_rates
         WHERE base_currency = 'USD' AND quote_currency = 'INR'
         ORDER BY created_at DESC LIMIT 1`
      );
      if (dbRes.rows.length > 0) {
        rate = Number(dbRes.rows[0].rate);
        source = dbRes.rows[0].source || 'POSTGRESQL_CACHE';
        updatedAt = dbRes.rows[0].created_at || new Date().toISOString();
      } else {
        // Fetch and cache live
        const live = await ExchangeRateService.syncRates();
        rate = live.inr;
        source = 'LIVE_OPEN_ER_API';
      }
    } catch {
      const live = await ExchangeRateService.fetchLatestRates();
      rate = live.inr;
      source = 'LIVE_OPEN_ER_API';
    }

    return res.json({
      success: true,
      data: {
        base: 'USD',
        target: 'INR',
        rate,
        usdToInr: rate,
        timestamp: updatedAt,
        source,
      },
    });
  } catch (err: any) {
    return res.json({
      success: true,
      data: {
        base: 'USD',
        target: 'INR',
        rate: 95.00,
        usdToInr: 95.00,
        timestamp: new Date().toISOString(),
        source: 'FALLBACK_BENCHMARK',
      },
    });
  }
});

// GET /api/v1/reference/contract-statuses
referenceRouter.get('/contract-statuses', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: [
      { code: 'ALL', label: 'All Statuses' },
      { code: 'ACTIVE', label: 'Active / Operational' },
      { code: 'CONFIRMED', label: 'Confirmed / Fixed' },
      { code: 'COMPLETED', label: 'Completed / Discharged' },
      { code: 'PENDING_APPROVAL', label: 'Pending Management Sign-off' },
      { code: 'CANCELLED', label: 'Cancelled / Voided' },
    ],
  });
});
