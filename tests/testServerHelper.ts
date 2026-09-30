import type { Server } from 'http';
import app from '../src/index.js';

let sharedServer: Server | null = null;

export async function ensureTestServerRunning(): Promise<void> {
  // 1. Check if an HTTP server is already responding on port 8000
  try {
    const res = await fetch('http://localhost:8000/health', { signal: AbortSignal.timeout(300) });
    if (res.status === 200) {
      return;
    }
  } catch {
    // Server not yet running on port 8000, proceed to start
  }

  if (sharedServer && sharedServer.listening) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    try {
      const server = app.listen(8000, () => {
        sharedServer = server;
        resolve();
      });

      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          // Another worker or external process is already listening on port 8000
          resolve();
        } else {
          reject(err);
        }
      });
    } catch {
      resolve();
    }
  });
}

export async function closeTestServer(): Promise<void> {
  if (sharedServer && sharedServer.listening) {
    await new Promise<void>((resolve) => {
      sharedServer?.close(() => {
        sharedServer = null;
        resolve();
      });
    });
  }
}
