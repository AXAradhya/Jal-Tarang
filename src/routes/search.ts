/**
 * JAL TARANG - Global Maritime Search API
 * Full-text and trigram multi-entity search across ports, vessels, freight codes, cargo, and voyages.
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/search - Global search across all maritime domains
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.status(400).json({ success: false, error: { code: 'QUERY_TOO_SHORT', message: 'Search term must be at least 2 characters' } });
  }
  if (q.trim().length > 200) {
    return res.status(400).json({ success: false, error: { code: 'QUERY_TOO_LONG', message: 'Search term must not exceed 200 characters' } });
  }

  const searchTerm = `%${q.trim()}%`;

  try {
    // 1. Search Ports
    const ports = await pool.query(
      `SELECT 'PORT' as entity_type, id, code, name as title, country_id,
              CONCAT('Port in East Coast / Global, Code: ', code) as description
       FROM ports
       WHERE code ILIKE $1 OR name ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    // 2. Search Vessels
    const vessels = await pool.query(
      `SELECT 'VESSEL' as entity_type, id, imo_number as code, name as title,
              CONCAT(vessel_class, ' | DWT: ', dwt, ' | Flag: ', flag) as description
       FROM vessels
       WHERE name ILIKE $1 OR imo_number ILIKE $1 OR mmsi ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    // 3. Search Freight Codes
    const freightCodes = await pool.query(
      `SELECT 'FREIGHT_CODE' as entity_type, id, code, description as title,
              CONCAT('Origin: ', origin_code, ' -> Dest: ', destination_code, ' [', vessel_class_code, ']') as description
       FROM freight_codes
       WHERE code ILIKE $1 OR description ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    // 4. Search Cargo Types
    const cargoTypes = await pool.query(
      `SELECT 'CARGO' as entity_type, id, code, name as title,
              CONCAT('Bulk Category: ', cargo_category_id) as description
       FROM cargo_types
       WHERE code ILIKE $1 OR name ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    // 5. Search Contracts & Charters (strictly scoped to user organization)
    const user = (req as any).user;
    const userOrgId = user?.organizationId || 'org-sail-corp';
    const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
    const contractsQuery = isSuperAdmin
      ? `SELECT 'CONTRACT' as entity_type, id, contract_number as code,
              CONCAT('Contract #', contract_number) as title,
              CONCAT(contract_type, ' | Status: ', status, ' | Rate: $', rate_usd) as description
         FROM contracts
         WHERE contract_number ILIKE $1
         LIMIT 10`
      : `SELECT 'CONTRACT' as entity_type, id, contract_number as code,
              CONCAT('Contract #', contract_number) as title,
              CONCAT(contract_type, ' | Status: ', status, ' | Rate: $', rate_usd) as description
         FROM contracts
         WHERE contract_number ILIKE $1 AND organization_id = $2
         LIMIT 10`;
    const contractsParams = isSuperAdmin ? [searchTerm] : [searchTerm, userOrgId];
    const contracts = await pool.query(contractsQuery, contractsParams);

    // 6. Search Maritime Routes
    const routes = await pool.query(
      `SELECT 'ROUTE' as entity_type, id, code, name as title,
              CONCAT('Distance: ', distance_nm, ' NM | Duration: ', typical_duration_days, ' days') as description
       FROM routes
       WHERE code ILIKE $1 OR name ILIKE $1
       LIMIT 10`,
      [searchTerm]
    );

    const merged = [
      ...ports.rows,
      ...vessels.rows,
      ...freightCodes.rows,
      ...cargoTypes.rows,
      ...contracts.rows,
      ...routes.rows
    ];

    return res.json({
      success: true,
      data: {
        query: q,
        totalMatches: merged.length,
        results: merged
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SEARCH_FAILED', message: err.message } });
  }
});

export default router;
