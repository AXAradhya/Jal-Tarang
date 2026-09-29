"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCharterStatusSchema = exports.createCharterRequirementSchema = void 0;
const zod_1 = require("zod");
exports.createCharterRequirementSchema = zod_1.z.object({
    charterType: zod_1.z.enum(['VOYAGE', 'TIME', 'COA', 'BAREBOAT']).default('VOYAGE'),
    loadingPortId: zod_1.z.string().min(1, 'loadingPortId is required'),
    dischargingPortId: zod_1.z.string().min(1, 'dischargingPortId is required'),
    cargoQuantityMt: zod_1.z.coerce.number().positive('cargoQuantityMt must be positive'),
    cargoTypeId: zod_1.z.string().optional(),
    laycanStartDate: zod_1.z.string().optional(),
    laycanEndDate: zod_1.z.string().optional(),
    maxBudgetUsd: zod_1.z.coerce.number().positive().optional(),
    preferredVesselClass: zod_1.z.string().optional(),
    notes: zod_1.z.string().max(5000).optional(),
});
exports.updateCharterStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['DRAFT', 'SUBMITTED', 'ACTIVE', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
    remarks: zod_1.z.string().max(1000).optional(),
});
//# sourceMappingURL=charteringSchemas.js.map