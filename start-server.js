// start-server.js — Servidor estatico ultraligero para cPanel/Passenger
// Sirve los archivos del build estatico de Next.js
// CERO frameworks externos, CERO worker threads, minimo uso de RAM
'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');

var port = process.env.PORT || 3000;

// MIME types que necesitamos
var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.txt':  'text/plain; charset=utf-8'
};

// __dirname = /home/datacent/respaldoreportedelabores.datacenterpc.com
// Los archivos de out/ se copian directamente aqui
var ROOT = __dirname;

http.createServer(function(req, res) {
  var parsed  = url.parse(req.url);
  var reqPath = parsed.pathname || '/';

  // Decodificar y limpiar
  try { reqPath = decodeURIComponent(reqPath); } catch(e) {}

  // Normalizar: quitar ..' y doble slashes
  reqPath = reqPath.replace(/\.\./g, '').replace(/\/+/g, '/');
  if (reqPath === '/') reqPath = '/index.html';

  var filePath = path.join(ROOT, reqPath);

  // Seguridad: no salir del ROOT
  if (filePath.indexOf(ROOT) !== 0) {
    res.writeHead(403); res.end(); return;
  }

  fs.readFile(filePath, function(err, data) {
    if (err) {
      // SPA fallback: todas las rutas desconocidas -> index.html (React Router)
      fs.readFile(path.join(ROOT, 'index.html'), function(e2, d2) {
        if (e2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(d2);
      });
      return;
    }

    var ext  = path.extname(filePath).toLowerCase();
    var mime = MIME[ext] || 'application/octet-stream';

    // Cache largo para assets de Next.js (_next/static/)
    var cacheHeader = filePath.indexOf('/_next/static/') !== -1
      ? 'public, max-age=31536000, immutable'
      : 'no-cache';

    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': cacheHeader
    });
    res.end(data);
  });
}).listen(port);
