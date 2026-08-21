/* =====================================================
   DASHBOARD.JS - Fleet Overview Grid & Filtering Controller
   ===================================================== */
import { LaserEngine } from './laserEngine.js';
import { ChartRenderer } from './charts.js';
import { formatDate } from './utils.js';

export const DashboardController = {
    /**
     * Update Fleet Statistics Summary Panel above grid.
     */
    updateFleetSummaryStats(machines, evalTime) {
        const totalEl = document.getElementById('stat-total-count');
        const safeEl = document.getElementById('stat-safe-count');
        const warnEl = document.getElementById('stat-warn-count');
        const alarmEl = document.getElementById('stat-alarm-count');
        const avgHealthEl = document.getElementById('stat-avg-health');
        const totalHrsEl = document.getElementById('stat-total-hours');
        const insightEl = document.getElementById('stat-ai-insight');

        let safeCount = 0, warnCount = 0, alarmCount = 0;
        let sumLifePct = 0, totalLasers = 0, criticalLasers = 0;

        machines.forEach(m => {
            const met = LaserEngine.calculateMachineMetrics(m, evalTime);
            if (met.status === 'SAFE') safeCount++;
            else if (met.status === 'WARNING') warnCount++;
            else if (met.status === 'ALARM') alarmCount++;

            if (Array.isArray(met.laserMetricsList)) {
                met.laserMetricsList.forEach(lm => {
                    sumLifePct += lm.lifeRemainingPercent || 0;
                    totalLasers++;
                    if (lm.status === 'ALARM') criticalLasers++;
                });
            }
        });

        const total = machines.length;
        const avgLifeRemaining = totalLasers > 0 ? (sumLifePct / totalLasers) : 100;

        if (totalEl) totalEl.textContent = total;
        if (safeEl) safeEl.textContent = safeCount;
        if (warnEl) warnEl.textContent = warnCount;
        if (alarmEl) alarmEl.textContent = alarmCount;
        if (avgHealthEl) avgHealthEl.textContent = `${Math.round(avgLifeRemaining)}%`;
        if (totalHrsEl) totalHrsEl.textContent = `${totalLasers} Heads (${criticalLasers} Exceeded)`;

        // Dynamic AI Insight Recommendation
        if (insightEl) {
            if (total === 0) {
                insightEl.textContent = 'No machines registered. Click "+ Add Machine" to begin fleet laser monitoring.';
            } else if (alarmCount > 0) {
                insightEl.textContent = `${alarmCount} machine(s) in ALARM / Contingency state. Immediate laser diode replacement and operational risk management required.`;
            } else if (warnCount > 0) {
                insightEl.textContent = `${warnCount} machine(s) approaching 80% life threshold. Plan procurement and schedule preventive replacement window.`;
            } else {
                insightEl.textContent = `Fleet optimal. All ${totalLasers} active laser diode heads operating within normal baseline limits.`;
            }
        }
    },

    /**
     * Render the machine fleet grid with active filters, sorting, and action handlers.
     */
    renderFleetView(container, machines, filters, evalTime, onSelectMachine, onEditMachine, onDeleteMachine, silent = false) {
        if (!container) return;

        this.updateFleetSummaryStats(machines, evalTime);

        const s = (filters.search || '').toLowerCase();

        const stat = filters.status || 'ALL';
        const dpt = filters.dept || 'ALL';
        const model = filters.model || 'ALL';
        const sortMode = filters.sort || 'no-asc';

        const filtered = machines.filter(m => {
            const metrics = LaserEngine.calculateMachineMetrics(m, evalTime);
            const matchSearch = (m.machineNo || '').toLowerCase().includes(s) ||
                                (m.machineName || '').toLowerCase().includes(s) ||
                                (m.serialNo || '').toLowerCase().includes(s) ||
                                (m.department || '').toLowerCase().includes(s) ||
                                (m.model || '').toLowerCase().includes(s);
            const matchStatus = (stat === 'ALL' || metrics.status === stat);
            const matchDept = (dpt === 'ALL' || m.department === dpt);
            const matchModel = (model === 'ALL' || m.model === model);
            return matchSearch && matchStatus && matchDept && matchModel;
        });

        // Execute user selected sortMode directly on the filtered dataset
        filtered.sort((a, b) => {
            const metricsA = LaserEngine.calculateMachineMetrics(a, evalTime);
            const metricsB = LaserEngine.calculateMachineMetrics(b, evalTime);

            const statusPriority = { 'ALARM': 3, 'WARNING': 2, 'BASELINE_REQUIRED': 1.5, 'SAFE': 1 };

            switch (sortMode) {
                case 'no-asc':
                    return (a.machineNo || '').localeCompare(b.machineNo || '', undefined, { numeric: true, sensitivity: 'base' });
                case 'no-desc':
                    return (b.machineNo || '').localeCompare(a.machineNo || '', undefined, { numeric: true, sensitivity: 'base' });
                case 'hour-desc':
                    return (metricsB.currentHour || 0) - (metricsA.currentHour || 0);
                case 'hour-asc':
                    return (metricsA.currentHour || 0) - (metricsB.currentHour || 0);
                case 'remain-asc':
                    return (metricsA.remainingTotal || 0) - (metricsB.remainingTotal || 0);
                case 'remain-desc':
                    return (metricsB.remainingTotal || 0) - (metricsA.remainingTotal || 0);
                case 'health-asc':
                    return (metricsA.lifeRemainingPercent || 0) - (metricsB.lifeRemainingPercent || 0);
                case 'health-desc':
                    return (metricsB.lifeRemainingPercent || 0) - (metricsA.lifeRemainingPercent || 0);
                case 'status-urgent': {
                    const priA = statusPriority[metricsA.status] ?? 0;
                    const priB = statusPriority[metricsB.status] ?? 0;
                    if (priA !== priB) return priB - priA;
                    return (metricsA.remainingTotal || 0) - (metricsB.remainingTotal || 0);
                }
                case 'status-safe': {
                    const priA = statusPriority[metricsA.status] ?? 0;
                    const priB = statusPriority[metricsB.status] ?? 0;
                    if (priA !== priB) return priA - priB;
                    return (metricsB.remainingTotal || 0) - (metricsA.remainingTotal || 0);
                }
                case 'recal-newest': {
                    const tA = new Date(metricsA.lastRecalibrationDate || 0).getTime() || 0;
                    const tB = new Date(metricsB.lastRecalibrationDate || 0).getTime() || 0;
                    return tB - tA;
                }
                case 'recal-oldest': {
                    const tA = new Date(metricsA.lastRecalibrationDate || 0).getTime() || 0;
                    const tB = new Date(metricsB.lastRecalibrationDate || 0).getTime() || 0;
                    return tA - tB;
                }
                default:
                    return (a.machineNo || '').localeCompare(b.machineNo || '', undefined, { numeric: true, sensitivity: 'base' });
            }
        });

        if (silent && container.querySelectorAll('.machine-card').length === filtered.length) {
            filtered.forEach((m) => {
                const metrics = LaserEngine.calculateMachineMetrics(m, evalTime);
                const card = container.querySelector(`.machine-card[data-id="${m.id}"]`);
                if (card) {
                    const crit = metrics.mostCriticalLaser;
                    const formatHrs = Math.abs(crit.remainingTotal).toLocaleString();
                    const remainText = crit.remainingTotal < 0 ? `-${formatHrs} hrs` : `${formatHrs} hrs`;

                    let replaceDaysText = '—';
                    let isOverdue = false;
                    if (crit.remainingDaysInfo && crit.remainingDaysInfo.daysVal !== null && !isNaN(crit.remainingDaysInfo.daysVal)) {
                        const daysVal = Math.abs(crit.remainingDaysInfo.daysVal);
                        if (crit.remainingTotal < 0) {
                            replaceDaysText = `${daysVal}d overdue`;
                            isOverdue = true;
                        } else {
                            replaceDaysText = `${daysVal}d left`;
                        }
                    }

                    let requiredAction = 'MONITOR';
                    let actionTone = 'action-safe';
                    if (crit.status === 'ALARM' || crit.isContingencyActive || crit.remainingTotal <= 0) {
                        requiredAction = 'REPLACE LASER HEAD';
                        actionTone = 'action-alarm';
                    } else if (crit.status === 'BASELINE_REQUIRED') {
                        requiredAction = 'CALIBRATION REQUIRED';
                        actionTone = 'action-baseline';
                    } else if (crit.status === 'WARNING') {
                        requiredAction = 'PLAN REPLACEMENT';
                        actionTone = 'action-warning';
                    }

                    const rawCurrentHr = crit.currentHour !== null && crit.currentHour !== '—' ? Number(crit.currentHour) : null;
                    const currentHrsVal = rawCurrentHr !== null && !isNaN(rawCurrentHr) ? rawCurrentHr.toLocaleString() : (crit.currentHour || '—');
                    const lifeRemainingDisplay = crit.isContingencyActive ? '0%' : crit.formattedLifeRemaining;
                    const lifeRemainingPct = crit.isContingencyActive ? 0 : crit.lifeRemainingPercent;

                    const actionPill = card.querySelector('.mc-action-pill');
                    const marginVal = card.querySelector('.mc-hero-margin-value');
                    const marginSub = card.querySelector('.mc-margin-subtext');
                    const currentVal = card.querySelector('.mc-runtime-value');
                    const healthFill = card.querySelector('.mc-progress-fill');
                    const healthText = card.querySelector('.mc-progress-label');

                    if (actionPill) {
                        actionPill.textContent = requiredAction;
                        actionPill.className = `mc-action-pill ${actionTone}`;
                    }
                    if (marginVal) {
                        marginVal.textContent = remainText;
                        marginVal.className = `mc-hero-margin-value ${crit.status === 'ALARM' ? 'color-alarm' : (crit.status === 'WARNING' ? 'color-warning' : 'color-safe')}`;
                    }
                    if (marginSub) {
                        marginSub.textContent = replaceDaysText;
                        marginSub.className = `mc-margin-subtext ${isOverdue ? 'color-alarm' : (crit.status === 'WARNING' ? 'color-warning' : '')}`;
                    }
                    if (currentVal) currentVal.textContent = `${currentHrsVal} HRS`;
                    if (healthFill) {
                        healthFill.style.width = `${lifeRemainingPct}%`;
                        let dotColor = 'var(--color-safe)';
                        if (metrics.status === 'WARNING') dotColor = 'var(--color-warning)';
                        if (metrics.status === 'ALARM') dotColor = 'var(--color-alarm)';
                        if (metrics.status === 'BASELINE_REQUIRED') dotColor = 'var(--color-primary)';
                        healthFill.style.background = dotColor;
                    }
                    if (healthText) healthText.textContent = lifeRemainingDisplay;
                }
            });
            return;
        }

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = `<div class="fleet-empty-state">No semiconductor laser machines match current filter criteria.</div>`;
            return;
        }

        // Helper to construct a machine card matching exact 6-level triage hierarchy
        const buildCard = (machine, isIncident = false) => {
            const metrics = LaserEngine.calculateMachineMetrics(machine, evalTime);
            let badgeClass = '', dotColor = '', statusLabel = '';

            if (metrics.status === 'SAFE') {
                badgeClass = 'color-safe'; dotColor = 'var(--color-safe)'; statusLabel = 'HEALTHY';
            } else if (metrics.status === 'WARNING') {
                badgeClass = 'color-warning'; dotColor = 'var(--color-warning)'; statusLabel = 'WARNING';
            } else if (metrics.status === 'BASELINE_REQUIRED') {
                badgeClass = 'color-baseline'; dotColor = 'var(--color-primary)'; statusLabel = 'BASELINE';
            } else {
                badgeClass = 'color-alarm'; dotColor = 'var(--color-alarm)'; statusLabel = 'ALARM';
            }

            const crit = metrics.mostCriticalLaser;
            const formatHrs = Math.abs(crit.remainingTotal).toLocaleString();
            const remainText = crit.remainingTotal < 0 ? `-${formatHrs} hrs` : `${formatHrs} hrs`;

            let replaceDaysText = '—';
            let isOverdue = false;
            if (crit.remainingDaysInfo && crit.remainingDaysInfo.daysVal !== null && !isNaN(crit.remainingDaysInfo.daysVal)) {
                const daysVal = Math.abs(crit.remainingDaysInfo.daysVal);
                if (crit.remainingTotal < 0) {
                    replaceDaysText = `${daysVal}d overdue`;
                    isOverdue = true;
                } else {
                    replaceDaysText = `${daysVal}d remaining`;
                }
            }

            // 2. REQUIRED ACTION DETERMINATION
            let requiredAction = 'MONITOR';
            let actionTone = 'action-safe';
            if (crit.status === 'ALARM' || crit.isContingencyActive || crit.remainingTotal <= 0) {
                requiredAction = 'REPLACE LASER HEAD';
                actionTone = 'action-alarm';
            } else if (crit.status === 'BASELINE_REQUIRED') {
                requiredAction = 'CALIBRATION REQUIRED';
                actionTone = 'action-baseline';
            } else if (crit.status === 'WARNING') {
                requiredAction = 'PLAN REPLACEMENT';
                actionTone = 'action-warning';
            }

            const rawCurrentHr = crit.currentHour !== null && crit.currentHour !== '—' ? Number(crit.currentHour) : null;
            const currentHrsVal = rawCurrentHr !== null && !isNaN(rawCurrentHr) ? rawCurrentHr.toLocaleString() : (crit.currentHour || '—');
            const lifeRemainingDisplay = crit.isContingencyActive ? '0%' : crit.formattedLifeRemaining;
            const lifeRemainingPct = crit.isContingencyActive ? 0 : crit.lifeRemainingPercent;

            const card = document.createElement('div');
            card.className = `machine-card ${isIncident ? 'incident-card' : 'monitored-card'}`;
            card.setAttribute('data-id', machine.id);
            card.onclick = (e) => {
                if (typeof onSelectMachine === 'function') {
                    onSelectMachine(machine.id, e.currentTarget);
                }
            };

            card.innerHTML = `
                <!-- 1. MACHINE IDENTITY & STATUS -->
                <div class="mc-identity-header">
                    <div class="mc-id-wrap">
                        <span class="mc-machine-no">${machine.machineNo}</span>
                        <span class="mc-machine-meta">${machine.model || 'BMD302W'} • ${machine.department || 'Production'}</span>
                    </div>
                    <div class="mc-status-pill ${badgeClass}">
                        <span class="mc-status-dot" style="background:${dotColor};"></span>
                        <span>${statusLabel}</span>
                    </div>
                </div>

                <!-- 2. REQUIRED ACTION -->
                <div class="mc-action-row">
                    <span class="mc-action-label">REQUIRED ACTION</span>
                    <span class="mc-action-pill ${actionTone}">${requiredAction}</span>
                </div>

                <!-- 3. REMAINING MARGIN (Primary Numerical Hero Metric) -->
                <div class="mc-margin-hero-box">
                    <div class="mc-margin-header">
                        <span class="mc-margin-title">REMAINING MARGIN</span>
                        <span class="mc-margin-subtext ${isOverdue ? 'color-alarm font-bold' : (crit.status === 'WARNING' ? 'color-warning' : '')}">${replaceDaysText}</span>
                    </div>
                    <div class="mc-margin-display">
                        <span class="mc-hero-margin-value ${crit.status === 'ALARM' ? 'color-alarm' : (crit.status === 'WARNING' ? 'color-warning' : 'color-safe')}">${remainText}</span>
                    </div>
                </div>

                <!-- 4. SUPPORTING RUNTIME -->
                <div class="mc-supporting-runtime">
                    <span class="mc-runtime-label">OPERATING RUNTIME (${crit.laserName || 'Critical Diode'})</span>
                    <span class="mc-runtime-value">${currentHrsVal} HRS</span>
                </div>

                <!-- 5. PROGRESS INDICATOR (Life Capacity %) -->
                <div class="mc-progress-box">
                    <div class="mc-progress-header">
                        <span class="mc-progress-title">LIFE CAPACITY</span>
                        <span class="mc-progress-label">${lifeRemainingDisplay}</span>
                    </div>
                    <div class="mc-progress-track">
                        <div class="mc-progress-fill" style="width: ${lifeRemainingPct}%; background: ${dotColor};"></div>
                    </div>
                </div>

                <!-- 6. QUICK ACTIONS -->
                <div class="mc-card-footer">
                    <div class="mc-inspect-link">
                        <span>Inspect Telemetry</span>
                        <svg class="icon mc-arrow-icon" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </div>
                    <div class="mc-quick-actions">
                        <button class="btn-mc-action btn-mc-edit" type="button" title="Edit Machine Settings">
                            <svg class="icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-mc-action btn-mc-delete" type="button" title="Delete Machine">
                            <svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            `;

            const btnEdit = card.querySelector('.btn-mc-edit');
            const btnDelete = card.querySelector('.btn-mc-delete');

            if (btnEdit) {
                btnEdit.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof onEditMachine === 'function') {
                        onEditMachine(machine.id);
                    }
                };
            }

            if (btnDelete) {
                btnDelete.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof onDeleteMachine === 'function') {
                        onDeleteMachine(machine.id);
                    }
                };
            }

            return card;
        };

        // Render machine cards directly in strict user-selected sort order
        const gridSection = document.createElement('div');
        gridSection.className = 'fleet-unified-grid';
        gridSection.innerHTML = `
            <div class="mission-section-header fleet-header">
                <div class="mission-section-title-wrap">
                    <span class="mission-section-title">FLEET UNITS</span>
                    <span class="mission-section-badge badge-normal">${filtered.length} ${filtered.length === 1 ? 'UNIT' : 'UNITS'}</span>
                    <span class="mission-section-desc">— Monitored semiconductor laser fleet sorted by selected criteria.</span>
                </div>
            </div>
            <div class="fleet-cards-grid"></div>
        `;
        const cardsGrid = gridSection.querySelector('.fleet-cards-grid');
        filtered.forEach(m => {
            const isAlarm = LaserEngine.calculateMachineMetrics(m, evalTime).status === 'ALARM';
            cardsGrid.appendChild(buildCard(m, isAlarm));
        });
        container.appendChild(gridSection);
    }
};

window.DashboardController = DashboardController;
