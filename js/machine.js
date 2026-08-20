/* =====================================================
   MACHINE.JS - Single Machine Detailed View Controller
   ===================================================== */
import { LaserEngine } from './laserEngine.js';
import { ChartRenderer } from './charts.js';
import { StorageService } from './storage.js';
import { UI } from './ui.js';
import { formatDate } from './utils.js';

export const MachineController = {
    /**
     * Render the single machine dashboard and update all metric displays.
     */
    renderSingleDashboard(machine, DOM, evalTime, silent = false, callbacks = {}) {
        if (!machine || !DOM) return;
        if ((!callbacks || typeof callbacks.onRecalibrateLaser !== 'function') && typeof window.getMachineCallbacks === 'function') {
            callbacks = window.getMachineCallbacks();
        }

        const metrics = LaserEngine.calculateMachineMetrics(machine, evalTime);
        const lasersCount = metrics.totalLasers || (machine.lasers ? machine.lasers.length : 1);

        // Header Elements
        const headerNum = document.getElementById('mach-header-num');
        const headerName = document.getElementById('mach-header-name');
        const headerModel = document.getElementById('mach-header-model');
        const headerStatus = document.getElementById('mach-header-status');
        if (headerNum) headerNum.textContent = machine.machineNo;
        if (headerName) headerName.textContent = machine.machineName || machine.machineNo;
        if (headerModel) headerModel.textContent = `${machine.model} • ${lasersCount} Laser ${lasersCount === 1 ? 'Head' : 'Heads'} • SN: ${machine.serialNo || 'N/A'}`;
        if (headerStatus) {
            let statusClass = 'color-safe';
            let bgClass = 'bg-safe';
            if (metrics.status === 'WARNING') { statusClass = 'color-warning'; bgClass = 'bg-warning'; }
            else if (metrics.status === 'ALARM') { statusClass = 'color-alarm'; bgClass = 'bg-alarm'; }
            else if (metrics.status === 'BASELINE_REQUIRED') { statusClass = 'color-baseline'; bgClass = 'bg-baseline'; }

            headerStatus.className = `mc-status-badge ${statusClass}`;
            headerStatus.innerHTML = `<div class="mc-led ${bgClass} led-solid"></div> ${metrics.status === 'BASELINE_REQUIRED' ? 'BASELINE REQUIRED' : metrics.status}`;
        }

        // Read-only Machine Profile Cards
        const infoNum = document.getElementById('info-mach-no');
        const infoModel = document.getElementById('info-model');
        const infoSerial = document.getElementById('info-serial');
        const infoDept = document.getElementById('info-dept');
        const infoRated = document.getElementById('info-rated');
        const infoBaseDate = document.getElementById('info-base-date');
        if (infoNum) infoNum.textContent = machine.machineNo;
        if (infoModel) infoModel.textContent = machine.model;
        if (infoSerial) infoSerial.textContent = machine.serialNo;
        if (infoDept) infoDept.textContent = machine.department;
        if (infoRated) infoRated.textContent = `${machine.ratedLife || 25000} hrs`;
        if (infoBaseDate) infoBaseDate.textContent = machine.baseTimestamp ? formatDate(machine.baseTimestamp) : 'N/A';

        // EOL Date Card
        const machEol = document.getElementById('mach-eol-date');
        if (machEol) machEol.textContent = metrics.eolDate || 'N/A';

        // Top Summary Metric Cards (Mapped to most critical laser)
        const crit = metrics.mostCriticalLaser;

        const heroCritName = document.getElementById('hero-crit-name');
        const heroCritSerial = document.getElementById('hero-crit-serial');
        const heroCritText = document.getElementById('hero-crit-status-text');
        const heroCritLed = document.getElementById('hero-crit-status-led');
        const heroCritBadge = document.getElementById('hero-crit-status-badge');

        if (heroCritName) heroCritName.textContent = crit.name;
        if (heroCritSerial) heroCritSerial.textContent = `SN: ${crit.serialNo || 'N/A'}`;
        if (heroCritText) heroCritText.textContent = crit.status === 'BASELINE_REQUIRED' ? 'BASELINE' : crit.status;
        if (heroCritBadge) {
            let statusClass = 'color-safe';
            let bgClass = 'bg-safe';
            if (crit.status === 'WARNING') { statusClass = 'color-warning'; bgClass = 'bg-warning'; }
            else if (crit.status === 'ALARM') { statusClass = 'color-alarm'; bgClass = 'bg-alarm'; }
            else if (crit.status === 'BASELINE_REQUIRED') { statusClass = 'color-baseline'; bgClass = 'bg-baseline'; }

            heroCritBadge.className = `mc-status-badge ${statusClass}`;
            if (heroCritLed) heroCritLed.className = `mc-led ${bgClass} led-solid`;
        }

        if (DOM.currentHour) DOM.currentHour.textContent = crit.currentHour !== null && crit.currentHour !== '—' ? `${crit.currentHour} hrs` : '—';
        if (DOM.currentAge) DOM.currentAge.textContent = `Critical: ${crit.name}`;
        
        if (DOM.healthPercent) {
            DOM.healthPercent.textContent = crit.baselineRequired ? '—' : (crit.isContingencyActive ? '0%' : crit.formattedLifeRemaining);
        }

        // Populate Configuration Tab fields
        const detName = document.getElementById('det-mach-name');
        const detNum = document.getElementById('det-mach-no');
        const detModel = document.getElementById('det-model');
        const detSerial = document.getElementById('det-serial-no');
        const detDept = document.getElementById('det-dept');
        if (detName) detName.value = machine.machineName || ('Wafer Driller ' + (machine.model || 'BMD302W'));
        if (detNum) detNum.value = machine.machineNo || '';
        if (detModel) detModel.value = machine.model || 'BMD302W';
        if (detSerial) detSerial.value = machine.serialNo || '';
        if (detDept) detDept.value = machine.department || 'Wafer Prep';

        // Warning Operational Banner
        const warnBanner = document.getElementById('mach-warning-banner');
        const warnBannerText = document.getElementById('mach-warning-banner-text');
        if (warnBanner) {
            if (metrics.status === 'BASELINE_REQUIRED' || crit.baselineRequired) {
                warnBanner.style.display = 'flex';
                warnBanner.style.borderColor = '#3b82f6';
                warnBanner.style.background = 'rgba(59, 130, 246, 0.15)';
                warnBanner.style.color = '#3b82f6';
                if (warnBannerText) {
                    warnBannerText.textContent = "Record the current physical laser hour-meter reading and capture date/time to begin automatic runtime estimation.";
                }
            } else if (metrics.status === 'WARNING' && !crit.isContingencyActive) {
                warnBanner.style.display = 'flex';
                warnBanner.style.borderColor = 'var(--yellow)';
                warnBanner.style.background = 'rgba(251, 191, 36, 0.15)';
                warnBanner.style.color = 'var(--yellow)';
                if (warnBannerText) {
                    warnBannerText.textContent = `REPLACEMENT PLANNING REQUIRED • RECOMMENDED LIFE LIMIT APPROACHING (${crit.remainingTotal} hrs remaining)`;
                }
            } else {
                warnBanner.style.display = 'none';
            }
        }

        // Automatic Contingency Mode Panel
        const contingencyPanel = document.getElementById('contingency-mode-panel');
        if (contingencyPanel) {
            if (crit.isContingencyActive) {
                contingencyPanel.style.display = 'block';

                const recLifeEl = document.getElementById('cm-recommended-life');
                const exceededByEl = document.getElementById('cm-exceeded-by');
                const marginRemainingEl = document.getElementById('cm-margin-remaining');
                const ceilingValEl = document.getElementById('cm-ceiling-val');
                const rangePctEl = document.getElementById('cm-range-pct');
                const progressFillEl = document.getElementById('cm-progress-fill');

                if (recLifeEl) recLifeEl.textContent = `${crit.ratedLife.toLocaleString()} hrs`;
                if (exceededByEl) exceededByEl.textContent = `${crit.hoursExceeded.toLocaleString()} hrs`;
                if (marginRemainingEl) marginRemainingEl.textContent = `${crit.contingencyMargin.toLocaleString()} hrs`;
                if (ceilingValEl) ceilingValEl.textContent = `${crit.contingencyCeiling.toLocaleString()} hrs`;

                const marginSpan = Math.max(1, crit.contingencyCeiling - crit.ratedLife);
                const usedPct = Math.min(100, Math.max(0, (crit.hoursExceeded / marginSpan) * 100));

                if (rangePctEl) rangePctEl.textContent = `${usedPct.toFixed(1)}% Margin Used`;
                if (progressFillEl) progressFillEl.style.width = `${usedPct}%`;
            } else {
                contingencyPanel.style.display = 'none';
            }
        }

        this.updateRemainingCardUI(crit, DOM);
        this.updateStatusCardUI(metrics.status, DOM, crit);

        if (DOM.progressBar) ChartRenderer.updateProgressBar(DOM.progressBar, crit.lifeRemainingPercent);

        // Render Laser Heads Grid
        this.renderLaserHeadsGrid(machine, metrics, evalTime, callbacks);

        // Render Permanent Replacement History Timeline
        this.renderReplacementHistory(machine, null, this.activeReplFilter || 'ALL');

        // Render Calibration Table
        const calibTable = document.getElementById('calibration-tbody');
        if (calibTable) this.renderCalibrationHistory(machine, calibTable);

        // Render Unified History Timeline for Audit Tab
        const timelineContainer = document.getElementById('machine-unified-timeline');
        if (timelineContainer) {
            this.renderUnifiedTimeline(machine, timelineContainer, this.activeHistoryFilter || 'ALL', evalTime);
        }

        const maintTable = document.getElementById('maintenance-tbody');
        if (maintTable) this.renderMaintenanceLog(machine, maintTable);

        if (!silent) {
            this.updateLegendsAndScales(machine, DOM);
        }
    },

    /**
     * Render dynamic grid of individual laser heads for the machine.
     * Highly readable, uncluttered industrial cards.
     */
    renderLaserHeadsGrid(machine, machineMetrics, evalTime, callbacks = {}) {
        const container = document.getElementById('laser-heads-grid');
        if (!container) return;

        container.innerHTML = '';

        const laserList = machineMetrics.laserMetricsList || [];

        laserList.forEach((lm) => {
            let badgeClass = 'color-safe', dotColor = 'var(--green)';
            if (lm.status === 'WARNING') { badgeClass = 'color-warning'; dotColor = 'var(--yellow)'; }
            if (lm.status === 'ALARM') { badgeClass = 'color-alarm'; dotColor = 'var(--red)'; }
            if (lm.status === 'BASELINE_REQUIRED') { badgeClass = 'color-baseline'; dotColor = '#3b82f6'; }

            const card = document.createElement('div');
            card.className = 'laser-head-card glass-panel';

            const currentHrsText = lm.currentHour !== null && lm.currentHour !== '—' ? `${lm.currentHour} hrs` : '—';
            let remainText = '—';
            if (lm.remainingTotal !== null && lm.remainingTotal !== '—') {
                const formatHrs = Math.abs(lm.remainingTotal);
                remainText = lm.remainingTotal < 0 ? `-${formatHrs} hrs` : `${formatHrs} hrs`;
            }

            let countdownText = '—';
            if (lm.remainingDaysInfo && lm.remainingDaysInfo.daysVal !== null && !isNaN(lm.remainingDaysInfo.daysVal)) {
                const daysVal = Math.abs(lm.remainingDaysInfo.daysVal);
                countdownText = lm.remainingTotal < 0 ? `${daysVal}d Overdue` : `${daysVal}d remaining`;
            }

            const lastRecalText = lm.lastRecalibrationDate ? formatDate(lm.lastRecalibrationDate) : (lm.baseTimestamp ? formatDate(lm.baseTimestamp) : 'Initial Baseline');
            const genNumber = lm.generation || (lm.replacementHistory ? lm.replacementHistory.length + 1 : (lm.lifecycleHistory ? lm.lifecycleHistory.length + 1 : 1));

            const contingencyInfoHtml = lm.isContingencyActive ? `
                <div style="padding: 6px 10px; background: rgba(239, 68, 68, 0.12); border: 1px solid var(--red); border-radius: 6px; font-size: 11px; color: #fca5a5; font-weight: 700; line-height: 1.35;">
                    <div style="color: var(--red); font-weight: 800; margin-bottom: 2px;">🚨 RECOMMENDED LIFE EXCEEDED</div>
                    Exceeded By: <strong>${lm.hoursExceeded} hrs</strong> • Contingency Margin: <strong>${lm.contingencyMargin} hrs</strong>
                </div>
            ` : '';

            const baselineInfoHtml = lm.status === 'BASELINE_REQUIRED' ? `
                <div style="padding: 6px 10px; background: rgba(59, 130, 246, 0.12); border: 1px solid #3b82f6; border-radius: 6px; font-size: 11px; color: #93c5fd; font-weight: 600; line-height: 1.35;">
                    Physical baseline hour required to initialize runtime tracking.
                </div>
            ` : '';

            card.innerHTML = `
                <div class="lhc-header">
                    <div>
                        <div style="display:flex; align-items:center; gap:6px;">
                            <div class="lhc-title">${lm.name}</div>
                            <span class="badge badge-info" style="font-size:9px; font-weight:700; padding:1px 5px; border-radius:4px;">Gen ${genNumber}</span>
                        </div>
                        <div class="lhc-subtitle">SN: ${lm.serialNo}</div>
                    </div>
                    <div class="mc-status-badge ${badgeClass}" style="border-color:${dotColor}40; font-size:10px; padding:2px 8px;">
                        <div class="mc-led" style="width:7px; height:7px; background:${dotColor}; box-shadow: 0 0 6px ${dotColor}"></div>
                        ${lm.status === 'BASELINE_REQUIRED' ? 'BASELINE' : lm.status}
                    </div>
                </div>

                <div class="lhc-stats">
                    <div class="lhc-stat-item">
                        <span class="lhc-stat-label">Current Runtime</span>
                        <span class="lhc-stat-val">${currentHrsText}</span>
                    </div>
                    <div class="lhc-stat-item">
                        <span class="lhc-stat-label">Remaining Hours</span>
                        <span class="lhc-stat-val ${badgeClass}">${remainText}</span>
                    </div>
                    <div class="lhc-stat-item">
                        <span class="lhc-stat-label">Replacement Countdown</span>
                        <span class="lhc-stat-val ${lm.remainingTotal < 0 ? 'color-alarm' : ''}" style="font-size:12px;">${countdownText}</span>
                    </div>
                    <div class="lhc-stat-item">
                        <span class="lhc-stat-label">Last Calibration</span>
                        <span class="lhc-stat-val" style="font-size:11px; margin-top:2px;">${lastRecalText}</span>
                    </div>
                </div>

                <div class="lhc-progress-box">
                    <div class="lhc-progress-meta">
                        <span>Rated Capacity Remaining</span>
                        <strong style="color:${dotColor}">${lm.baselineRequired ? '—' : (lm.isContingencyActive ? '0%' : lm.formattedLifeRemaining)}</strong>
                    </div>
                    <div class="mini-health-track" style="width:100%; height:8px;">
                        <div class="mini-health-fill" style="width:${(lm.baselineRequired || lm.isContingencyActive) ? 0 : (lm.lifeRemainingPercent || 0)}%; background:${dotColor};"></div>
                    </div>
                </div>

                ${baselineInfoHtml}
                ${contingencyInfoHtml}

                <div class="lhc-action-group">
                    <div class="lhc-primary-actions">
                        <button class="btn btn-primary btn-sm btn-replace-laser" data-laser-id="${lm.id}" title="Replace laser diode unit">
                            <svg class="icon" viewBox="0 0 24 24" style="width:12px;height:12px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            Replace Laser
                        </button>
                        ${lm.status === 'BASELINE_REQUIRED' ? `
                        <button class="btn btn-secondary btn-sm btn-edit-laser" data-laser-id="${lm.id}" title="Set initial baseline reading">
                            <svg class="icon" viewBox="0 0 24 24" style="width:12px;height:12px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Set Baseline
                        </button>
                        ` : `
                        <button class="btn btn-secondary btn-sm btn-recal-laser" data-laser-id="${lm.id}" title="Recalibrate runtime hours">
                            <svg class="icon" viewBox="0 0 24 24" style="width:12px;height:12px;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
                            Recalibrate
                        </button>
                        `}
                    </div>
                    <div class="lhc-footer-actions">
                        <button class="btn-lhc-ghost btn-edit-laser" data-laser-id="${lm.id}" title="Edit laser parameters">
                            <svg class="icon" viewBox="0 0 24 24" style="width:12px;height:12px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            <span>Edit</span>
                        </button>
                        ${laserList.length > 1 ? `
                        <button class="btn-lhc-ghost btn-lhc-ghost-danger btn-delete-laser" data-laser-id="${lm.id}" title="Remove Laser Head">
                            <svg class="icon" viewBox="0 0 24 24" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            <span>Delete</span>
                        </button>` : `
                        <button class="btn-lhc-ghost btn-lhc-ghost-danger btn-delete-laser" data-laser-id="${lm.id}" title="At least one laser head is required." disabled style="opacity:0.35; cursor:not-allowed;">
                            <svg class="icon" viewBox="0 0 24 24" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            <span>Delete</span>
                        </button>`}
                    </div>
                </div>
            `;

            const replBtn = card.querySelector('.btn-replace-laser');
            if (replBtn) {
                replBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof callbacks.onReplaceLaser === 'function') {
                        callbacks.onReplaceLaser(machine.id, lm.id);
                    }
                };
            }

            const recalBtn = card.querySelector('.btn-recal-laser');
            if (recalBtn) {
                recalBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof callbacks.onRecalibrateLaser === 'function') {
                        callbacks.onRecalibrateLaser(machine.id, lm.id);
                    }
                };
            }

            const editBtns = card.querySelectorAll('.btn-edit-laser');
            editBtns.forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof callbacks.onEditLaser === 'function') {
                        callbacks.onEditLaser(machine.id, lm.id);
                    }
                };
            });

            const deleteBtn = card.querySelector('.btn-delete-laser');
            if (deleteBtn && !deleteBtn.disabled) {
                deleteBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof callbacks.onDeleteLaser === 'function') {
                        callbacks.onDeleteLaser(machine.id, lm.id);
                    }
                };
            }

            container.appendChild(card);
        });
    },

    updateRemainingCardUI(critMetric, DOM) {
        if (!DOM.remainingHour || !DOM.remainingCard) return;

        const remInfo = critMetric.remainingDaysInfo;
        const remainingTotal = critMetric.remainingTotal;

        DOM.remainingHour.className = "kpi-value";
        DOM.remainingCard.className = "mach-kpi-card glass-panel";
        if (DOM.remainingDot) DOM.remainingDot.className = "led";

        if (remInfo.urgency === "SAFE") {
            DOM.remainingHour.classList.add("color-safe");
            DOM.remainingCard.classList.add("glow-safe");
            if (DOM.remainingDot) DOM.remainingDot.classList.add("bg-safe", "led-solid");
            if (DOM.remainingText) {
                DOM.remainingText.className = "kpi-status-tag color-safe";
                DOM.remainingText.textContent = "SAFE";
            }
        } else if (remInfo.urgency === "WARNING") {
            DOM.remainingHour.classList.add("color-warning");
            DOM.remainingCard.classList.add("glow-warning");
            if (DOM.remainingDot) DOM.remainingDot.classList.add("bg-warning", "blink-slow");
            if (DOM.remainingText) {
                DOM.remainingText.className = "kpi-status-tag color-warning";
                DOM.remainingText.textContent = "WARNING";
            }
        } else {
            DOM.remainingHour.classList.add("color-alarm");
            DOM.remainingCard.classList.add("glow-alarm");
            if (DOM.remainingDot) DOM.remainingDot.classList.add("bg-alarm", "blink-fast");
            if (DOM.remainingText) {
                DOM.remainingText.className = "kpi-status-tag color-alarm";
                DOM.remainingText.textContent = "ALARM";
            }
        }

        const formatHours = (remainingTotal < 0 ? "-" : "") + Math.abs(remainingTotal) + " hrs";
        DOM.remainingHour.textContent = formatHours;
        
        if (DOM.remainingDay) {
            if (critMetric.isContingencyActive) {
                DOM.remainingDay.textContent = "RECOMMENDED LIFE EXCEEDED";
                DOM.remainingDay.style.color = "var(--red)";
                DOM.remainingDay.style.fontWeight = "700";
            } else {
                DOM.remainingDay.textContent = remInfo.daysVal + " " + remInfo.statusMsg;
                DOM.remainingDay.style.color = "var(--muted)";
                DOM.remainingDay.style.fontWeight = "normal";
            }
        }
    },

    updateStatusCardUI(status, DOM, critMetric = {}) {
        if (!DOM.recommendation) return;
        if (DOM.statusText) {
            DOM.statusText.textContent = status;
            DOM.statusText.style.textShadow = "none";
        }

        if (status === "SAFE") {
            if (DOM.statusText) {
                DOM.statusText.style.color = "var(--green)";
                DOM.statusText.style.textShadow = "0 0 18px rgba(52,211,153,.35)";
            }
            DOM.recommendation.className = "recommendation-banner color-safe";
            DOM.recommendation.style.backgroundColor = "rgba(16, 185, 129, 0.1)";
            DOM.recommendation.style.borderColor = "var(--green)";
            DOM.recommendation.style.color = "var(--green)";
            DOM.recommendation.textContent = "Continue normal operation. Review during next preventive maintenance.";
        } else if (status === "WARNING") {
            if (DOM.statusText) {
                DOM.statusText.style.color = "var(--yellow)";
                DOM.statusText.style.textShadow = "0 0 18px rgba(251,191,36,.35)";
            }
            DOM.recommendation.className = "recommendation-banner color-warning";
            DOM.recommendation.style.backgroundColor = "rgba(245, 158, 11, 0.12)";
            DOM.recommendation.style.borderColor = "var(--yellow)";
            DOM.recommendation.style.color = "var(--yellow)";
            DOM.recommendation.textContent = "REPLACEMENT PLANNING REQUIRED • RECOMMENDED LIFE LIMIT APPROACHING. Schedule maintenance before reaching recommended lifetime limit.";
        } else {
            if (DOM.statusText) {
                DOM.statusText.style.color = "var(--red)";
                DOM.statusText.style.textShadow = "0 0 18px rgba(248,113,113,.45)";
            }
            DOM.recommendation.className = "recommendation-banner color-alarm";
            DOM.recommendation.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
            DOM.recommendation.style.borderColor = "var(--red)";
            DOM.recommendation.style.color = "var(--red)";
            DOM.recommendation.textContent = `🚨 RECOMMENDED LASER LIFE EXCEEDED. AUTOMATIC CONTINGENCY MODE ACTIVE. Immediate laser replacement planning and customer risk management required.`;
        }
    },

    renderMaintenanceLog(machine, containerElement) {
        if (!containerElement) return;
        containerElement.innerHTML = '';
        if (!machine.maintenanceHistory || machine.maintenanceHistory.length === 0) {
            containerElement.innerHTML = `<div style="text-align:center; color:var(--muted); padding: 24px;">No maintenance records found. Click "+ Add Record" to start.</div>`;
            return;
        }
        
        // Show max 10 records
        const records = machine.maintenanceHistory.slice(0, 10);
        
        records.forEach((log, index) => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-marker">
                    <div class="timeline-dot"></div>
                    ${index !== records.length - 1 ? '<div class="timeline-line"></div>' : ''}
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <div class="timeline-meta">
                            <span class="timeline-date" contenteditable="true" data-field="date" data-index="${index}">${log.date}</span>
                            <span class="timeline-engineer" contenteditable="true" data-field="engineer" data-index="${index}">${log.engineer}</span>
                        </div>
                        <button class="btn-icon-danger btn-delete-record" data-index="${index}" title="Delete Record">
                            <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                    <div class="timeline-action" contenteditable="true" data-field="action" data-index="${index}">${log.action}</div>
                    <div class="timeline-notes" contenteditable="true" data-field="notes" data-index="${index}">${log.notes}</div>
                </div>
            `;
            containerElement.appendChild(item);
        });

        const editableCells = containerElement.querySelectorAll('[contenteditable="true"]');
        editableCells.forEach(cell => {
            cell.addEventListener('blur', (e) => {
                const idx = e.target.getAttribute('data-index');
                const field = e.target.getAttribute('data-field');
                machine.maintenanceHistory[idx][field] = e.target.textContent.trim();
                StorageService.saveMachine(machine);
            });
            cell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });

        const delBtns = containerElement.querySelectorAll('.btn-delete-record');
        delBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                if (confirm('Delete this maintenance record?')) {
                    machine.maintenanceHistory.splice(idx, 1);
                    StorageService.saveMachine(machine);
                    this.renderMaintenanceLog(machine, containerElement);
                }
            });
        });
    },

    updateLegendsAndScales(machine, DOM) {
        const warn = Math.round((machine.ratedLife || 25000) * 0.8);
        const rated = machine.ratedLife || 25000;

        if (DOM.legendSafe) DOM.legendSafe.textContent = `0 – ${warn - 1} hrs`;
        if (DOM.legendWarning) DOM.legendWarning.textContent = `${warn} – ${rated - 1} hrs`;
        if (DOM.legendAlarm) DOM.legendAlarm.textContent = `${rated}+ hrs`;

        if (DOM.scaleWarn) DOM.scaleWarn.textContent = `${warn} hrs (WARN)`;
        if (DOM.scaleAlarm) DOM.scaleAlarm.textContent = `${rated} hrs (ALARM)`;
    },

    activeHistoryFilter: 'ALL',
    activeReplFilter: 'ALL',

    setHistoryFilter(filter) {
        this.activeHistoryFilter = filter || 'ALL';
        const bar = document.getElementById('history-filter-bar');
        if (bar) {
            bar.querySelectorAll('.history-pill').forEach(btn => {
                if (btn.getAttribute('data-hist-filter') === this.activeHistoryFilter) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
    },

    /**
     * Render permanent engineering Replacement History timeline.
     * Displays newest first with full details: Date, Engineer, Previous Runtime, New Baseline, Notes, Reason, Serial.
     */
    renderReplacementHistory(machine, containerElement = null, filterLaserId = 'ALL') {
        const container = containerElement || document.getElementById('replacement-timeline-container');
        if (!container) return;

        this.activeReplFilter = filterLaserId || 'ALL';

        // 1. Setup Filter Bar
        const filterBar = document.getElementById('repl-filter-bar');
        if (filterBar && Array.isArray(machine.lasers)) {
            filterBar.innerHTML = '';
            
            const allBtn = document.createElement('button');
            allBtn.className = `history-pill ${this.activeReplFilter === 'ALL' ? 'active' : ''}`;
            allBtn.setAttribute('data-repl-filter', 'ALL');
            allBtn.textContent = 'All Laser Heads';
            filterBar.appendChild(allBtn);

            machine.lasers.forEach(l => {
                const pill = document.createElement('button');
                pill.className = `history-pill ${this.activeReplFilter === l.id ? 'active' : ''}`;
                pill.setAttribute('data-repl-filter', l.id);
                pill.textContent = l.name || 'Laser Head';
                filterBar.appendChild(pill);
            });
        }

        // 2. Aggregate all replacement records
        const allReplacements = [];

        if (Array.isArray(machine.lasers)) {
            machine.lasers.forEach(laser => {
                if (this.activeReplFilter !== 'ALL' && laser.id !== this.activeReplFilter) return;

                const replList = Array.isArray(laser.replacementHistory) ? laser.replacementHistory : (Array.isArray(laser.lifecycleHistory) ? laser.lifecycleHistory : []);

                replList.forEach(rec => {
                    allReplacements.push({
                        id: rec.id || `repl-${Date.now()}-${Math.random()}`,
                        laserId: laser.id,
                        laserName: laser.name || 'Laser Head',
                        laserSerial: laser.serialNo || machine.serialNo || 'N/A',
                        generation: rec.generation || 1,
                        nextGeneration: (rec.generation ? rec.generation + 1 : 2),
                        date: rec.replacementDate || rec.date || rec.timestamp || rec.retiredDate || 'N/A',
                        engineer: rec.engineer || 'Optics Specialist',
                        previousRuntime: rec.previousRuntime !== undefined ? rec.previousRuntime : (rec.retiredHours !== undefined ? rec.retiredHours : '—'),
                        newBaselineHours: rec.newBaselineHours !== undefined ? rec.newBaselineHours : (rec.baseLaserHour !== undefined ? rec.baseLaserHour : 0),
                        reason: rec.reason || 'Lifecycle Limit Reached',
                        notes: rec.notes || ''
                    });
                });
            });
        }

        // Sort descending (newest first)
        allReplacements.sort((a, b) => {
            const timeA = new Date(a.date || 0).getTime() || 0;
            const timeB = new Date(b.date || 0).getTime() || 0;
            return timeB - timeA;
        });

        // Update summary badge
        const summaryBadge = document.getElementById('repl-summary-badge');
        if (summaryBadge) {
            summaryBadge.textContent = `${allReplacements.length} ${allReplacements.length === 1 ? 'Replacement Logged' : 'Replacements Logged'}`;
        }

        container.innerHTML = '';

        if (allReplacements.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:36px 16px; color:var(--muted); font-size:13px;" class="glass-panel">
                    <svg class="icon" viewBox="0 0 24 24" style="width:36px;height:36px;margin-bottom:8px;stroke:var(--muted);opacity:0.6;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                    <div style="font-weight:700; color:var(--text); margin-bottom:4px;">No Laser Diode Replacements Recorded</div>
                    <div>Active laser heads are currently operating on their original Gen 1 factory baseline.</div>
                </div>
            `;
            return;
        }

        const timelineList = document.createElement('div');
        timelineList.className = 'repl-timeline';

        allReplacements.forEach(rec => {
            const formattedDate = rec.date ? formatDate(rec.date) : '—';
            const card = document.createElement('div');
            card.className = 'repl-card';
            card.innerHTML = `
                <div class="repl-node">
                    <div class="repl-node-dot"></div>
                </div>
                <div class="repl-header">
                    <div class="repl-title-group">
                        <div class="repl-title">
                            <span>${rec.laserName}</span>
                            <span class="badge badge-info" style="font-size:10px; font-weight:700;">Gen ${rec.generation} → Gen ${rec.nextGeneration}</span>
                        </div>
                        <div class="repl-meta">Serial: <strong>${rec.laserSerial}</strong> • Replaced on <strong>${formattedDate}</strong></div>
                    </div>
                    <div class="repl-badge-group">
                        <span class="badge badge-engineer" style="font-size:11px;">👤 ${rec.engineer}</span>
                    </div>
                </div>

                <div class="repl-metrics-grid">
                    <div class="repl-metric-item">
                        <span class="repl-metric-label">Previous Runtime</span>
                        <span class="repl-metric-val" style="color:var(--yellow);">${rec.previousRuntime} hrs</span>
                    </div>
                    <div class="repl-metric-item">
                        <span class="repl-metric-label">New Baseline</span>
                        <span class="repl-metric-val" style="color:var(--green);">${rec.newBaselineHours} hrs</span>
                    </div>
                    <div class="repl-metric-item" style="grid-column: 1 / -1;">
                        <span class="repl-metric-label">Engineering Reason</span>
                        <span class="repl-metric-val" style="font-size:13px; font-weight:700;">${rec.reason}</span>
                    </div>
                </div>

                ${rec.notes ? `
                <div class="repl-notes-box">
                    <strong style="color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px;">Service Notes:</strong>
                    ${rec.notes}
                </div>` : ''}
            `;
            timelineList.appendChild(card);
        });

        container.appendChild(timelineList);
    },

    renderUnifiedTimeline(machine, containerElement, filter = 'ALL', evalTime = new Date()) {
        if (!containerElement) return;
        containerElement.innerHTML = '';

        const events = [];

        // 1. Replacements History
        if (Array.isArray(machine.lasers)) {
            machine.lasers.forEach(laser => {
                if (Array.isArray(laser.lifecycleHistory)) {
                    laser.lifecycleHistory.forEach(repl => {
                        events.push({
                            id: repl.id || `repl-${Date.now()}`,
                            type: 'REPLACEMENT',
                            category: 'Laser Replacement',
                            badgeClass: 'badge-info',
                            title: `Laser Unit Replaced — ${repl.laserName || laser.name}`,
                            subtitle: `Gen ${repl.generation || 1} Retired at ${repl.retiredHours ?? '—'} hrs (SN: ${repl.serialNo || laser.serialNo})`,
                            date: repl.retiredDate || repl.installDate || repl.date || 'N/A',
                            engineer: repl.engineer || 'Optics Engineer',
                            reason: repl.reason || 'End-of-Life Reached',
                            notes: repl.notes || '',
                            raw: repl,
                            isFuture: false
                        });
                    });
                }
            });
        }

        // 2. Calibrations History
        let calibs = [];
        if (Array.isArray(machine.calibrationHistory)) {
            calibs = calibs.concat(machine.calibrationHistory.map(h => ({ ...h, laserName: h.laserName || 'Laser Head 1' })));
        }
        if (Array.isArray(machine.lasers)) {
            machine.lasers.forEach(l => {
                if (Array.isArray(l.calibrationHistory)) {
                    l.calibrationHistory.forEach(h => {
                        if (!calibs.some(c => c.date === h.date && c.actualHour === h.actualHour)) {
                            calibs.push({ ...h, laserName: l.name || 'Laser Head' });
                        }
                    });
                }
            });
        }
        calibs.forEach(cal => {
            const diff = Number(cal.difference) || 0;
            const diffStr = diff > 0 ? `+${diff} hrs` : `${diff} hrs`;
            events.push({
                id: cal.id || `cal-${Date.now()}`,
                type: 'CALIBRATION',
                category: 'Recalibration',
                badgeClass: 'badge-safe',
                title: `Physical Recalibration — ${cal.laserName}`,
                subtitle: `Actual Meter: ${cal.actualHour} hrs (Est: ${cal.estimatedHour} hrs • Deviation: ${diffStr})`,
                date: cal.date ? (cal.time ? `${cal.date} ${cal.time}` : cal.date) : 'N/A',
                engineer: cal.engineer || 'Service Specialist',
                reason: cal.reason || 'Routine Verification',
                notes: `Accuracy Rating: ${cal.rating || 'OPTIMAL'}`,
                raw: cal,
                isFuture: false
            });
        });

        // 3. Maintenance Logs
        if (Array.isArray(machine.maintenanceHistory)) {
            machine.maintenanceHistory.forEach((maint, idx) => {
                events.push({
                    id: maint.id || `maint-${idx}`,
                    type: 'MAINTENANCE',
                    category: 'Maintenance',
                    badgeClass: 'badge-engineer',
                    title: maint.action || 'Preventive Maintenance Service',
                    subtitle: `Action Logged by ${maint.engineer || 'Service Engineer'}`,
                    date: maint.date || 'N/A',
                    engineer: maint.engineer || 'Engineer',
                    reason: 'Scheduled / Reactive Service',
                    notes: maint.notes || '',
                    raw: maint,
                    isFuture: false
                });
            });
        }

        // 4. Future Projected Advisories (from LaserEngine)
        const metrics = LaserEngine.calculateMachineMetrics(machine, evalTime);
        if (metrics.eolDate && metrics.eolDate !== 'N/A' && metrics.eolDate !== '—') {
            events.push({
                id: 'future-eol',
                type: 'FUTURE',
                category: 'Forecast Advisory',
                badgeClass: 'badge-alarm',
                title: `Projected 100% EOL Limit (${metrics.ratedLife || 25000} hrs)`,
                subtitle: `Estimated end-of-life milestone for ${metrics.mostCriticalLaser ? metrics.mostCriticalLaser.name : 'Primary Diode'}`,
                date: metrics.eolDate,
                engineer: 'Automated Lifecycle Forecast Engine',
                reason: 'Life Capacity Limit',
                notes: 'Procure replacement laser diode and schedule engineering window prior to this date.',
                isFuture: true
            });
        }

        // Filter events
        const activeFilter = filter || this.activeHistoryFilter || 'ALL';
        const filteredEvents = events.filter(ev => {
            if (activeFilter === 'ALL') return true;
            return ev.type === activeFilter;
        });

        if (filteredEvents.length === 0) {
            containerElement.innerHTML = `
                <div style="text-align:center; padding:36px 16px; color:var(--muted); font-size:13px;">
                    <svg class="icon" viewBox="0 0 24 24" style="width:36px;height:36px;margin-bottom:8px;stroke:var(--muted);opacity:0.6;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                    <div>No events recorded in this category.</div>
                </div>
            `;
            return;
        }

        // Sort: Future events at the top if relevant, then newest-first by date
        filteredEvents.sort((a, b) => {
            if (a.isFuture && !b.isFuture) return -1;
            if (!a.isFuture && b.isFuture) return 1;
            const timeA = new Date(a.date || 0).getTime() || 0;
            const timeB = new Date(b.date || 0).getTime() || 0;
            return timeB - timeA;
        });

        filteredEvents.forEach((ev, idx) => {
            let dotColor = 'var(--primary)';
            let iconSvg = '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

            if (ev.type === 'REPLACEMENT') {
                dotColor = 'var(--primary)';
                iconSvg = '<svg class="icon" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';
            } else if (ev.type === 'CALIBRATION') {
                dotColor = 'var(--green)';
                iconSvg = '<svg class="icon" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>';
            } else if (ev.type === 'MAINTENANCE') {
                dotColor = 'var(--yellow)';
                iconSvg = '<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>';
            } else if (ev.type === 'FUTURE') {
                dotColor = 'var(--red)';
                iconSvg = '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
            }

            const item = document.createElement('div');
            item.className = `timeline-item ${ev.isFuture ? 'timeline-future' : ''}`;
            item.innerHTML = `
                <div class="timeline-marker">
                    <div class="timeline-dot" style="background:${dotColor}; box-shadow:0 0 8px ${dotColor};"></div>
                    ${idx !== filteredEvents.length - 1 ? '<div class="timeline-line"></div>' : ''}
                </div>
                <div class="timeline-content glass-panel" style="padding:14px 16px; margin-bottom:12px;">
                    <div class="timeline-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="badge ${ev.badgeClass}" style="font-size:10px; font-weight:700;">${ev.category}</span>
                                <strong style="font-size:14px; color:var(--text);">${ev.title}</strong>
                            </div>
                            <div style="font-size:12px; color:var(--muted); margin-top:3px;">${ev.subtitle}</div>
                        </div>
                        <div style="text-align:right;">
                            <span class="timeline-date" style="font-size:12px; font-weight:700; color:var(--text);">${ev.date}</span>
                            <div style="font-size:11px; color:var(--muted); margin-top:2px;">${ev.engineer}</div>
                        </div>
                    </div>
                    ${ev.reason ? `
                    <div style="font-size:12px; color:var(--text); margin-top:6px;">
                        <span style="color:var(--muted); font-weight:600;">Reason:</span> ${ev.reason}
                    </div>` : ''}
                    ${ev.notes ? `
                    <div class="timeline-notes" style="margin-top:6px; font-size:12px; color:var(--muted); background:rgba(255,255,255,0.03); padding:6px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.06);">
                        ${ev.notes}
                    </div>` : ''}
                </div>
            `;
            containerElement.appendChild(item);
        });
    },

    renderCalibrationHistory(machine, tbodyElement) {
        if (!tbodyElement) return;
        tbodyElement.innerHTML = '';
        
        let allHistory = [];
        if (Array.isArray(machine.calibrationHistory)) {
            allHistory = allHistory.concat(machine.calibrationHistory.map(h => ({ ...h, laserName: h.laserName || 'Laser Head 1' })));
        }

        if (Array.isArray(machine.lasers)) {
            machine.lasers.forEach(l => {
                if (Array.isArray(l.calibrationHistory)) {
                    l.calibrationHistory.forEach(h => {
                        if (!allHistory.some(existing => existing.date === h.date && existing.actualHour === h.actualHour)) {
                            allHistory.push({ ...h, laserName: l.name || 'Laser Head' });
                        }
                    });
                }
            });
        }

        if (allHistory.length === 0) {
            tbodyElement.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--muted); padding: 18px;">No calibration records yet. Use "Recalibrate" on a laser unit to record actual meter hours.</td></tr>`;
            return;
        }

        // Sort descending by date
        allHistory.sort((a, b) => {
            const timeA = new Date(a.date || 0).getTime() || 0;
            const timeB = new Date(b.date || 0).getTime() || 0;
            return timeB - timeA;
        });

        allHistory.forEach(rec => {
            const tr = document.createElement('tr');
            let dateStr = 'N/A';
            if (rec.date) {
                if (rec.time) {
                    dateStr = `${rec.date} ${rec.time}`;
                } else if (rec.date.includes('T')) {
                    const d = new Date(rec.date);
                    if (!isNaN(d.getTime())) {
                        try {
                            dateStr = `${d.toISOString().split('T')[0]} ${d.toTimeString().split(' ')[0].substring(0, 5)}`;
                        } catch (e) {
                            dateStr = rec.date;
                        }
                    } else {
                        dateStr = rec.date;
                    }
                } else {
                    dateStr = rec.date;
                }
            }
            const diffNum = Number(rec.difference) || 0;
            const diffText = diffNum > 0 ? `+${diffNum} hrs` : `${diffNum} hrs`;
            const diffColor = Math.abs(diffNum) <= 25 ? 'var(--green)' : (Math.abs(diffNum) <= 100 ? 'var(--yellow)' : 'var(--red)');
            const badgeType = Math.abs(diffNum) <= 25 ? 'badge-safe' : (Math.abs(diffNum) <= 100 ? 'badge-warning' : 'badge-danger');
            const ratingText = rec.rating || (Math.abs(diffNum) <= 25 ? 'OPTIMAL' : (Math.abs(diffNum) <= 100 ? 'MODERATE DRIFT' : 'CRITICAL DRIFT'));

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><strong style="color:var(--text)">${rec.laserName || 'Laser Head'}</strong></td>
                <td><span class="timeline-engineer" style="font-size:12px; font-weight:600;">${rec.engineer || 'Service Specialist'}</span></td>
                <td><strong>${Number(rec.estimatedHour)} hrs</strong></td>
                <td><strong>${Number(rec.actualHour)} hrs</strong></td>
                <td style="color:${diffColor}; font-weight:700;">${diffText}</td>
                <td><span class="badge ${badgeType}" style="font-size:10px; font-weight:700;">${ratingText}</span></td>
            `;
            tbodyElement.appendChild(tr);
        });
    }
};

window.MachineController = MachineController;
