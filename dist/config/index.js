"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    env: process.env.APP_ENV || 'development',
    port: parseInt(process.env.PORT || '8000', 10),
    apiPrefix: process.env.API_V1_PREFIX || '/api/v1',
    database: {
        connectionString: process.env.DATABASE_URL_SYNC || 'postgresql://sail_marinex:marinex_secure_pass@localhost:5432/sail_marinex_db',
        poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://:redis_secure_pass@localhost:6379/0',
    },
    jwt: {
        secret: (() => {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                throw new Error('FATAL: JWT_SECRET environment variable must be explicitly defined in environment.');
            }
            return secret;
        })(),
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE_MINUTES ? `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES}m` : '60m',
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRE_DAYS ? `${process.env.REFRESH_TOKEN_EXPIRE_DAYS}d` : '14d',
    },
    security: {
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
        lockoutMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
    },
    openRouter: {
        apiKey: process.env.OPENROUTER_API_KEY || '',
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        fallbackModel: process.env.OPENROUTER_FALLBACK_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
        apiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
    },
    mlService: {
        url: process.env.ML_SERVICE_URL || 'http://localhost:8001',
        timeoutMs: parseInt(process.env.ML_SERVICE_TIMEOUT_MS || '10000', 10),
    },
};
//# sourceMappingURL=index.js.map