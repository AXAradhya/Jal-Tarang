import dotenv from 'dotenv';
dotenv.config();
export const config = {
    env: process.env.APP_ENV || 'development',
    port: parseInt(process.env.PORT || '8000', 10),
    apiPrefix: process.env.API_V1_PREFIX || '/api/v1',
    // PostgreSQL Database
    database: {
        connectionString: process.env.DATABASE_URL_SYNC || 'postgresql://sail_marinex:marinex_secure_pass@localhost:5432/sail_marinex_db',
        poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
    },
    // Redis
    redis: {
        url: process.env.REDIS_URL || 'redis://:redis_secure_pass@localhost:6379/0',
    },
    // JWT Security
    jwt: {
        secret: process.env.JWT_SECRET || 'sail_marinex_super_secure_jwt_secret_key_change_in_prod_2026_min_32_chars',
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE_MINUTES ? `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES}m` : '60m',
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRE_DAYS ? `${process.env.REFRESH_TOKEN_EXPIRE_DAYS}d` : '14d',
    },
    // Security Thresholds
    security: {
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
        lockoutMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
    }
};
