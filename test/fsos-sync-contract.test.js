const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Contract Evaluation Function (identical to server.js & src/worker.js)
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

console.log('--- Running FSOS Sync Contract & Version Tests ---');

// Test Case A: FSOS returns HTTP success + success:true + updated:true + updatedCount:1 + updatedMachineIds:['WD-77972'] -> LMS reports sync success
{
    const fsosResponse = {
        success: true,
        updated: true,
        updatedCount: 1,
        updatedMachineIds: ['WD-77972'],
        message: 'LMS machine synchronized successfully'
    };
    const result = evaluateFsosSyncResponse(true, 200, fsosResponse);
    assert.strictEqual(result.success, true, 'Case A: LMS should report sync success');
    assert.strictEqual(result.updated, true, 'Case A: updated flag should be true');
    assert.strictEqual(result.updatedCount, 1, 'Case A: updatedCount should be 1');
    assert.deepStrictEqual(result.updatedMachineIds, ['WD-77972'], 'Case A: updatedMachineIds should contain machine ID');
    console.log('✓ PASS Case A: FSOS HTTP 200 + success:true + updated:true + updatedCount:1 -> LMS sync success');
}

// Test Case B: FSOS returns HTTP 200 + success:true + updated:false + updatedCount:0 -> LMS reports sync failure / no update
{
    const fsosResponse = {
        success: true,
        updated: false,
        updatedCount: 0,
        updatedMachineIds: [],
        message: 'No matching machine record found to update in FSOS'
    };
    const result = evaluateFsosSyncResponse(true, 200, fsosResponse);
    assert.strictEqual(result.success, false, 'Case B: LMS should report sync failure when updated is false');
    assert.strictEqual(result.updated, false, 'Case B: updated flag should be false');
    assert.strictEqual(result.updatedCount, 0, 'Case B: updatedCount should be 0');
    assert.deepStrictEqual(result.updatedMachineIds, [], 'Case B: updatedMachineIds should be empty');
    console.log('✓ PASS Case B: FSOS HTTP 200 + success:true + updated:false + updatedCount:0 -> LMS sync failure');
}

// Test Case C: FSOS returns HTTP 500 -> LMS reports sync failure
{
    const result = evaluateFsosSyncResponse(false, 500, null);
    assert.strictEqual(result.success, false, 'Case C: LMS should report sync failure on HTTP 500');
    assert.strictEqual(result.updated, false, 'Case C: updated flag should be false');
    assert.strictEqual(result.error, 'HTTP error 500', 'Case C: error message should reflect HTTP error 500');
    console.log('✓ PASS Case C: FSOS HTTP 500 -> LMS sync failure');
}

// Test Case D: Invalid / malformed FSOS response -> LMS reports sync failure
{
    // D1: null body
    const resNull = evaluateFsosSyncResponse(true, 200, null);
    assert.strictEqual(resNull.success, false, 'Case D1: null body must fail');

    // D2: missing updatedMachineIds
    const resNoIds = evaluateFsosSyncResponse(true, 200, { success: true, updated: true, updatedCount: 1 });
    assert.strictEqual(resNoIds.success, false, 'Case D2: missing updatedMachineIds must fail');

    // D3: empty updatedMachineIds despite updated: true
    const resEmptyIds = evaluateFsosSyncResponse(true, 200, { success: true, updated: true, updatedCount: 1, updatedMachineIds: [] });
    assert.strictEqual(resEmptyIds.success, false, 'Case D3: empty updatedMachineIds must fail');

    // D4: success false
    const resFail = evaluateFsosSyncResponse(true, 200, { success: false, updated: false, message: 'Invalid payload' });
    assert.strictEqual(resFail.success, false, 'Case D4: success:false must fail');

    console.log('✓ PASS Case D: Invalid/malformed FSOS responses consistently report sync failure');
}

// Test Case E: LMS visible version surfaces resolve to the same authoritative v2.0.4
{
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const expectedVersion = '2.0.4';
    assert.strictEqual(packageJson.version, expectedVersion, 'package.json version must be 2.0.4');

    const utilsContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'utils.js'), 'utf8');
    assert.ok(utilsContent.includes(`LMS_VERSION = '${expectedVersion}'`), 'js/utils.js must export authoritative LMS_VERSION 2.0.4');

    const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    // Header version
    assert.ok(indexHtml.includes(`class="brand-version-badge">v${expectedVersion}</span>`), 'index.html header must show v2.0.4');
    // System info version
    assert.ok(indexHtml.includes(`id="settings-app-version" class="settings-info-value">v${expectedVersion}</span>`), 'index.html system info must show v2.0.4');
    // Bottom ops badge
    assert.ok(indexHtml.includes(`class="ops-badge" id="ops-lms-badge">LMS v${expectedVersion}</span>`), 'index.html ops badge must show LMS v2.0.4');
    // No FSOS Enterprise in LMS UI
    assert.ok(!indexHtml.includes('FSOS ENTERPRISE'), 'index.html must not identify as FSOS Enterprise');

    const settingsJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'settings.json'), 'utf8'));
    assert.strictEqual(settingsJson.version, expectedVersion, 'data/settings.json must specify version 2.0.4');

    console.log('✓ PASS Case E: LMS visible version surfaces consistently resolve to authoritative v2.0.4');
}

console.log('--- All FSOS Sync Contract & Version Tests Passed! ---');
