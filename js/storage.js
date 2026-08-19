/* =====================================================
   STORAGE.JS - Local Storage & Data Persistence Layer
   ===================================================== */
import { dateOffset } from './utils.js';

const STORAGE_KEY = 'wafer_driller_fleet_v5';
const SETTINGS_KEY = 'wafer_driller_settings_v5';

// Feature Flag for Multi-Device Cloud Sync
export const CLOUD_SYNC_ENABLED = true;

let currentSyncStatus = CLOUD_SYNC_ENABLED ? 'SYNCING' : 'LOCAL';
let syncTimer = null;
let lastMachinesHash = '';
let lastSettingsHash = '';

function getMachinesHash(machines) {
    try {
        return JSON.stringify(machines.map(m => ({ id: m.id, lu: m.lastUpdated, len: m.lasers ? m.lasers.length : 0 })));
    } catch(e) {
        return '';
    }
}

function getSettingsHash(settings) {
    try {
        return JSON.stringify(settings || {});
    } catch(e) {
        return '';
    }
}

function updateSyncStatus(status) {
    currentSyncStatus = status;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lms-sync-status-changed', { detail: { status } }));
    }
}

function getFallbackMachines() {
    return [
        {
            id: 'WD-101-ID',
            machineNo: 'WD-101',
            machineName: 'Wafer Driller BMD302W',
            serialNo: 'BMD3-9021',
            manufacturer: 'SemiconTech',
            model: 'BMD302W',
            department: 'Wafer Prep',
            lasers: [
                {
                    id: 'WD-101-L1',
                    name: 'Laser Head 1',
                    serialNo: 'BMD3-9021-L1',
                    ratedLife: 25000,
                    warningLife: 20000,
                    baseLaserHour: 12500,
                    baseTimestamp: dateOffset(30),
                    lastRecalibrationDate: dateOffset(30),
                    calibrationHistory: [
                        { date: dateOffset(30), estimatedHour: 12490, actualHour: 12500, difference: 10, reason: 'Scheduled PM', rating: '★★★★★ Excellent' }
                    ]
                },
                {
                    id: 'WD-101-L2',
                    name: 'Laser Head 2',
                    serialNo: 'BMD3-9021-L2',
                    ratedLife: 25000,
                    warningLife: 20000,
                    baseLaserHour: 20500,
                    baseTimestamp: dateOffset(30),
                    lastRecalibrationDate: dateOffset(30),
                    calibrationHistory: []
                }
            ],
            maintenanceHistory: [
                { date: dateOffset(120).split('T')[0], engineer: 'J. Smith', action: 'Lens Clean', notes: 'Routine check' },
                { date: dateOffset(60).split('T')[0], engineer: 'M. Doe', action: 'Filter Replace', notes: 'Dust accumulation high' }
            ],
            lastUpdated: new Date().toISOString()
        },
        {
            id: 'WD-102-ID',
            machineNo: 'WD-102',
            machineName: 'Wafer Driller BMD250WM',
            serialNo: 'BMD2-40401',
            manufacturer: 'SemiconTech',
            model: 'BMD250WM',
            department: 'Packaging',
            lasers: [
                {
                    id: 'WD-102-L1',
                    name: 'Laser Head 1',
                    serialNo: 'BMD2-40401-L1',
                    ratedLife: 25000,
                    warningLife: 20000,
                    baseLaserHour: 19800,
                    baseTimestamp: dateOffset(45),
                    lastRecalibrationDate: dateOffset(45),
                    calibrationHistory: [
                        { date: dateOffset(45), estimatedHour: 19780, actualHour: 19800, difference: 20, reason: 'Manual Verification', rating: '★★★★☆ Very Good' }
                    ]
                },
                {
                    id: 'WD-102-L2',
                    name: 'Laser Head 2',
                    serialNo: 'BMD2-40401-L2',
                    ratedLife: 25000,
                    warningLife: 20000,
                    baseLaserHour: 14200,
                    baseTimestamp: dateOffset(45),
                    lastRecalibrationDate: dateOffset(45),
                    calibrationHistory: []
                },
                {
                    id: 'WD-102-L3',
                    name: 'Laser Head 3',
                    serialNo: 'BMD2-40401-L3',
                    ratedLife: 25000,
                    warningLife: 20000,
                    baseLaserHour: 8900,
                    baseTimestamp: dateOffset(45),
                    lastRecalibrationDate: dateOffset(45),
                    calibrationHistory: []
                }
            ],
            maintenanceHistory: [
                { date: dateOffset(70).split('T')[0], engineer: 'T. Stark', action: 'Calibration', notes: 'Beam alignment drift corrected' }
            ],
            lastUpdated: new Date().toISOString()
        },
        {
            id: 'WD-201-ID',
            machineNo: 'WD-201',
            machineName: 'Wafer Driller BMD302W',
            serialNo: 'BMD3-8832',
            manufacturer: 'SemiconTech',
            model: 'BMD302W',
            department: 'R&D',
            lasers: [
                {
                    id: 'WD-201-L1',
                    name: 'Laser Head 1',
                    serialNo: 'BMD3-8832-L1',
                    ratedLife: 25000,
                    warningLife: 20000,
                    baseLaserHour: 24500,
                    baseTimestamp: dateOffset(95),
                    lastRecalibrationDate: dateOffset(95),
                    calibrationHistory: [
                        { date: dateOffset(95), estimatedHour: 24450, actualHour: 24500, difference: 50, reason: 'Breakdown', rating: '★★★☆☆ Good' }
                    ]
                },
                {
                    id: 'WD-201-L2',
                    name: 'Laser Head 2',
                    serialNo: 'BMD3-8832-L2',
                    ratedLife: 25000,
                    warningLife: 20000,
                    baseLaserHour: 18100,
                    baseTimestamp: dateOffset(95),
                    lastRecalibrationDate: dateOffset(95),
                    calibrationHistory: []
                }
            ],
            maintenanceHistory: [
                { date: dateOffset(200).split('T')[0], engineer: 'B. Banner', action: 'Diode Module 1 Replace', notes: 'Power drop detected' }
            ],
            lastUpdated: new Date().toISOString()
        },
        {
            id: 'WD-305-ID',
            machineNo: 'WD-305',
            machineName: 'Wafer Driller BMD250WM',
            serialNo: 'BMD2-771',
            manufacturer: 'SemiconTech',
            model: 'BMD250WM',
            department: 'Wafer Prep',
            lasers: [
                {
                    id: 'WD-305-L1',
                    name: 'Laser Head 1',
                    serialNo: 'BMD2-771-L1',
                    ratedLife: 20000,
                    warningLife: 15000,
                    baseLaserHour: 2500,
                    baseTimestamp: dateOffset(10),
                    lastRecalibrationDate: dateOffset(10),
                    calibrationHistory: []
                },
                {
                    id: 'WD-305-L2',
                    name: 'Laser Head 2',
                    serialNo: 'BMD2-771-L2',
                    ratedLife: 20000,
                    warningLife: 15000,
                    baseLaserHour: 3100,
                    baseTimestamp: dateOffset(10),
                    lastRecalibrationDate: dateOffset(10),
                    calibrationHistory: []
                },
                {
                    id: 'WD-305-L3',
                    name: 'Laser Head 3',
                    serialNo: 'BMD2-771-L3',
                    ratedLife: 20000,
                    warningLife: 15000,
                    baseLaserHour: 1800,
                    baseTimestamp: dateOffset(10),
                    lastRecalibrationDate: dateOffset(10),
                    calibrationHistory: []
                },
                {
                    id: 'WD-305-L4',
                    name: 'Laser Head 4',
                    serialNo: 'BMD2-771-L4',
                    ratedLife: 20000,
                    warningLife: 15000,
                    baseLaserHour: 2900,
                    baseTimestamp: dateOffset(10),
                    lastRecalibrationDate: dateOffset(10),
                    calibrationHistory: []
                }
            ],
            maintenanceHistory: [],
            lastUpdated: new Date().toISOString()
        }
    ];
}

export const StorageService = {
    normalizeMachines(list) {
        if (!Array.isArray(list)) return getFallbackMachines();
        return list.map(m => {
            const id = m.id || 'WD-' + Math.floor(Math.random() * 100000);
            const machineNo = m.machineNo || 'WD-000';
            const machineName = m.machineName || ('Wafer Driller ' + (m.model || 'BMD302W'));
            const serialNo = m.serialNo || 'SN-0000';
            const manufacturer = m.manufacturer || 'SemiconTech';
            const model = m.model || 'BMD302W';
            const department = m.department || 'Wafer Prep';

            // Multi-laser normalization: ensure lasers array exists and has valid objects
            let lasers = Array.isArray(m.lasers) && m.lasers.length > 0 ? m.lasers : null;

            if (!lasers) {
                // Migrate single laser machine object into multi-laser structure
                const rated = Number(m.ratedLife) || 25000;
                const warn = Number(m.warningLife) || Math.floor(rated * 0.8);
                const contingency = (typeof m.contingencyCeiling === 'number' && !isNaN(m.contingencyCeiling))
                    ? m.contingencyCeiling
                    : (Number(m.contingencyCeiling) || (rated + 3000));
                const baseHour = (typeof m.baseLaserHour === 'number' && !isNaN(m.baseLaserHour)) ? m.baseLaserHour : (typeof m.prevHour === 'number' && !isNaN(m.prevHour) ? m.prevHour : null);
                let baseTs = (m.baseTimestamp && !isNaN(new Date(m.baseTimestamp).getTime()))
                    ? m.baseTimestamp
                    : ((m.prevDate && !isNaN(new Date(m.prevDate).getTime())) ? new Date(m.prevDate).toISOString() : null);

                lasers = [{
                    id: `${id}-L1`,
                    name: 'Laser Head 1',
                    serialNo: m.laserSerialNo || (serialNo ? `${serialNo}-L1` : 'LS-101'),
                    generation: Number(m.generation) || (Array.isArray(m.lifecycleHistory) ? m.lifecycleHistory.length + 1 : 1),
                    lifecycleHistory: Array.isArray(m.lifecycleHistory) ? m.lifecycleHistory : [],
                    ratedLife: rated,
                    warningLife: warn,
                    contingencyCeiling: contingency,
                    baseLaserHour: baseHour,
                    baseTimestamp: baseTs,
                    runtimeState: (!baseTs || baseHour === null) ? 'BASELINE_REQUIRED' : 'NORMAL',
                    lastRecalibrationDate: m.lastRecalibrationDate || baseTs,
                    calibrationHistory: Array.isArray(m.calibrationHistory) ? m.calibrationHistory : []
                }];
            } else {
                // Ensure every laser in array is preserved correctly without fabricating timestamps
                lasers = lasers.map((laser, idx) => {
                    const lRated = Number(laser.ratedLife) || 25000;
                    const lWarn = Number(laser.warningLife) || Math.floor(laser.warningLife) || Math.floor(lRated * 0.8);
                    const lContingency = (typeof laser.contingencyCeiling === 'number' && !isNaN(laser.contingencyCeiling))
                        ? laser.contingencyCeiling
                        : (Number(laser.contingencyCeiling) || (lRated + 3000));
                    const lBase = (typeof laser.baseLaserHour === 'number' && !isNaN(laser.baseLaserHour)) ? laser.baseLaserHour : null;
                    const lTs = (laser.baseTimestamp && !isNaN(new Date(laser.baseTimestamp).getTime())) ? laser.baseTimestamp : null;

                    return {
                        id: laser.id || `${id}-L${idx + 1}`,
                        name: laser.name || `Laser Head ${idx + 1}`,
                        serialNo: laser.serialNo || `${serialNo}-L${idx + 1}`,
                        generation: Number(laser.generation) || (Array.isArray(laser.lifecycleHistory) ? laser.lifecycleHistory.length + 1 : 1),
                        lifecycleHistory: Array.isArray(laser.lifecycleHistory) ? laser.lifecycleHistory : [],
                        ratedLife: lRated,
                        warningLife: lWarn,
                        contingencyCeiling: lContingency,
                        baseLaserHour: lBase,
                        baseTimestamp: lTs,
                        runtimeState: (!lTs || lBase === null) ? 'BASELINE_REQUIRED' : (laser.runtimeState || 'NORMAL'),
                        lastRecalibrationDate: laser.lastRecalibrationDate || lTs,
                        calibrationHistory: Array.isArray(laser.calibrationHistory) ? laser.calibrationHistory : []
                    };
                });
            }

            return {
                id,
                machineNo,
                machineName,
                serialNo,
                manufacturer,
                model,
                department,
                lasers,
                maintenanceHistory: Array.isArray(m.maintenanceHistory) ? m.maintenanceHistory : [],
                lastUpdated: m.lastUpdated || new Date().toISOString()
            };
        });
    },

    async loadMachinesAsync() {
        if (CLOUD_SYNC_ENABLED) {
            try {
                updateSyncStatus('SYNCING');
                const res = await fetch('/api/machines');
                if (res.ok) {
                    const remote = await res.json();
                    if (Array.isArray(remote) && remote.length > 0) {
                        const normalized = this.normalizeMachines(remote);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
                        lastMachinesHash = getMachinesHash(normalized);
                        updateSyncStatus('SYNCED');
                        return normalized;
                    } else if (Array.isArray(remote) && remote.length === 0) {
                        // Remote D1 is empty. Check if local data exists to seed D1.
                        const localRaw = localStorage.getItem(STORAGE_KEY);
                        let localMachines = [];
                        if (localRaw) {
                            try { localMachines = JSON.parse(localRaw); } catch (e) {}
                        }
                        if (!Array.isArray(localMachines) || localMachines.length === 0) {
                            try {
                                const fRes = await fetch('data/machines.json');
                                if (fRes.ok) {
                                    const json = await fRes.json();
                                    if (Array.isArray(json) && json.length > 0) {
                                        localMachines = json;
                                    }
                                }
                            } catch (e) {}
                        }
                        if (!Array.isArray(localMachines) || localMachines.length === 0) {
                            localMachines = getFallbackMachines();
                        }

                        const normalizedLocal = this.normalizeMachines(localMachines);
                        try {
                            await fetch('/api/sync/upload-local', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ machines: normalizedLocal, settings: this.loadSettings() })
                            });
                        } catch (uploadErr) {
                            console.warn('[StorageService] D1 seed upload warning:', uploadErr);
                        }
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedLocal));
                        lastMachinesHash = getMachinesHash(normalizedLocal);
                        updateSyncStatus('SYNCED');
                        return normalizedLocal;
                    }
                }
            } catch (err) {
                console.warn('[StorageService] Error connecting to Cloud API, using local storage:', err);
                updateSyncStatus('OFFLINE');
            }
        }

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw !== null) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return this.normalizeMachines(parsed);
                }
            }
            const res = await fetch('data/machines.json');
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json) && json.length > 0) {
                    const normalized = this.normalizeMachines(json);
                    this.saveMachines(normalized);
                    return normalized;
                }
            }
        } catch (err) {
            console.warn('[StorageService] Error loading data/machines.json, using fallbacks:', err);
        }
        const fallback = getFallbackMachines();
        this.saveMachines(fallback);
        return fallback;
    },

    loadMachines() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw === null) {
                const initial = getFallbackMachines();
                this.saveMachines(initial);
                return initial;
            }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                const initial = getFallbackMachines();
                this.saveMachines(initial);
                return initial;
            }
            return this.normalizeMachines(parsed);
        } catch (err) {
            console.error('[StorageService] Error loading machines:', err);
            return getFallbackMachines();
        }
    },

    saveMachines(machines) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('lms-fleet-updated', { detail: { count: machines ? machines.length : 0 } }));
            }
        } catch (err) {
            console.error('[StorageService] Error saving machines:', err);
        }
    },

    getMachineById(id) {
        const machines = this.loadMachines();
        return machines.find(m => m.id === id) || null;
    },

    saveMachine(machineData) {
        const machines = this.loadMachines();
        const index = machines.findIndex(m => m.id === machineData.id);
        const updatedTarget = { ...machineData, lastUpdated: new Date().toISOString() };
        if (index !== -1) {
            machines[index] = { ...machines[index], ...updatedTarget };
        } else {
            machines.push(updatedTarget);
        }
        this.saveMachines(machines);

        if (CLOUD_SYNC_ENABLED) {
            updateSyncStatus('SYNCING');
            fetch('/api/machines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTarget)
            }).then(res => {
                if (res.ok) updateSyncStatus('SYNCED');
                else updateSyncStatus('ERROR');
            }).catch(err => {
                updateSyncStatus('OFFLINE');
            });
        }

        return machines;
    },

    deleteMachine(id) {
        let machines = this.loadMachines();
        machines = machines.filter(m => String(m.id) !== String(id));
        this.saveMachines(machines);

        if (CLOUD_SYNC_ENABLED) {
            updateSyncStatus('SYNCING');
            fetch(`/api/machines/${id}`, { method: 'DELETE' })
                .then(res => {
                    if (res.ok) updateSyncStatus('SYNCED');
                    else updateSyncStatus('ERROR');
                })
                .catch(err => {
                    updateSyncStatus('OFFLINE');
                });
        }

        return machines;
    },

    loadSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            const defaults = {
                systemTitle: "Laser Management System",
                version: "1.0",
                theme: "dark",
                defaultRatedLife: 25000,
                defaultWarningPercentage: 80,
                engineerPassword: "1234",
                accessMode: "ENGINEER"
            };
            if (!raw) return defaults;
            const parsed = JSON.parse(raw);
            if (parsed.systemTitle === "Wafer Driller BMD302W/BMD250WM Management") {
                parsed.systemTitle = "Laser Management System";
            }
            return { ...defaults, ...parsed };
        } catch (err) {
            return {
                systemTitle: "Laser Management System",
                version: "1.0",
                theme: "dark",
                engineerPassword: "1234",
                accessMode: "ENGINEER"
            };
        }
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (err) {
            console.error('[StorageService] Error saving settings:', err);
        }

        if (CLOUD_SYNC_ENABLED) {
            fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            }).catch(err => {});
        }
    },

    exportBackup() {
        const machines = this.loadMachines();
        const settings = this.loadSettings();
        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            machines: JSON.parse(JSON.stringify(machines)),
            settings: JSON.parse(JSON.stringify(settings))
        };
    },

    importBackup(data) {
        if (!data) throw new Error('Invalid backup data');
        let machines = [];
        let settings = null;

        if (Array.isArray(data)) {
            machines = data;
        } else if (typeof data === 'object' && data !== null) {
            machines = Array.isArray(data.machines) ? data.machines : [];
            if (data.settings && typeof data.settings === 'object') {
                settings = data.settings;
            }
        } else {
            throw new Error('Unsupported backup format');
        }

        const normalizedMachines = this.normalizeMachines(machines);
        this.saveMachines(normalizedMachines);

        if (settings) {
            this.saveSettings(settings);
        }

        if (CLOUD_SYNC_ENABLED) {
            fetch('/api/sync/upload-local', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ machines: normalizedMachines, settings: settings || this.loadSettings() })
            }).catch(err => console.warn('[StorageService] Backup sync error:', err));
        }

        return {
            machines: normalizedMachines,
            settings: this.loadSettings()
        };
    },

    getSyncStatus() {
        return currentSyncStatus;
    },

    async saveMachineAsync(machineData) {
        const machines = this.saveMachine(machineData);
        if (CLOUD_SYNC_ENABLED) {
            try {
                updateSyncStatus('SYNCING');
                const res = await fetch('/api/machines', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(machineData)
                });
                if (res.ok) updateSyncStatus('SYNCED');
                else updateSyncStatus('ERROR');
            } catch (err) {
                updateSyncStatus('OFFLINE');
            }
        }
        return machines;
    },

    async deleteMachineAsync(id) {
        const machines = this.deleteMachine(id);
        if (CLOUD_SYNC_ENABLED) {
            try {
                updateSyncStatus('SYNCING');
                const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
                if (res.ok) updateSyncStatus('SYNCED');
                else updateSyncStatus('ERROR');
            } catch (err) {
                updateSyncStatus('OFFLINE');
            }
        }
        return machines;
    },

    async loadSettingsAsync() {
        if (!CLOUD_SYNC_ENABLED) return this.loadSettings();
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const remote = await res.json();
                if (remote && Object.keys(remote).length > 0) {
                    this.saveSettings(remote);
                    return this.loadSettings();
                }
            }
        } catch (err) {}
        return this.loadSettings();
    },

    async saveSettingsAsync(settings) {
        this.saveSettings(settings);
        if (CLOUD_SYNC_ENABLED) {
            try {
                await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                });
            } catch (err) {}
        }
    },

    initBackgroundSync(onUpdateCallback) {
        if (!CLOUD_SYNC_ENABLED) return;

        const checkRemoteChanges = async () => {
            try {
                const [mRes, sRes] = await Promise.all([
                    fetch('/api/machines').catch(() => null),
                    fetch('/api/settings').catch(() => null)
                ]);

                if (mRes && mRes.ok) {
                    const remote = await mRes.json();
                    const normalized = this.normalizeMachines(remote);
                    const newHash = getMachinesHash(normalized);
                    if (lastMachinesHash && newHash !== lastMachinesHash) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
                        lastMachinesHash = newHash;
                        updateSyncStatus('SYNCED');
                        if (typeof onUpdateCallback === 'function') {
                            onUpdateCallback(normalized);
                        }
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('lms-fleet-updated', { detail: { count: normalized.length } }));
                        }
                    } else {
                        lastMachinesHash = newHash;
                        updateSyncStatus('SYNCED');
                    }
                }

                if (sRes && sRes.ok) {
                    const remoteSettings = await sRes.json();
                    if (remoteSettings && Object.keys(remoteSettings).length > 0) {
                        const mergedSettings = { ...this.loadSettings(), ...remoteSettings };
                        const newSHash = getSettingsHash(mergedSettings);
                        if (lastSettingsHash && newSHash !== lastSettingsHash) {
                            localStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings));
                            lastSettingsHash = newSHash;
                            if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('lms-settings-updated', { detail: mergedSettings }));
                            }
                        } else {
                            lastSettingsHash = newSHash;
                        }
                    }
                }
            } catch (err) {
                updateSyncStatus('OFFLINE');
            }
        };

        if (!syncTimer) {
            syncTimer = setInterval(checkRemoteChanges, 10000);
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('focus', checkRemoteChanges);
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    checkRemoteChanges();
                }
            });
        }
    }
};

window.StorageService = StorageService;
