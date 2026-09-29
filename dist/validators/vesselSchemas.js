"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vesselFeasibilitySchema = exports.createVesselSchema = exports.createProcurementRequirementSchema = void 0;
const zod_1 = require("zod");
exports.createProcurementRequirementSchema = zod_1.z.object({
    plantId: zod_1.z.string().min(1, 'plantId is required'),
    cargoTypeId: zod_1.z.string().min(1, 'cargoTypeId is required'),
    quantityRequiredMt: zod_1.z.coerce.number().positive('quantityRequiredMt must be positive'),
    requiredDeliveryDate: zod_1.z.string().optional(),
    targetPriceUsdMt: zod_1.z.coerce.number().positive().optional(),
    incoterms: zod_1.z.enum(['FOB', 'CFR', 'CIF', 'EXW']).default('FOB'),
    notes: zod_1.z.string().max(5000).optional(),
});
exports.createVesselSchema = zod_1.z.object({
    imoNumber: zod_1.z.string().min(7).max(10),
    vesselName: zod_1.z.string().min(1).max(255),
    callSign: zod_1.z.string().max(20).optional(),
    mmsiNumber: zod_1.z.string().max(20).optional(),
    vesselType: zod_1.z.string().default('BULK_CARRIER'),
    vesselClass: zod_1.z.string().optional(),
    deadweightTonnes: zod_1.z.coerce.number().positive(),
    grossTonnage: zod_1.z.coerce.number().positive().optional(),
    netTonnage: zod_1.z.coerce.number().positive().optional(),
    lengthOverallM: zod_1.z.coerce.number().positive().optional(),
    beamM: zod_1.z.coerce.number().positive().optional(),
    summerDraftM: zod_1.z.coerce.number().positive().optional(),
    yearBuilt: zod_1.z.coerce.number().int().min(1950).max(2100).optional(),
    flagCountryIso2: zod_1.z.string().length(2).optional(),
    status: zod_1.z.string().default('ACTIVE'),
});
exports.vesselFeasibilitySchema = zod_1.z.object({
    vesselId: zod_1.z.string().min(1, 'vesselId is required'),
    portId: zod_1.z.string().min(1, 'portId is required'),
    cargoQuantityMt: zod_1.z.coerce.number().positive().optional(),
});
//# sourceMappingURL=vesselSchemas.js.map