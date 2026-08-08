// start-server.js — Diagnostico + Next.js Standalone para cPanel
// Si Next.js falla al iniciar, muestra el error exacto via HTTP (no 503)
'use strict';

process.env.UV_THREADPOOL_SIZE = '1';
process.env.NODE_ENV = 'production';

var http = require('http');
var path = require('path');
var fs = require('fs');

var port = process.env.PORT || 3000;
var standaloneDir = path.join(__dirname, '.next', 'standalone');
var standaloneServer = path.join(standaloneDir, 'server.js');

function startDiagnosticServer(errorMsg, extra) {
  // Muestra el error como pagina HTTP en lugar de 503
  http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(
      'STARTUP ERROR:\n\n' + errorMsg +
      '\n\n--- INFO ---\n' +
      'standaloneDir: ' + standaloneDir + '\n' +
      'standaloneServer: ' + standaloneServer + '\n' +
      'exists: ' + fs.existsSync(standaloneServer) + '\n' +
      '__dirname: ' + __dirname + '\n' +
      'NODE_VERSION: ' + process.version + '\n' +
      (extra || '')
    );
  }).listen(port);
}

// Verificar que el standalone existe
if (!fs.existsSync(standaloneServer)) {
  var dirs = '';
  try {
    dirs = '\nFiles in .next/: ' + fs.readdirSync(path.join(__dirname, '.next')).join(', ');
  } catch(e2) { dirs = '\n.next/ not found'; }
  startDiagnosticServer('standalone/server.js NOT FOUND at: ' + standaloneServer, dirs);
} else {
  try {
    process.chdir(standaloneDir);
    require(standaloneServer);
  } catch(e) {
    startDiagnosticServer(e.message + '\n\nSTACK:\n' + e.stack);
  }
}
