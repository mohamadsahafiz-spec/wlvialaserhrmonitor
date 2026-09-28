const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Load local environment configuration from .env or .dev.env.json
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v.length > 0) {
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    });
  }
} catch (e) {}

try {
  const devEnvPath = path.join(__dirname, '..', '.dev.env.json');
  if (fs.existsSync(devEnvPath)) {
    const devEnv = JSON.parse(fs.readFileSync(devEnvPath, 'utf8'));
    Object.entries(devEnv).forEach(([k, v]) => {
      if (!process.env[k]) process.env[k] = v;
    });
  }
} catch (e) {}

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

function evaluateFsosSyncResponse(httpOk, httpStatus, body) {
  if (!httpOk) {
    return {
      success: false,
      updated: false,
      updatedCount: 0,
      updatedMachineIds: [],
      error: `HTTP error ${httpStatus}`
    };
  }
  if (!body || typeof body !== 'object') {
    return {
      success: false,
      updated: false,
      updatedCount: 0,
      updatedMachineIds: [],
      error: 'Invalid/unexpected FSOS response'
    };
  }

  const isSuccess = (
    body.success === true &&
    body.updated === true &&
    typeof body.updatedCount === 'number' &&
    body.updatedCount >= 1 &&
    Array.isArray(body.updatedMachineIds) &&
    body.updatedMachineIds.length > 0
  );

  if (!isSuccess) {
    return {
      success: false,
      updated: Boolean(body.updated),
      updatedCount: typeof body.updatedCount === 'number' ? body.updatedCount : 0,
      updatedMachineIds: Array.isArray(body.updatedMachineIds) ? body.updatedMachineIds : [],
      message: body.message || 'FSOS reported no update or sync failure',
      raw: body
    };
  }

  return {
    success: true,
    updated: true,
    updatedCount: body.updatedCount,
    updatedMachineIds: body.updatedMachineIds,
    message: body.message,
    raw: body
  };
}

async function syncMachineToFsosLocal(m, lastUpdated) {
  let fsosUrl = process.env.FSOS_SYNC_URL || process.env.FSOS_ENDPOINT;
  if (!fsosUrl) return { success: false, updated: false, updatedCount: 0, updatedMachineIds: [], error: 'NO_FSOS_URL' };
  if (!fsosUrl.includes('/api/lms/sync')) {
    fsosUrl = fsosUrl.replace(/\/+$/, '') + '/api/lms/sync';
  }
  const token = process.env.LMS_SYNC_SECRET || process.env.FSOS_SYNC_SECRET || process.env.FSOS_AUTH_TOKEN || '';
  if (!token) {
    // In local development without secret configured, skip unauthenticated remote sync
    return { success: false, updated: false, updatedCount: 0, updatedMachineIds: [], error: 'NO_TOKEN' };
  }
  const payload = mapLmsToFsosPayload(m, lastUpdated);
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-LMS-Auth-Token': token
    };
    const res = await fetch(fsosUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      if (res.status === 401) {
        console.warn(`[LMS->FSOS Sync Local] Sync unauthorized (invalid or missing token)`);
      } else {
        console.warn(`[LMS->FSOS Sync Local] Delivery responded with HTTP ${res.status}: ${res.statusText}`);
      }
      return evaluateFsosSyncResponse(false, res.status, null);
    }
    let body;
    try {
      body = await res.json();
    } catch (e) {
      console.warn(`[LMS->FSOS Sync Local] Malformed JSON response`);
      return evaluateFsosSyncResponse(true, res.status, null);
    }

    const evaluation = evaluateFsosSyncResponse(true, res.status, body);
    if (!evaluation.success) {
      console.warn(`[LMS->FSOS Sync Local] FSOS sync reported no update or failure:`, body);
    }
    return evaluation;
  } catch (err) {
    console.warn(`[LMS->FSOS Sync Local] Network/delivery notice: ${err.message}`);
    return { success: false, updated: false, updatedCount: 0, updatedMachineIds: [], error: err.message };
  }
}

function processLaserTimestamps(existingMachine, incomingMachine, saveTime) {
  if (!existingMachine || !Array.isArray(existingMachine.lasers) || !Array.isArray(incomingMachine.lasers)) {
    return;
  }
  incomingMachine.lasers.forEach(laser => {
    const prevLaser = existingMachine.lasers.find(pl => pl.id === laser.id);
    if (prevLaser) {
      const hourChanged = (laser.baseLaserHour !== prevLaser.baseLaserHour);
      const tsExplicitlyChanged = Boolean(laser.baseTimestamp && laser.baseTimestamp !== prevLaser.baseTimestamp);
      if (hourChanged) {
        if (!tsExplicitlyChanged) {
          laser.baseTimestamp = saveTime;
        }
      } else {
        if (!laser.baseTimestamp && prevLaser.baseTimestamp) {
          laser.baseTimestamp = prevLaser.baseTimestamp;
        }
      }
    }
  });
}

// 3. POST /api/machines (Create or Update)
app.post('/api/machines', async (req, res) => {
  const m = req.body;
  if (!m || !m.id) {
    return res.status(400).json({ error: 'Invalid machine payload' });
  }
  const machines = readJsonFile(MACHINES_FILE, []);
  const idx = machines.findIndex(item => String(item.id) === String(m.id));
  const existing = idx !== -1 ? machines[idx] : null;
  const saveTime = m.lastUpdated || new Date().toISOString();

  processLaserTimestamps(existing, m, saveTime);

  const updatedMachine = { ...m, lastUpdated: saveTime };
  if (idx !== -1) {
    machines[idx] = updatedMachine;
  } else {
    machines.push(updatedMachine);
  }
  writeJsonFile(MACHINES_FILE, machines);

  const fsosSync = await syncMachineToFsosLocal(updatedMachine, updatedMachine.lastUpdated);

  res.json({ success: true, id: m.id, lastUpdated: updatedMachine.lastUpdated, fsosSync });
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
    version: "2.0.4",
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

function getLaserIdentifier(laser, index) {
  if (laser && laser.laserIdentifier) return laser.laserIdentifier;
  if (laser && typeof laser.name === 'string') {
    const match = laser.name.match(/LH\s*(\d+)/i) || laser.name.match(/Laser\s*Head\s*#?(\d+)/i) || laser.name.match(/L(\d+)$/i);
    if (match) return `LH${match[1]}`;
  }
  if (laser && typeof laser.id === 'string') {
    const match = laser.id.match(/-L(\d+)$/i);
    if (match && Number(match[1]) <= 10) return `LH${match[1]}`;
  }
  return `LH${index + 1}`;
}

function calculateLaserHours(laser, now = new Date()) {
  if (!laser || laser.baseLaserHour === null || laser.baseLaserHour === undefined || isNaN(Number(laser.baseLaserHour))) {
    return 0;
  }
  const baseHour = Number(laser.baseLaserHour);
  if (!laser.baseTimestamp) {
    return Math.round(baseHour * 10) / 10;
  }
  const baseMs = new Date(laser.baseTimestamp).getTime();
  const currentMs = now.getTime();
  if (isNaN(baseMs) || isNaN(currentMs) || currentMs < baseMs) {
    return Math.round(baseHour * 10) / 10;
  }
  const elapsedHours = (currentMs - baseMs) / (1000 * 60 * 60);
  const total = baseHour + elapsedHours;
  return Math.round(total * 10) / 10;
}

// 8. GET /api/lms/laser-hours (Read-only authoritative laser hours for FSOS)
app.get('/api/lms/laser-hours', (req, res) => {
  try {
    const configuredToken = process.env.LMS_SYNC_SECRET || process.env.FSOS_SYNC_SECRET || process.env.FSOS_AUTH_TOKEN || '';
    if (configuredToken) {
      const authHeader = req.headers['authorization'] || '';
      const xToken = req.headers['x-lms-auth-token'] || '';
      const queryToken = req.query.token || req.query.secret || '';
      const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
      const providedToken = bearerToken || xToken || queryToken;

      if (!providedToken || providedToken !== configuredToken) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing authentication token' });
      }
    }

    const machines = readJsonFile(MACHINES_FILE, null);
    if (!machines) {
      return res.status(500).json({ error: 'Failed to read machines database' });
    }

    const filterMachine = req.query.machine ? String(req.query.machine).trim() : null;
    const filterLaser = req.query.laser ? String(req.query.laser).trim().toUpperCase() : null;
    const records = [];

    machines.forEach(m => {
      const machineIdentifier = m.machineNo || m.machineName || m.machineNumber;
      if (!machineIdentifier) return;
      if (filterMachine && machineIdentifier !== filterMachine && m.id !== filterMachine) return;

      const lasers = Array.isArray(m.lasers) ? m.lasers : [];
      lasers.forEach((l, idx) => {
        const laserIdentifier = getLaserIdentifier(l, idx);
        if (filterLaser && laserIdentifier !== filterLaser) return;

        const currentHours = calculateLaserHours(l);
        const lastUpdated = l.lastRecalibrationDate || l.baseTimestamp || m.lastUpdated || null;

        records.push({
          machine: machineIdentifier,
          laser: laserIdentifier,
          laserHours: currentHours,
          lastUpdated: lastUpdated
        });
      });
    });

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    console.error('[API] /api/lms/laser-hours error:', err);
    res.status(500).json({ error: 'Internal server error reading laser hours' });
  }
});

// Fallback for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

