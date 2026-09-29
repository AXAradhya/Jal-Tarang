/**
 * JAL TARANG — Freight Rate Repository
 */

import { pool } from '../db/index.js';

export class FreightRateRepository {
  public static async findLatestByRoute(originPortId: string, destinationPortId: string) {
    const res = await pool.query(
      `SELECT fr.freight_rate_usd, fr.rate_date, fr.market_condition, fr.vessel_class,
              mr.route_code, mr.route_name, mr.distance_nm
       FROM freight_rates fr
       LEFT JOIN maritime_routes mr ON mr.origin_port_id = $1 AND mr.destination_port_id = $2
       WHERE (mr.origin_port_id = $1 OR fr.route_id IN (
         SELECT id FROM maritime_routes WHERE origin_port_id = $1 AND destination_port_id = $2
       ))
       ORDER BY fr.rate_date DESC LIMIT 5`,
      [originPortId, destinationPortId]
    );
    return res.rows;
  }

  public static async findBunkerPrices(portId: string) {
    const res = await pool.query(
      `SELECT bp.price_usd_mt, bp.fuel_grade, bp.price_date
       FROM bunker_prices bp
       WHERE bp.port_id = $1
       ORDER BY bp.price_date DESC LIMIT 3`,
      [portId]
    );
    return res.rows;
  }
}
