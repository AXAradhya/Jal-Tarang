/**
 * JAL TARANG — Port Repository
 * Encapsulates all data access for ports, constraints, berths, and terminals.
 */

import { pool } from '../db/index.js';

export interface PortRecord {
  id: string;
  port_name: string;
  port_code?: string;
  un_locode?: string;
  latitude?: number;
  longitude?: number;
  max_vessel_loa_m?: number;
  max_vessel_beam_m?: number;
  max_vessel_draft_m?: number;
  max_vessel_dwt?: number;
  is_east_coast_india?: boolean;
  status?: string;
  country_name?: string;
}

export class PortRepository {
  public static async findById(id: string): Promise<PortRecord | null> {
    const res = await pool.query(
      `SELECT p.*, c.name AS country_name
       FROM ports p
       LEFT JOIN countries c ON c.id = p.country_id
       WHERE p.id = $1 AND p.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  public static async findEastCoast(): Promise<PortRecord[]> {
    const res = await pool.query(
      `SELECT p.id, p.port_name, p.port_code, p.un_locode, p.latitude, p.longitude,
              p.max_vessel_loa_m, p.max_vessel_beam_m, p.max_vessel_draft_m, p.max_vessel_dwt,
              p.annual_capacity_mt, p.status, p.is_major_port, p.tidal_window_hours
       FROM ports p
       WHERE p.is_east_coast_india = TRUE AND p.status = 'OPERATIONAL'
       ORDER BY p.port_name ASC`
    );
    return res.rows;
  }

  public static async search(query: string, limit: number = 20): Promise<PortRecord[]> {
    const res = await pool.query(
      `SELECT p.id, p.port_name, p.port_code, p.un_locode, p.latitude, p.longitude,
              p.max_vessel_loa_m, p.max_vessel_beam_m, p.max_vessel_draft_m, p.max_vessel_dwt,
              p.is_east_coast_india, c.name AS country_name
       FROM ports p
       LEFT JOIN countries c ON c.id = p.country_id
       WHERE p.port_name ILIKE $1 OR p.un_locode ILIKE $1
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return res.rows;
  }
}
