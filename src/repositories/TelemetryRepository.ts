/**
 * JAL TARANG — Telemetry Repository
 * Encapsulates all data access for live AIS vessel tracking and positions.
 */

import { pool } from '../db/index.js';

export interface TelemetryRecord {
  id?: string;
  vessel_id?: string;
  vessel_name?: string;
  mmsi: string;
  imo_number?: string;
  latitude: number;
  longitude: number;
  speed_knots: number;
  heading_deg: number;
  timestamp_utc: string;
}

export class TelemetryRepository {
  public static async getLatestForVessel(vesselId: string): Promise<TelemetryRecord | null> {
    const res = await pool.query(
      `SELECT t.*, v.vessel_name
       FROM live_vessel_telemetry t
       LEFT JOIN vessels v ON v.id = t.vessel_id
       WHERE t.vessel_id = $1
       ORDER BY t.timestamp_utc DESC
       LIMIT 1`,
      [vesselId]
    );
    return res.rows[0] || null;
  }

  public static async getAllActiveVesselPositions(): Promise<TelemetryRecord[]> {
    const res = await pool.query(
      `SELECT v.id AS vessel_id, v.vessel_name, v.imo_number,
              v.current_position_lat AS latitude,
              v.current_position_lon AS longitude,
              v.current_speed_knots AS speed_knots,
              v.current_heading_deg AS heading_deg,
              v.last_position_update AS timestamp_utc,
              v.current_status
       FROM vessels v
       WHERE v.deleted_at IS NULL AND v.current_position_lat IS NOT NULL
       ORDER BY v.vessel_name ASC`
    );
    return res.rows as any;
  }
}
