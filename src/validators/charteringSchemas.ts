/**
 * JAL TARANG — Chartering Zod Validation Schemas
 */

import { z } from 'zod';

export const createCharterRequirementSchema = z.object({
  charterType: z.enum(['VOYAGE', 'TIME', 'COA', 'BAREBOAT']).default('VOYAGE'),
  loadingPortId: z.string().min(1, 'loadingPortId is required'),
  dischargingPortId: z.string().min(1, 'dischargingPortId is required'),
  cargoQuantityMt: z.coerce.number().positive('cargoQuantityMt must be positive'),
  cargoTypeId: z.string().optional(),
  laycanStartDate: z.string().optional(),
  laycanEndDate: z.string().optional(),
  maxBudgetUsd: z.coerce.number().positive().optional(),
  preferredVesselClass: z.string().optional(),
  notes: z.string().max(5000).optional(),
});

export const updateCharterStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'ACTIVE', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
  remarks: z.string().max(1000).optional(),
});
