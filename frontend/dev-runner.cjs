const { spawn } = require('child_process');
const path = require('path');

// Keep process active and prevent stdin from closing
if (process.stdin.resume) {
  process.stdin.resume();
}

function startVite() {
  const viteBin = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
  const child = spawn(process.execPath, [viteBin, '--host', '--port', '3000'], {
    cwd: __dirname,
    stdio: ['pipe', 'inherit', 'inherit'],
    env: { ...process.env, CI: 'true' }
  });

  child.on('exit', (code) => {
    console.log(`[Vite Runner] Dev server exited with code ${code}. Auto-restarting in 1s...`);
    setTimeout(startVite, 1000);
  });

  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    child.kill('SIGINT');
    process.exit(0);
  });
}

startVite();
