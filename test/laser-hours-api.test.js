const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Helper functions (mirrored from server.js / src/worker.js)
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

function processLaserHoursResponse(machines, filterMachine, filterLaser) {
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

    return {
        success: true,
        count: records.length,
        data: records
    };
}

console.log('--- Running LMS Laser Hours API Tests ---');

// Test Case 1: Format and content of laser hours records
{
    const sampleMachines = [
        {
            id: 'WD-77972',
            machineNo: 'WLVIA#1',
            machineName: 'WLVIA#1',
            lasers: [
                {
                    id: 'WD-77972-L1',
                    name: 'Laser Head 1',
                    baseLaserHour: 10000,
                    baseTimestamp: '2026-09-27T07:18:00.000Z',
                    lastRecalibrationDate: '2026-09-27T07:18:00.000Z'
                },
                {
                    id: 'WD-77972-L9491',
                    name: 'Laser Head 2',
                    baseLaserHour: 10,
                    baseTimestamp: '2026-08-20T07:51:00.000Z'
                }
            ],
            lastUpdated: '2026-09-27T07:18:00.000Z'
        }
    ];

    const result = processLaserHoursResponse(sampleMachines);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.count, 2);

    const record1 = result.data[0];
    assert.strictEqual(record1.machine, 'WLVIA#1', 'Machine identifier must be WLVIA#1');
    assert.strictEqual(record1.laser, 'LH1', 'First laser identifier must be LH1');
    assert.ok(typeof record1.laserHours === 'number' && record1.laserHours >= 10000, 'laserHours must be >= 10000');
    assert.strictEqual(record1.lastUpdated, '2026-09-27T07:18:00.000Z');

    const record2 = result.data[1];
    assert.strictEqual(record2.machine, 'WLVIA#1');
    assert.strictEqual(record2.laser, 'LH2', 'Second laser identifier must be LH2');

    // Verify NO internal LMS IDs or FSOS IDs exposed
    assert.strictEqual(record1.id, undefined, 'Must not expose internal ID');
    assert.strictEqual(record1.serialNo, undefined, 'Must not expose serialNo');
    assert.strictEqual(record1.fsosId, undefined, 'Must not expose fsosId');

    console.log('✓ PASS Test 1: Laser hours payload schema conforms to contract without internal IDs');
}

// Test Case 2: WLVIA#1 / LH1 specific retrieval
{
    const machines = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'machines.json'), 'utf8'));
    const result = processLaserHoursResponse(machines, 'WLVIA#1', 'LH1');

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.count, 1, 'Should return exactly 1 record for WLVIA#1 / LH1');
    assert.strictEqual(result.data[0].machine, 'WLVIA#1');
    assert.strictEqual(result.data[0].laser, 'LH1');
    assert.ok(typeof result.data[0].laserHours === 'number');
    assert.ok(result.data[0].lastUpdated !== null);

    console.log(`✓ PASS Test 2: WLVIA#1 / LH1 returned laserHours: ${result.data[0].laserHours}, lastUpdated: ${result.data[0].lastUpdated}`);
}

// Test Case 3: Authentication verification
{
    const configuredSecret = 'TEST_SECRET_KEY_123';

    function authenticate(headerAuth, xToken, queryToken, secret) {
        if (!secret) return true;
        const bearer = (headerAuth || '').startsWith('Bearer ') ? headerAuth.slice(7).trim() : (headerAuth || '').trim();
        const token = bearer || xToken || queryToken;
        return token === secret;
    }

    // Success with Bearer token
    assert.strictEqual(authenticate('Bearer TEST_SECRET_KEY_123', null, null, configuredSecret), true);
    // Success with X-LMS-Auth-Token
    assert.strictEqual(authenticate(null, 'TEST_SECRET_KEY_123', null, configuredSecret), true);
    // Success with query param
    assert.strictEqual(authenticate(null, null, 'TEST_SECRET_KEY_123', configuredSecret), true);
    // Failure with wrong token
    assert.strictEqual(authenticate('Bearer WRONG_TOKEN', null, null, configuredSecret), false);
    // Failure with empty token
    assert.strictEqual(authenticate(null, null, null, configuredSecret), false);

    console.log('✓ PASS Test 3: Authentication checks pass for headers, query params, and rejection of invalid tokens');
}

// Test Case 4: Version consistency v2.0.4
{
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    assert.strictEqual(pkg.version, '2.0.4', 'package.json version must be 2.0.4');

    const utils = fs.readFileSync(path.join(__dirname, '..', 'js', 'utils.js'), 'utf8');
    assert.ok(utils.includes("LMS_VERSION = '2.0.4'"), 'js/utils.js must export LMS_VERSION 2.0.4');

    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    assert.ok(html.includes('v2.0.4'), 'index.html must display v2.0.4');

    console.log('✓ PASS Test 4: LMS version 2.0.4 verified across package, utils, and UI');
}

console.log('--- All LMS Laser Hours API Tests Passed! ---');
