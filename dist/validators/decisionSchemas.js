"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decisionAnalyzeSchema = void 0;
const zod_1 = require("zod");
exports.decisionAnalyzeSchema = zod_1.z.object({
    vesselId: zod_1.z.string().optional(),
    loadingPortId: zod_1.z.string().min(1, 'loadingPortId is required'),
    dischargingPortId: zod_1.z.string().min(1, 'dischargingPortId is required'),
    cargoTypeId: zod_1.z.string().optional(),
    cargoQuantityMt: zod_1.z.coerce.number().positive('cargoQuantityMt must be a positive number'),
    laycanStart: zod_1.z.string().optional(),
    laycanEnd: zod_1.z.string().optional(),
    freightRateOverrideUsd: zod_1.z.coerce.number().positive().optional(),
    bunkerPriceOverrideUsd: zod_1.z.coerce.number().positive().optional(),
    speedKnotsOverride: zod_1.z.coerce.number().positive().optional(),
    includeScenarios: zod_1.z.boolean().default(true).optional(),
    includeForecasts: zod_1.z.boolean().default(true).optional(),
});
//# sourceMappingURL=decisionSchemas.js.map