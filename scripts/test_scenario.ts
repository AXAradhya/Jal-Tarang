import { pool, ACTIVE_SCENARIOS } from '../src/db/index.js';

async function testScenario() {
  console.log('Initial scenarios:', ACTIVE_SCENARIOS.length);
  const insertRes = await pool.query(
    'INSERT INTO scenarios (code, name, description, scenario_type, parameters) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    ['TEST_MONSOON', 'Paradip Monsoon Delay', 'Severe monsoon swell', 'HIGH_CONGESTION', JSON.stringify({ delayDays: 5 })]
  );
  console.log('Inserted scenario row:', insertRes.rows[0]);
  const selectRes = await pool.query('SELECT * FROM scenarios');
  console.log('Total scenarios after insert:', selectRes.rows.length);
  const found = selectRes.rows.find(s => s.code === 'TEST_MONSOON');
  console.log('Found inserted scenario:', found?.name);
  process.exit(0);
}

testScenario();
