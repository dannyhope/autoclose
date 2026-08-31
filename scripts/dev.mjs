import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = await new Promise((resolvePort, reject) => {
  const child = spawn(resolve(root, 'scripts/resolve-dev-port.sh'), [], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.on('error', reject);
  child.on('close', (code) => code === 0 ? resolvePort(output.trim()) : reject(new Error(`Port resolver exited with ${code}`)));
});

const vite = spawn('vite', ['--host', '127.0.0.1', '--port', port, '--strictPort'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

process.on('SIGINT', () => vite.kill('SIGINT'));
process.on('SIGTERM', () => vite.kill('SIGTERM'));
vite.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
