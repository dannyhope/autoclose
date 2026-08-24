#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const previewDir = path.join(__dirname, 'dev-preview');
const openPath = process.env.DEV_OPEN_PATH || '/popup.html';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function resolvePort() {
  const script = path.join(__dirname, 'resolve-dev-port.sh');
  const output = execFileSync('bash', [script], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  });
  return Number(output.trim());
}

function injectPreview(html) {
  const tags = `
    <link rel="stylesheet" href="/__dev/preview.css" />
    <script src="/__dev/chrome-shim.js"></script>
    <script src="/__dev/live-reload.js"></script>
`;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${tags}</head>`);
  }
  return `${tags}${html}`;
}

function send(response, status, body, headers = {}) {
  response.writeHead(status, headers);
  response.end(body);
}

function safeJoin(base, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const resolved = path.resolve(base, `.${decoded}`);
  if (!resolved.startsWith(base)) {
    return null;
  }
  return resolved;
}

const clients = new Set();
let reloadTimer = null;

function broadcastReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const client of clients) {
      client.write('data: reload\n\n');
    }
  }, 80);
}

function serveDevAsset(urlPath, response) {
  const fileName = urlPath.replace('/__dev/', '');
  const allowed = new Set(['preview.css', 'chrome-shim.js', 'live-reload.js']);
  if (!allowed.has(fileName)) {
    send(response, 404, 'Not found');
    return;
  }
  const filePath = path.join(previewDir, fileName);
  const type = mimeTypes[path.extname(fileName)] || 'text/plain; charset=utf-8';
  send(response, 200, fs.readFileSync(filePath), { 'Content-Type': type });
}

const server = http.createServer((request, response) => {
  const urlPath = request.url || '/';

  if (urlPath.startsWith('/__dev/events')) {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    response.write('\n');
    clients.add(response);
    request.on('close', () => clients.delete(response));
    return;
  }

  if (urlPath.startsWith('/__dev/')) {
    serveDevAsset(urlPath, response);
    return;
  }

  const relative = urlPath === '/' ? openPath : urlPath.split('?')[0];
  const filePath = safeJoin(srcDir, relative);
  if (!filePath) {
    send(response, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      send(response, 404, 'Not found');
      return;
    }
    const type = mimeTypes[path.extname(filePath)] || 'application/octet-stream';
    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        send(response, 500, 'Error reading file');
        return;
      }
      const body = type.includes('text/html') ? injectPreview(data.toString('utf8')) : data;
      send(response, 200, body, { 'Content-Type': type });
    });
  });
});

const port = resolvePort();
const previewUrl = `http://127.0.0.1:${port}${openPath}`;

server.listen(port, '127.0.0.1', () => {
  fs.watch(srcDir, { recursive: true }, broadcastReload);
  spawn('open', [previewUrl], { stdio: 'ignore', detached: true }).unref();
  console.log(`Popup preview: ${previewUrl}`);
  console.log('Saving files in src/ reloads this tab. chrome://extensions is only needed for real tab-closing.');
});
