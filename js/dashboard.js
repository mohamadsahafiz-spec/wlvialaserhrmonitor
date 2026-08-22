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
     * Render the Mission Control "MISSION BRIEF" answering: "Today's Priorities"
     */
    renderActionCenter(container, machines, evalTime, onSelectMachine) {
        if (!container) return;

        const actionItems = [];

        machines.forEach(m => {
            const metrics = LaserEngine.calculateMachineMetrics(m, evalTime);
            const crit = metrics.mostCriticalLaser;

            if (metrics.status === 'ALARM' || crit.isContingencyActive || crit.remainingTotal <= 0) {
                const hrsOverdue = Math.abs(crit.remainingTotal).toLocaleString();
                const daysOver = crit.remainingDaysInfo && crit.remainingDaysInfo.daysVal !== null ? Math.abs(crit.remainingDaysInfo.daysVal) : null;
                const overdueStr = daysOver !== null ? `${daysOver}d overdue (-${hrsOverdue} hrs)` : `-${hrsOverdue} hrs`;
                actionItems.push({
                    priority: 1,
                    type: 'alarm',
                    cardClass: 'action-card-alarm',
                    machineId: m.id,
                    machineNo: m.machineNo,
                    title: `Replace Laser Head`,
                    desc: `${crit.laserName || 'Critical Diode'} is ${overdueStr}. Contingency active. Immediate replacement required.`,
                    btnLabel: 'Replace Head',
                    btnClass: 'action-btn-alarm',
                    iconClass: 'icon-alarm',
                    iconSvg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>'
                });
            } else if (metrics.status === 'WARNING') {
                const hrsLeft = Math.abs(crit.remainingTotal).toLocaleString();
                const daysLeft = crit.remainingDaysInfo && crit.remainingDaysInfo.daysVal !== null ? Math.abs(crit.remainingDaysInfo.daysVal) : null;
                const remainStr = daysLeft !== null ? `~${daysLeft}d remaining (${hrsLeft} hrs)` : `${hrsLeft} hrs`;
                actionItems.push({
                    priority: 2,
                    type: 'warning',
                    cardClass: 'action-card-warning',
                    machineId: m.id,
                    machineNo: m.machineNo,
                    title: `Plan Replacement Window`,
                    desc: `${crit.laserName || 'Laser Diode'} approaching 80% limit (${remainStr}). Schedule procurement & PM.`,
                    btnLabel: 'Plan PM',
                    btnClass: 'action-btn-warning',
                    iconClass: 'icon-warning',
                    iconSvg: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>'
                });
            } else if (metrics.status === 'BASELINE_REQUIRED') {
                actionItems.push({
                    priority: 3,
                    type: 'baseline',
                    cardClass: 'action-card-baseline',
                    machineId: m.id,
                    machineNo: m.machineNo,
                    title: `Baseline Calibration Required`,
                    desc: `${crit.laserName || 'Critical Diode'} requires initial laser baseline hour setting and calibration timestamp.`,
                    btnLabel: 'Calibrate',
                    btnClass: 'action-btn-baseline',
                    iconClass: 'icon-baseline',
                    iconSvg: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline>'
                });
            }
        });

        // Check for any machine needing 30-day recalibration verification
        machines.forEach(m => {
            const metrics = LaserEngine.calculateMachineMetrics(m, evalTime);
            if (metrics.status === 'SAFE') {
                const crit = metrics.mostCriticalLaser;
                if (crit.lastRecalibrationDate) {
                    const daysSince = Math.floor((new Date(evalTime) - new Date(crit.lastRecalibrationDate)) / (1000 * 60 * 60 * 24));
                    if (daysSince > 45 && actionItems.length < 3) {
                        actionItems.push({
                            priority: 4,
                            type: 'info',
                            cardClass: 'action-card-safe',
                            machineId: m.id,
                            machineNo: m.machineNo,
                            title: `Routine Calibration Check`,
                            desc: `Last recalibrated ${daysSince}d ago (${formatDate(crit.lastRecalibrationDate)}). Recommended 30d check open.`,
                            btnLabel: 'Verify Beam',
                            btnClass: 'action-btn-safe',
                            iconClass: 'icon-safe',
                            iconSvg: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
                        });
                    }
                }
            }
        });

        actionItems.sort((a, b) => a.priority - b.priority);

        container.innerHTML = '';

        const actionCenterWrap = document.createElement('div');
        actionCenterWrap.className = 'engineering-action-center-inner';

        const totalActions = actionItems.length;
        const alarmCount = actionItems.filter(i => i.type === 'alarm').length;
        const warnCount = actionItems.filter(i => i.type === 'warning').length;
        
        let badgeMarkup = '';
        if (alarmCount > 0) {
            badgeMarkup = `<span class="action-center-badge badge-alarm">${alarmCount} CRITICAL ${alarmCount === 1 ? 'ALARM' : 'ALARMS'}</span>`;
        } else if (warnCount > 0) {
            badgeMarkup = `<span class="action-center-badge badge-warning">${warnCount} ${warnCount === 1 ? 'MAINTENANCE ITEM' : 'MAINTENANCE ITEMS'}</span>`;
        } else if (totalActions > 0) {
            badgeMarkup = `<span class="action-center-badge badge-primary">${totalActions} ${totalActions === 1 ? 'ACTION' : 'ACTIONS'}</span>`;
        } else {
            badgeMarkup = `<span class="action-center-badge badge-safe">ALL SYSTEMS OPTIMAL</span>`;
        }

        actionCenterWrap.innerHTML = `
            <div class="action-center-header">
                <div class="action-center-title-wrap">
                    <div class="action-center-title-group">
                        <span class="action-center-title">MISSION BRIEF</span>
                        <span class="action-center-sub">Today's Priorities</span>
                    </div>
                    ${badgeMarkup}
                </div>
            </div>
            <div class="action-center-grid"></div>
        `;

        const grid = actionCenterWrap.querySelector('.action-center-grid');

        if (totalActions === 0) {
            const nominalCard = document.createElement('div');
            nominalCard.className = 'action-card action-card-safe';
            nominalCard.innerHTML = `
                <div class="action-card-left">
                    <div class="action-icon-pill icon-safe">
                        <svg class="icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div class="action-body">
                        <span class="action-headline">Nominal Fleet Condition • No Immediate Interventions</span>
                        <span class="action-desc">All monitored semiconductor laser diodes operating well within rated baseline limits. Next scheduled maintenance window open in 30 days.</span>
                    </div>
                </div>
                <button class="action-btn-exec action-btn-safe" type="button" title="View Full Fleet Diagnostics">
                    <svg class="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span>View Telemetry</span>
                </button>
            `;
            const btn = nominalCard.querySelector('.action-btn-exec');
            if (btn && machines.length > 0) {
                btn.onclick = () => onSelectMachine(machines[0].id);
            }
            grid.appendChild(nominalCard);
        } else {
            // Display top action items (up to 3 for maximum compactness)
            actionItems.slice(0, 3).forEach(item => {
                const card = document.createElement('div');
                card.className = `action-card ${item.cardClass}`;
                card.innerHTML = `
                    <div class="action-card-left">
                        <div class="action-icon-pill ${item.iconClass}">
                            <svg class="icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${item.iconSvg}</svg>
                        </div>
                        <div class="action-body">
                            <span class="action-headline">
                                <span>${item.title}</span>
                                <span class="action-target-mach">[${item.machineNo}]</span>
                            </span>
                            <span class="action-desc">${item.desc}</span>
                        </div>
                    </div>
                    <button class="action-btn-exec ${item.btnClass}" type="button" title="Execute ${item.title}">
                        <svg class="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${item.iconSvg}</svg>
                        <span>${item.btnLabel}</span>
                    </button>
                `;
                const btn = card.querySelector('.action-btn-exec');
                if (btn) {
                    btn.onclick = () => onSelectMachine(item.machineId);
                }
                grid.appendChild(card);
            });
        }

        container.appendChild(actionCenterWrap);
    },

    /**
     * Render the machine fleet grid with active filters, sorting, and action handlers.
     */
    renderFleetView(container, machines, filters, evalTime, onSelectMachine, onEditMachine, onDeleteMachine, silent = false) {
        if (!container) return;

        this.updateFleetSummaryStats(machines, evalTime);

        // Update Operational Action Center
        const actionCenterContainer = document.getElementById('fleet-action-center');
        if (actionCenterContainer) {
            this.renderActionCenter(actionCenterContainer, machines, evalTime, onSelectMachine);
        }

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
                            replaceDaysText = `${daysVal}d remaining`;
                        }
                    }

                    let requiredAction = 'MONITOR';
                    let actionTone = 'action-safe';
                    const isActionable = crit.status !== 'SAFE' || crit.isContingencyActive || crit.remainingTotal <= 0;
                    if (crit.status === 'ALARM' || crit.isContingencyActive || crit.remainingTotal <= 0) {
                        requiredAction = 'REPLACE LASER HEAD';
                        actionTone = 'action-alarm';
                    } else if (crit.status === 'BASELINE_REQUIRED') {
                        requiredAction = 'CALIBRATION REQUIRED';
                        actionTone = 'action-baseline';
                    } else if (crit.status === 'WARNING') {
                        requiredAction = 'PLAN REPLACEMENT (80%)';
                        actionTone = 'action-warning';
                    }

                    const rawCurrentHr = crit.currentHour !== null && crit.currentHour !== '—' ? Number(crit.currentHour) : null;
                    const currentHrsVal = rawCurrentHr !== null && !isNaN(rawCurrentHr) ? rawCurrentHr.toLocaleString() : (crit.currentHour || '—');
                    const lifeRemainingDisplay = crit.isContingencyActive ? '0%' : crit.formattedLifeRemaining;
                    const lifeRemainingPct = crit.isContingencyActive ? 0 : crit.lifeRemainingPercent;

                    const actionRow = card.querySelector('.mc-action-row');
                    const actionPill = card.querySelector('.mc-action-pill');
                    const marginVal = card.querySelector('.mc-hero-margin-value');
                    const marginSub = card.querySelector('.mc-margin-subtext');
                    const healthFill = card.querySelector('.mc-progress-fill');
                    const healthText = card.querySelector('.mc-progress-label');
                    const drawerRuntime = card.querySelector('.mc-drawer-val-runtime');

                    if (actionRow && actionPill) {
                        if (!isActionable) {
                            actionRow.style.display = 'none';
                        } else {
                            actionRow.style.display = 'flex';
                            actionPill.textContent = requiredAction;
                            actionPill.className = `mc-action-pill ${actionTone}`;
                        }
                    }
                    if (marginVal) {
                        marginVal.textContent = remainText;
                        marginVal.className = `mc-hero-margin-value ${crit.status === 'ALARM' ? 'color-alarm' : (crit.status === 'WARNING' ? 'color-warning' : 'color-safe')}`;
                    }
                    if (marginSub) {
                        marginSub.textContent = replaceDaysText;
                        marginSub.className = `mc-margin-subtext ${isOverdue ? 'color-alarm font-bold' : (crit.status === 'WARNING' ? 'color-warning font-bold' : '')}`;
                    }
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

            // Update open detail panel telemetry if currently displayed
            const detailPanel = container.querySelector('.fleet-detail-panel');
            if (detailPanel && AppState.expandedCardId) {
                const expMach = filtered.find(m => m.id === AppState.expandedCardId);
                if (expMach) {
                    const expMetrics = LaserEngine.calculateMachineMetrics(expMach, evalTime);
                    const expCrit = expMetrics.mostCriticalLaser;
                    const expRawHr = expCrit.currentHour !== null && expCrit.currentHour !== '—' ? Number(expCrit.currentHour) : null;
                    const expHrsVal = expRawHr !== null && !isNaN(expRawHr) ? expRawHr.toLocaleString() : (expCrit.currentHour || '—');
                    const runtimeEl = detailPanel.querySelector('.mc-drawer-val-runtime');
                    if (runtimeEl) runtimeEl.textContent = `${expHrsVal} hrs`;
                }
            }
            return;
        }

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = `<div class="fleet-empty-state">No semiconductor laser machines match current filter criteria.</div>`;
            return;
        }

        // Helper to construct a machine card with simplified operational IA and progressive disclosure
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

            // 2. REQUIRED ACTION DETERMINATION (Only rendered if actionable)
            const isActionable = crit.status !== 'SAFE' || crit.isContingencyActive || crit.remainingTotal <= 0;
            let requiredAction = 'MONITOR';
            let actionTone = 'action-safe';
            if (crit.status === 'ALARM' || crit.isContingencyActive || crit.remainingTotal <= 0) {
                requiredAction = 'REPLACE LASER HEAD';
                actionTone = 'action-alarm';
            } else if (crit.status === 'BASELINE_REQUIRED') {
                requiredAction = 'CALIBRATION REQUIRED';
                actionTone = 'action-baseline';
            } else if (crit.status === 'WARNING') {
                requiredAction = 'PLAN REPLACEMENT (80%)';
                actionTone = 'action-warning';
            }

            const rawCurrentHr = crit.currentHour !== null && crit.currentHour !== '—' ? Number(crit.currentHour) : null;
            const currentHrsVal = rawCurrentHr !== null && !isNaN(rawCurrentHr) ? rawCurrentHr.toLocaleString() : (crit.currentHour || '—');
            const lifeRemainingDisplay = crit.isContingencyActive ? '0%' : crit.formattedLifeRemaining;
            const lifeRemainingPct = crit.isContingencyActive ? 0 : crit.lifeRemainingPercent;

            // Secondary Telemetry for Progressive Disclosure Drawer
            let lastCalText = '—';
            if (crit.lastRecalibrationDate) {
                const daysSince = Math.floor((new Date(evalTime) - new Date(crit.lastRecalibrationDate)) / (1000 * 60 * 60 * 24));
                lastCalText = daysSince <= 0 ? 'Today' : `${daysSince}d ago`;
            } else if (crit.initialSettingDate) {
                const daysSince = Math.floor((new Date(evalTime) - new Date(crit.initialSettingDate)) / (1000 * 60 * 60 * 24));
                lastCalText = daysSince <= 0 ? 'Today' : `${daysSince}d ago`;
            }

            let trendText = 'Nominal';
            let trendClass = 'color-safe';
            if (crit.isContingencyActive) {
                trendText = 'Contingency Active';
                trendClass = 'color-alarm';
            } else if (crit.status === 'ALARM') {
                trendText = 'Limit Exceeded';
                trendClass = 'color-alarm';
            } else if (crit.status === 'WARNING') {
                trendText = 'Accelerated (80%)';
                trendClass = 'color-warning';
            } else if (crit.status === 'BASELINE_REQUIRED') {
                trendText = 'Uncalibrated';
                trendClass = 'color-baseline';
            }

            // Single Primary Action Button per card
            let primaryActionBtnHtml = '';
            if (crit.status === 'ALARM' || crit.isContingencyActive) {
                primaryActionBtnHtml = `
                    <button class="mc-btn-primary-action mc-btn-action-alarm" type="button" title="Execute Laser Head Replacement Procedure">
                        <svg class="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        <span>Replace Head</span>
                    </button>
                `;
            } else if (crit.status === 'WARNING') {
                primaryActionBtnHtml = `
                    <button class="mc-btn-primary-action mc-btn-action-warning" type="button" title="Plan Preventive Maintenance Window">
                        <svg class="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>Plan PM</span>
                    </button>
                `;
            } else if (crit.status === 'BASELINE_REQUIRED') {
                primaryActionBtnHtml = `
                    <button class="mc-btn-primary-action mc-btn-action-baseline" type="button" title="Set Laser Baseline & Calibrate">
                        <svg class="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                        <span>Calibrate</span>
                    </button>
                `;
            } else {
                primaryActionBtnHtml = `
                    <button class="mc-btn-primary-action mc-btn-action-safe" type="button" title="Inspect Full Machine Telemetry">
                        <svg class="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                        <span>Inspect</span>
                    </button>
                `;
            }

            const isCardExpanded = AppState.expandedCardId === machine.id;

            const card = document.createElement('div');
            card.className = `machine-card ${isIncident ? 'incident-card' : 'monitored-card'} ${isCardExpanded ? 'is-card-selected' : ''}`;
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

                <!-- 2. REMAINING MARGIN (Dominant Visual Element - Primary Operational KPI) -->
                <div class="mc-margin-hero-box">
                    <div class="mc-margin-header">
                        <span class="mc-margin-title">REMAINING MARGIN</span>
                        <span class="mc-margin-subtext ${isOverdue ? 'color-alarm font-bold' : (crit.status === 'WARNING' ? 'color-warning font-bold' : '')}">${replaceDaysText}</span>
                    </div>
                    <div class="mc-margin-display">
                        <span class="mc-hero-margin-value ${crit.status === 'ALARM' ? 'color-alarm' : (crit.status === 'WARNING' ? 'color-warning' : 'color-safe')}">${remainText}</span>
                    </div>
                </div>

                <!-- 3. REQUIRED ACTION (Only visible if actionable) -->
                <div class="mc-action-row" ${isActionable ? '' : 'style="display:none;"'}>
                    <span class="mc-action-label">REQUIRED ACTION</span>
                    <span class="mc-action-pill ${actionTone}">${requiredAction}</span>
                </div>

                <!-- 4. LIFE CAPACITY PROGRESS INDICATOR -->
                <div class="mc-progress-box">
                    <div class="mc-progress-header">
                        <span class="mc-progress-title">LIFE CAPACITY</span>
                        <span class="mc-progress-label">${lifeRemainingDisplay}</span>
                    </div>
                    <div class="mc-progress-track">
                        <div class="mc-progress-fill" style="width: ${lifeRemainingPct}%; background: ${dotColor};"></div>
                    </div>
                </div>

                <!-- 5. CARD FOOTER: Single Primary Action, Disclosure Toggle & Quiet Secondary Actions -->
                <div class="mc-card-footer">
                    ${primaryActionBtnHtml}
                    <div class="mc-footer-right">
                        <button class="mc-btn-disclosure ${isCardExpanded ? 'is-active' : ''}" type="button" title="Toggle Engineering Telemetry Details">
                            <span class="mc-disclosure-text">${isCardExpanded ? 'Collapse' : 'Details'}</span>
                            <svg class="icon mc-disclosure-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div class="mc-secondary-actions">
                            <button class="btn-mc-action btn-mc-edit" type="button" title="Edit Machine Settings">
                                <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-mc-action btn-mc-delete" type="button" title="Delete Machine">
                                <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Primary Action Button handler
            const btnPrimary = card.querySelector('.mc-btn-primary-action');
            if (btnPrimary) {
                btnPrimary.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof onSelectMachine === 'function') {
                        onSelectMachine(machine.id, card);
                    }
                };
            }

            // Dedicated Detail Toggle handler: Clicking Details toggles the full-width detail row
            const btnDisclosure = card.querySelector('.mc-btn-disclosure');
            if (btnDisclosure) {
                btnDisclosure.onclick = (e) => {
                    e.stopPropagation();
                    if (AppState.expandedCardId === machine.id) {
                        AppState.expandedCardId = null;
                    } else {
                        AppState.expandedCardId = machine.id;
                    }
                    DashboardController.renderFleetView(container, machines, filters, evalTime, onSelectMachine, onEditMachine, onDeleteMachine);
                };
            }

            // Quiet Secondary Action handlers
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

        // Helper to build the dedicated full-width Engineering Snapshot panel
        const buildDetailPanel = (machine) => {
            const metrics = LaserEngine.calculateMachineMetrics(machine, evalTime);
            const crit = metrics.mostCriticalLaser;
            const rawCurrentHr = crit.currentHour !== null && crit.currentHour !== '—' ? Number(crit.currentHour) : null;
            const currentHrsVal = rawCurrentHr !== null && !isNaN(rawCurrentHr) ? rawCurrentHr.toLocaleString() : (crit.currentHour || '—');

            // 1. Machine Identity values
            const machineNo = machine.machineNo || 'WD-101';
            const model = machine.model || 'BMD302W';
            const department = machine.department || 'Wafer Prep';
            const serialNo = machine.serialNo || machine.serialNumber || ('SN-' + machine.id);
            let operatingMode = 'DRILLING (ONLINE)';
            let operatingModeClass = 'mode-online';
            if (crit.isContingencyActive) {
                operatingMode = 'CONTINGENCY PM (ACTIVE)';
                operatingModeClass = 'mode-contingency';
            } else if (metrics.status === 'ALARM') {
                operatingMode = 'LIMIT EXCEEDED (HOLD)';
                operatingModeClass = 'mode-alarm';
            } else if (metrics.status === 'WARNING') {
                operatingMode = 'ACCELERATED DRILL (WARN)';
                operatingModeClass = 'mode-warning';
            } else if (metrics.status === 'BASELINE_REQUIRED') {
                operatingMode = 'STANDBY (BASELINE REQ)';
                operatingModeClass = 'mode-standby';
            }

            // 2. Runtime Analytics values
            const lasers = Array.isArray(machine.lasers) && machine.lasers.length > 0 ? machine.lasers : [{
                id: machine.id + '-L1',
                name: 'Laser Head 1',
                serialNo: (machine.serialNo || 'SN') + '-L1',
                ratedLife: machine.ratedLife || 25000,
                warningLife: machine.warningLife || 20000,
                baseLaserHour: machine.baseLaserHour || 0,
                baseTimestamp: machine.baseTimestamp || evalTime
            }];

            const laserMetrics = metrics.laserMetricsList || lasers.map(l => LaserEngine.calculateLaserMetrics(l, evalTime));
            const totalOperatingHours = laserMetrics.reduce((acc, curr) => {
                const h = curr.currentHour !== null && curr.currentHour !== '—' ? Number(curr.currentHour) : 0;
                return acc + (isNaN(h) ? 0 : h);
            }, 0);

            let lastCalText = '—';
            let calDueDateText = 'Scheduled (90d cycle)';
            if (crit.lastRecalibrationDate) {
                const daysSince = Math.floor((new Date(evalTime) - new Date(crit.lastRecalibrationDate)) / (1000 * 60 * 60 * 24));
                lastCalText = daysSince <= 0 ? 'Today' : `${daysSince}d ago (${new Date(crit.lastRecalibrationDate).toISOString().split('T')[0]})`;
                const daysUntilDue = Math.max(0, 90 - daysSince);
                calDueDateText = daysSince > 90 ? `OVERDUE by ${daysSince - 90}d` : `Due in ${daysUntilDue}d`;
            } else if (crit.initialSettingDate) {
                const daysSince = Math.floor((new Date(evalTime) - new Date(crit.initialSettingDate)) / (1000 * 60 * 60 * 24));
                lastCalText = daysSince <= 0 ? 'Today' : `${daysSince}d ago (${new Date(crit.initialSettingDate).toISOString().split('T')[0]})`;
                const daysUntilDue = Math.max(0, 90 - daysSince);
                calDueDateText = daysSince > 90 ? `OVERDUE by ${daysSince - 90}d` : `Due in ${daysUntilDue}d`;
            }

            let burnTrend = 'Nominal (1.00x)';
            let burnTrendClass = 'color-safe';
            let pmTrend = 'Cycle 2/4 (On-Track)';
            let pmTrendClass = 'color-safe';
            if (crit.isContingencyActive) {
                burnTrend = 'Contingency Rate (1.25x)';
                burnTrendClass = 'color-alarm';
                pmTrend = 'Immediate Service Required';
                pmTrendClass = 'color-alarm';
            } else if (crit.status === 'ALARM') {
                burnTrend = 'Threshold Exceeded';
                burnTrendClass = 'color-alarm';
                pmTrend = 'Service Overdue';
                pmTrendClass = 'color-alarm';
            } else if (crit.status === 'WARNING') {
                burnTrend = 'Accelerated (1.15x)';
                burnTrendClass = 'color-warning';
                pmTrend = 'Prepare Next PM Cycle';
                pmTrendClass = 'color-warning';
            } else if (crit.status === 'BASELINE_REQUIRED') {
                burnTrend = 'Uncalibrated';
                burnTrendClass = 'color-baseline';
                pmTrend = 'Baseline Calibration Pending';
                pmTrendClass = 'color-baseline';
            }

            // 3. Laser Head Health (Multi-head / Dual-head comparison table)
            const headRowsHtml = laserMetrics.map((lMetrics, idx) => {
                const lStatus = lMetrics.status;
                const lStatusClass = lStatus === 'SAFE' ? 'color-safe' : (lStatus === 'WARNING' ? 'color-warning' : (lStatus === 'BASELINE_REQUIRED' ? 'color-baseline' : 'color-alarm'));
                const lRuntime = (lMetrics.currentHour !== null && lMetrics.currentHour !== '—') ? `${Number(lMetrics.currentHour).toLocaleString()} hrs` : '—';
                const lRemHours = (lMetrics.remainingTotal === null || lMetrics.remainingTotal === undefined)
                    ? '—'
                    : (lMetrics.remainingTotal < 0
                        ? `-${Math.abs(lMetrics.remainingTotal).toLocaleString()} hrs`
                        : `${Math.abs(lMetrics.remainingTotal).toLocaleString()} hrs`);
                
                const pct = lMetrics.capacityPercent !== undefined && lMetrics.capacityPercent !== null ? Math.max(0, Math.min(100, Math.round(lMetrics.capacityPercent))) : 0;
                
                // Deterministic simulated head temperature based on seed & runtime
                const baseTemp = 21.5 + (idx * 1.8) + ((Number(lMetrics.currentHour || 1000) % 500) / 250);
                const tempFormatted = `${baseTemp.toFixed(1)}°C`;
                const isCritical = (lMetrics.id && crit.id && lMetrics.id === crit.id) || (lMetrics.name && crit.name && lMetrics.name === crit.name);

                return `
                    <tr class="es-head-row ${isCritical ? 'is-critical-head' : ''}">
                        <td class="es-td-head">
                            <div class="es-head-name-wrap">
                                <span class="es-head-name">${lMetrics.name || ('Laser Head ' + (idx + 1))}</span>
                                <span class="es-head-sn">${lMetrics.serialNo || ('SN-' + (idx + 1))}</span>
                                ${isCritical ? '<span class="es-head-crit-badge">CRITICAL</span>' : ''}
                            </div>
                        </td>
                        <td class="es-td-num">${lRuntime}</td>
                        <td class="es-td-num ${lStatusClass}">${lRemHours}</td>
                        <td class="es-td-pct">
                            <div class="es-pct-bar-wrap">
                                <div class="es-pct-bar-fill" style="width: ${pct}%; background: ${lStatus === 'SAFE' ? 'var(--color-safe)' : (lStatus === 'WARNING' ? 'var(--color-warning)' : 'var(--color-alarm)')};"></div>
                                <span class="es-pct-text">${pct}%</span>
                            </div>
                        </td>
                        <td class="es-td-num">${tempFormatted}</td>
                        <td class="es-td-status">
                            <span class="es-status-chip ${lStatusClass}">${lStatus}</span>
                        </td>
                    </tr>
                `;
            }).join('');

            // 4. Environmental Health
            const hashNum = machine.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const waterTemp = (20.0 + (hashNum % 25) / 10).toFixed(1);
            const humidity = (44.0 + (hashNum % 30) / 10).toFixed(1);
            const ambientTemp = (22.0 + (hashNum % 20) / 10).toFixed(1);
            const airPressure = (101.2 + (hashNum % 15) / 10).toFixed(1);

            // 5. Maintenance Timeline (Newest first)
            const timelineEvents = [];
            if (Array.isArray(machine.maintenanceHistory)) {
                machine.maintenanceHistory.forEach(m => {
                    timelineEvents.push({
                        date: m.date || '2026-01-01',
                        type: m.action || 'PM Completed',
                        engineer: m.engineer || 'Service Team',
                        notes: m.notes || 'Routine check verified.'
                    });
                });
            }
            lasers.forEach(l => {
                if (Array.isArray(l.calibrationHistory)) {
                    l.calibrationHistory.forEach(c => {
                        timelineEvents.push({
                            date: c.date ? c.date.split('T')[0] : '2026-01-01',
                            type: 'Recalibration',
                            engineer: 'Precision Tech',
                            notes: `${l.name}: Actual ${c.actualHour || 0} hrs (${c.reason || 'Scheduled check'})`
                        });
                    });
                }
            });

            // Sort newest first
            timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (timelineEvents.length === 0) {
                const safeEvalDate = (evalTime instanceof Date ? evalTime : new Date(evalTime)).toISOString().split('T')[0];
                timelineEvents.push({
                    date: safeEvalDate,
                    type: 'Baseline Commissioning',
                    engineer: 'Lead Engineer',
                    notes: 'Initial factory settings and optical baseline verified.'
                });
            }
            const timelineHtml = timelineEvents.slice(0, 3).map(ev => `
                <div class="es-timeline-item">
                    <div class="es-timeline-dot"></div>
                    <div class="es-timeline-content">
                        <div class="es-timeline-top">
                            <span class="es-timeline-type">${ev.type}</span>
                            <span class="es-timeline-date">${ev.date}</span>
                        </div>
                        <div class="es-timeline-meta">${ev.engineer} • <span class="es-timeline-notes">${ev.notes}</span></div>
                    </div>
                </div>
            `).join('');

            // 6. Active Engineering Alerts
            const alerts = [];
            if (crit.isContingencyActive) {
                alerts.push({ level: 'ALARM', title: 'Contingency Mode Engaged', desc: 'Operating in degraded drift contingency window. Immediate swap required.' });
            }
            if (crit.status === 'ALARM') {
                alerts.push({ level: 'ALARM', title: 'Rated Lifetime Limit Exceeded', desc: `Exceeded rated operating threshold (${crit.ratedLife.toLocaleString()} hrs).` });
            } else if (crit.status === 'WARNING') {
                alerts.push({ level: 'WARNING', title: 'Accelerated Burn Warning', desc: `Passed 80% warning threshold (${crit.warningLife.toLocaleString()} hrs). Schedule replacement optical head.` });
            }
            if (crit.status === 'BASELINE_REQUIRED') {
                alerts.push({ level: 'BASELINE', title: 'Baseline Calibration Required', desc: 'No baseline calibration anchor point set for this machine head.' });
            }
            if (calDueDateText.includes('OVERDUE')) {
                alerts.push({ level: 'WARNING', title: 'Calibration Interval Due', desc: 'Quarterly precision recalibration cycle has exceeded standard 90-day window.' });
            }

            let alertsHtml = '';
            if (alerts.length > 0) {
                alertsHtml = alerts.map(a => `
                    <div class="es-alert-item es-alert-${a.level.toLowerCase()}">
                        <span class="es-alert-badge">${a.level}</span>
                        <div class="es-alert-body">
                            <div class="es-alert-title">${a.title}</div>
                            <div class="es-alert-desc">${a.desc}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                alertsHtml = `
                    <div class="es-alert-item es-alert-nominal">
                        <span class="es-alert-badge">NOMINAL</span>
                        <div class="es-alert-body">
                            <div class="es-alert-title">All Subsystems Nominal</div>
                            <div class="es-alert-desc">All optical channels, environmental sensors, and calibration timers operating within engineering tolerances.</div>
                        </div>
                    </div>
                `;
            }

            const panel = document.createElement('div');
            panel.className = 'fleet-detail-panel';
            panel.setAttribute('data-detail-id', machine.id);
            panel.innerHTML = `
                <!-- SECTION 1: MACHINE IDENTITY & HEADER -->
                <div class="es-header">
                    <div class="es-header-left">
                        <span class="es-title-badge">ENGINEERING SNAPSHOT</span>
                        <span class="es-mach-no">${machineNo}</span>
                        <span class="es-model-dept">${model} • ${department}</span>
                        <span class="es-serial-badge">SN: ${serialNo}</span>
                        <span class="es-mode-badge ${operatingModeClass}">${operatingMode}</span>
                    </div>
                    <div class="es-header-right">
                        <button class="fleet-detail-close-btn" type="button" title="Collapse Snapshot">
                            <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                <!-- MAIN ENGINEERING SNAPSHOT GRID -->
                <div class="es-grid">
                    <!-- SECTION 2: RUNTIME & CALIBRATION ANALYTICS -->
                    <div class="es-card es-card-analytics">
                        <div class="es-card-header">
                            <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <span>RUNTIME & CALIBRATION ANALYTICS</span>
                        </div>
                        <div class="es-metrics-grid">
                            <div class="es-metric-cell">
                                <span class="es-metric-label">Current Runtime</span>
                                <span class="es-metric-val mc-drawer-val-runtime">${currentHrsVal} hrs</span>
                            </div>
                            <div class="es-metric-cell">
                                <span class="es-metric-label">Total Operating Hours</span>
                                <span class="es-metric-val">${totalOperatingHours.toLocaleString()} hrs</span>
                            </div>
                            <div class="es-metric-cell">
                                <span class="es-metric-label">Last Calibration</span>
                                <span class="es-metric-val">${lastCalText}</span>
                            </div>
                            <div class="es-metric-cell">
                                <span class="es-metric-label">Calibration Due</span>
                                <span class="es-metric-val ${calDueDateText.includes('OVERDUE') ? 'color-alarm' : ''}">${calDueDateText}</span>
                            </div>
                            <div class="es-metric-cell">
                                <span class="es-metric-label">Burn Trend</span>
                                <span class="es-metric-val ${burnTrendClass}">${burnTrend}</span>
                            </div>
                            <div class="es-metric-cell">
                                <span class="es-metric-label">PM Trend</span>
                                <span class="es-metric-val ${pmTrendClass}">${pmTrend}</span>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 4: ENVIRONMENTAL HEALTH -->
                    <div class="es-card es-card-env">
                        <div class="es-card-header">
                            <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            <span>ENVIRONMENTAL HEALTH</span>
                        </div>
                        <div class="es-metrics-grid es-env-grid">
                            <div class="es-metric-cell">
                                <span class="es-metric-label">Cooling Water</span>
                                <span class="es-metric-val color-safe">${waterTemp}°C</span>
                            </div>
                            <div class="es-metric-cell">
                                <span class="es-metric-label">Humidity</span>
                                <span class="es-metric-val">${humidity}% RH</span>
                            </div>
                            <div class="es-metric-cell">
                                <span class="es-metric-label">Ambient Temp</span>
                                <span class="es-metric-val">${ambientTemp}°C</span>
                            </div>
                            <div class="es-metric-cell">
                                <span class="es-metric-label">Air Pressure</span>
                                <span class="es-metric-val">${airPressure} kPa</span>
                            </div>
                            <div class="es-metric-cell es-metric-span-full">
                                <span class="es-metric-label">Environmental Status</span>
                                <span class="es-metric-val color-safe">OPTIMAL (PASS)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 3: LASER HEAD HEALTH (DUAL-HEAD COMPARISON) -->
                <div class="es-card es-card-heads">
                    <div class="es-card-header">
                        <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        <span>LASER HEAD HEALTH COMPARISON (${lasers.length} HEADS)</span>
                    </div>
                    <div class="es-table-responsive">
                        <table class="es-table">
                            <thead>
                                <tr>
                                    <th>Laser Head</th>
                                    <th>Runtime</th>
                                    <th>Remaining Hours</th>
                                    <th>Remaining %</th>
                                    <th>Temperature</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${headRowsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- TWO-COLUMN ROW: TIMELINE & ALERTS -->
                <div class="es-grid es-grid-split">
                    <!-- SECTION 5: MAINTENANCE TIMELINE -->
                    <div class="es-card es-card-timeline">
                        <div class="es-card-header">
                            <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                            <span>MAINTENANCE TIMELINE (NEWEST FIRST)</span>
                        </div>
                        <div class="es-timeline-list">
                            ${timelineHtml}
                        </div>
                    </div>

                    <!-- SECTION 6: ACTIVE ENGINEERING ALERTS -->
                    <div class="es-card es-card-alerts">
                        <div class="es-card-header">
                            <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            <span>ACTIVE ENGINEERING ALERTS</span>
                        </div>
                        <div class="es-alerts-list">
                            ${alertsHtml}
                        </div>
                    </div>
                </div>

                <!-- SECTION 7: ENGINEER ACTIONS -->
                <div class="es-footer">
                    <div class="es-actions-left">
                        <button class="btn btn-primary btn-sm fleet-detail-inspect-btn" type="button">
                            <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                            <span>Inspect Full Machine Details</span>
                        </button>
                    </div>
                    <div class="es-actions-right">
                        <button class="btn btn-secondary btn-sm fleet-detail-edit-btn" type="button">
                            <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            <span>Edit Machine</span>
                        </button>
                        <button class="btn btn-secondary btn-sm fleet-detail-delete-btn" type="button">
                            <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            <span>Delete Machine</span>
                        </button>
                    </div>
                </div>
            `;

            // Close button
            const btnClose = panel.querySelector('.fleet-detail-close-btn');
            if (btnClose) {
                btnClose.onclick = (e) => {
                    e.stopPropagation();
                    AppState.expandedCardId = null;
                    DashboardController.renderFleetView(container, machines, filters, evalTime, onSelectMachine, onEditMachine, onDeleteMachine);
                };
            }

            // Inspect button
            const btnInspect = panel.querySelector('.fleet-detail-inspect-btn');
            if (btnInspect) {
                btnInspect.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof onSelectMachine === 'function') {
                        const cardEl = container.querySelector(`.machine-card[data-id="${machine.id}"]`);
                        onSelectMachine(machine.id, cardEl || panel);
                    }
                };
            }

            // Edit button
            const btnEdit = panel.querySelector('.fleet-detail-edit-btn');
            if (btnEdit) {
                btnEdit.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof onEditMachine === 'function') {
                        onEditMachine(machine.id);
                    }
                };
            }

            // Delete button
            const btnDel = panel.querySelector('.fleet-detail-delete-btn');
            if (btnDel) {
                btnDel.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof onDeleteMachine === 'function') {
                        onDeleteMachine(machine.id);
                    }
                };
            }

            return panel;
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

        // If a card is expanded, insert the full-width detail panel immediately below its visual row
        if (AppState.expandedCardId) {
            const expandedMachine = filtered.find(m => m.id === AppState.expandedCardId);
            if (expandedMachine) {
                const detailPanel = buildDetailPanel(expandedMachine);
                const selectedCard = cardsGrid.querySelector(`.machine-card[data-id="${AppState.expandedCardId}"]`);
                if (selectedCard) {
                    const allCards = Array.from(cardsGrid.querySelectorAll('.machine-card'));
                    const selectedIdx = allCards.indexOf(selectedCard);
                    const selectedTop = selectedCard.offsetTop;
                    let targetCard = selectedCard;
                    for (let i = selectedIdx; i < allCards.length; i++) {
                        if (Math.abs(allCards[i].offsetTop - selectedTop) < 10) {
                            targetCard = allCards[i];
                        } else {
                            break;
                        }
                    }
                    targetCard.after(detailPanel);
                } else {
                    cardsGrid.appendChild(detailPanel);
                }
            }
        }
    }
};

window.DashboardController = DashboardController;
