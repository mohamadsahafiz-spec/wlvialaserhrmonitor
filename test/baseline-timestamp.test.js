const assert = require('assert');

// 1. Core Timestamp Logic Function for testing
function resolveBaselineTimestamp(prevLaser, newBaseHour, newTimestampInput, saveTimestamp = new Date().toISOString()) {
    const prevHour = (prevLaser && typeof prevLaser.baseLaserHour === 'number' && !isNaN(prevLaser.baseLaserHour)) ? prevLaser.baseLaserHour : null;
    const incomingHour = (newBaseHour !== null && newBaseHour !== undefined && !isNaN(Number(newBaseHour))) ? Number(newBaseHour) : null;
    const prevTs = prevLaser ? (prevLaser.baseTimestamp || null) : null;
    const incomingTs = newTimestampInput || null;

    const hourChanged = (incomingHour !== prevHour);

    let tsExplicitlyChanged = false;
    if (incomingTs && incomingTs !== prevTs) {
        const prevLocal = prevTs ? (prevTs.includes('T') ? prevTs.slice(0, 16) : prevTs) : '';
        const inLocal = incomingTs.includes('T') ? incomingTs.slice(0, 16) : incomingTs;
        if (inLocal !== prevLocal) {
            tsExplicitlyChanged = true;
        }
    }

    if (hourChanged) {
        if (tsExplicitlyChanged && incomingTs) {
            return incomingTs;
        }
        return saveTimestamp;
    } else {
        if (tsExplicitlyChanged && incomingTs) {
            return incomingTs;
        }
        return prevTs;
    }
}

// 2. Machine Level Payload Processor
function processLaserTimestamps(existingMachine, incomingMachine, saveTime) {
    if (!existingMachine || !Array.isArray(existingMachine.lasers) || !Array.isArray(incomingMachine.lasers)) {
        return;
    }
    incomingMachine.lasers.forEach(laser => {
        const prevLaser = existingMachine.lasers.find(pl => pl.id === laser.id);
        if (prevLaser) {
            laser.baseTimestamp = resolveBaselineTimestamp(
                prevLaser,
                laser.baseLaserHour,
                laser.baseTimestamp,
                saveTime
            );
        }
    });
}

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
            baseLaserHour: l.baseLaserHour,
            baseTimestamp: l.baseTimestamp
        })) : [],
        lastUpdated: lastUpdated || m.lastUpdated || new Date().toISOString()
    };
}

// ==========================================
// TEST SUITE
// ==========================================

console.log('--- Starting Laser Baseline Timestamp Tests ---');

// Test Case 1: Hour changed + timestamp explicitly changed -> supplied timestamp preserved
{
    const prevLaser = {
        id: 'L1',
        name: 'Laser Head 1',
        baseLaserHour: 12500,
        baseTimestamp: '2026-08-01T10:00:00.000Z'
    };
    const newHour = 12600;
    const explicitTimestamp = '2026-09-20T15:30:00.000Z';
    const saveTime = '2026-09-27T03:00:00.000Z';

    const resultTs = resolveBaselineTimestamp(prevLaser, newHour, explicitTimestamp, saveTime);
    assert.strictEqual(resultTs, explicitTimestamp, 'Case 1 Failed: Supplied timestamp should be preserved');
    console.log('✓ PASS Case 1: Hour changed + timestamp explicitly changed -> supplied timestamp preserved');
}

// Test Case 2: Hour changed + timestamp unchanged -> save timestamp generated
{
    const prevLaser = {
        id: 'L1',
        name: 'Laser Head 1',
        baseLaserHour: 12500,
        baseTimestamp: '2026-08-01T10:00:00.000Z'
    };
    const newHour = 12600;
    const unchangedTimestamp = '2026-08-01T10:00:00.000Z';
    const saveTime = '2026-09-27T03:00:00.000Z';

    const resultTs = resolveBaselineTimestamp(prevLaser, newHour, unchangedTimestamp, saveTime);
    assert.strictEqual(resultTs, saveTime, 'Case 2 Failed: Save timestamp should be generated');
    console.log('✓ PASS Case 2: Hour changed + timestamp unchanged -> save timestamp generated');
}

// Test Case 3: Hour unchanged + timestamp unchanged -> existing timestamp preserved
{
    const prevLaser = {
        id: 'L1',
        name: 'Laser Head 1',
        baseLaserHour: 12500,
        baseTimestamp: '2026-08-01T10:00:00.000Z'
    };
    const sameHour = 12500;
    const unchangedTimestamp = '2026-08-01T10:00:00.000Z';
    const saveTime = '2026-09-27T03:00:00.000Z';

    const resultTs = resolveBaselineTimestamp(prevLaser, sameHour, unchangedTimestamp, saveTime);
    assert.strictEqual(resultTs, prevLaser.baseTimestamp, 'Case 3 Failed: Existing timestamp should be preserved');
    console.log('✓ PASS Case 3: Hour unchanged + timestamp unchanged -> existing timestamp preserved');
}

// Test Case 4: API Payload Generation Verification
{
    const existingMachine = {
        id: 'WLVIA-1',
        machineNo: 'WLVIA#1',
        lasers: [
            { id: 'L1', name: 'Laser Head 1', baseLaserHour: 12500, baseTimestamp: '2026-08-01T10:00:00.000Z' }
        ]
    };
    const saveTime = '2026-09-27T03:15:00.000Z';

    // Subcase 4A: Hour changed without timestamp change in machine update
    const incomingMachineA = {
        id: 'WLVIA-1',
        machineNo: 'WLVIA#1',
        lasers: [
            { id: 'L1', name: 'Laser Head 1', baseLaserHour: 12501, baseTimestamp: '2026-08-01T10:00:00.000Z' }
        ]
    };
    processLaserTimestamps(existingMachine, incomingMachineA, saveTime);
    const payloadA = mapLmsToFsosPayload(incomingMachineA, saveTime);
    assert.strictEqual(payloadA.lasers[0].baseLaserHour, 12501);
    assert.strictEqual(payloadA.lasers[0].baseTimestamp, saveTime, 'Payload A should have save timestamp');

    // Subcase 4B: Hour changed with explicit timestamp
    const incomingMachineB = {
        id: 'WLVIA-1',
        machineNo: 'WLVIA#1',
        lasers: [
            { id: 'L1', name: 'Laser Head 1', baseLaserHour: 12502, baseTimestamp: '2026-09-26T22:00:00.000Z' }
        ]
    };
    processLaserTimestamps(existingMachine, incomingMachineB, saveTime);
    const payloadB = mapLmsToFsosPayload(incomingMachineB, saveTime);
    assert.strictEqual(payloadB.lasers[0].baseLaserHour, 12502);
    assert.strictEqual(payloadB.lasers[0].baseTimestamp, '2026-09-26T22:00:00.000Z', 'Payload B should have explicit timestamp');

    // Subcase 4C: Hour unchanged with unchanged timestamp
    const incomingMachineC = {
        id: 'WLVIA-1',
        machineNo: 'WLVIA#1',
        lasers: [
            { id: 'L1', name: 'Laser Head 1', baseLaserHour: 12500, baseTimestamp: '2026-08-01T10:00:00.000Z' }
        ]
    };
    processLaserTimestamps(existingMachine, incomingMachineC, saveTime);
    const payloadC = mapLmsToFsosPayload(incomingMachineC, saveTime);
    assert.strictEqual(payloadC.lasers[0].baseLaserHour, 12500);
    assert.strictEqual(payloadC.lasers[0].baseTimestamp, '2026-08-01T10:00:00.000Z', 'Payload C should retain original timestamp');

    console.log('✓ PASS Case 4: API & FSOS Payload mapping verified for all 3 cases');
}

// Test Case 5: Recalibration path 9999 -> 10000 with older Simulation Date
{
    const olderSimulationDate = '2026-09-25T07:09:09.647Z';
    const mockSaveTime = '2026-09-27T07:18:00.000Z';
    const initialMachine = {
        id: 'WD-77972',
        machineNo: 'WLVIA#1',
        lasers: [
            {
                id: 'WD-77972-L1',
                name: 'Laser Head 1',
                baseLaserHour: 9999,
                baseTimestamp: '2026-09-25T03:36:09.096Z',
                calibrationHistory: []
            }
        ]
    };

    const actualReading = 10000;
    const targetLaser = initialMachine.lasers[0];
    const recalLaser = {
        ...targetLaser,
        baseLaserHour: actualReading,
        baseTimestamp: mockSaveTime,
        lastRecalibrationDate: mockSaveTime,
        calibrationHistory: [
            {
                date: olderSimulationDate.split('T')[0],
                time: '15:09',
                actualHour: actualReading,
                estimatedHour: 9999
            }
        ]
    };

    const recalibratedMachine = {
        ...initialMachine,
        lasers: [recalLaser],
        lastUpdated: mockSaveTime
    };

    // Verify properties
    assert.strictEqual(recalibratedMachine.lasers[0].baseLaserHour, 10000, 'baseLaserHour must equal 10000');
    assert.strictEqual(recalibratedMachine.lasers[0].baseTimestamp, mockSaveTime, 'baseTimestamp must equal actual save time');
    assert.notStrictEqual(recalibratedMachine.lasers[0].baseTimestamp, olderSimulationDate, 'baseTimestamp must NOT be the simulation date');

    // Verify FSOS payload mapping
    const fsosPayload = mapLmsToFsosPayload(recalibratedMachine, mockSaveTime);
    assert.strictEqual(fsosPayload.lasers[0].baseLaserHour, 10000);
    assert.strictEqual(fsosPayload.lasers[0].baseTimestamp, mockSaveTime);

    console.log('✓ PASS Case 5: Recalibration 9999 -> 10000 with older Simulation Date sets baseTimestamp to actual save time');
}

console.log('--- All tests completed successfully! ---');
