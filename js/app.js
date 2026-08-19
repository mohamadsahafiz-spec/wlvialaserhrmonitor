/* =====================================================
   APP.JS - Main Application Entry & Controller
   ===================================================== */
import { StorageService } from './storage.js';
import { LaserEngine } from './laserEngine.js';
import { DashboardController } from './dashboard.js';
import { MachineController } from './machine.js';
import { RecalibrationController } from './recalibration.js';
import { UI } from './ui.js';
import { getCurrentEvalTime, getQueryParam, setQueryParam, safeToISOString, safeToDatetimeLocal } from './utils.js';

const AppState = {
    machines: [],
    settings: {},
    currentMachineId: null,
    simulatedDate: new Date().toISOString().split('T')[0],
    filters: { search: '', status: 'ALL', dept: 'ALL', model: 'ALL', sort: 'no-asc' },
    pendingRecalibration: null
};
window.AppState = AppState;

let DOM = {};

function initDOM() {
    DOM = {
        // Navigation Views
        viewFleet: document.getElementById('view-fleet'),
        viewSingle: document.getElementById('view-single'),
        viewSettings: document.getElementById('view-settings'),
        navFleet: document.getElementById('nav-fleet'),
        navSettings: document.getElementById('nav-settings'),
        fleetGrid: document.getElementById('fleet-grid'),

        // Filters
        filterSearch: document.getElementById('filter-search'),
        filterStatus: document.getElementById('filter-status'),
        filterDept: document.getElementById('filter-dept'),
        filterModel: document.getElementById('filter-model'),
        filterSort: document.getElementById('filter-sort'),

        // Machine Detail Form
        detMachNo: document.getElementById('det-mach-no'),
        detModel: document.getElementById('det-model'),
        detSerialNo: document.getElementById('det-serial-no'),
        detDept: document.getElementById('det-dept'),
        detRated: document.getElementById('det-rated'),
        prevHour: document.getElementById('prevHour'),
        prevDate: document.getElementById('prevDate'),
        todayDate: document.getElementById('todayDate'),

        // Confidence Center
        confEstimatedHour: document.getElementById('conf-estimated-hour'),
        confAccuracy: document.getElementById('conf-accuracy'),
        confLastRecal: document.getElementById('conf-last-recal'),
        confNextRecal: document.getElementById('conf-next-recal'),
        confStatus: document.getElementById('conf-status'),

        // Metric Card Elements
        currentHour: document.getElementById('currentHour'),
        currentAge: document.getElementById('currentAge'),
        runningHour: document.getElementById('runningHour'),
        runningDay: document.getElementById('runningDay'),
        remainingCard: document.getElementById('remainingCard'),
        remainingHour: document.getElementById('remainingHour'),
        remainingDay: document.getElementById('remainingDay'),
        remainingDot: document.getElementById('remainingDot'),
        remainingText: document.getElementById('remainingText'),
        statusText: document.getElementById('statusText'),
        recommendation: document.getElementById('recommendation'),
        progressBar: document.getElementById('progressBar'),
        healthPercent: document.getElementById('healthPercent'),

        // History Tables
        maintTbody: document.getElementById('maintenance-tbody'),
        btnAddRecord: document.getElementById('btn-add-record'),
        calibrationTbody: document.getElementById('calibration-tbody'),

        // Legends & Scales
        legendSafe: document.getElementById('legend-safe'),
        legendWarning: document.getElementById('legend-warning'),
        legendAlarm: document.getElementById('legend-alarm'),
        scaleWarn: document.getElementById('scale-warn'),
        scaleAlarm: document.getElementById('scale-alarm'),

        // Buttons
        btnBack: document.getElementById('btn-back'),
        btnSaveMachine: document.getElementById('btn-save-machine'),
        btnDeleteMachine: document.getElementById('btn-delete-machine'),
        btnExportCsv: document.getElementById('btn-export-csv'),
        btnPrint: document.getElementById('btn-print'),
        btnTheme: document.getElementById('btn-theme'),

        // Recalibration Modal
        btnCloseMachModal: document.getElementById('btn-close-mach-modal'),
        btnOpenRecalibrate: document.getElementById('btn-open-recalibrate'),
        recalOverlay: document.getElementById('recalibrate-modal-overlay'),
        btnCloseRecalModal: document.getElementById('btn-close-recal-modal'),
        btnCancelRecalModal: document.getElementById('btn-cancel-recal-modal'),
        btnSubmitRecalibrate: document.getElementById('btn-submit-recalibrate'),
        recalLaserSelect: document.getElementById('recal-laser-select'),
        recalCurrentEstDisplay: document.getElementById('recal-current-est'),
        recalActualInput: document.getElementById('recal-actual-hour'),
        recalReasonSelect: document.getElementById('recal-reason'),

        // Laser Head Modal
        btnAddLaserHead: document.getElementById('btn-add-laser-head'),
        laserModalOverlay: document.getElementById('laser-modal-overlay'),
        btnCloseLaserModal: document.getElementById('btn-close-laser-modal'),
        btnCancelLaserModal: document.getElementById('btn-cancel-laser-modal'),
        btnSubmitLaserHead: document.getElementById('btn-submit-laser-head'),
        laserModalTitle: document.getElementById('laser-modal-title'),
        laserModalId: document.getElementById('laser-modal-id'),
        laserModalName: document.getElementById('laser-modal-name'),
        laserModalSerial: document.getElementById('laser-modal-serial'),
        laserModalBaseHour: document.getElementById('laser-modal-base-hour'),
        laserModalTimestamp: document.getElementById('laser-modal-timestamp'),
        laserModalWarning: document.getElementById('laser-modal-warning'),
        laserModalRated: document.getElementById('laser-modal-rated'),
        laserModalContingency: document.getElementById('laser-modal-contingency'),
        laserModalPreviewText: document.getElementById('laser-modal-preview-text'),

        // Delete Laser Modal
        deleteLaserOverlay: document.getElementById('delete-laser-modal-overlay'),
        btnCloseDeleteLaserModal: document.getElementById('btn-close-delete-laser-modal'),
        btnCancelDeleteLaserModal: document.getElementById('btn-cancel-delete-laser-modal'),
        btnConfirmDeleteLaser: document.getElementById('btn-confirm-delete-laser'),
        deleteLaserTargetName: document.getElementById('delete-laser-target-name'),
        deleteLaserTargetSerial: document.getElementById('delete-laser-target-serial'),

        // Delete Machine Modal
        deleteMachineOverlay: document.getElementById('delete-machine-modal-overlay'),
        btnCloseDeleteMachineModal: document.getElementById('btn-close-delete-machine-modal'),
        btnCancelDeleteMachineModal: document.getElementById('btn-cancel-delete-machine-modal'),
        btnConfirmDeleteMachineModal: document.getElementById('btn-confirm-delete-machine-modal'),
        deleteMachineTargetName: document.getElementById('delete-machine-target-name'),
        deleteMachineTargetSerial: document.getElementById('delete-machine-target-serial'),

        // Deviation Analysis Modal
        deviationOverlay: document.getElementById('deviation-modal-overlay'),
        btnCloseDevModal: document.getElementById('btn-close-dev-modal'),
        btnBackDevModal: document.getElementById('btn-back-dev-modal'),
        btnConfirmDeviation: document.getElementById('btn-confirm-deviation'),
        devEstHourDisplay: document.getElementById('dev-est-hour'),
        devActualHourDisplay: document.getElementById('dev-actual-hour'),
        devDiffDisplay: document.getElementById('dev-diff'),
        devRatingDisplay: document.getElementById('dev-rating'),
        devWarningBox: document.getElementById('dev-warning-box'),

        // Add Machine Modal
        btnOpenAdd: document.getElementById('btn-open-add'),
        addModalOverlay: document.getElementById('add-modal-overlay'),
        btnCloseAddModal: document.getElementById('btn-close-modal'),
        btnCancelAddModal: document.getElementById('btn-cancel-modal'),
        btnSubmitMachine: document.getElementById('btn-submit-machine'),
        newMachModel: document.getElementById('new-mach-model'),
        newMachSerial: document.getElementById('new-mach-serial'),
        newMachDept: document.getElementById('new-mach-dept'),
        newMachLaserCount: document.getElementById('new-mach-laser-count'),

        // Edit Machine Modal
        editModalOverlay: document.getElementById('edit-modal-overlay'),
        btnCloseEditModal: document.getElementById('btn-close-edit-modal'),
        btnCancelEditModal: document.getElementById('btn-cancel-edit-modal'),
        btnSubmitEditMachine: document.getElementById('btn-submit-edit-machine'),
        editMachId: document.getElementById('edit-mach-id'),
        editMachName: document.getElementById('edit-mach-name'),
        editMachNo: document.getElementById('edit-mach-no'),
        editMachModel: document.getElementById('edit-mach-model'),
        editMachSerial: document.getElementById('edit-mach-serial'),
        editMachDept: document.getElementById('edit-mach-dept'),
        editMachRated: document.getElementById('edit-mach-rated'),
        editMachBaseHour: document.getElementById('edit-mach-base-hour'),

        // Configuration & Delete Buttons
        btnDeleteMachine: document.getElementById('btn-delete-machine'),
        btnDeleteEditMachine: document.getElementById('btn-delete-edit-machine'),
        detMachName: document.getElementById('det-mach-name'),
        detMachNo: document.getElementById('det-mach-no'),
        detModel: document.getElementById('det-model'),
        detSerialNo: document.getElementById('det-serial-no'),
        detDept: document.getElementById('det-dept'),

        // Toolbar Filter Popover & Controls
        btnToggleFilters: document.getElementById('btn-toggle-filters'),
        filterPopover: document.getElementById('filter-popover-menu'),
        btnClearFilters: document.getElementById('btn-clear-filters'),
        filterActiveBadge: document.getElementById('filter-active-badge'),
        historyFilterBar: document.getElementById('history-filter-bar'),

        // Replace Laser Modal
        replaceLaserOverlay: document.getElementById('replace-laser-modal-overlay'),
        btnCloseReplaceModal: document.getElementById('btn-close-replace-modal'),
        btnCancelReplaceModal: document.getElementById('btn-cancel-replace-modal'),
        btnSubmitReplaceLaser: document.getElementById('btn-submit-replace-laser'),
        replModalTitle: document.getElementById('repl-modal-title'),
        replMachineId: document.getElementById('repl-machine-id'),
        replLaserId: document.getElementById('repl-laser-id'),
        replInstalledHour: document.getElementById('repl-installed-hour'),
        replInstallTimestamp: document.getElementById('repl-install-timestamp'),
        replEngineerName: document.getElementById('repl-engineer-name'),
        replReason: document.getElementById('repl-reason'),
        replNotes: document.getElementById('repl-notes'),

        // Maintenance Record Modal
        maintenanceOverlay: document.getElementById('maintenance-modal-overlay'),
        btnCloseMaintModal: document.getElementById('btn-close-maint-modal'),
        btnCancelMaintModal: document.getElementById('btn-cancel-maint-modal'),
        btnSubmitMaintenance: document.getElementById('btn-submit-maintenance'),
        maintDate: document.getElementById('maint-date'),
        maintEngineer: document.getElementById('maint-engineer'),
        maintAction: document.getElementById('maint-action'),
        maintNotes: document.getElementById('maint-notes'),

        // Identity Mismatch Modal
        identityOverlay: document.getElementById('identity-mismatch-modal-overlay'),
        btnCloseIdentityModal: document.getElementById('btn-close-identity-modal'),
        btnUseRegisteredIdentity: document.getElementById('btn-use-registered-identity'),
        btnConfirmIdentityChange: document.getElementById('btn-confirm-identity-change'),
        mismatchRegModel: document.getElementById('mismatch-reg-model'),
        mismatchEntModel: document.getElementById('mismatch-ent-model'),
        mismatchRegSerial: document.getElementById('mismatch-reg-serial'),
        mismatchEntSerial: document.getElementById('mismatch-ent-serial'),

        // Mode Authentication Modal & Controls
        btnToggleMode: document.getElementById('btn-toggle-mode'),
        modeLabel: document.getElementById('mode-label'),
        modeModalOverlay: document.getElementById('mode-modal-overlay'),
        inputModePassword: document.getElementById('input-mode-password'),
        btnSubmitModeAuth: document.getElementById('btn-submit-mode-auth'),
        btnCancelModeModal: document.getElementById('btn-cancel-mode-modal'),
        btnCloseModeModal: document.getElementById('btn-close-mode-modal'),
        modePasswordError: document.getElementById('mode-password-error'),

        // Header & Application Title Elements
        appHeaderTitle: document.getElementById('app-header-title'),

        // Settings & Fleet Backup Controls
        cfgAppTitle: document.getElementById('cfg-app-title'),
        cfgRatedLife: document.getElementById('cfg-rated-life'),
        cfgWarnPct: document.getElementById('cfg-warn-pct'),
        cfgRecalInterval: document.getElementById('cfg-recal-interval'),
        cfgEngPassword: document.getElementById('cfg-eng-password'),
        btnSaveSettings: document.getElementById('btn-save-settings'),
        btnResetDefaults: document.getElementById('btn-reset-defaults'),
        btnExportJson: document.getElementById('btn-export-json'),
        inputImportJson: document.getElementById('input-import-json')
    };
}

let pendingEngineerAction = null;

function updateModeBadgeUI() {
    const isEng = AppState.settings.accessMode === 'ENGINEER';
    if (DOM.btnToggleMode) {
        DOM.btnToggleMode.className = `user-profile-btn ${isEng ? 'user-eng' : 'user-cust'}`;
        DOM.btnToggleMode.title = `Current User: ${isEng ? 'Engineer Mode' : 'Customer Mode'}. Click to switch.`;
        DOM.btnToggleMode.innerHTML = `
            <div class="user-avatar ${isEng ? 'avatar-engineer' : 'avatar-customer'}">${isEng ? 'E' : 'C'}</div>
            <div class="user-info">
                <span id="mode-label" class="user-name">${isEng ? 'Engineer Admin' : 'Customer View'}</span>
                <span class="user-role-badge ${isEng ? 'role-eng' : 'role-cust'}">${isEng ? 'Full Access' : 'Read Only'}</span>
            </div>
            <svg class="icon user-dropdown-icon" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        `;
    }
}

function requireEngineerMode(actionCallback) {
    if (AppState.settings.accessMode === 'ENGINEER') {
        if (typeof actionCallback === 'function') actionCallback();
    } else {
        pendingEngineerAction = actionCallback;
        if (DOM.inputModePassword) DOM.inputModePassword.value = '';
        if (DOM.modePasswordError) DOM.modePasswordError.style.display = 'none';
        UI.showModal(DOM.modeModalOverlay);
    }
}


function getEvalTime() {
    const simDateStr = DOM.todayDate ? DOM.todayDate.value : AppState.simulatedDate;
    return getCurrentEvalTime(simDateStr);
}

function updateAppTitle(title) {
    const finalTitle = title || (AppState.settings && AppState.settings.systemTitle) || "Laser Management System";
    if (DOM.appHeaderTitle) {
        DOM.appHeaderTitle.textContent = finalTitle;
    } else {
        const h1 = document.getElementById('app-header-title');
        if (h1) h1.textContent = finalTitle;
    }
    document.title = finalTitle;
}

function populateSettingsForm() {
    if (!AppState.settings) return;
    if (DOM.cfgAppTitle) DOM.cfgAppTitle.value = AppState.settings.systemTitle || "Laser Management System";
    if (DOM.cfgRatedLife) DOM.cfgRatedLife.value = AppState.settings.defaultRatedLife || 25000;
    if (DOM.cfgWarnPct) DOM.cfgWarnPct.value = AppState.settings.defaultWarningPercentage || 80;
    if (DOM.cfgRecalInterval) DOM.cfgRecalInterval.value = AppState.settings.recalibrationInterval || 30;
    if (DOM.cfgEngPassword) DOM.cfgEngPassword.value = AppState.settings.engineerPassword || "1234";
}

async function initApp() {
    initDOM();
    AppState.machines = await StorageService.loadMachinesAsync();
    AppState.settings = await StorageService.loadSettingsAsync();

    updateAppTitle();
    populateSettingsForm();

    StorageService.initBackgroundSync((updatedMachines) => {
        AppState.machines = updatedMachines;
        if (!window.location.pathname.includes('machine.html') && !window.location.pathname.includes('settings.html')) {
            showFleetView();
        }
    });

    UI.applyTheme(AppState.settings.theme);
    updateModeBadgeUI();

    if (DOM.todayDate) DOM.todayDate.value = AppState.simulatedDate;

    // Check page route or query parameter
    const urlMachineId = getQueryParam('id');
    const path = window.location.pathname;

    if (path.includes('machine.html') || urlMachineId) {
        const idToLoad = urlMachineId || (AppState.machines[0] ? AppState.machines[0].id : null);
        if (idToLoad) {
            showMachineDetail(idToLoad);
        } else {
            showFleetView();
        }
    } else if (path.includes('settings.html')) {
        showSettingsView();
    } else {
        showFleetView();
    }

    setupEventListeners();

    // Smooth real-time 1-second refresh
    setInterval(() => {
        const evalTime = getEvalTime();
        if (DOM.viewFleet && !DOM.viewFleet.classList.contains('hidden')) {
            DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, evalTime, handleMachineSelect, handleEditMachine, handleDeleteMachine, true);
        } else if (DOM.viewSingle && !DOM.viewSingle.classList.contains('hidden') && AppState.currentMachineId) {
            const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
            if (machine) {
                MachineController.renderSingleDashboard(machine, DOM, evalTime, true, getMachineCallbacks());
            }
        }
    }, 1000);
}

function showFleetView() {
    if (DOM.viewSingle && !DOM.viewSingle.classList.contains('hidden')) {
        const modalContainer = DOM.viewSingle.querySelector('.mach-modal-container');
        if (modalContainer && AppState.lastCardRect) {
            const cardRect = AppState.lastCardRect;
            const modalRect = modalContainer.getBoundingClientRect();
            
            // Revert transform to original card position
            const scaleX = cardRect.width / modalRect.width;
            const scaleY = cardRect.height / modalRect.height;
            const translateX = cardRect.left - modalRect.left + (cardRect.width - modalRect.width) / 2;
            const translateY = cardRect.top - modalRect.top + (cardRect.height - modalRect.height) / 2;
            
            modalContainer.style.transition = 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease';
            modalContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
            modalContainer.style.opacity = '0';
            
            DOM.viewSingle.style.transition = 'background-color 250ms ease, backdrop-filter 250ms ease';
            DOM.viewSingle.style.backgroundColor = 'transparent';
            DOM.viewSingle.style.backdropFilter = 'blur(0px)';
            
            setTimeout(() => {
                DOM.viewSingle.classList.add('hidden');
                DOM.viewSingle.classList.remove('as-modal');
                modalContainer.style.transform = '';
                modalContainer.style.opacity = '';
                modalContainer.style.transition = '';
                DOM.viewSingle.style.backgroundColor = '';
                DOM.viewSingle.style.backdropFilter = '';
                DOM.viewSingle.style.transition = '';
            }, 250);
        } else {
            DOM.viewSingle.classList.add('hidden');
            DOM.viewSingle.classList.remove('as-modal');
        }
    }
    if (DOM.viewSettings) DOM.viewSettings.classList.add('hidden');
    if (DOM.viewFleet) DOM.viewFleet.classList.remove('hidden');

    if (DOM.navFleet) DOM.navFleet.classList.add('active');
    if (DOM.navSettings) DOM.navSettings.classList.remove('active');

    AppState.currentMachineId = null;
    setQueryParam('id', null);

    const evalTime = getEvalTime();
    if (DOM.fleetGrid) {
        DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, evalTime, handleMachineSelect, handleEditMachine, handleDeleteMachine);
    }
}

function handleMachineSelect(id, cardElement) {
    if (DOM.viewSingle) {
        showMachineDetail(id, cardElement);
    }
}

let pendingIdentityState = null;

function checkAndHandleIdentityChange(machine, enteredModel, enteredSerial, enteredName, enteredDept, saveCallback) {
    const isModelChanged = Boolean(enteredModel && enteredModel !== machine.model);
    const isSerialChanged = Boolean(enteredSerial && enteredSerial !== machine.serialNo);

    if (isModelChanged || isSerialChanged) {
        pendingIdentityState = {
            machine,
            enteredModel,
            enteredSerial,
            enteredName,
            enteredDept,
            saveCallback
        };

        if (DOM.mismatchRegModel) DOM.mismatchRegModel.textContent = machine.model || 'N/A';
        if (DOM.mismatchEntModel) DOM.mismatchEntModel.textContent = enteredModel || 'N/A';
        if (DOM.mismatchRegSerial) DOM.mismatchRegSerial.textContent = machine.serialNo || 'N/A';
        if (DOM.mismatchEntSerial) DOM.mismatchEntSerial.textContent = enteredSerial || 'N/A';

        UI.showModal(DOM.identityOverlay);
        return true;
    }

    if (enteredName) machine.machineName = enteredName;
    if (enteredDept) machine.department = enteredDept;
    saveCallback(false);
    return false;
}

function handleEditMachine(id) {
    requireEngineerMode(() => {
        const machine = AppState.machines.find(m => m.id === id);
        if (!machine) return;

        if (DOM.editMachId) DOM.editMachId.value = machine.id;
        if (DOM.editMachName) DOM.editMachName.value = machine.machineName || (`Wafer Driller ${machine.model || 'BMD302W'}`);
        if (DOM.editMachNo) DOM.editMachNo.value = machine.machineNo || '';
        if (DOM.editMachModel) DOM.editMachModel.value = machine.model || 'BMD302W';
        if (DOM.editMachSerial) DOM.editMachSerial.value = machine.serialNo || '';
        if (DOM.editMachDept) DOM.editMachDept.value = machine.department || 'Wafer Prep';

        UI.showModal(DOM.editModalOverlay);
    });
}

let pendingDeleteMachineId = null;

const closeDeleteMachineModal = () => {
    pendingDeleteMachineId = null;
    if (DOM.deleteMachineOverlay) {
        UI.hideModal(DOM.deleteMachineOverlay);
    }
};

function handleDeleteMachine(id) {
    requireEngineerMode(() => {
        const machine = AppState.machines.find(m => String(m.id) === String(id));
        if (!machine) return;

        pendingDeleteMachineId = id;

        if (DOM.deleteMachineTargetName) {
            DOM.deleteMachineTargetName.textContent = `${machine.machineNo || ''} (${machine.machineName || ''})`;
        }
        if (DOM.deleteMachineTargetSerial) {
            DOM.deleteMachineTargetSerial.textContent = `SN: ${machine.serialNo || 'N/A'}`;
        }

        UI.showModal(DOM.deleteMachineOverlay);
    });
}
window.handleDeleteMachine = handleDeleteMachine;

function showMachineDetail(id, cardElement) {
    AppState.currentMachineId = id;
    setQueryParam('id', id);

    if (DOM.viewSettings) DOM.viewSettings.classList.add('hidden');

    if (DOM.viewSingle) {
        DOM.viewSingle.classList.add('as-modal');
        DOM.viewSingle.classList.remove('hidden');
        
        // Wait for next frame to ensure modal container is rendered to get its dimensions
        requestAnimationFrame(() => {
            if (cardElement) {
                const modalContainer = DOM.viewSingle.querySelector('.mach-modal-container');
                if (modalContainer) {
                    const cardRect = cardElement.getBoundingClientRect();
                    const modalRect = modalContainer.getBoundingClientRect();
                    
                    // Calculate scale and translation
                    const scaleX = cardRect.width / modalRect.width;
                    const scaleY = cardRect.height / modalRect.height;
                    
                    const translateX = cardRect.left - modalRect.left + (cardRect.width - modalRect.width) / 2;
                    const translateY = cardRect.top - modalRect.top + (cardRect.height - modalRect.height) / 2;
                    
                    // Initial state for animation
                    modalContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
                    modalContainer.style.opacity = '0';
                    modalContainer.style.transformOrigin = 'center center';
                    modalContainer.style.transition = 'none';
                    
                    DOM.viewSingle.style.backgroundColor = 'transparent';
                    DOM.viewSingle.style.backdropFilter = 'blur(0px)';
                    DOM.viewSingle.style.transition = 'none';
                    
                    // Force reflow
                    modalContainer.offsetHeight;
                    
                    // Animate to center
                    modalContainer.style.transition = 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease';
                    modalContainer.style.transform = 'translate(0, 0) scale(1)';
                    modalContainer.style.opacity = '1';
                    
                    DOM.viewSingle.style.transition = 'background-color 300ms ease, backdrop-filter 300ms ease';
                    DOM.viewSingle.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
                    DOM.viewSingle.style.backdropFilter = 'blur(14px)';
                    
                    // Store the originating rect for close animation
                    AppState.lastCardRect = cardRect;
                }
            } else {
                // Fallback if no card element is passed
                DOM.viewSingle.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
                DOM.viewSingle.style.backdropFilter = 'blur(14px)';
            }
        });
    }

    const machine = AppState.machines.find(m => m.id === id);
    if (!machine) return;

    if (DOM.detMachNo) DOM.detMachNo.value = machine.machineNo;
    if (DOM.detModel) DOM.detModel.value = machine.model;
    if (DOM.detSerialNo) DOM.detSerialNo.value = machine.serialNo;
    if (DOM.detDept) DOM.detDept.value = machine.department;
    if (DOM.detRated) DOM.detRated.value = machine.ratedLife;

    if (DOM.prevHour) DOM.prevHour.value = machine.baseLaserHour;
    if (DOM.prevDate) DOM.prevDate.value = safeToDatetimeLocal(machine.baseTimestamp);

    const evalTime = getEvalTime();
    MachineController.renderMaintenanceLog(machine, DOM.maintTbody);
    MachineController.renderCalibrationHistory(machine, DOM.calibrationTbody);
    MachineController.renderSingleDashboard(machine, DOM, evalTime, false, getMachineCallbacks());
}

let pendingDeleteTarget = null;

const updateLaserModalPreview = () => {
    if (!DOM.laserModalPreviewText) return;
    const hourVal = DOM.laserModalBaseHour ? DOM.laserModalBaseHour.value : '';
    const tsVal = DOM.laserModalTimestamp ? DOM.laserModalTimestamp.value : '';
    const evalTime = getEvalTime();

    if (hourVal === '' || !tsVal) {
        DOM.laserModalPreviewText.textContent = `⚠️ Baseline Required: Record captured hour & date/time to establish baseline.`;
        return;
    }

    const baseHour = Number(hourVal) || 0;
    const baseMs = new Date(tsVal).getTime();
    const evalMs = evalTime.getTime();

    if (isNaN(baseMs)) {
        DOM.laserModalPreviewText.textContent = `⚠️ Baseline Required: Invalid timestamp format.`;
        return;
    }

    const elapsedMs = Math.max(0, evalMs - baseMs);
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const estNow = baseHour + elapsedHours;

    DOM.laserModalPreviewText.textContent = `Estimated now: ${estNow.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} hrs (${elapsedDays.toFixed(1)} days elapsed)`;
};

const openRecalibrateModalForLaser = (mId, laserId) => {
    requireEngineerMode(() => {
        const machine = AppState.machines.find(m => m.id === (mId || AppState.currentMachineId));
        if (!machine) return;

        const lasers = Array.isArray(machine.lasers) && machine.lasers.length > 0 ? machine.lasers : [{
            id: machine.id + '-L1',
            name: 'Laser Head 1',
            baseLaserHour: machine.baseLaserHour || 0,
            baseTimestamp: safeToISOString(machine.baseTimestamp)
        }];

        if (DOM.recalLaserSelect) {
            DOM.recalLaserSelect.innerHTML = lasers.map(l => `<option value="${l.id}">${l.name || 'Laser Head'} (${l.serialNo || 'SN-N/A'})</option>`).join('');
            if (laserId) DOM.recalLaserSelect.value = laserId;
        }

        const updateEstForSelectedLaser = () => {
            const targetId = DOM.recalLaserSelect ? DOM.recalLaserSelect.value : (laserId || lasers[0].id);
            const targetLaser = lasers.find(l => l.id === targetId) || lasers[0];
            const evalTime = getEvalTime();
            const est = LaserEngine.calculateEstimatedHour(targetLaser.baseLaserHour || 0, safeToISOString(targetLaser.baseTimestamp), evalTime);

            if (DOM.recalCurrentEstDisplay) DOM.recalCurrentEstDisplay.value = `${Math.round(est * 10) / 10} hrs`;
            if (DOM.recalActualInput) DOM.recalActualInput.value = Math.round(est);
        };

        updateEstForSelectedLaser();

        if (DOM.recalLaserSelect) {
            DOM.recalLaserSelect.onchange = updateEstForSelectedLaser;
        }

        if (DOM.recalReasonSelect) DOM.recalReasonSelect.value = 'Manual Verification';
        UI.showModal(DOM.recalOverlay);
    });
};

const openEditLaserModal = (mId, laserId) => {
    requireEngineerMode(() => {
        const machine = AppState.machines.find(m => m.id === (mId || AppState.currentMachineId));
        if (!machine || !Array.isArray(machine.lasers)) return;

        const laser = machine.lasers.find(l => l.id === laserId);
        if (!laser) return;

        const isBaselineReq = !laser.baseTimestamp || isNaN(new Date(laser.baseTimestamp).getTime()) || laser.baseLaserHour === null || laser.baseLaserHour === undefined;

        if (DOM.laserModalTitle) DOM.laserModalTitle.textContent = isBaselineReq ? `Set Baseline - ${laser.name}` : `Edit ${laser.name}`;
        if (DOM.laserModalId) DOM.laserModalId.value = laser.id;
        if (DOM.laserModalName) DOM.laserModalName.value = laser.name || '';
        if (DOM.laserModalSerial) DOM.laserModalSerial.value = laser.serialNo || '';
        if (DOM.laserModalBaseHour) DOM.laserModalBaseHour.value = (typeof laser.baseLaserHour === 'number' && !isNaN(laser.baseLaserHour)) ? laser.baseLaserHour : '';
        if (DOM.laserModalTimestamp) DOM.laserModalTimestamp.value = safeToDatetimeLocal(laser.baseTimestamp, '');
        if (DOM.laserModalWarning) DOM.laserModalWarning.value = laser.warningLife || 20000;
        if (DOM.laserModalRated) DOM.laserModalRated.value = laser.ratedLife || 25000;
        if (DOM.laserModalContingency) DOM.laserModalContingency.value = laser.contingencyCeiling || 28000;

        updateLaserModalPreview();
        UI.showModal(DOM.laserModalOverlay);
    });
};

const handleDeleteLaserHead = (mId, laserId) => {
    requireEngineerMode(() => {
        const machine = AppState.machines.find(m => m.id === (mId || AppState.currentMachineId));
        if (!machine || !Array.isArray(machine.lasers) || machine.lasers.length <= 1) {
            UI.showToast('Machine must maintain at least 1 Laser Head unit.', 'error');
            return;
        }

        const targetLaser = machine.lasers.find(l => l.id === laserId);
        if (!targetLaser) return;

        pendingDeleteTarget = {
            machineId: machine.id,
            laserId: targetLaser.id,
            laserName: targetLaser.name
        };

        if (DOM.deleteLaserTargetName) DOM.deleteLaserTargetName.textContent = targetLaser.name || 'Laser Head';
        if (DOM.deleteLaserTargetSerial) DOM.deleteLaserTargetSerial.textContent = `SN: ${targetLaser.serialNo || 'N/A'}`;

        UI.showModal(DOM.deleteLaserOverlay);
    });
};

const closeDeleteLaserModal = () => {
    pendingDeleteTarget = null;
    UI.hideModal(DOM.deleteLaserOverlay);
};

const openReplaceLaserModal = (mId, laserId) => {
    requireEngineerMode(() => {
        const machine = AppState.machines.find(m => m.id === (mId || AppState.currentMachineId));
        if (!machine || !Array.isArray(machine.lasers)) return;

        const laser = machine.lasers.find(l => l.id === laserId) || machine.lasers[0];
        if (!laser) return;

        const currentGen = laser.generation || (laser.replacementHistory ? laser.replacementHistory.length + 1 : (laser.lifecycleHistory ? laser.lifecycleHistory.length + 1 : 1));
        const evalTime = getEvalTime();
        const estHour = LaserEngine.calculateEstimatedHour(laser.baseLaserHour || 0, safeToISOString(laser.baseTimestamp), evalTime);
        const estDisplay = Math.round(estHour * 10) / 10;

        const titleEl = document.getElementById('repl-laser-title');
        const serialEl = document.getElementById('repl-laser-serial');
        const genEl = document.getElementById('repl-laser-current-gen');
        const targetLaserInput = document.getElementById('repl-target-laser-id');

        if (titleEl) titleEl.textContent = `${laser.name} (${machine.machineName || machine.machineNo})`;
        if (serialEl) serialEl.textContent = `SN: ${laser.serialNo || 'N/A'} • Active Runtime: ${estDisplay} hrs`;
        if (genEl) genEl.textContent = `Gen ${currentGen} (Active)`;
        if (targetLaserInput) targetLaserInput.value = laser.id;

        if (DOM.replModalTitle) DOM.replModalTitle.textContent = `Replace Laser Unit — ${laser.name}`;
        if (DOM.replMachineId) DOM.replMachineId.value = machine.id;
        if (DOM.replLaserId) DOM.replLaserId.value = laser.id;
        if (DOM.replInstalledHour) DOM.replInstalledHour.value = 0;
        if (DOM.replInstallTimestamp) DOM.replInstallTimestamp.value = safeToDatetimeLocal(getEvalTime().toISOString());
        if (DOM.replEngineerName) DOM.replEngineerName.value = '';
        if (DOM.replReason) DOM.replReason.value = 'End-of-Life Reached (Rated Limit)';
        if (DOM.replNotes) DOM.replNotes.value = '';

        UI.showModal(DOM.replaceLaserOverlay);
    });
};

const closeReplaceLaserModal = () => {
    if (DOM.replaceLaserOverlay) UI.hideModal(DOM.replaceLaserOverlay);
};

const closeMaintenanceModal = () => {
    if (DOM.maintenanceOverlay) UI.hideModal(DOM.maintenanceOverlay);
};

function updateFilterActiveBadge() {
    let count = 0;
    if (AppState.filters.status && AppState.filters.status !== 'ALL') count++;
    if (AppState.filters.dept && AppState.filters.dept !== 'ALL') count++;
    if (AppState.filters.model && AppState.filters.model !== 'ALL') count++;
    if (DOM.filterActiveBadge) {
        if (count > 0) {
            DOM.filterActiveBadge.textContent = count;
            DOM.filterActiveBadge.classList.remove('hidden');
        } else {
            DOM.filterActiveBadge.classList.add('hidden');
        }
    }
}

function getMachineCallbacks() {
    return {
        onRecalibrateLaser: (mId, laserId) => openRecalibrateModalForLaser(mId, laserId),
        onEditLaser: (mId, laserId) => openEditLaserModal(mId, laserId),
        onDeleteLaser: (mId, laserId) => handleDeleteLaserHead(mId, laserId),
        onReplaceLaser: (mId, laserId) => openReplaceLaserModal(mId, laserId)
    };
}
window.getMachineCallbacks = getMachineCallbacks;

function showSettingsView() {
    if (DOM.viewFleet) DOM.viewFleet.classList.add('hidden');
    if (DOM.viewSingle) DOM.viewSingle.classList.add('hidden');
    if (DOM.viewSettings) DOM.viewSettings.classList.remove('hidden');

    if (DOM.navSettings) DOM.navSettings.classList.add('active');
    if (DOM.navFleet) DOM.navFleet.classList.remove('active');

    populateSettingsForm();
}

function setupEventListeners() {
    // Navigation SPA Listeners
    if (DOM.navFleet) {
        DOM.navFleet.addEventListener('click', (e) => {
            e.preventDefault();
            showFleetView();
        });
    }
    if (DOM.navSettings) {
        DOM.navSettings.addEventListener('click', (e) => {
            e.preventDefault();
            showSettingsView();
        });
    }
    // Search & Filter Listeners
    if (DOM.filterSearch) DOM.filterSearch.addEventListener('input', (e) => {
        AppState.filters.search = e.target.value;
        DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, getEvalTime(), handleMachineSelect, handleEditMachine, handleDeleteMachine);
    });
    if (DOM.filterStatus) DOM.filterStatus.addEventListener('change', (e) => {
        AppState.filters.status = e.target.value;
        updateFilterActiveBadge();
        DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, getEvalTime(), handleMachineSelect, handleEditMachine, handleDeleteMachine);
    });
    if (DOM.filterDept) DOM.filterDept.addEventListener('change', (e) => {
        AppState.filters.dept = e.target.value;
        updateFilterActiveBadge();
        DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, getEvalTime(), handleMachineSelect, handleEditMachine, handleDeleteMachine);
    });
    if (DOM.filterModel) DOM.filterModel.addEventListener('change', (e) => {
        AppState.filters.model = e.target.value;
        updateFilterActiveBadge();
        DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, getEvalTime(), handleMachineSelect, handleEditMachine, handleDeleteMachine);
    });
    if (DOM.filterSort) DOM.filterSort.addEventListener('change', (e) => {
        AppState.filters.sort = e.target.value;
        DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, getEvalTime(), handleMachineSelect, handleEditMachine, handleDeleteMachine);
    });

    // Toolbar Filter Popover Toggle & Clear
    if (DOM.btnToggleFilters && DOM.filterPopover) {
        DOM.btnToggleFilters.addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.filterPopover.classList.toggle('hidden');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!DOM.filterPopover.contains(e.target) && !DOM.btnToggleFilters.contains(e.target)) {
                DOM.filterPopover.classList.add('hidden');
            }
        });
    }

    if (DOM.btnClearFilters) {
        DOM.btnClearFilters.addEventListener('click', (e) => {
            e.stopPropagation();
            AppState.filters.status = 'ALL';
            AppState.filters.dept = 'ALL';
            AppState.filters.model = 'ALL';
            if (DOM.filterStatus) DOM.filterStatus.value = 'ALL';
            if (DOM.filterDept) DOM.filterDept.value = 'ALL';
            if (DOM.filterModel) DOM.filterModel.value = 'ALL';
            updateFilterActiveBadge();
            DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, getEvalTime(), handleMachineSelect, handleEditMachine, handleDeleteMachine);
        });
    }

    // Unified History Filter Pills
    if (DOM.historyFilterBar) {
        DOM.historyFilterBar.addEventListener('click', (e) => {
            const pill = e.target.closest('.history-pill');
            if (!pill) return;
            const filter = pill.getAttribute('data-hist-filter') || 'ALL';
            MachineController.setHistoryFilter(filter);
            const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
            if (machine) {
                const timelineContainer = document.getElementById('machine-unified-timeline');
                if (timelineContainer) {
                    MachineController.renderUnifiedTimeline(machine, timelineContainer, filter, getEvalTime());
                }
            }
        });
    }

    // Replace Laser Modal Handlers
    if (DOM.btnCloseReplaceModal) DOM.btnCloseReplaceModal.addEventListener('click', closeReplaceLaserModal);
    if (DOM.btnCancelReplaceModal) DOM.btnCancelReplaceModal.addEventListener('click', closeReplaceLaserModal);

    if (DOM.btnSubmitReplaceLaser) {
        DOM.btnSubmitReplaceLaser.addEventListener('click', () => {
            const machId = DOM.replMachineId ? DOM.replMachineId.value : AppState.currentMachineId;
            const laserId = DOM.replLaserId ? DOM.replLaserId.value : '';
            const machine = AppState.machines.find(m => m.id === machId);
            if (!machine || !Array.isArray(machine.lasers)) return;

            const laser = machine.lasers.find(l => l.id === laserId);
            if (!laser) return;

            const newHour = Number(DOM.replInstalledHour ? DOM.replInstalledHour.value : 0) || 0;
            const tsVal = DOM.replInstallTimestamp ? DOM.replInstallTimestamp.value : '';
            const newTs = tsVal ? safeToISOString(tsVal, null) : getEvalTime().toISOString();
            const engineer = DOM.replEngineerName ? (DOM.replEngineerName.value.trim() || 'Optics Specialist') : 'Optics Specialist';
            const reason = DOM.replReason ? DOM.replReason.value : 'End-of-Life Reached (Rated Limit)';
            const notes = DOM.replNotes ? DOM.replNotes.value.trim() : '';

            const evalTime = getEvalTime();
            const retiredHours = LaserEngine.calculateEstimatedHour(laser.baseLaserHour || 0, safeToISOString(laser.baseTimestamp), new Date(newTs));

            if (!Array.isArray(laser.lifecycleHistory)) {
                laser.lifecycleHistory = [];
            }

            const currentGen = laser.generation || laser.lifecycleHistory.length + 1;

            // Record retired generation in history (never delete historical records)
            const replacementRecord = {
                id: `REPL-${Date.now()}`,
                laserId: laser.id,
                laserName: laser.name,
                serialNo: laser.serialNo,
                generation: currentGen,
                installDate: laser.baseTimestamp || 'Initial',
                installHours: Number(laser.baseLaserHour) || 0,
                retiredDate: safeToISOString(newTs),
                retiredHours: Math.round(retiredHours * 10) / 10,
                engineer: engineer,
                reason: reason,
                notes: notes,
                status: 'ARCHIVED'
            };
            laser.lifecycleHistory.push(replacementRecord);

            // Update laser to next generation with new baseline
            laser.generation = currentGen + 1;
            laser.baseLaserHour = newHour;
            laser.baseTimestamp = newTs;
            laser.lastRecalibrationDate = newTs;

            StorageService.saveMachine(machine);
            AppState.machines = StorageService.loadMachines();

            closeReplaceLaserModal();
            UI.showToast(`Replaced ${laser.name} (Now Gen ${laser.generation}) ✓`, 'success');

            const updatedMachine = AppState.machines.find(m => m.id === machId);
            if (updatedMachine) {
                MachineController.renderSingleDashboard(updatedMachine, DOM, evalTime, false, getMachineCallbacks());
            }
            if (DOM.fleetGrid) {
                DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, evalTime, handleMachineSelect, handleEditMachine, handleDeleteMachine);
            }
        });
    }

    // Maintenance Modal Handlers
    if (DOM.btnAddRecord) {
        DOM.btnAddRecord.addEventListener('click', () => {
            requireEngineerMode(() => {
                if (DOM.maintDate) DOM.maintDate.value = safeToDatetimeLocal(getEvalTime().toISOString());
                if (DOM.maintEngineer) DOM.maintEngineer.value = '';
                if (DOM.maintAction) DOM.maintAction.value = 'Periodic Preventive Maintenance';
                if (DOM.maintNotes) DOM.maintNotes.value = '';
                UI.showModal(DOM.maintenanceOverlay);
            });
        });
    }
    if (DOM.btnCloseMaintModal) DOM.btnCloseMaintModal.addEventListener('click', closeMaintenanceModal);
    if (DOM.btnCancelMaintModal) DOM.btnCancelMaintModal.addEventListener('click', closeMaintenanceModal);

    if (DOM.btnSubmitMaintenance) {
        DOM.btnSubmitMaintenance.addEventListener('click', () => {
            const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
            if (!machine) return;

            if (!Array.isArray(machine.maintenanceHistory)) machine.maintenanceHistory = [];

            const dateStr = DOM.maintDate ? DOM.maintDate.value : safeToDatetimeLocal(getEvalTime().toISOString());
            const eng = DOM.maintEngineer ? (DOM.maintEngineer.value.trim() || 'Service Engineer') : 'Service Engineer';
            const action = DOM.maintAction ? (DOM.maintAction.value.trim() || 'Maintenance Service') : 'Maintenance Service';
            const notes = DOM.maintNotes ? DOM.maintNotes.value.trim() : '';

            const newRecord = {
                id: `MAINT-${Date.now()}`,
                date: dateStr,
                engineer: eng,
                action: action,
                notes: notes
            };

            machine.maintenanceHistory.unshift(newRecord);
            StorageService.saveMachine(machine);
            AppState.machines = StorageService.loadMachines();

            closeMaintenanceModal();
            UI.showToast('Service record saved ✓', 'success');

            const updated = AppState.machines.find(m => m.id === AppState.currentMachineId);
            if (updated) {
                MachineController.renderSingleDashboard(updated, DOM, getEvalTime(), false, getMachineCallbacks());
            }
        });
    }

    // Mode Switching & Password Auth Listeners
    if (DOM.btnToggleMode) {
        DOM.btnToggleMode.addEventListener('click', () => {
            if (AppState.settings.accessMode === 'ENGINEER') {
                AppState.settings.accessMode = 'CUSTOMER';
                StorageService.saveSettings(AppState.settings);
                updateModeBadgeUI();
                UI.showToast('Switched to Customer Mode (Read-Only)', 'warning');
            } else {
                requireEngineerMode(() => {
                    UI.showToast('Engineer Mode Unlocked!', 'success');
                });
            }
        });
    }

    if (DOM.btnSubmitModeAuth) {
        DOM.btnSubmitModeAuth.addEventListener('click', () => {
            const entered = DOM.inputModePassword ? DOM.inputModePassword.value : '';
            const correct = AppState.settings.engineerPassword || '1234';
            if (entered === correct) {
                AppState.settings.accessMode = 'ENGINEER';
                StorageService.saveSettings(AppState.settings);
                updateModeBadgeUI();
                UI.hideModal(DOM.modeModalOverlay);
                UI.showToast('Engineer Mode Unlocked!', 'success');
                if (pendingEngineerAction) {
                    const cb = pendingEngineerAction;
                    pendingEngineerAction = null;
                    cb();
                }
            } else {
                if (DOM.modePasswordError) DOM.modePasswordError.style.display = 'block';
            }
        });
    }

    const closeModeModal = () => {
        UI.hideModal(DOM.modeModalOverlay);
        pendingEngineerAction = null;
    };
    if (DOM.btnCancelModeModal) DOM.btnCancelModeModal.addEventListener('click', closeModeModal);
    if (DOM.btnCloseModeModal) DOM.btnCloseModeModal.addEventListener('click', closeModeModal);

    // Detail Inputs
    if (DOM.prevHour) DOM.prevHour.addEventListener('input', () => {
        requireEngineerMode(() => {
            const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
            if (machine) {
                machine.baseLaserHour = Number(DOM.prevHour.value) || 0;
                MachineController.renderSingleDashboard(machine, DOM, getEvalTime());
            }
        });
    });

    if (DOM.prevDate) DOM.prevDate.addEventListener('change', () => {
        requireEngineerMode(() => {
            const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
            if (machine && DOM.prevDate.value) {
                machine.baseTimestamp = safeToISOString(DOM.prevDate.value);
                MachineController.renderSingleDashboard(machine, DOM, getEvalTime());
            }
        });
    });

    if (DOM.todayDate) DOM.todayDate.addEventListener('change', () => {
        AppState.simulatedDate = DOM.todayDate.value;
        const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
        if (machine) {
            MachineController.renderSingleDashboard(machine, DOM, getEvalTime());
        }
    });

    if (DOM.detRated) DOM.detRated.addEventListener('input', () => {
        requireEngineerMode(() => {
            const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
            if (machine) {
                machine.ratedLife = Number(DOM.detRated.value) || 25000;
                machine.warningLife = Math.floor(machine.ratedLife * 0.8);
                MachineController.renderSingleDashboard(machine, DOM, getEvalTime());
            }
        });
    });

    if (DOM.btnBack) DOM.btnBack.addEventListener('click', () => {
        if (window.location.pathname.includes('machine.html')) {
            window.location.href = 'index.html';
        } else {
            showFleetView();
        }
    });

    if (DOM.btnCloseMachModal) DOM.btnCloseMachModal.addEventListener('click', () => {
        if (window.location.pathname.includes('machine.html')) {
            window.location.href = 'index.html';
        } else {
            showFleetView();
        }
    });

    // Modal Tabs Switching Listener
    const tabBtns = document.querySelectorAll('.mach-tab-btn');
    const tabPanes = document.querySelectorAll('.mach-tab-pane');

    function switchTab(tabId) {
        tabBtns.forEach(b => {
            if (b.getAttribute('data-tab') === tabId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        tabPanes.forEach(pane => {
            if (pane.id === `tab-${tabId}`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            if (targetTab === 'config' && AppState.settings.accessMode !== 'ENGINEER') {
                requireEngineerMode(() => {
                    switchTab(targetTab);
                });
                return;
            }
            switchTab(targetTab);
        });
    });

    // ESC Key to Close Modal Workspace
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.viewSingle && !DOM.viewSingle.classList.contains('hidden')) {
            showFleetView();
        }
    });

    // Backdrop Click Outside to Close Modal Workspace
    if (DOM.viewSingle) {
        DOM.viewSingle.addEventListener('click', (e) => {
            if (DOM.viewSingle.classList.contains('as-modal') && e.target === DOM.viewSingle) {
                showFleetView();
            }
        });
    }

    // Secondary Action Triggers
    if (DOM.laserModalBaseHour) DOM.laserModalBaseHour.addEventListener('input', updateLaserModalPreview);
    if (DOM.laserModalTimestamp) DOM.laserModalTimestamp.addEventListener('input', updateLaserModalPreview);

    if (DOM.btnCloseDeleteLaserModal) DOM.btnCloseDeleteLaserModal.addEventListener('click', closeDeleteLaserModal);
    if (DOM.btnCancelDeleteLaserModal) DOM.btnCancelDeleteLaserModal.addEventListener('click', closeDeleteLaserModal);

    if (DOM.btnCloseDeleteMachineModal) DOM.btnCloseDeleteMachineModal.addEventListener('click', closeDeleteMachineModal);
    if (DOM.btnCancelDeleteMachineModal) DOM.btnCancelDeleteMachineModal.addEventListener('click', closeDeleteMachineModal);

    if (DOM.btnConfirmDeleteMachineModal) {
        DOM.btnConfirmDeleteMachineModal.addEventListener('click', () => {
            if (!pendingDeleteMachineId) return;
            const id = pendingDeleteMachineId;
            const machine = AppState.machines.find(m => String(m.id) === String(id));
            const machineNo = machine ? machine.machineNo : '';

            closeDeleteMachineModal();

            if (DOM.editModalOverlay) {
                UI.hideModal(DOM.editModalOverlay);
            }
            if (DOM.viewSingle && !DOM.viewSingle.classList.contains('hidden')) {
                DOM.viewSingle.classList.add('hidden');
                DOM.viewSingle.classList.remove('as-modal');
            }

            StorageService.deleteMachine(id);
            AppState.machines = StorageService.loadMachines();
            if (String(AppState.currentMachineId) === String(id)) {
                AppState.currentMachineId = null;
            }

            UI.showToast(`Deleted machine ${machineNo || ''}`, 'warning');

            window.dispatchEvent(new CustomEvent('lms-fleet-updated', {
                detail: { count: AppState.machines.length }
            }));

            if (window.location.pathname.includes('machine.html')) {
                window.location.href = 'index.html';
            } else {
                showFleetView();
            }
        });
    }

    if (DOM.btnConfirmDeleteLaser) {
        DOM.btnConfirmDeleteLaser.addEventListener('click', () => {
            if (!pendingDeleteTarget) return;

            const { machineId, laserId, laserName } = pendingDeleteTarget;
            const machine = AppState.machines.find(m => m.id === machineId);
            if (!machine || !Array.isArray(machine.lasers) || machine.lasers.length <= 1) {
                UI.showToast('Machine must maintain at least 1 Laser Head unit.', 'error');
                closeDeleteLaserModal();
                return;
            }

            machine.lasers = machine.lasers.filter(l => l.id !== laserId);
            StorageService.saveMachine(machine);
            AppState.machines = StorageService.loadMachines();
            closeDeleteLaserModal();
            UI.showToast(`Removed ${laserName} ✓`, 'warning');

            const updatedMachine = AppState.machines.find(m => m.id === machineId);
            if (updatedMachine) {
                const evalTime = getEvalTime();
                MachineController.renderSingleDashboard(updatedMachine, DOM, evalTime, false, getMachineCallbacks());
            }
        });
    }

    // Event delegation for Laser Head Card action buttons
    const laserHeadsGrid = document.getElementById('laser-heads-grid');
    if (laserHeadsGrid) {
        laserHeadsGrid.addEventListener('click', (e) => {
            const recalBtn = e.target.closest('.btn-recal-laser');
            if (recalBtn) {
                e.preventDefault();
                const laserId = recalBtn.getAttribute('data-laser-id');
                openRecalibrateModalForLaser(AppState.currentMachineId, laserId);
                return;
            }

            const editBtn = e.target.closest('.btn-edit-laser');
            if (editBtn) {
                e.preventDefault();
                const laserId = editBtn.getAttribute('data-laser-id');
                openEditLaserModal(AppState.currentMachineId, laserId);
                return;
            }

            const deleteBtn = e.target.closest('.btn-delete-laser');
            if (deleteBtn && !deleteBtn.disabled) {
                e.preventDefault();
                const laserId = deleteBtn.getAttribute('data-laser-id');
                handleDeleteLaserHead(AppState.currentMachineId, laserId);
                return;
            }
        });
    }

    if (DOM.btnOpenRecalibrate) DOM.btnOpenRecalibrate.addEventListener('click', () => openRecalibrateModalForLaser());

    const btnOpenRecal2 = document.getElementById('btn-open-recalibrate-2');
    if (btnOpenRecal2) {
        btnOpenRecal2.addEventListener('click', () => openRecalibrateModalForLaser());
    }

    // Add Laser Head Button Handler
    if (DOM.btnAddLaserHead) {
        DOM.btnAddLaserHead.addEventListener('click', () => {
            requireEngineerMode(() => {
                const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
                if (!machine) return;

                const nextNum = (machine.lasers ? machine.lasers.length : 0) + 1;
                if (DOM.laserModalTitle) DOM.laserModalTitle.textContent = `Add New Laser Head Unit`;
                if (DOM.laserModalId) DOM.laserModalId.value = '';
                if (DOM.laserModalName) DOM.laserModalName.value = `Laser Head #${nextNum}`;
                if (DOM.laserModalSerial) DOM.laserModalSerial.value = `${machine.serialNo || 'BMD'}-L${nextNum}`;
                if (DOM.laserModalBaseHour) DOM.laserModalBaseHour.value = 0;
                if (DOM.laserModalTimestamp) DOM.laserModalTimestamp.value = safeToDatetimeLocal(getEvalTime().toISOString());
                if (DOM.laserModalWarning) DOM.laserModalWarning.value = 20000;
                if (DOM.laserModalRated) DOM.laserModalRated.value = 25000;
                if (DOM.laserModalContingency) DOM.laserModalContingency.value = 28000;

                updateLaserModalPreview();
                UI.showModal(DOM.laserModalOverlay);
            });
        });
    }

    const closeLaserModal = () => UI.hideModal(DOM.laserModalOverlay);
    if (DOM.btnCloseLaserModal) DOM.btnCloseLaserModal.addEventListener('click', closeLaserModal);
    if (DOM.btnCancelLaserModal) DOM.btnCancelLaserModal.addEventListener('click', closeLaserModal);

    if (DOM.btnSubmitLaserHead) {
        DOM.btnSubmitLaserHead.addEventListener('click', () => {
            const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
            if (!machine) return;

            if (!Array.isArray(machine.lasers)) machine.lasers = [];

            const lid = DOM.laserModalId ? DOM.laserModalId.value : '';
            const lname = DOM.laserModalName ? DOM.laserModalName.value.trim() : 'Laser Head';
            const lserial = DOM.laserModalSerial ? DOM.laserModalSerial.value.trim() : 'SN-N/A';
            const hourInput = DOM.laserModalBaseHour ? DOM.laserModalBaseHour.value : '';
            const lbaseHour = (hourInput !== '' && !isNaN(Number(hourInput))) ? Number(hourInput) : null;
            const ltsInput = DOM.laserModalTimestamp ? DOM.laserModalTimestamp.value : '';
            const lwarning = Number(DOM.laserModalWarning ? DOM.laserModalWarning.value : 20000) || 20000;
            const lrated = Number(DOM.laserModalRated ? DOM.laserModalRated.value : 25000) || 25000;
            const lcontingency = Number(DOM.laserModalContingency ? DOM.laserModalContingency.value : 28000) || (lrated + 3000);

            if (lid) {
                // Update existing laser
                const existingLaser = machine.lasers.find(l => l.id === lid);
                if (existingLaser) {
                    let lbaseTs = null;
                    if (existingLaser.baseTimestamp && safeToDatetimeLocal(existingLaser.baseTimestamp) === ltsInput) {
                        lbaseTs = existingLaser.baseTimestamp; // Preserve exact byte-for-byte timestamp if unmodified
                    } else if (ltsInput) {
                        lbaseTs = safeToISOString(ltsInput, null);
                    }

                    existingLaser.name = lname;
                    existingLaser.serialNo = lserial;
                    existingLaser.baseLaserHour = lbaseHour;
                    existingLaser.baseTimestamp = lbaseTs;
                    existingLaser.warningLife = lwarning;
                    existingLaser.ratedLife = lrated;
                    existingLaser.contingencyCeiling = lcontingency;
                }
            } else {
                // Add new laser
                const lbaseTs = ltsInput ? safeToISOString(ltsInput, null) : null;
                const newLaser = {
                    id: `${machine.id}-L${Date.now().toString().slice(-4)}`,
                    name: lname,
                    serialNo: lserial,
                    baseLaserHour: lbaseHour,
                    baseTimestamp: lbaseTs,
                    warningLife: lwarning,
                    ratedLife: lrated,
                    contingencyCeiling: lcontingency,
                    lastRecalibrationDate: lbaseTs,
                    calibrationHistory: []
                };
                machine.lasers.push(newLaser);
            }

            StorageService.saveMachine(machine);
            AppState.machines = StorageService.loadMachines();
            closeLaserModal();
            UI.showToast(`Saved ${lname} ✓`, 'success');

            const evalTime = getEvalTime();
            MachineController.renderSingleDashboard(machine, DOM, evalTime, false, getMachineCallbacks());
        });
    }

    const btnEditConfig = document.getElementById('btn-edit-config-trigger');
    if (btnEditConfig) {
        btnEditConfig.addEventListener('click', () => {
            if (AppState.settings.accessMode !== 'ENGINEER') {
                requireEngineerMode(() => {
                    switchTab('config');
                });
            } else {
                switchTab('config');
            }
        });
    }

    if (DOM.btnDeleteMachine) {
        DOM.btnDeleteMachine.addEventListener('click', () => {
            if (AppState.currentMachineId) {
                handleDeleteMachine(AppState.currentMachineId);
            }
        });
    }

    if (DOM.btnDeleteEditMachine) {
        DOM.btnDeleteEditMachine.addEventListener('click', () => {
            const id = DOM.editMachId ? DOM.editMachId.value : null;
            if (id) {
                handleDeleteMachine(id);
            }
        });
    }

    if (DOM.btnSaveMachine) DOM.btnSaveMachine.addEventListener('click', () => {
        requireEngineerMode(() => {
            const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
            if (!machine) return;

            const entName = DOM.detMachName ? DOM.detMachName.value.trim() : '';
            const entNo = DOM.detMachNo ? DOM.detMachNo.value.trim() : machine.machineNo;
            const entModel = DOM.detModel ? DOM.detModel.value : machine.model;
            const entSerial = DOM.detSerialNo ? DOM.detSerialNo.value.trim() : machine.serialNo;
            const entDept = DOM.detDept ? DOM.detDept.value : machine.department;

            if (entNo) machine.machineNo = entNo;

            checkAndHandleIdentityChange(machine, entModel, entSerial, entName, entDept, (isConfirmedIdentityChange) => {
                StorageService.saveMachine(machine);
                AppState.machines = StorageService.loadMachines();
                MachineController.renderSingleDashboard(machine, DOM, getEvalTime(), false, getMachineCallbacks());
                UI.showToast(isConfirmedIdentityChange ? `Updated Identity for ${machine.machineNo} ✓` : `Saved configuration for ${machine.machineNo} ✓`, 'success');

                const origTxt = DOM.btnSaveMachine.textContent;
                DOM.btnSaveMachine.textContent = "Saved ✓";
                setTimeout(() => DOM.btnSaveMachine.textContent = origTxt, 1200);
            });
        });
    });

    if (DOM.btnAddRecord) DOM.btnAddRecord.addEventListener('click', () => {
        requireEngineerMode(() => {
            const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
            if (machine) {
                if (!Array.isArray(machine.maintenanceHistory)) machine.maintenanceHistory = [];
                machine.maintenanceHistory.unshift({
                    date: AppState.simulatedDate,
                    engineer: 'Engineer',
                    action: 'Routine Inspection',
                    notes: 'Inspected optical alignment and cooling flow.'
                });
                StorageService.saveMachine(machine);
                MachineController.renderMaintenanceLog(machine, DOM.maintTbody);
                UI.showToast('Added maintenance record', 'success');
            }
        });
    });

    // Recalibration Flow
    const closeRecalModal = () => UI.hideModal(DOM.recalOverlay);
    if (DOM.btnCloseRecalModal) DOM.btnCloseRecalModal.addEventListener('click', closeRecalModal);
    if (DOM.btnCancelRecalModal) DOM.btnCancelRecalModal.addEventListener('click', closeRecalModal);

    if (DOM.btnSubmitRecalibrate) DOM.btnSubmitRecalibrate.addEventListener('click', () => {
        const actualHour = Number(DOM.recalActualInput.value);
        if (isNaN(actualHour) || actualHour < 0) {
            UI.showToast("Please enter a valid actual machine hour reading.", "error");
            return;
        }

        const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
        if (!machine) return;

        const evalTime = getEvalTime();
        const reason = DOM.recalReasonSelect.value;
        const selectedLaserId = DOM.recalLaserSelect ? DOM.recalLaserSelect.value : null;

        const result = RecalibrationController.prepareRecalibration(machine, selectedLaserId, actualHour, reason, evalTime);
        AppState.pendingRecalibration = result;

        if (DOM.devEstHourDisplay) DOM.devEstHourDisplay.textContent = `${result.analysis.estimatedHour} hrs`;
        if (DOM.devActualHourDisplay) DOM.devActualHourDisplay.textContent = `${result.analysis.actualHour} hrs`;

        const diff = result.analysis.difference;
        if (DOM.devDiffDisplay) {
            DOM.devDiffDisplay.textContent = diff > 0 ? `+${diff} hrs` : `${diff} hrs`;
            DOM.devDiffDisplay.style.color = RecalibrationController.getDeviationColor(diff);
        }

        if (DOM.devRatingDisplay) DOM.devRatingDisplay.textContent = result.analysis.ratingInfo.rating;

        if (DOM.devWarningBox) {
            if (result.analysis.ratingInfo.warningMsg) {
                DOM.devWarningBox.textContent = result.analysis.ratingInfo.warningMsg;
                DOM.devWarningBox.classList.remove('hidden');
            } else {
                DOM.devWarningBox.classList.add('hidden');
            }
        }

        closeRecalModal();
        UI.showModal(DOM.deviationOverlay);
    });

    const closeDevModal = () => UI.hideModal(DOM.deviationOverlay);
    if (DOM.btnCloseDevModal) DOM.btnCloseDevModal.addEventListener('click', closeDevModal);
    if (DOM.btnBackDevModal) DOM.btnBackDevModal.addEventListener('click', () => {
        closeDevModal();
        UI.showModal(DOM.recalOverlay);
    });

    if (DOM.btnConfirmDeviation) DOM.btnConfirmDeviation.addEventListener('click', () => {
        if (!AppState.pendingRecalibration) return;

        const { updatedMachine } = AppState.pendingRecalibration;
        StorageService.saveMachine(updatedMachine);
        AppState.machines = StorageService.loadMachines();
        AppState.pendingRecalibration = null;

        closeDevModal();
        UI.showToast('Recalibration Baseline Applied ✓', 'success');

        const m = AppState.machines.find(item => item.id === AppState.currentMachineId);
        if (m) {
            if (DOM.prevHour) DOM.prevHour.value = m.baseLaserHour;
            if (DOM.prevDate) DOM.prevDate.value = safeToDatetimeLocal(m.baseTimestamp);
            MachineController.renderCalibrationHistory(m, DOM.calibrationTbody);
            MachineController.renderSingleDashboard(m, DOM, getEvalTime());
        }
    });

    // Replace Laser Workflow Listeners
    if (DOM.btnCloseReplaceModal) DOM.btnCloseReplaceModal.addEventListener('click', closeReplaceLaserModal);
    if (DOM.btnCancelReplaceModal) DOM.btnCancelReplaceModal.addEventListener('click', closeReplaceLaserModal);

    if (DOM.btnSubmitReplaceLaser) {
        DOM.btnSubmitReplaceLaser.addEventListener('click', () => {
            const machine = AppState.machines.find(m => m.id === AppState.currentMachineId);
            if (!machine || !Array.isArray(machine.lasers)) return;

            const targetId = document.getElementById('repl-target-laser-id') ? document.getElementById('repl-target-laser-id').value : (DOM.replLaserId ? DOM.replLaserId.value : '');
            const laser = machine.lasers.find(l => l.id === targetId) || machine.lasers[0];
            if (!laser) return;

            const installedHourInput = DOM.replInstalledHour ? DOM.replInstalledHour.value : '0';
            const newBaselineHour = installedHourInput !== '' && !isNaN(Number(installedHourInput)) ? Math.max(0, Number(installedHourInput)) : 0;
            const installTsInput = DOM.replInstallTimestamp ? DOM.replInstallTimestamp.value : '';
            const installDate = installTsInput ? safeToISOString(installTsInput, new Date().toISOString()) : new Date().toISOString();
            const engineerName = DOM.replEngineerName ? DOM.replEngineerName.value.trim() : 'Optics Specialist';
            const reason = DOM.replReason ? DOM.replReason.value : 'End-of-Life Reached (Rated Limit)';
            const notes = DOM.replNotes ? DOM.replNotes.value.trim() : '';

            const evalTime = new Date(installDate);
            const prevEstHour = LaserEngine.calculateEstimatedHour(laser.baseLaserHour || 0, safeToISOString(laser.baseTimestamp), evalTime);
            const currentGen = laser.generation || (laser.replacementHistory ? laser.replacementHistory.length + 1 : (laser.lifecycleHistory ? laser.lifecycleHistory.length + 1 : 1));

            if (!Array.isArray(laser.replacementHistory)) {
                laser.replacementHistory = Array.isArray(laser.lifecycleHistory) ? [...laser.lifecycleHistory] : [];
            }

            const replacementRecord = {
                id: `REPL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                generation: currentGen,
                replacementDate: installDate,
                previousRuntime: Math.round(prevEstHour * 10) / 10,
                newBaselineHours: newBaselineHour,
                engineer: engineerName || 'Optics Specialist',
                reason: reason,
                notes: notes
            };

            laser.replacementHistory.unshift(replacementRecord);
            laser.lifecycleHistory = laser.replacementHistory; // Backward compatibility

            laser.generation = currentGen + 1;
            laser.baseLaserHour = newBaselineHour;
            laser.baseTimestamp = installDate;
            laser.installedDate = installDate;
            laser.installedBy = engineerName || 'Optics Specialist';
            laser.lastRecalibrationDate = installDate;

            // Log to machine maintenance history
            if (!Array.isArray(machine.maintenanceHistory)) machine.maintenanceHistory = [];
            machine.maintenanceHistory.unshift({
                id: `MAINT-${Date.now()}`,
                date: installDate,
                engineer: engineerName || 'Optics Specialist',
                action: `Replaced ${laser.name} (Gen ${currentGen} → Gen ${laser.generation})`,
                notes: `Reset baseline to ${newBaselineHour} hrs. Previous runtime: ${Math.round(prevEstHour)} hrs. Reason: ${reason}. ${notes ? `Notes: ${notes}` : ''}`
            });

            StorageService.saveMachine(machine);
            AppState.machines = StorageService.loadMachines();

            closeReplaceLaserModal();
            UI.showToast(`Successfully replaced ${laser.name} (Now Gen ${laser.generation}) ✓`, 'success');

            const currentEval = getEvalTime();
            MachineController.renderMaintenanceLog(machine, DOM.maintTbody);
            MachineController.renderSingleDashboard(machine, DOM, currentEval, false, getMachineCallbacks());

            if (DOM.fleetGrid) {
                DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, currentEval, handleMachineSelect, handleEditMachine, handleDeleteMachine);
            }

            window.dispatchEvent(new CustomEvent('lms-fleet-updated', {
                detail: { count: AppState.machines.length }
            }));
        });
    }

    // Global Header Action Buttons
    if (DOM.btnTheme) DOM.btnTheme.addEventListener('click', () => {
        const nextTheme = UI.toggleTheme();
        AppState.settings.theme = nextTheme;
        StorageService.saveSettings(AppState.settings);
    });

    if (DOM.btnPrint) DOM.btnPrint.addEventListener('click', () => UI.printReport());
    if (DOM.btnExportCsv) DOM.btnExportCsv.addEventListener('click', () => {
        UI.exportToCSV(AppState.machines, getEvalTime(), AppState.simulatedDate);
        UI.showToast('CSV Report Downloaded', 'success');
    });

    // Fleet Backup Export & Import (.json)
    if (DOM.btnExportJson) {
        DOM.btnExportJson.addEventListener('click', () => {
            try {
                const backupData = StorageService.exportBackup();
                const jsonString = JSON.stringify(backupData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const filename = `LMS_Fleet_Backup_${year}-${month}-${day}_${hours}${minutes}.json`;

                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                UI.showToast('Fleet Backup Exported', 'success');
            } catch (err) {
                console.error('[ExportBackup] Error exporting backup:', err);
                UI.showToast('Failed to export fleet backup', 'error');
            }
        });
    }

    if (DOM.inputImportJson) {
        DOM.inputImportJson.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    const restored = StorageService.importBackup(parsed);
                    AppState.machines = restored.machines;
                    AppState.settings = restored.settings;

                    UI.applyTheme(AppState.settings.theme);
                    updateModeBadgeUI();
                    updateAppTitle();
                    populateSettingsForm();
                    UI.showToast('Fleet Backup Restored Successfully ✓', 'success');

                    if (DOM.fleetGrid) {
                        DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, getEvalTime(), handleMachineSelect, handleEditMachine, handleDeleteMachine);
                    }
                } catch (err) {
                    console.error('[ImportBackup] Error importing backup:', err);
                    UI.showToast('Failed to import backup JSON file', 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // Save & Restore Settings Buttons
    if (DOM.btnSaveSettings) {
        DOM.btnSaveSettings.addEventListener('click', async () => {
            const newTitle = DOM.cfgAppTitle ? DOM.cfgAppTitle.value.trim() : '';
            AppState.settings.systemTitle = newTitle || "Laser Management System";
            if (DOM.cfgRatedLife && DOM.cfgRatedLife.value) {
                AppState.settings.defaultRatedLife = Number(DOM.cfgRatedLife.value);
            }
            if (DOM.cfgWarnPct && DOM.cfgWarnPct.value) {
                AppState.settings.defaultWarningPercentage = Number(DOM.cfgWarnPct.value);
            }
            if (DOM.cfgRecalInterval && DOM.cfgRecalInterval.value) {
                AppState.settings.recalibrationInterval = Number(DOM.cfgRecalInterval.value);
            }
            if (DOM.cfgEngPassword) {
                AppState.settings.engineerPassword = DOM.cfgEngPassword.value;
            }

            await StorageService.saveSettingsAsync(AppState.settings);
            updateAppTitle();
            UI.showToast('System settings saved successfully ✓', 'success');
        });
    }

    if (DOM.btnResetDefaults) {
        DOM.btnResetDefaults.addEventListener('click', async () => {
            AppState.settings.systemTitle = "Laser Management System";
            AppState.settings.defaultRatedLife = 25000;
            AppState.settings.defaultWarningPercentage = 80;
            AppState.settings.recalibrationInterval = 30;
            AppState.settings.engineerPassword = "1234";

            await StorageService.saveSettingsAsync(AppState.settings);
            populateSettingsForm();
            updateAppTitle();
            UI.showToast('Settings restored to defaults', 'info');
        });
    }

    window.addEventListener('lms-settings-updated', (e) => {
        if (e.detail) {
            AppState.settings = { ...AppState.settings, ...e.detail };
            updateAppTitle();
            UI.applyTheme(AppState.settings.theme);
            updateModeBadgeUI();
            populateSettingsForm();
        }
    });

    // Identity Mismatch Modal Handlers
    const closeIdentityModal = () => {
        UI.hideModal(DOM.identityOverlay);
        pendingIdentityState = null;
    };
    if (DOM.btnCloseIdentityModal) DOM.btnCloseIdentityModal.addEventListener('click', closeIdentityModal);

    if (DOM.btnUseRegisteredIdentity) {
        DOM.btnUseRegisteredIdentity.addEventListener('click', () => {
            if (!pendingIdentityState) return;
            const { machine, enteredName, enteredDept, saveCallback } = pendingIdentityState;

            if (DOM.detModel) DOM.detModel.value = machine.model || 'BMD302W';
            if (DOM.detSerialNo) DOM.detSerialNo.value = machine.serialNo || '';
            if (DOM.editMachModel) DOM.editMachModel.value = machine.model || 'BMD302W';
            if (DOM.editMachSerial) DOM.editMachSerial.value = machine.serialNo || '';

            if (enteredName) machine.machineName = enteredName;
            if (enteredDept) machine.department = enteredDept;

            closeIdentityModal();
            saveCallback(false);
        });
    }

    if (DOM.btnConfirmIdentityChange) {
        DOM.btnConfirmIdentityChange.addEventListener('click', () => {
            if (!pendingIdentityState) return;
            const { machine, enteredModel, enteredSerial, enteredName, enteredDept, saveCallback } = pendingIdentityState;

            const oldSerial = machine.serialNo;
            if (enteredModel) machine.model = enteredModel;
            if (enteredSerial) machine.serialNo = enteredSerial;
            if (enteredName) machine.machineName = enteredName;
            if (enteredDept) machine.department = enteredDept;

            if (Array.isArray(machine.lasers)) {
                machine.lasers.forEach((laser, idx) => {
                    if (!laser.serialNo || (oldSerial && laser.serialNo.includes(oldSerial))) {
                        laser.serialNo = `${machine.serialNo}-L${idx + 1}`;
                    }
                });
            }

            closeIdentityModal();
            saveCallback(true);
        });
    }

    // Add Machine Modal
    const openAddModal = () => {
        requireEngineerMode(() => {
            if (DOM.newMachSerial) DOM.newMachSerial.value = '';
            if (DOM.newMachLaserCount) DOM.newMachLaserCount.value = '1';
            UI.showModal(DOM.addModalOverlay);
        });
    };
    const closeAddModal = () => UI.hideModal(DOM.addModalOverlay);

    if (DOM.btnOpenAdd) DOM.btnOpenAdd.addEventListener('click', openAddModal);
    if (DOM.btnCloseAddModal) DOM.btnCloseAddModal.addEventListener('click', closeAddModal);
    if (DOM.btnCancelAddModal) DOM.btnCancelAddModal.addEventListener('click', closeAddModal);

    if (DOM.btnSubmitMachine) DOM.btnSubmitMachine.addEventListener('click', () => {
        const model = DOM.newMachModel ? DOM.newMachModel.value : 'BMD302W';
        const serial = (DOM.newMachSerial ? DOM.newMachSerial.value.trim() : '') || 'SN-XXXX';
        const dept = DOM.newMachDept ? DOM.newMachDept.value : 'Wafer Prep';
        const headCount = Number(DOM.newMachLaserCount ? DOM.newMachLaserCount.value : 1) || 1;

        const machId = 'WD-' + Math.floor(10000 + Math.random() * 90000);
        const machineNo = `WD-${serial.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || Math.floor(100 + Math.random() * 900)}`;

        const lasers = [];
        for (let i = 1; i <= headCount; i++) {
            lasers.push({
                id: `${machId}-L${i}`,
                name: `Laser Head ${i}`,
                serialNo: `${serial}-L${i}`,
                ratedLife: 25000,
                warningLife: 20000,
                contingencyCeiling: 28000,
                baseLaserHour: null,
                baseTimestamp: null,
                runtimeState: 'BASELINE_REQUIRED',
                lastRecalibrationDate: null,
                calibrationHistory: []
            });
        }

        const newMachine = {
            id: machId,
            machineNo: machineNo,
            machineName: `Wafer Driller ${model}`,
            model: model,
            serialNo: serial,
            department: dept,
            lasers: lasers,
            maintenanceHistory: [],
            calibrationHistory: []
        };

        StorageService.saveMachine(newMachine);
        AppState.machines = StorageService.loadMachines();
        closeAddModal();
        UI.showToast(`Created ${newMachine.machineName} (${serial}) ✓`, 'success');

        const evalTime = getEvalTime();
        const metrics = LaserEngine.calculateMachineMetrics(newMachine, evalTime);

        const s = (AppState.filters.search || '').toLowerCase();
        const matchSearch = !s ||
            (newMachine.machineNo || '').toLowerCase().includes(s) ||
            (newMachine.machineName || '').toLowerCase().includes(s) ||
            (newMachine.serialNo || '').toLowerCase().includes(s) ||
            (newMachine.department || '').toLowerCase().includes(s) ||
            (newMachine.model || '').toLowerCase().includes(s);

        if (!matchSearch) {
            AppState.filters.search = '';
            if (DOM.filterSearch) DOM.filterSearch.value = '';
        }

        const stat = AppState.filters.status || 'ALL';
        const matchStatus = (stat === 'ALL' || metrics.status === stat);
        if (!matchStatus) {
            AppState.filters.status = 'ALL';
            if (DOM.filterStatus) DOM.filterStatus.value = 'ALL';
        }

        const dpt = AppState.filters.dept || 'ALL';
        const matchDept = (dpt === 'ALL' || newMachine.department === dpt);
        if (!matchDept) {
            AppState.filters.dept = 'ALL';
            if (DOM.filterDept) DOM.filterDept.value = 'ALL';
        }

        const modelFilter = AppState.filters.model || 'ALL';
        const matchModel = (modelFilter === 'ALL' || newMachine.model === modelFilter);
        if (!matchModel) {
            AppState.filters.model = 'ALL';
            if (DOM.filterModel) DOM.filterModel.value = 'ALL';
        }

        window.dispatchEvent(new CustomEvent('lms-fleet-updated', {
            detail: { count: AppState.machines.length }
        }));

        if (window.location.pathname.includes('machine.html')) {
            window.location.href = 'index.html';
        } else {
            showFleetView();
        }
    });

    // Edit Machine Modal
    const closeEditModal = () => UI.hideModal(DOM.editModalOverlay);
    if (DOM.btnCloseEditModal) DOM.btnCloseEditModal.addEventListener('click', closeEditModal);
    if (DOM.btnCancelEditModal) DOM.btnCancelEditModal.addEventListener('click', closeEditModal);

    if (DOM.btnSubmitEditMachine) DOM.btnSubmitEditMachine.addEventListener('click', () => {
        const id = DOM.editMachId ? DOM.editMachId.value : null;
        if (!id) return;

        const machine = AppState.machines.find(m => m.id === id);
        if (!machine) return;

        const entName = DOM.editMachName ? DOM.editMachName.value.trim() : '';
        const entNo = DOM.editMachNo ? DOM.editMachNo.value.trim() : machine.machineNo;
        const entModel = DOM.editMachModel ? DOM.editMachModel.value : machine.model;
        const entSerial = DOM.editMachSerial ? DOM.editMachSerial.value.trim() : machine.serialNo;
        const entDept = DOM.editMachDept ? DOM.editMachDept.value : machine.department;

        if (entNo) machine.machineNo = entNo;

        checkAndHandleIdentityChange(machine, entModel, entSerial, entName, entDept, (isConfirmedIdentityChange) => {
            StorageService.saveMachine(machine);
            AppState.machines = StorageService.loadMachines();
            closeEditModal();
            UI.showToast(isConfirmedIdentityChange ? `Updated Identity for ${machine.machineNo} ✓` : `Saved ${machine.machineNo} ✓`, 'success');

            if (DOM.fleetGrid) {
                DashboardController.renderFleetView(DOM.fleetGrid, AppState.machines, AppState.filters, getEvalTime(), handleMachineSelect, handleEditMachine, handleDeleteMachine);
            }
            if (AppState.currentMachineId === machine.id) {
                MachineController.renderSingleDashboard(machine, DOM, getEvalTime(), false, getMachineCallbacks());
            }
        });
    });

    // Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
        // Ctrl+S or Cmd+S to Save
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            if (DOM.btnSaveMachine) DOM.btnSaveMachine.click();
        }
        // Ctrl+P or Cmd+P to Print Report
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
            e.preventDefault();
            UI.printReport();
        }
        // Ctrl+E or Cmd+E to Toggle Engineer Mode
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
            e.preventDefault();
            if (DOM.btnToggleMode) DOM.btnToggleMode.click();
        }
        // Focus search input on / or Ctrl+F
        if ((e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f")) && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            if (DOM.filterSearch) {
                e.preventDefault();
                DOM.filterSearch.focus();
            }
        }
        // Escape closes all modals
        if (e.key === "Escape") {
            closeAddModal();
            closeEditModal();
            closeRecalModal();
            closeDevModal();
            closeModeModal();
            closeReplaceLaserModal();
            closeMaintenanceModal();
            if (DOM.filterPopover) DOM.filterPopover.classList.add('hidden');
        }
    });
}

window.addEventListener('DOMContentLoaded', initApp);
