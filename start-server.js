// start-server.js — Next.js Standalone para cPanel / Phusion Passenger
// UV_THREADPOOL_SIZE=1 evita limite de pthreads de CloudLinux
'use strict';

process.env.UV_THREADPOOL_SIZE = '1';
process.env.NODE_ENV = 'production';

var path = require('path');
var standaloneDir = path.join(__dirname, '.next', 'standalone');
var standaloneServer = path.join(standaloneDir, 'server.js');

// chdir al standalone para que server.js encuentre sus assets con process.cwd()
process.chdir(standaloneDir);

// require con ruta absoluta (require('./x') resuelve relativo al archivo, no al cwd)
require(standaloneServer);
