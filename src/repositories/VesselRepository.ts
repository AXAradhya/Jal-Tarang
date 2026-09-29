/**
 * JAL TARANG — Vessel Repository
 * Encapsulates all data access for fleet management, vessels, and physical specifications.
 */

import { pool } from '../db/index.js';

export interface VesselRecord {
  id: string;
  imo_number: string;
  vessel_name: string;
  call_sign?: string;
  vessel_type?: string;
  vessel_class?: string;
  deadweight_tonnes: number;
  summer_draft_m?: number;
  length_overall_m?: number;
  beam_m?: number;
  status: string;
  organization_id?: string;
  is_verified?: boolean;
}

export class VesselRepository {
  public static async findById(id: string, orgId?: string): Promise<VesselRecord | null> {
    const res = await pool.query(
      `SELECT v.* FROM vessels v
       WHERE v.id = $1 AND ($2::text IS NULL OR v.organization_id = $2 OR v.is_verified = TRUE OR v.organization_id IS NULL)
       LIMIT 1`,
      [id, orgId || null]
    );
    return res.rows[0] || null;
  }

  public static async findAvailable(orgId?: string): Promise<VesselRecord[]> {
    const res = await pool.query(
      `SELECT v.* FROM vessels v
       WHERE v.status = 'AVAILABLE' AND ($1::text IS NULL OR v.organization_id = $1 OR v.is_verified = TRUE OR v.organization_id IS NULL)
       ORDER BY v.deadweight_tonnes DESC`,
      [orgId || null]
    );
    return res.rows;
  }

  public static async findByClass(vesselClass: string, orgId?: string): Promise<VesselRecord[]> {
    const res = await pool.query(
      `SELECT v.* FROM vessels v
       WHERE UPPER(v.vessel_class) = UPPER($1)
         AND ($2::text IS NULL OR v.organization_id = $2 OR v.is_verified = TRUE OR v.organization_id IS NULL)
       ORDER BY v.deadweight_tonnes DESC`,
      [vesselClass, orgId || null]
    );
    return res.rows;
  }
}
