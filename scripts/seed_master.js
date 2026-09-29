"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const argon2_1 = __importDefault(require("argon2"));
const index_js_1 = require("../src/db/index.js");
async function seedMaster() {
    console.log('--- Seeding SAIL MARINEX Master Data ---');
    const client = await index_js_1.pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Continents
        const continents = [
            { code: 'AS', name: 'Asia' },
            { code: 'OC', name: 'Oceania' },
            { code: 'NA', name: 'North America' },
            { code: 'AF', name: 'Africa' },
            { code: 'EU', name: 'Europe' }
        ];
        for (const c of continents) {
            await client.query(`INSERT INTO continents (code, name) VALUES ($1, $2) ON CONFLICT (code) DO UPDATE SET name = $2`, [c.code, c.name]);
        }
        // 2. Countries (India, Australia, USA, Mozambique, Russia, Indonesia)
        const countries = [
            { iso2: 'IN', iso3: 'IND', name: 'India', cont: 'AS' },
            { iso2: 'AU', iso3: 'AUS', name: 'Australia', cont: 'OC' },
            { iso2: 'US', iso3: 'USA', name: 'United States', cont: 'NA' },
            { iso2: 'MZ', iso3: 'MOZ', name: 'Mozambique', cont: 'AF' },
            { iso2: 'RU', iso3: 'RUS', name: 'Russia', cont: 'EU' },
            { iso2: 'ID', iso3: 'IDN', name: 'Indonesia', cont: 'AS' }
        ];
        for (const cnt of countries) {
            const contRes = await client.query(`SELECT id FROM continents WHERE code = $1`, [cnt.cont]);
            const continentId = contRes.rows[0]?.id;
            await client.query(`INSERT INTO countries (iso2, iso3, name, continent_id, is_maritime_nation) 
         VALUES ($1, $2, $3, $4, TRUE) 
         ON CONFLICT (iso3) DO UPDATE SET name = $3`, [cnt.iso2, cnt.iso3, cnt.name, continentId]);
        }
        // 3. Currencies
        const currencies = [
            { code: 'USD', name: 'United States Dollar', symbol: '$' },
            { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
            { code: 'EUR', name: 'Euro', symbol: '€' }
        ];
        for (const cur of currencies) {
            await client.query(`INSERT INTO currencies (code, name, symbol) VALUES ($1, $2, $3) 
         ON CONFLICT (code) DO NOTHING`, [cur.code, cur.name, cur.symbol]);
        }
        // 4. Units
        const unitCats = [
            { name: 'WEIGHT', desc: 'Mass and deadweight measurements' },
            { name: 'RATE', desc: 'Freight tariffs and financial rates' },
            { name: 'DISTANCE', desc: 'Maritime nautical measurements' }
        ];
        for (const uc of unitCats) {
            await client.query(`INSERT INTO unit_categories (category_name, description) VALUES ($1, $2) ON CONFLICT (category_name) DO NOTHING`, [uc.name, uc.desc]);
        }
        const units = [
            { code: 'MT', name: 'Metric Ton', cat: 'WEIGHT', sym: 'MT' },
            { code: 'DWT', name: 'Deadweight Tonnage', cat: 'WEIGHT', sym: 'DWT' },
            { code: 'USD/MT', name: 'US Dollars per Metric Ton', cat: 'RATE', sym: '$/MT' },
            { code: 'USD/DAY', name: 'US Dollars per Day', cat: 'RATE', sym: '$/Day' },
            { code: 'NM', name: 'Nautical Miles', cat: 'DISTANCE', sym: 'NM' }
        ];
        for (const u of units) {
            const catRes = await client.query(`SELECT id FROM unit_categories WHERE category_name = $1`, [u.cat]);
            await client.query(`INSERT INTO units (category_id, unit_code, unit_name, symbol) VALUES ($1, $2, $3, $4) ON CONFLICT (unit_code) DO NOTHING`, [catRes.rows[0]?.id, u.code, u.name, u.sym]);
        }
        // 5. EXACTLY SIX SYSTEM ROLES
        console.log('Seeding exactly 6 system roles...');
        const roles = [
            { name: 'SUPER_ADMIN', display: 'Platform Super Administrator', desc: 'Full unrestricted platform access' },
            { name: 'ADMIN', display: 'Organization Administrator', desc: 'Manage organization users and settings' },
            { name: 'CHARTERING_MANAGER', display: 'Chartering Manager', desc: 'Chartering Command Center: vessel chartering and freight optimization' },
            { name: 'PROCUREMENT_MANAGER', display: 'Procurement Manager', desc: 'Procurement Intelligence Center: cargo requirements and contracts' },
            { name: 'PORT_MANAGER', display: 'Port Manager', desc: 'Port Operations Control Center: infrastructure and port constraints' },
            { name: 'ANALYST', display: 'Freight & Decision Analyst', desc: 'Freight & Data Intelligence Center: forecasts, ML, and scenario modeling' },
        ];
        for (const r of roles) {
            await client.query(`INSERT INTO roles (role_name, display_name, description, is_system_role)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (role_name) DO UPDATE SET display_name = $2, description = $3`, [r.name, r.display, r.desc]);
        }
        // 6. Vessel Classes
        const vClasses = [
            { code: 'HANDYSIZE', name: 'Handysize', min: 10000, max: 39999, beam: 28.0, loa: 180.0 },
            { code: 'SUPRAMAX', name: 'Supramax', min: 50000, max: 60000, beam: 32.2, loa: 190.0 },
            { code: 'ULTRAMAX', name: 'Ultramax', min: 60001, max: 68000, beam: 32.3, loa: 200.0 },
            { code: 'PANAMAX', name: 'Panamax', min: 65000, max: 80000, beam: 32.2, loa: 225.0 },
            { code: 'KAMSARMAX', name: 'Kamsarmax', min: 80001, max: 85000, beam: 32.26, loa: 229.0 },
            { code: 'POST_PANAMAX', name: 'Post-Panamax', min: 85001, max: 110000, beam: 38.0, loa: 240.0 },
            { code: 'CAPESIZE', name: 'Capesize', min: 120000, max: 200000, beam: 45.0, loa: 290.0 },
            { code: 'NEWCASTLEMAX', name: 'Newcastlemax', min: 205000, max: 215000, beam: 50.0, loa: 300.0 },
            { code: 'MINI_CAPE', name: 'Mini-Cape', min: 100000, max: 119999, beam: 40.0, loa: 255.0 },
        ];
        for (const vc of vClasses) {
            await client.query(`INSERT INTO vessel_classes (class_code, class_name, min_dwt_mt, max_dwt_mt, typical_beam_m, typical_loa_m)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (class_code) DO NOTHING`, [vc.code, vc.name, vc.min, vc.max, vc.beam, vc.loa]);
        }
        // 7. Bulk Cargo Types
        const cargoCatRes = await client.query(`INSERT INTO cargo_categories (category_code, category_name) VALUES ('DRY_BULK', 'Dry Bulk Commodities') ON CONFLICT (category_code) DO UPDATE SET category_name = 'Dry Bulk Commodities' RETURNING id`);
        const cargoCatId = cargoCatRes.rows[0].id;
        const cargos = [
            { code: 'COKING_COAL', name: 'Coking Coal (Metallurgical)' },
            { code: 'STEAM_COAL', name: 'Thermal / Steam Coal' },
            { code: 'IRON_ORE_FINED', name: 'Iron Ore Fines' },
            { code: 'IRON_ORE_LUMP', name: 'Iron Ore Lumps' },
            { code: 'LIMESTONE', name: 'Limestone Flux' },
            { code: 'PETCOKE', name: 'Petroleum Coke' },
            { code: 'BAUXITE', name: 'Bauxite' },
        ];
        for (const cg of cargos) {
            await client.query(`INSERT INTO cargo_types (category_id, cargo_code, cargo_name) VALUES ($1, $2, $3) ON CONFLICT (cargo_code) DO NOTHING`, [cargoCatId, cg.code, cg.name]);
        }
        // 8. Freight Types & Rate Types
        const fTypes = [
            { code: 'SPOT_FREIGHT', name: 'Spot Freight' },
            { code: 'VOYAGE_CHARTER', name: 'Voyage Charter' },
            { code: 'TIME_CHARTER', name: 'Time Charter' },
            { code: 'COA', name: 'Contract of Affreightment' },
            { code: 'MULTI_VOYAGE', name: 'Multi-Voyage Commitment' }
        ];
        for (const ft of fTypes) {
            await client.query(`INSERT INTO freight_types (type_code, type_name) VALUES ($1, $2) ON CONFLICT (type_code) DO NOTHING`, [ft.code, ft.name]);
        }
        const frTypes = [
            { code: 'USD_PER_MT', name: 'US Dollars per Metric Ton' },
            { code: 'USD_PER_DAY', name: 'US Dollars per Day' },
            { code: 'LUMP_SUM', name: 'Lump Sum Freight' },
            { code: 'WORLD_SCALE', name: 'Worldscale Rate' }
        ];
        for (const frt of frTypes) {
            await client.query(`INSERT INTO freight_rate_types (rate_type_code, rate_type_name) VALUES ($1, $2) ON CONFLICT (rate_type_code) DO NOTHING`, [frt.code, frt.name]);
        }
        // 9. Target East Coast India Ports (Master Records)
        const indRes = await client.query(`SELECT id FROM countries WHERE iso3 = 'IND'`);
        const indId = indRes.rows[0]?.id;
        const eastCoastPorts = [
            { name: 'Paradip', un: 'INPRT', lat: 20.2644, lon: 86.6711, state: 'Odisha' },
            { name: 'Visakhapatnam', un: 'INVTZ', lat: 17.6868, lon: 83.2185, state: 'Andhra Pradesh' },
            { name: 'Gangavaram', un: 'INGAV', lat: 17.6167, lon: 83.2333, state: 'Andhra Pradesh' },
            { name: 'Gopalpur', un: 'INGPR', lat: 19.3000, lon: 84.9667, state: 'Odisha' },
            { name: 'Dhamra', un: 'INDHM', lat: 20.8000, lon: 86.9667, state: 'Odisha' },
            { name: 'Sagar / Sandheads', un: 'INSAG', lat: 21.6500, lon: 88.0500, state: 'West Bengal' },
            { name: 'Haldia', un: 'INHAL', lat: 22.0200, lon: 88.0600, state: 'West Bengal' }
        ];
        for (const p of eastCoastPorts) {
            await client.query(`INSERT INTO ports (port_name, official_name, un_locode, country_id, state, latitude, longitude, location_geog, is_east_coast_india, status, is_synthetic)
         VALUES ($1, $1 || ' Port', $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography, TRUE, 'OPERATIONAL', FALSE)
         ON CONFLICT (un_locode) DO NOTHING`, [p.name, p.un, indId, p.state, p.lat, p.lon]);
        }
        // 10. Default Organization: Steel Authority of India Limited (SAIL)
        const sailOrgRes = await client.query(`INSERT INTO organizations (organization_code, legal_name, display_name, organization_type, industry, status)
       VALUES ('SAIL-HQ', 'Steel Authority of India Limited', 'SAIL', 'ENTERPRISE', 'Steel Manufacturing & Logistics', 'ACTIVE')
       ON CONFLICT (organization_code) DO UPDATE SET display_name = 'SAIL' RETURNING id`);
        const orgId = sailOrgRes.rows[0].id;
        // 11. Super Admin User
        const superAdminEmail = 'superadmin@marinex.sail.in';
        const hash = await argon2_1.default.hash('SailAdmin@2026Secure!');
        const userRes = await client.query(`INSERT INTO users (organization_id, employee_code, first_name, last_name, display_name, email, status)
       VALUES ($1, 'SAIL-SA-001', 'Platform', 'Administrator', 'SAIL Super Admin', $2, 'ACTIVE')
       ON CONFLICT (email) DO UPDATE SET display_name = 'SAIL Super Admin' RETURNING id`, [orgId, superAdminEmail]);
        const userId = userRes.rows[0].id;
        await client.query(`INSERT INTO user_credentials (user_id, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET password_hash = $2`, [userId, hash]);
        const superAdminRoleRes = await client.query(`SELECT id FROM roles WHERE role_name = 'SUPER_ADMIN'`);
        const superAdminRoleId = superAdminRoleRes.rows[0].id;
        await client.query(`INSERT INTO user_roles (user_id, role_id, organization_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, role_id, organization_id) DO NOTHING`, [userId, superAdminRoleId, orgId]);
        await client.query('COMMIT');
        console.log('Successfully seeded SAIL MARINEX master data & 6 primary roles.');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Master seed failed:', error);
        process.exit(1);
    }
    finally {
        client.release();
        await index_js_1.pool.end();
    }
}
seedMaster();
