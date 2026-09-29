/**
 * JAL TARANG — Common Zod Validation Schemas
 */

import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

export const searchSchema = z.object({
  search: z.string().max(255).optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1).max(128),
});
