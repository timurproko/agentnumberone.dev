const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PORT || 4173);
const publicFiles = new Set(['index.html', 'styles.css', 'script.js']);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const parts = relative.split(/[\\/]/);
  if (parts.some(part => part.startsWith('.')) ||
      !(publicFiles.has(relative) || relative.startsWith('assets/'))) {
    res.writeHead(404).end('Not found');
    return;
  }

  fs.readFile(path.join(__dirname, relative), (error, data) => {
    if (error) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(relative)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Stop the existing preview server first (see README.md).`
    : error.message);
  process.exitCode = 1;
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Preview: http://localhost:${port}`);
  console.log('Press Ctrl+C to stop. Refresh the browser after editing files.');
});
