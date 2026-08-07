// start-server.js – Memory-only server for extreme CloudLinux limits
// Loads ALL files into RAM at startup. Zero I/O during request handling.

var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = parseInt(process.env.PORT, 10) || 3001;
var BASE = __dirname;
var CACHE = {}; // pathname → { data: Buffer, type: string }

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif':  'image/gif',
  '.svg':  'image/svg+xml', '.ico':  'image/x-icon',
  '.webp': 'image/webp', '.woff': 'font/woff',
  '.woff2':'font/woff2',  '.ttf':  'font/ttf',
};

// Recursively load directory into cache
function loadDir(dir, prefix) {
  try {
    var items = fs.readdirSync(dir);
    for (var i = 0; i < items.length; i++) {
      var full = path.join(dir, items[i]);
      var key = prefix + '/' + items[i];
      try {
        var st = fs.statSync(full);
        if (st.isDirectory()) {
          loadDir(full, key);
        } else if (st.isFile() && st.size < 5 * 1024 * 1024) { // max 5MB per file
          var ext = path.extname(items[i]).toLowerCase();
          CACHE[key] = {
            data: fs.readFileSync(full),
            type: MIME[ext] || 'application/octet-stream'
          };
        }
      } catch(e) {}
    }
  } catch(e) {}
}

// Pre-load static assets
var staticDir = path.join(BASE, '.next', 'standalone', '.next', 'static');
loadDir(staticDir, '/_next/static');

// Pre-load public
var pubDirs = [
  path.join(BASE, 'public'),
  path.join(BASE, '.next', 'standalone', 'public')
];
for (var d = 0; d < pubDirs.length; d++) {
  loadDir(pubDirs[d], '');
}

// Pre-load index.html
var indexPath = path.join(BASE, '.next', 'standalone', '.next', 'server', 'app', 'index.html');
try {
  CACHE['/'] = {
    data: fs.readFileSync(indexPath),
    type: 'text/html; charset=utf-8'
  };
} catch(e) {
  CACHE['/'] = {
    data: Buffer.from('<h1>index.html not found</h1>'),
    type: 'text/html; charset=utf-8'
  };
}

console.log('Cached ' + Object.keys(CACHE).length + ' files');

// Server – pure memory, zero I/O
var server = http.createServer(function(req, res) {
  var pathname = req.url.split('?')[0];
  
  if (pathname.indexOf('..') !== -1) {
    res.writeHead(400);
    return res.end('Bad');
  }

  // API stub
  if (pathname.indexOf('/api/') === 0) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end('{"ok":true}');
  }

  var entry = CACHE[pathname];
  if (!entry && pathname !== '/') {
    // Try without trailing slash or with index.html
    entry = CACHE[pathname + '/index.html'] || CACHE[pathname + '.html'];
  }
  if (!entry) {
    entry = CACHE['/'];
  }

  res.writeHead(200, {
    'Content-Type': entry.type,
    'Content-Length': entry.data.length
  });
  res.end(entry.data);
});

server.listen(PORT, '0.0.0.0', function() {
  console.log('Ready on port ' + PORT);
});
