// Cloudflare Worker API for LMS D1 Synchronization

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

async function syncMachineToFsos(m, lastUpdated, env) {
    let fsosUrl = env?.FSOS_SYNC_URL || env?.FSOS_ENDPOINT;
    if (!fsosUrl) {
        return { success: false, updated: false, updatedCount: 0, updatedMachineIds: [], error: 'NO_FSOS_URL' };
    }
    if (!fsosUrl.includes('/api/lms/sync')) {
        fsosUrl = fsosUrl.replace(/\/+$/, '') + '/api/lms/sync';
    }
    const token = env?.LMS_SYNC_SECRET || env?.FSOS_SYNC_SECRET || env?.FSOS_AUTH_TOKEN || '';
    const payload = mapLmsToFsosPayload(m, lastUpdated);

    try {
        const headers = {
            'Content-Type': 'application/json'
        };
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
            console.error(`[LMS->FSOS Sync] Delivery failed with HTTP ${res.status}: ${res.statusText}`);
            return evaluateFsosSyncResponse(false, res.status, null);
        }

        let body;
        try {
            body = await res.json();
        } catch (jsonErr) {
            console.error(`[LMS->FSOS Sync] Malformed JSON response: ${jsonErr.message}`);
            return evaluateFsosSyncResponse(true, res.status, null);
        }

        const evaluation = evaluateFsosSyncResponse(true, res.status, body);
        if (!evaluation.success) {
            console.warn(`[LMS->FSOS Sync] FSOS sync reported no update or failure:`, body);
        }
        return evaluation;
    } catch (err) {
        console.error(`[LMS->FSOS Sync] Network/delivery error: ${err.message}`);
        return { success: false, updated: false, updatedCount: 0, updatedMachineIds: [], error: err.message };
    }
}

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

function processLaserTimestamps(existingLasers, incomingLasers, saveTime) {
    if (!Array.isArray(existingLasers) || !Array.isArray(incomingLasers)) {
        return;
    }
    incomingLasers.forEach(laser => {
        const prevLaser = existingLasers.find(pl => pl.id === laser.id);
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

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        if (method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // GET /api/lms/laser-hours (Read-only authoritative laser hours for FSOS)
            if (path === '/api/lms/laser-hours' && method === 'GET') {
                const configuredToken = env?.LMS_SYNC_SECRET || env?.FSOS_SYNC_SECRET || env?.FSOS_AUTH_TOKEN || '';
                if (configuredToken) {
                    const authHeader = request.headers.get('Authorization') || '';
                    const xToken = request.headers.get('X-LMS-Auth-Token') || '';
                    const queryToken = url.searchParams.get('token') || url.searchParams.get('secret') || '';
                    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
                    const providedToken = bearerToken || xToken || queryToken;

                    if (!providedToken || providedToken !== configuredToken) {
                        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or missing authentication token' }), {
                            status: 401,
                            headers: corsHeaders
                        });
                    }
                }

                try {
                    const { results } = await env.DB.prepare('SELECT * FROM machines ORDER BY last_updated DESC').all();
                    const filterMachine = url.searchParams.get('machine');
                    const filterLaser = url.searchParams.get('laser') ? url.searchParams.get('laser').trim().toUpperCase() : null;
                    const records = [];

                    results.forEach(row => {
                        const machineNo = row.machine_no || row.machine_name;
                        if (!machineNo) return;
                        if (filterMachine && machineNo !== filterMachine && row.id !== filterMachine) return;

                        let lasers = [];
                        try { lasers = JSON.parse(row.lasers || '[]'); } catch (e) {}

                        lasers.forEach((l, idx) => {
                            const laserIdentifier = getLaserIdentifier(l, idx);
                            if (filterLaser && laserIdentifier !== filterLaser) return;

                            const currentHours = calculateLaserHours(l);
                            const lastUpdated = l.lastRecalibrationDate || l.baseTimestamp || row.last_updated || null;

                            records.push({
                                machine: machineNo,
                                laser: laserIdentifier,
                                laserHours: currentHours,
                                lastUpdated: lastUpdated
                            });
                        });
                    });

                    return new Response(JSON.stringify({
                        success: true,
                        count: records.length,
                        data: records
                    }), { headers: corsHeaders });
                } catch (dbErr) {
                    console.error('[Worker] DB error reading laser hours:', dbErr);
                    return new Response(JSON.stringify({ error: 'Database error reading laser hours' }), {
                        status: 500,
                        headers: corsHeaders
                    });
                }
            }

            // GET /api/machines
            if (path === '/api/machines' && method === 'GET') {
                const { results } = await env.DB.prepare('SELECT * FROM machines ORDER BY last_updated DESC').all();
                const machines = results.map(row => ({
                    id: row.id,
                    machineNo: row.machine_no,
                    machineName: row.machine_name,
                    serialNo: row.serial_no,
                    manufacturer: row.manufacturer,
                    model: row.model,
                    department: row.department,
                    lasers: JSON.parse(row.lasers || '[]'),
                    maintenanceHistory: JSON.parse(row.maintenance_history || '[]'),
                    lastUpdated: row.last_updated
                }));
                return new Response(JSON.stringify(machines), { headers: corsHeaders });
            }

            // GET /api/machines/:id
            if (path.startsWith('/api/machines/') && method === 'GET') {
                const id = path.replace('/api/machines/', '');
                const row = await env.DB.prepare('SELECT * FROM machines WHERE id = ?').bind(id).first();
                if (!row) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
                const machine = {
                    id: row.id,
                    machineNo: row.machine_no,
                    machineName: row.machine_name,
                    serialNo: row.serial_no,
                    manufacturer: row.manufacturer,
                    model: row.model,
                    department: row.department,
                    lasers: JSON.parse(row.lasers || '[]'),
                    maintenanceHistory: JSON.parse(row.maintenance_history || '[]'),
                    lastUpdated: row.last_updated
                };
                return new Response(JSON.stringify(machine), { headers: corsHeaders });
            }

            // POST or PUT /api/machines
            if ((path === '/api/machines' || path.startsWith('/api/machines/')) && (method === 'POST' || method === 'PUT')) {
                const m = await request.json();
                const lastUpdated = m.lastUpdated || new Date().toISOString();

                // Check existing machine in D1 to enforce timestamp rules
                try {
                    const existingRow = await env.DB.prepare('SELECT lasers FROM machines WHERE id = ?').bind(m.id).first();
                    if (existingRow && existingRow.lasers) {
                        const existingLasers = JSON.parse(existingRow.lasers || '[]');
                        processLaserTimestamps(existingLasers, m.lasers, lastUpdated);
                    }
                } catch (e) {}

                await env.DB.prepare(`
                    INSERT INTO machines (id, machine_no, machine_name, serial_no, manufacturer, model, department, lasers, maintenance_history, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        machine_no=excluded.machine_no,
                        machine_name=excluded.machine_name,
                        serial_no=excluded.serial_no,
                        manufacturer=excluded.manufacturer,
                        model=excluded.model,
                        department=excluded.department,
                        lasers=excluded.lasers,
                        maintenance_history=excluded.maintenance_history,
                        last_updated=excluded.last_updated
                `).bind(
                    m.id,
                    m.machineNo || '',
                    m.machineName || '',
                    m.serialNo || '',
                    m.manufacturer || '',
                    m.model || '',
                    m.department || '',
                    JSON.stringify(m.lasers || []),
                    JSON.stringify(m.maintenanceHistory || []),
                    lastUpdated
                ).run();

                // Trigger automatic push of authoritative laser data to FSOS
                const fsosSync = await syncMachineToFsos(m, lastUpdated, env);

                return new Response(JSON.stringify({ success: true, id: m.id, lastUpdated, fsosSync }), { headers: corsHeaders });
            }

            // DELETE /api/machines/:id
            if (path.startsWith('/api/machines/') && method === 'DELETE') {
                const id = path.replace('/api/machines/', '');
                await env.DB.prepare('DELETE FROM machines WHERE id = ?').bind(id).run();
                return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
            }

            // GET /api/settings
            if (path === '/api/settings' && method === 'GET') {
                const { results } = await env.DB.prepare('SELECT * FROM settings').all();
                const settings = {};
                results.forEach(row => {
                    try { settings[row.key] = JSON.parse(row.value); }
                    catch(e) { settings[row.key] = row.value; }
                });
                return new Response(JSON.stringify(settings), { headers: corsHeaders });
            }

            // POST /api/settings
            if (path === '/api/settings' && method === 'POST') {
                const settings = await request.json();
                for (const [key, value] of Object.entries(settings)) {
                    const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    await env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
                        .bind(key, strVal).run();
                }
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // POST /api/sync/upload-local & /api/sync/import (Initial Migration or Authoritative Import)
            if ((path === '/api/sync/upload-local' || path === '/api/sync/import') && method === 'POST') {
                const payload = await request.json();
                const machines = payload.machines || [];
                const settings = payload.settings || {};
                const overwrite = payload.overwrite === true || path === '/api/sync/import';

                // Check if D1 already has machines
                const countRow = await env.DB.prepare('SELECT COUNT(*) as count FROM machines').first();
                if (countRow && countRow.count > 0 && !overwrite) {
                    return new Response(JSON.stringify({ success: false, message: 'D1 database is not empty. Authoritative cloud data retained.' }), { status: 409, headers: corsHeaders });
                }

                if (overwrite) {
                    await env.DB.prepare('DELETE FROM machines').run();
                }

                for (const m of machines) {
                    await env.DB.prepare(`
                        INSERT INTO machines (id, machine_no, machine_name, serial_no, manufacturer, model, department, lasers, maintenance_history, last_updated)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                        m.id,
                        m.machineNo || '',
                        m.machineName || '',
                        m.serialNo || '',
                        m.manufacturer || '',
                        m.model || '',
                        m.department || '',
                        JSON.stringify(m.lasers || []),
                        JSON.stringify(m.maintenanceHistory || []),
                        m.lastUpdated || new Date().toISOString()
                    ).run();
                }

                for (const [key, value] of Object.entries(settings)) {
                    const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    await env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
                        .bind(key, strVal).run();
                }

                return new Response(JSON.stringify({ success: true, count: machines.length }), { headers: corsHeaders });
            }

            // If non-API request, pass to static asset handler
            if (env.ASSETS) {
                return env.ASSETS.fetch(request);
            }

            return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
        }
    }
};
