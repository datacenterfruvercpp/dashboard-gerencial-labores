// start-server.js — Next.js Standalone para cPanel / Phusion Passenger
// UV_THREADPOOL_SIZE=1 evita el limite de pthreads de CloudLinux
'use strict';

process.env.UV_THREADPOOL_SIZE = '1';
process.env.NODE_ENV = 'production';
// Passenger inyecta PORT automaticamente; Next.js standalone lo lee

var path = require('path');
var standaloneDir = path.join(__dirname, '.next', 'standalone');

// El standalone tiene su propio node_modules — no necesita el raiz
process.chdir(standaloneDir);

// Iniciar el servidor Next.js standalone
require('./server.js');
