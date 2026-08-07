// start-server.js – Ultra-lightweight file server for cPanel shared hosting
// Serves the Next.js pre-rendered static build without worker threads.
// Designed for environments with strict pthread limits (CloudLinux/cPanel).

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.PORT, 10) || 3001;
const BASE = __dirname;

// Pre-rendered HTML from Next.js build
const INDEX_HTML = path.join(BASE, '.next', 'standalone', '.next', 'server', 'app', 'index.html');
const NOT_FOUND_HTML = path.join(BASE, '.next', 'standalone', '.next', 'server', 'app', '_not-found.html');

// Static asset directories
const STATIC_DIR = path.join(BASE, '.next', 'standalone', '.next', 'static');
const PUBLIC_DIR = path.join(BASE, 'public');

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.map':  'application/json',
};

function getMime(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function serveFile(res, filePath, cacheControl) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
    res.writeHead(200, {
      'Content-Type': getMime(filePath),
      'Content-Length': stat.size,
      'Cache-Control': cacheControl || 'public, max-age=3600',
    });
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch (e) {
    return false;
  }
}

const server = http.createServer(function(req, res) {
  const parsed = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsed.pathname);

  // Security: prevent directory traversal
  if (pathname.indexOf('..') !== -1) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  // /_next/static/* → serve from .next/standalone/.next/static/
  if (pathname.startsWith('/_next/static/')) {
    const rel = pathname.replace('/_next/static/', '');
    const filePath = path.join(STATIC_DIR, rel);
    if (serveFile(res, filePath, 'public, max-age=31536000, immutable')) return;
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // /api/* → return JSON (minimal stub – real API can be added later)
  if (pathname.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'API endpoint available' }));
    return;
  }

  // Public files (favicon.ico, images, etc.)
  if (pathname !== '/' && pathname !== '') {
    // Try public dir first
    const pubFile = path.join(PUBLIC_DIR, pathname);
    if (serveFile(res, pubFile, 'public, max-age=86400')) return;
    // Try standalone public
    const standalonePub = path.join(BASE, '.next', 'standalone', 'public', pathname);
    if (serveFile(res, standalonePub, 'public, max-age=86400')) return;
  }

  // Default: serve index.html
  if (fs.existsSync(INDEX_HTML)) {
    serveFile(res, INDEX_HTML, 'public, max-age=0, must-revalidate');
  } else {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('index.html not found at: ' + INDEX_HTML);
  }
});

server.listen(PORT, '0.0.0.0', function() {
  console.log('Dashboard server listening on port ' + PORT);
});
