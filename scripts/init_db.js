"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const index_js_1 = require("../src/db/index.js");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
async function runInitDb() {
    console.log('--- Initializing SAIL MARINEX Database Schema (PostgreSQL 16+) ---');
    const client = await index_js_1.pool.connect();
    try {
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        const sql = fs_1.default.readFileSync(schemaPath, 'utf8');
        console.log('Executing schema.sql...');
        await client.query(sql);
        console.log('Successfully applied database extensions, tables, views, and indexes.');
    }
    catch (error) {
        console.error('Error applying database schema:', error);
        process.exit(1);
    }
    finally {
        client.release();
        await index_js_1.pool.end();
    }
}
runInitDb();
