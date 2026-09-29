/**
 * JAL TARANG — Procurement & Vessel Zod Validation Schemas
 */

import { z } from 'zod';

export const createProcurementRequirementSchema = z.object({
  plantId: z.string().min(1, 'plantId is required'),
  cargoTypeId: z.string().min(1, 'cargoTypeId is required'),
  quantityRequiredMt: z.coerce.number().positive('quantityRequiredMt must be positive'),
  requiredDeliveryDate: z.string().optional(),
  targetPriceUsdMt: z.coerce.number().positive().optional(),
  incoterms: z.enum(['FOB', 'CFR', 'CIF', 'EXW']).default('FOB'),
  notes: z.string().max(5000).optional(),
});

export const createVesselSchema = z.object({
  imoNumber: z.string().min(7).max(10),
  vesselName: z.string().min(1).max(255),
  callSign: z.string().max(20).optional(),
  mmsiNumber: z.string().max(20).optional(),
  vesselType: z.string().default('BULK_CARRIER'),
  vesselClass: z.string().optional(),
  deadweightTonnes: z.coerce.number().positive(),
  grossTonnage: z.coerce.number().positive().optional(),
  netTonnage: z.coerce.number().positive().optional(),
  lengthOverallM: z.coerce.number().positive().optional(),
  beamM: z.coerce.number().positive().optional(),
  summerDraftM: z.coerce.number().positive().optional(),
  yearBuilt: z.coerce.number().int().min(1950).max(2100).optional(),
  flagCountryIso2: z.string().length(2).optional(),
  status: z.string().default('ACTIVE'),
});

export const vesselFeasibilitySchema = z.object({
  vesselId: z.string().min(1, 'vesselId is required'),
  portId: z.string().min(1, 'portId is required'),
  cargoQuantityMt: z.coerce.number().positive().optional(),
});
