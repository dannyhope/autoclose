import { execFileSync } from 'node:child_process';
import { cpSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

function resolveDevPort(): number {
  const script = path.join(root, 'scripts/resolve-dev-port.sh');
  const output = execFileSync('bash', [script], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  });
  return Number(output.trim());
}

function copyExtensionStatic(): Plugin {
  return {
    name: 'copy-extension-static',
    closeBundle() {
      const dist = path.join(root, 'dist');
      const src = path.join(root, 'src');
      cpSync(path.join(src, 'manifest.json'), path.join(dist, 'manifest.json'));
      cpSync(path.join(src, 'js'), path.join(dist, 'js'), { recursive: true });
      if (existsSync(path.join(src, 'icons'))) {
        cpSync(path.join(src, 'icons'), path.join(dist, 'icons'), { recursive: true });
      }
    }
  };
}

export default defineConfig(({ command }) => {
  const port = command === 'serve' ? resolveDevPort() : 5920;
  return {
    plugins: [react(), tailwindcss(), copyExtensionStatic()],
    resolve: {
      alias: {
        '@': path.join(root, 'src')
      }
    },
    root: path.join(root, 'src'),
    base: './',
    publicDir: false,
    server: {
      host: '127.0.0.1',
      port,
      strictPort: true,
      open: '/popup.html'
    },
    build: {
      outDir: path.join(root, 'dist'),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: path.join(root, 'src/popup.html'),
          fullList: path.join(root, 'src/full-list.html')
        }
      }
    }
  };
});
