"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.searchSchema = exports.paginationSchema = void 0;
const zod_1 = require("zod");
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(25),
});
exports.searchSchema = zod_1.z.object({
    search: zod_1.z.string().max(255).optional(),
});
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().min(1).max(128),
});
//# sourceMappingURL=commonSchemas.js.map