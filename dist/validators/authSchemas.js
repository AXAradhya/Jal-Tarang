"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.changePasswordSchema = exports.refreshSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10, 'refreshToken is required'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(10, 'Reset token is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
});
//# sourceMappingURL=authSchemas.js.map