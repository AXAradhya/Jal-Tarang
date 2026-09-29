import pg from 'pg';
import { config } from '../config/index.js';
const { Pool } = pg;
export const pool = new Pool({
    connectionString: config.database.connectionString,
    max: config.database.poolSize,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL client error:', err);
});
export const query = async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    return res;
};
export const getClient = async () => {
    return await pool.connect();
};
