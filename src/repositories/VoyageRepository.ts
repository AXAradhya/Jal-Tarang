/**
 * JAL TARANG — Voyage Repository
 * Encapsulates all data access for voyages, fixtures, sailing schedules, and economics.
 */

import { pool } from '../db/index.js';

export interface VoyageRecord {
  id: string;
  voyage_number: string;
  vessel_name?: string;
  load_port_name?: string;
  discharge_port_name?: string;
  cargo_name?: string;
  status: string;
  eta?: string;
  etd?: string;
  created_at: string;
}

export class VoyageRepository {
  public static async list(limit: number = 50): Promise<VoyageRecord[]> {
    const res = await pool.query(
      `SELECT v.id, v.voyage_number, v.status, v.eta, v.etd, v.created_at,
              ves.vessel_name,
              lp.port_name AS load_port_name,
              dp.port_name AS discharge_port_name,
              ct.cargo_type_name AS cargo_name
       FROM voyages v
       LEFT JOIN vessels ves ON ves.id = v.vessel_id
       LEFT JOIN ports lp ON lp.id = v.load_port_id
       LEFT JOIN ports dp ON dp.id = v.discharge_port_id
       LEFT JOIN cargo_types ct ON ct.id = v.cargo_type_id
       WHERE v.deleted_at IS NULL
       ORDER BY v.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }

  public static async findById(id: string): Promise<VoyageRecord | null> {
    const res = await pool.query(
      `SELECT v.*,
              ves.vessel_name,
              lp.port_name AS load_port_name,
              dp.port_name AS discharge_port_name,
              ct.cargo_type_name AS cargo_name
       FROM voyages v
       LEFT JOIN vessels ves ON ves.id = v.vessel_id
       LEFT JOIN ports lp ON lp.id = v.load_port_id
       LEFT JOIN ports dp ON dp.id = v.discharge_port_id
       LEFT JOIN cargo_types ct ON ct.id = v.cargo_type_id
       WHERE v.id = $1 AND v.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  public static async findByVessel(vesselId: string, limit: number = 20): Promise<any[]> {
    const res = await pool.query(
      `SELECT v.* FROM voyages v WHERE v.vessel_id = $1 ORDER BY v.created_at DESC LIMIT $2`,
      [vesselId, limit]
    );
    return res.rows;
  }
}
