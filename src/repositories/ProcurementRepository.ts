/**
 * JAL TARANG — Procurement Repository
 * Encapsulates all data access for raw material procurement requirements, tender awards, and plant stocks.
 */

import { pool } from '../db/index.js';

export interface ProcurementRecord {
  id: string;
  requirement_reference: string;
  commodity_name?: string;
  quantity_required_mt: number;
  quantity_procured_mt: number;
  destination_plant: string;
  required_delivery_date: string;
  status: string;
  priority: string;
  created_at: string;
}

export interface PlantStockRecord {
  id: string;
  plant: string;
  currentDays: number;
  safeBuffer: number;
  material: string;
  monthlyConsumptionMt: number;
  status: 'NORMAL' | 'WATCH' | 'CRITICAL';
  cushionDeltaDays: number;
}

export class ProcurementRepository {
  public static async list(limit: number = 50): Promise<ProcurementRecord[]> {
    const res = await pool.query(
      `SELECT pr.id, pr.requirement_reference, pr.quantity_required_mt, pr.quantity_procured_mt,
              pr.destination_plant, pr.required_delivery_date, pr.status, pr.priority, pr.created_at,
              c.commodity_name
       FROM procurement_requirements pr
       LEFT JOIN commodities c ON c.id = pr.commodity_id
       WHERE pr.deleted_at IS NULL
       ORDER BY pr.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }

  public static async findById(id: string): Promise<ProcurementRecord | null> {
    const res = await pool.query(
      `SELECT pr.*, c.commodity_name
       FROM procurement_requirements pr
       LEFT JOIN commodities c ON c.id = pr.commodity_id
       WHERE pr.id = $1 AND pr.deleted_at IS NULL
       LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  public static async findByOrg(orgId: string, limit: number = 20): Promise<any[]> {
    const res = await pool.query(
      `SELECT pr.*, ct.cargo_type_name
       FROM procurement_requirements pr
       LEFT JOIN cargo_types ct ON ct.id = pr.cargo_type_id
       WHERE pr.organization_id = $1
       ORDER BY pr.created_at DESC LIMIT $2`,
      [orgId, limit]
    );
    return res.rows;
  }

  public static async getPlantStock(): Promise<PlantStockRecord[]> {
    const plants = [
      { id: 'BSP', plant: 'Bhilai Steel Plant (BSP)', currentDays: 14.5, safeBuffer: 21, material: 'Coking Coal', monthlyConsumptionMt: 420000 },
      { id: 'BSL', plant: 'Bokaro Steel Plant (BSL)', currentDays: 23.0, safeBuffer: 21, material: 'Coking Coal', monthlyConsumptionMt: 360000 },
      { id: 'RSP', plant: 'Rourkela Steel Plant (RSP)', currentDays: 28.2, safeBuffer: 21, material: 'Iron Ore Fines', monthlyConsumptionMt: 290000 },
      { id: 'DSP', plant: 'Durgapur Steel Plant (DSP)', currentDays: 13.8, safeBuffer: 21, material: 'Coking Coal', monthlyConsumptionMt: 210000 },
      { id: 'ISP', plant: 'IISCO Steel Plant (ISP)', currentDays: 19.4, safeBuffer: 21, material: 'Coking Coal & Limestone', monthlyConsumptionMt: 180000 },
    ].map((p) => ({
      ...p,
      status: p.currentDays < 15 ? ('CRITICAL' as const) : p.currentDays < 21 ? ('WATCH' as const) : ('NORMAL' as const),
      cushionDeltaDays: +(p.currentDays - p.safeBuffer).toFixed(1),
    }));

    return plants;
  }
}
