// start-server.js - Entry point for cPanel Node.js Selector
// Uses Next.js as a module (compatible with cPanel virtual environment)
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT, 10) || 3001;
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on port ${port} [${dev ? 'development' : 'production'}]`);
  });
}).catch((err) => {
  console.error('Error starting Next.js:', err);
  process.exit(1);
});
