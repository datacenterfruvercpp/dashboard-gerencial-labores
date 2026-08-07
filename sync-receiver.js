/**
 * sync-receiver.js — API endpoint para recibir datos sincronizados
 * desde el Windows Server (LABAGRIC + PLANILLAS)
 * 
 * Corre en el VPS como servicio PM2 en puerto 3005
 * Recibe POST /api/sync-data con JSON de datos procesados
 * Actualiza siembra-labagric.html con los nuevos datos
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3005;
const HTML_PATH = '/var/www/dashboard-gerencial/public/siembra-labagric.html';
const LOG_DIR = '/var/www/dashboard-gerencial/sync-logs';
const SYNC_TOKEN = process.env.SYNC_TOKEN || 'dcIA-sync-2026-Labagric-CPP-secure';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// Parse large JSON bodies (up to 50MB)
app.use(express.json({ limit: '50mb' }));

// Backup alert state
let lastBackupAlert = null;

// Health check / heartbeat (includes backup status)
app.get('/api/sync-status', (req, res) => {
  const logFile = path.join(LOG_DIR, 'last-sync.json');
  let lastSync = null;
  try { lastSync = JSON.parse(fs.readFileSync(logFile, 'utf-8')); } catch(e) {}
  res.json({
    status: 'online',
    lastSync,
    lastBackupAlert,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Backup alert endpoint (called by offsite-backup.sh on failure)
app.post('/api/sync-status', express.json(), (req, res) => {
  if (req.body.backupAlert) {
    lastBackupAlert = {
      status: req.body.backupAlert,
      error: req.body.error || null,
      timestamp: req.body.timestamp || new Date().toISOString()
    };
    console.log(`⚠️ BACKUP ALERT: ${req.body.backupAlert} - ${req.body.error}`);
    // Write alert to file for persistence
    fs.writeFileSync(path.join(LOG_DIR, 'backup-alert.json'), JSON.stringify(lastBackupAlert, null, 2));
  }
  if (req.body.backupAlert === 'SUCCESS') {
    lastBackupAlert = null;
    try { fs.unlinkSync(path.join(LOG_DIR, 'backup-alert.json')); } catch(e) {}
  }
  res.json({ received: true });
});

// Main sync endpoint
app.post('/api/sync-data', (req, res) => {
  const startTime = Date.now();
  
  // 1. Validate token
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${SYNC_TOKEN}`) {
    console.error(`[${new Date().toISOString()}] ❌ Unauthorized sync attempt from ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // 2. Validate payload
  const { siembra, aplicaciones, planillas, meta } = req.body;
  if (!siembra && !planillas) {
    return res.status(400).json({ error: 'No data provided (need siembra and/or planillas)' });
  }
  
  console.log(`[${new Date().toISOString()}] 📥 Sync request received from ${req.ip}`);
  console.log(`  Siembra: ${siembra ? siembra.length + ' registros' : 'no incluida'}`);
  console.log(`  Planillas: ${planillas ? 'sí (' + (planillas.nomina || []).length + ' nóminas)' : 'no incluidas'}`);
  
  try {
    // 3. Read current HTML
    let html = fs.readFileSync(HTML_PATH, 'utf-8');
    
    // 4. Parse existing RAW_DATA
    const startMatch = html.indexOf('const RAW_DATA = ');
    if (startMatch === -1) {
      return res.status(500).json({ error: 'Could not find RAW_DATA in HTML file' });
    }
    
    const jsonStart = html.indexOf('{', startMatch);
    let depth = 0, jsonEnd = -1;
    for (let i = jsonStart; i < html.length; i++) {
      if (html[i] === '{') depth++;
      if (html[i] === '}') depth--;
      if (depth === 0) { jsonEnd = i; break; }
    }
    
    if (jsonEnd === -1) {
      return res.status(500).json({ error: 'Could not parse RAW_DATA boundaries' });
    }
    
    const rawData = JSON.parse(html.substring(jsonStart, jsonEnd + 1));
    
    // 5. Update data sections
    const changes = [];
    
    if (siembra && siembra.length > 0) {
      const oldCount = (rawData.siembra || []).length;
      rawData.siembra = siembra;
      changes.push(`siembra: ${oldCount} → ${siembra.length}`);
    }
    
    if (aplicaciones && aplicaciones.length > 0) {
      const oldCount = (rawData.aplicaciones || []).length;
      rawData.aplicaciones = aplicaciones;
      changes.push(`aplicaciones: ${oldCount} → ${aplicaciones.length}`);
    }
    
    if (planillas) {
      const oldNomCount = (rawData.planillas && rawData.planillas.nomina) ? rawData.planillas.nomina.length : 0;
      rawData.planillas = planillas;
      changes.push(`planillas: ${oldNomCount} → ${(planillas.nomina || []).length} nóminas`);
    }
    
    // 6. Write updated HTML
    // Create backup first
    const backupName = `siembra-labagric.html.sync-backup-${Date.now()}`;
    fs.copyFileSync(HTML_PATH, path.join(path.dirname(HTML_PATH), backupName));
    
    // Replace RAW_DATA in HTML
    html = html.substring(0, startMatch) + 'const RAW_DATA = ' + JSON.stringify(rawData) + ';' + html.substring(jsonEnd + 2);
    fs.writeFileSync(HTML_PATH, html, 'utf-8');
    
    // 7. Log the sync
    const duration = Date.now() - startTime;
    const logEntry = {
      timestamp: new Date().toISOString(),
      source: meta?.hostname || req.ip,
      changes,
      duration: `${duration}ms`,
      siembraCount: (rawData.siembra || []).length,
      planillasNominaCount: (rawData.planillas && rawData.planillas.nomina) ? rawData.planillas.nomina.length : 0,
      aplicacionesCount: (rawData.aplicaciones || []).length,
      htmlSize: `${(html.length / 1024).toFixed(1)} KB`,
      success: true
    };
    
    // Save last sync info
    fs.writeFileSync(path.join(LOG_DIR, 'last-sync.json'), JSON.stringify(logEntry, null, 2));
    
    // Append to history log
    fs.appendFileSync(
      path.join(LOG_DIR, 'sync-history.log'),
      JSON.stringify(logEntry) + '\n'
    );
    
    // Cleanup old backups (keep last 5)
    const backups = fs.readdirSync(path.dirname(HTML_PATH))
      .filter(f => f.startsWith('siembra-labagric.html.sync-backup-'))
      .sort()
      .reverse();
    backups.slice(5).forEach(f => {
      fs.unlinkSync(path.join(path.dirname(HTML_PATH), f));
    });
    
    console.log(`[${new Date().toISOString()}] ✅ Sync completed in ${duration}ms`);
    console.log(`  Changes: ${changes.join(', ')}`);
    
    res.json({
      success: true,
      changes,
      duration: `${duration}ms`,
      counts: {
        siembra: (rawData.siembra || []).length,
        aplicaciones: (rawData.aplicaciones || []).length,
        planillasNomina: (rawData.planillas && rawData.planillas.nomina) ? rawData.planillas.nomina.length : 0
      }
    });
    
  } catch(error) {
    console.error(`[${new Date().toISOString()}] ❌ Sync error:`, error.message);
    
    // Log the error
    fs.appendFileSync(
      path.join(LOG_DIR, 'sync-history.log'),
      JSON.stringify({ timestamp: new Date().toISOString(), error: error.message, success: false }) + '\n'
    );
    
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🔌 Sync Receiver running on port ${PORT}`);
  console.log(`   HTML: ${HTML_PATH}`);
  console.log(`   Logs: ${LOG_DIR}`);
});
