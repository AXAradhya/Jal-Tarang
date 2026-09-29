process.env.CI = 'true';
import { createServer } from 'vite';

async function main() {
  process.env.CI = 'true';
  // Detach / pause stdin so Vite never receives EOF
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(false);
    } catch {}
  }
  process.stdin.pause();

  console.log('Starting SAIL MarineX Vite dev server with CI=true...');
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
  console.log('SAIL MarineX frontend running cleanly on port 3000.');

  // Keep event loop alive indefinitely
  setInterval(() => {}, 60000);
}

main().catch(err => {
  console.error('Fatal dev server error:', err);
  process.exit(1);
});
