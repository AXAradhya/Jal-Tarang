/**
 * JAL TARANG — Decision Engine Zod Validation Schemas
 */

import { z } from 'zod';

export const decisionAnalyzeSchema = z.object({
  vesselId: z.string().optional(),
  loadingPortId: z.string().min(1, 'loadingPortId is required'),
  dischargingPortId: z.string().min(1, 'dischargingPortId is required'),
  cargoTypeId: z.string().optional(),
  cargoQuantityMt: z.coerce.number().positive('cargoQuantityMt must be a positive number'),
  laycanStart: z.string().optional(),
  laycanEnd: z.string().optional(),
  freightRateOverrideUsd: z.coerce.number().positive().optional(),
  bunkerPriceOverrideUsd: z.coerce.number().positive().optional(),
  speedKnotsOverride: z.coerce.number().positive().optional(),
  includeScenarios: z.boolean().default(true).optional(),
  includeForecasts: z.boolean().default(true).optional(),
});
