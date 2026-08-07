// start-server.js – 100% synchronous file server for cPanel shared hosting
// Zero worker threads. All file reads are synchronous (readFileSync).
// Designed for CloudLinux environments with extreme pthread limits.

var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = parseInt(process.env.PORT, 10) || 3001;
var BASE = __dirname;

var STATIC_DIR = path.join(BASE, '.next', 'standalone', '.next', 'static');
var PUBLIC_DIR = path.join(BASE, 'public');
var STANDALONE_PUBLIC = path.join(BASE, '.next', 'standalone', 'public');
var INDEX_HTML = path.join(BASE, '.next', 'standalone', '.next', 'server', 'app', 'index.html');

var MIME = {
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
};

function sendFile(res, filePath, cache) {
  try {
    var data = fs.readFileSync(filePath);
    var ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': cache || 'public, max-age=3600',
    });
    res.end(data);
    return true;
  } catch (e) {
    return false;
  }
}

var server = http.createServer(function(req, res) {
  var pathname = req.url.split('?')[0];
  
  // Security
  if (pathname.indexOf('..') !== -1) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  // /_next/static/* 
  if (pathname.indexOf('/_next/static/') === 0) {
    var rel = pathname.substring('/_next/static/'.length);
    if (sendFile(res, path.join(STATIC_DIR, rel), 'public, max-age=31536000, immutable')) return;
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // /api/*
  if (pathname.indexOf('/api/') === 0) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
    return;
  }

  // Public files
  if (pathname !== '/') {
    if (sendFile(res, path.join(PUBLIC_DIR, pathname), 'public, max-age=86400')) return;
    if (sendFile(res, path.join(STANDALONE_PUBLIC, pathname), 'public, max-age=86400')) return;
  }

  // Index
  if (sendFile(res, INDEX_HTML, 'public, max-age=0, must-revalidate')) return;
  
  res.writeHead(500);
  res.end('index.html not found');
});

server.listen(PORT, '0.0.0.0', function() {
  console.log('Server ready on port ' + PORT);
});
