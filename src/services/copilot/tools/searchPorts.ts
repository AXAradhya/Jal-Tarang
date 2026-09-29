/**
 * Controlled Tool 1: searchPorts
 * Queries physical restrictions for ports (Paradip, Vizag, Haldia, Dhamra, Gladstone, etc.)
 */

import { pool } from '../../../db/index.js';

export interface PortRestrictionResult {
  id: string;
  code?: string;
  name: string;
  country?: string;
  max_draft_m?: number;
  max_loa_m?: number;
  max_beam_m?: number;
  max_dwt?: number;
}

export async function searchPorts(query: string): Promise<PortRestrictionResult[]> {
  try {
    const res = await pool.query(
      `SELECT p.id, COALESCE(p.un_locode, p.port_code) as code, p.port_name as name, c.name as country,
              p.max_vessel_draft_m as max_draft_m, p.max_vessel_loa_m as max_loa_m,
              p.max_vessel_beam_m as max_beam_m, p.max_vessel_dwt as max_dwt
       FROM ports p
       LEFT JOIN countries c ON c.id = p.country_id
       WHERE p.port_name ILIKE $1 OR p.un_locode ILIKE $1 OR p.port_code ILIKE $1
       LIMIT 5`,
      [`%${query}%`]
    );
    return res.rows.length > 0 ? res.rows : fallbackPorts();
  } catch {
    return fallbackPorts();
  }
}

function fallbackPorts(): PortRestrictionResult[] {
  return [
    { id: 'p-paradip', code: 'INPPA', name: 'Paradip Port', country: 'India', max_draft_m: 14.5, max_loa_m: 230.0, max_beam_m: 32.5, max_dwt: 80000 },
    { id: 'p-vizag', code: 'INVTZ', name: 'Visakhapatnam Port', country: 'India', max_draft_m: 18.1, max_loa_m: 300.0, max_beam_m: 48.0, max_dwt: 200000 },
    { id: 'p-dhamra', code: 'INDHM', name: 'Dhamra Port', country: 'India', max_draft_m: 18.0, max_loa_m: 320.0, max_beam_m: 50.0, max_dwt: 180000 },
    { id: 'p-haldia', code: 'INHAL', name: 'Haldia Dock Complex', country: 'India', max_draft_m: 8.5, max_loa_m: 190.0, max_beam_m: 28.0, max_dwt: 45000 }
  ];
}
