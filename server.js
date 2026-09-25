const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

const MACHINES_FILE = path.join(__dirname, 'data', 'machines.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

function readJsonFile(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`[Server] Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[Server] Error writing ${filePath}:`, err);
    return false;
  }
}

// 1. GET /api/machines
app.get('/api/machines', (req, res) => {
  const machines = readJsonFile(MACHINES_FILE, []);
  res.json(machines);
});

// 2. GET /api/machines/:id
app.get('/api/machines/:id', (req, res) => {
  const machines = readJsonFile(MACHINES_FILE, []);
  const machine = machines.find(m => String(m.id) === String(req.params.id));
  if (!machine) {
    return res.status(404).json({ error: 'Machine not found' });
  }
  res.json(machine);
});

function mapLmsToFsosPayload(m, lastUpdated) {
  return {
    id: m.id,
    machineNumber: m.machineNo || m.machineNumber || '',
    machineName: m.machineName || '',
    serialNo: m.serialNo || '',
    manufacturer: m.manufacturer || '',
    model: m.model || '',
    department: m.department || '',
    lasers: Array.isArray(m.lasers) ? m.lasers.map(l => ({
      id: l.id,
      name: l.name,
      serialNo: l.serialNo,
      generation: l.generation,
      lifecycleHistory: l.lifecycleHistory,
      replacementHistory: l.replacementHistory,
      ratedLife: l.ratedLife,
      warningLife: l.warningLife,
      contingencyCeiling: l.contingencyCeiling,
      baseLaserHour: l.baseLaserHour,
      baseTimestamp: l.baseTimestamp,
      runtimeState: l.runtimeState,
      lastRecalibrationDate: l.lastRecalibrationDate,
      calibrationHistory: l.calibrationHistory,
      installedDate: l.installedDate,
      installedBy: l.installedBy
    })) : [],
    lastUpdated: lastUpdated || m.lastUpdated || new Date().toISOString()
  };
}

async function syncMachineToFsosLocal(m, lastUpdated) {
  let fsosUrl = process.env.FSOS_SYNC_URL || process.env.FSOS_ENDPOINT;
  if (!fsosUrl) return;
  if (!fsosUrl.includes('/api/lms/sync')) {
    fsosUrl = fsosUrl.replace(/\/+$/, '') + '/api/lms/sync';
  }
  const token = process.env.FSOS_SYNC_SECRET || process.env.FSOS_AUTH_TOKEN || '';
  const payload = mapLmsToFsosPayload(m, lastUpdated);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-LMS-Auth-Token'] = token;
    }
    const res = await fetch(fsosUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error(`[LMS->FSOS Sync Local] Delivery failed with HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    console.error(`[LMS->FSOS Sync Local] Network/delivery error: ${err.message}`);
  }
}

// 3. POST /api/machines (Create or Update)
app.post('/api/machines', async (req, res) => {
  const m = req.body;
  if (!m || !m.id) {
    return res.status(400).json({ error: 'Invalid machine payload' });
  }
  const machines = readJsonFile(MACHINES_FILE, []);
  const idx = machines.findIndex(item => String(item.id) === String(m.id));
  const updatedMachine = { ...m, lastUpdated: m.lastUpdated || new Date().toISOString() };
  if (idx !== -1) {
    machines[idx] = updatedMachine;
  } else {
    machines.push(updatedMachine);
  }
  writeJsonFile(MACHINES_FILE, machines);

  await syncMachineToFsosLocal(updatedMachine, updatedMachine.lastUpdated);

  res.json({ success: true, id: m.id, lastUpdated: updatedMachine.lastUpdated });
});

// 4. DELETE /api/machines/:id
app.delete('/api/machines/:id', (req, res) => {
  const id = req.params.id;
  let machines = readJsonFile(MACHINES_FILE, []);
  machines = machines.filter(m => String(m.id) !== String(id));
  writeJsonFile(MACHINES_FILE, machines);
  res.json({ success: true, id });
});

// 5. GET /api/settings
app.get('/api/settings', (req, res) => {
  const settings = readJsonFile(SETTINGS_FILE, {
    systemTitle: "Laser Management System",
    version: "1.0",
    theme: "dark",
    defaultRatedLife: 25000,
    defaultWarningPercentage: 80,
    recalibrationInterval: 30,
    engineerPassword: "1234",
    accessMode: "ENGINEER"
  });
  res.json(settings);
});

// 6. POST /api/settings
app.post('/api/settings', (req, res) => {
  const newSettings = req.body || {};
  const currentSettings = readJsonFile(SETTINGS_FILE, {});
  const merged = { ...currentSettings, ...newSettings };
  writeJsonFile(SETTINGS_FILE, merged);
  res.json({ success: true, settings: merged });
});

// 7. POST /api/sync/upload-local & /api/sync/import (Import / authoritative persistence)
app.post(['/api/sync/upload-local', '/api/sync/import'], (req, res) => {
  const payload = req.body || {};
  const machines = payload.machines || [];
  const settings = payload.settings || null;

  if (Array.isArray(machines) && machines.length > 0) {
    writeJsonFile(MACHINES_FILE, machines);
  }
  if (settings && typeof settings === 'object') {
    const currentSettings = readJsonFile(SETTINGS_FILE, {});
    writeJsonFile(SETTINGS_FILE, { ...currentSettings, ...settings });
  }

  res.json({
    success: true,
    machineCount: machines.length,
    timestamp: new Date().toISOString()
  });
});

// Fallback for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

