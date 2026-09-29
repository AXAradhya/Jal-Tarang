import { createServer } from 'vite';

// Intercept process.exit to prevent third-party crashes from killing the dev server
const realExit = process.exit;
process.exit = (code) => {
  console.warn('Intercepted process.exit call with code:', code);
  console.warn(new Error().stack);
  if (code === 0) {
    // allow clean intentional exit if ever needed
  }
};

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION (recovered):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION (recovered):', reason);
});

process.on('SIGTERM', () => {
  console.log('RECEIVED SIGTERM');
});

process.on('SIGINT', () => {
  console.log('RECEIVED SIGINT');
});

async function start() {
  try {
    console.log('Initializing persistent Vite dev server on port 3000...');
    const server = await createServer({
      configFile: './vite.config.ts',
      root: process.cwd(),
      server: {
        host: '0.0.0.0',
        port: 3000,
      }
    });
    await server.listen();
    server.printUrls();
    console.log('Persistent Vite dev server listening successfully.');

    // Permanent keepalive loop
    setInterval(() => {
      // heartbeat
    }, 15000);
  } catch (err) {
    console.error('Dev server error during startup:', err);
  }
}

start();
