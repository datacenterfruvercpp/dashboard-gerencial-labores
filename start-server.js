// start-server.js – Minimal test
var http = require('http');
http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
  res.end('<h1>Dashboard OK</h1><p>Server is running</p>');
}).listen(3001);
