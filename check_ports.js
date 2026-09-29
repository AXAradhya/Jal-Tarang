const http = require('http');

const ports = [3000, 3001, 3002, 3003, 5173, 8000];

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, { timeout: 2000 }, (res) => {
      resolve({ port, status: res.statusCode, ok: true });
    });
    req.on('error', (err) => {
      resolve({ port, error: err.message, ok: false });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ port, error: 'TIMEOUT', ok: false });
    });
  });
}

async function run() {
  const results = await Promise.all(ports.map(checkPort));
  console.log(JSON.stringify(results, null, 2));
}

run();
