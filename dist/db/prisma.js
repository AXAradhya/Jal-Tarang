"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const index_js_1 = require("../config/index.js");
exports.prisma = globalThis.prismaClientGlobal ??
    new client_1.PrismaClient({
        log: index_js_1.config.env === 'development' ? ['warn', 'error'] : ['error'],
    });
if (index_js_1.config.env !== 'production') {
    globalThis.prismaClientGlobal = exports.prisma;
}
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map