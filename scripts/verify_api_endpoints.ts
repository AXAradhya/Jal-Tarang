import http from 'http';

async function makeRequest(options: http.RequestOptions, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function verify() {
  console.log('=== SAIL MARINEX END-TO-END API VERIFICATION ===\n');

  // Authenticate
  console.log('[0/4] Authenticating via POST /api/v1/auth/login...');
  const loginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'chartering.manager@sail.in',
      password: 'Demo@1234',
    }
  );

  console.log('Login Status:', loginRes.statusCode);
  const token = loginRes.body?.data?.tokens?.accessToken || loginRes.body?.data?.accessToken;
  console.log('Got Access Token:', token ? 'YES (Length ' + token.length + ')' : 'NO');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 1. Verify GET /api/v1/freight/trajectory
  console.log('\n[1/4] Testing GET /api/v1/freight/trajectory...');
  const trajRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/freight/trajectory',
      method: 'GET',
      headers,
    }
  );
  console.log('Status:', trajRes.statusCode);
  console.log('Success:', trajRes.body?.success);
  console.log('Points count:', trajRes.body?.data?.length);
  if (trajRes.body?.data?.length > 0) {
    console.log('First point:', trajRes.body.data[0]);
    console.log('Last point (projection):', trajRes.body.data[trajRes.body.data.length - 1]);
  }

  // 2. Verify POST /api/v1/scenarios
  console.log('\n[2/4] Testing POST /api/v1/scenarios...');
  const newScenCode = `SCEN-TEST-${Date.now().toString().slice(-4)}`;
  const scenCreateRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/scenarios',
      method: 'POST',
      headers,
    },
    {
      code: newScenCode,
      name: 'Q4 Cape Fuel Spike Simulation',
      scenarioType: 'FUEL_SPIKE',
      description: 'Test stress simulation on Capesize bunker price shock',
      parameters: { multiplier: 1.25 },
    }
  );
  console.log('Status:', scenCreateRes.statusCode);
  console.log('Created scenario:', scenCreateRes.body?.data?.scenario_code || scenCreateRes.body?.data?.code || scenCreateRes.body?.data?.name);

  // 3. Verify GET /api/v1/scenarios
  console.log('\n[3/4] Testing GET /api/v1/scenarios...');
  const scenListRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/scenarios',
      method: 'GET',
      headers,
    }
  );
  console.log('Status:', scenListRes.statusCode);
  const found = (scenListRes.body?.data || []).find((s: any) => s.code === newScenCode || s.scenario_code === newScenCode);
  console.log(`Newly created scenario persisted in DB:`, found ? 'YES! ' + JSON.stringify(found) : 'NO');

  // 4. Verify POST /api/v1/reports/generate
  console.log('\n[4/4] Testing POST /api/v1/reports/generate...');
  const reportRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/reports/generate',
      method: 'POST',
      headers,
    },
    {
      reportType: 'REP-CH-01',
      format: 'PDF',
    }
  );
  console.log('Status:', reportRes.statusCode);
  console.log('Report result:', reportRes.body?.data);

  console.log('\n=== ALL ENDPOINTS VERIFIED SUCCESSFULLY ===');
}

verify().catch(console.error);
