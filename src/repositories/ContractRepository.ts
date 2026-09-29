/**
 * JAL TARANG — Contract, User & Organization Repositories
 */

import { pool } from '../db/index.js';

export class ContractRepository {
  public static async findByOrg(orgId: string, limit: number = 20) {
    const res = await pool.query(
      `SELECT c.*, v.vessel_name, lp.port_name AS load_port_name, dp.port_name AS disch_port_name
       FROM contracts c
       LEFT JOIN vessels v ON v.id = c.vessel_id
       LEFT JOIN ports lp ON lp.id = c.loading_port_id
       LEFT JOIN ports dp ON dp.id = c.discharging_port_id
       WHERE c.organization_id = $1
       ORDER BY c.created_at DESC LIMIT $2`,
      [orgId, limit]
    );
    return res.rows;
  }
}

export class UserRepository {
  public static async findById(id: string) {
    const res = await pool.query(
      `SELECT u.id, u.organization_id, u.email, u.first_name, u.last_name, u.display_name, u.status
       FROM users u WHERE u.id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  public static async findByEmail(email: string) {
    const res = await pool.query(
      `SELECT u.id, u.organization_id, u.email, u.first_name, u.last_name, u.display_name, u.status
       FROM users u WHERE LOWER(u.email) = LOWER($1) LIMIT 1`,
      [email]
    );
    return res.rows[0] || null;
  }
}

export class OrganizationRepository {
  public static async findById(id: string) {
    const res = await pool.query(
      `SELECT o.* FROM organizations o WHERE o.id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }
}
