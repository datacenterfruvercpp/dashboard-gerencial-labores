// Extract planillas data from siembra-labagric.html and save as planillas-data.json
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'public', 'siembra-labagric.html');
const OUT_PATH = path.join(__dirname, 'public', 'planillas-data.json');

console.log('Reading HTML file...');
const html = fs.readFileSync(HTML_PATH, 'utf-8');

// Find RAW_DATA
const startMatch = html.indexOf('const RAW_DATA = ');
if (startMatch === -1) {
  console.error('Could not find RAW_DATA');
  process.exit(1);
}

const jsonStart = html.indexOf('{', startMatch);
let depth = 0, jsonEnd = -1;
for (let i = jsonStart; i < html.length; i++) {
  if (html[i] === '{') depth++;
  if (html[i] === '}') depth--;
  if (depth === 0) { jsonEnd = i; break; }
}

console.log('Parsing RAW_DATA...');
const rawData = JSON.parse(html.substring(jsonStart, jsonEnd + 1));

if (!rawData.planillas) {
  console.error('No planillas found in RAW_DATA');
  process.exit(1);
}

const planillas = rawData.planillas;

console.log('Planillas data:');
console.log('  empleados:', (planillas.empleados || []).length);
console.log('  nomina:', (planillas.nomina || []).length);
console.log('  detalle:', (planillas.detalle || []).length);

// Validate detalle has labor field
const detalleWithLabor = (planillas.detalle || []).filter(d => d.labor);
console.log('  detalle with labor:', detalleWithLabor.length);

// Show unique semanas
const semanas = [...new Set((planillas.nomina || []).map(n => n.semana))].sort((a,b) => a-b);
console.log('  semanas:', semanas.join(', '));

// Write to planillas-data.json
fs.writeFileSync(OUT_PATH, JSON.stringify(planillas, null, 0));
console.log(`\nSaved to ${OUT_PATH} (${(fs.statSync(OUT_PATH).size / 1024).toFixed(1)} KB)`);
