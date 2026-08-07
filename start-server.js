// start-server.js - Entry point for cPanel Node.js Selector
// Starts Next.js in production mode
const { spawn } = require('child_process');
const path = require('path');

const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
const port = process.env.PORT || 3001;

const child = spawn(process.execPath, [nextBin, 'start', '-p', port], {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env, NODE_ENV: 'production' }
});

child.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
