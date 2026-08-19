// Cloudflare Worker API for LMS D1 Synchronization

export default {
    async fetch(request, env) {
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
                return new Response(JSON.stringify({ success: true, id: m.id, lastUpdated }), { headers: corsHeaders });
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

            // POST /api/sync/upload-local (Initial Migration)
            if (path === '/api/sync/upload-local' && method === 'POST') {
                const payload = await request.json();
                const machines = payload.machines || [];
                const settings = payload.settings || {};

                // Check if D1 already has machines
                const countRow = await env.DB.prepare('SELECT COUNT(*) as count FROM machines').first();
                if (countRow && countRow.count > 0) {
                    return new Response(JSON.stringify({ success: false, message: 'D1 database is not empty. Authoritative cloud data retained.' }), { status: 409, headers: corsHeaders });
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
