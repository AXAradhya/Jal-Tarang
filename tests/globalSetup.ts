import { ensureTestServerRunning, closeTestServer } from './testServerHelper.js';

export async function setup() {
  await ensureTestServerRunning();
}

export async function teardown() {
  await closeTestServer();
}
