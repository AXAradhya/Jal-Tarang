import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runInitDb() {
  console.log('--- Initializing SAIL MARINEX Database Schema (PostgreSQL 16+) ---');
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    await client.query(sql);
    console.log('Successfully applied database extensions, tables, views, and indexes.');
  } catch (error) {
    console.error('Error applying database schema:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runInitDb();
