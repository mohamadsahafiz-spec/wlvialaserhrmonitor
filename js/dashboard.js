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

        // Sort machines based on Primary Status Order (ALARM > WARNING > SAFE) then user selected sortMode
        filtered.sort((a, b) => {
            const metricsA = LaserEngine.calculateMachineMetrics(a, evalTime);
            const metricsB = LaserEngine.calculateMachineMetrics(b, evalTime);

            const statusPriority = { 'ALARM': 3, 'WARNING': 2, 'SAFE': 1 };
            const priA = statusPriority[metricsA.status] ?? 0;
            const priB = statusPriority[metricsB.status] ?? 0;

            if (priA !== priB) {
                return priB - priA; // Primary order: ALARM > WARNING > SAFE
            }

            // Secondary sort within same status group according to user sort choice
            switch (sortMode) {
                case 'no-asc':
                    return (a.machineNo || '').localeCompare(b.machineNo || '', undefined, { numeric: true, sensitivity: 'base' });
                case 'no-desc':
                    return (b.machineNo || '').localeCompare(a.machineNo || '', undefined, { numeric: true, sensitivity: 'base' });
                case 'hour-desc':
                    return metricsB.currentHour - metricsA.currentHour;
                case 'hour-asc':
                    return metricsA.currentHour - metricsB.currentHour;
                case 'remain-asc':
                    return metricsA.remainingTotal - metricsB.remainingTotal;
                case 'remain-desc':
                    return metricsB.remainingTotal - metricsA.remainingTotal;
                case 'health-asc':
                    return metricsA.lifeRemainingPercent - metricsB.lifeRemainingPercent;
                case 'health-desc':
                    return metricsB.lifeRemainingPercent - metricsA.lifeRemainingPercent;
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
                    const formatHrs = Math.abs(crit.remainingTotal);
                    const remainText = crit.remainingTotal < 0 ? `-${formatHrs} hrs` : `${formatHrs} hrs`;

                    let replaceDaysText = '—';
                    if (crit.remainingDaysInfo && crit.remainingDaysInfo.daysVal !== null && !isNaN(crit.remainingDaysInfo.daysVal)) {
                        const daysVal = Math.abs(crit.remainingDaysInfo.daysVal);
                        replaceDaysText = crit.remainingTotal < 0 ? `${daysVal}d Overdue` : `${daysVal}d`;
                    }

                    const currentHrsText = crit.currentHour !== null && crit.currentHour !== '—' ? `${crit.currentHour} hrs` : '—';
                    const lifeRemainingDisplay = crit.isContingencyActive ? '0%' : crit.formattedLifeRemaining;
                    const lifeRemainingPct = crit.isContingencyActive ? 0 : crit.lifeRemainingPercent;

                    const currentVal = card.querySelector('.mc-primary-hour');
                    const remainVal = card.querySelector('.mc-stat-val-remain');
                    const daysValEl = card.querySelector('.mc-stat-val-days');
                    const healthFill = card.querySelector('.mc-progress-fill');
                    const healthText = card.querySelector('.mc-progress-label');

                    if (currentVal) currentVal.textContent = currentHrsText;
                    if (remainVal) {
                        remainVal.textContent = remainText;
                        remainVal.className = `mc-split-val mc-stat-val-remain ${crit.status === 'ALARM' ? 'color-alarm' : (crit.status === 'WARNING' ? 'color-warning' : 'color-safe')}`;
                    }
                    if (daysValEl) {
                        daysValEl.textContent = replaceDaysText;
                        daysValEl.style.color = crit.remainingTotal < 0 ? 'var(--red)' : '';
                    }
                    if (healthFill) {
                        healthFill.style.width = `${lifeRemainingPct}%`;
                        let dotColor = 'var(--green)';
                        if (metrics.status === 'WARNING') dotColor = 'var(--yellow)';
                        if (metrics.status === 'ALARM') dotColor = 'var(--red)';
                        if (metrics.status === 'BASELINE_REQUIRED') dotColor = '#3b82f6';
                        healthFill.style.background = dotColor;
                    }
                    if (healthText) healthText.textContent = lifeRemainingDisplay;
                }
            });
            return;
        }

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--muted); font-size: 15px;" class="glass-panel">No wafer driller machines match your search or filter criteria.</div>`;
            return;
        }

        const groups = [
            {
                status: 'ALARM',
                title: 'ALARM',
                desc: 'Immediate Attention',
                color: 'var(--red)',
                bg: 'rgba(239, 68, 68, 0.12)',
                border: 'rgba(239, 68, 68, 0.3)',
                items: filtered.filter(m => LaserEngine.calculateMachineMetrics(m, evalTime).status === 'ALARM')
            },
            {
                status: 'BASELINE_REQUIRED',
                title: 'BASELINE REQUIRED',
                desc: 'Initialization Required',
                color: '#3b82f6',
                bg: 'rgba(59, 130, 246, 0.12)',
                border: 'rgba(59, 130, 246, 0.3)',
                items: filtered.filter(m => LaserEngine.calculateMachineMetrics(m, evalTime).status === 'BASELINE_REQUIRED')
            },
            {
                status: 'WARNING',
                title: 'WARNING',
                desc: 'Planning Required',
                color: 'var(--yellow)',
                bg: 'rgba(245, 158, 11, 0.12)',
                border: 'rgba(245, 158, 11, 0.3)',
                items: filtered.filter(m => LaserEngine.calculateMachineMetrics(m, evalTime).status === 'WARNING')
            },
            {
                status: 'SAFE',
                title: 'HEALTHY',
                desc: 'Normal Operation',
                color: 'var(--green)',
                bg: 'rgba(34, 197, 94, 0.12)',
                border: 'rgba(34, 197, 94, 0.3)',
                items: filtered.filter(m => {
                    const st = LaserEngine.calculateMachineMetrics(m, evalTime).status;
                    return st === 'SAFE' || (st !== 'ALARM' && st !== 'BASELINE_REQUIRED' && st !== 'WARNING');
                })
            }
        ];

        groups.forEach(group => {
            if (group.items.length === 0) return;

            const sectionEl = document.createElement('div');
            sectionEl.className = `fleet-status-section fleet-section-${group.status.toLowerCase()}`;
            sectionEl.innerHTML = `
                <div class="fleet-section-header" style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; margin-bottom: 14px; border-bottom: 1px solid var(--glass-border);">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <span style="font-size: 13px; font-weight: 800; letter-spacing: 0.8px; color: ${group.color}; text-transform: uppercase;">${group.title}</span>
                        <span style="font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 12px; background: ${group.bg}; color: ${group.color}; border: 1px solid ${group.border}; text-transform: uppercase;">${group.items.length} ${group.items.length === 1 ? 'MACHINE' : 'MACHINES'}</span>
                        <span style="font-size: 12px; color: var(--muted); font-weight: 500;">— ${group.desc}</span>
                    </div>
                </div>
                <div class="fleet-section-grid"></div>
            `;

            const sectionGrid = sectionEl.querySelector('.fleet-section-grid');

            group.items.forEach(machine => {
                const metrics = LaserEngine.calculateMachineMetrics(machine, evalTime);
                let badgeClass = '', dotColor = '', statusLabel = '';

                if (metrics.status === 'SAFE') {
                    badgeClass = 'color-safe'; dotColor = 'var(--green)'; statusLabel = 'HEALTHY';
                } else if (metrics.status === 'WARNING') {
                    badgeClass = 'color-warning'; dotColor = 'var(--yellow)'; statusLabel = 'WARNING';
                } else if (metrics.status === 'BASELINE_REQUIRED') {
                    badgeClass = 'color-baseline'; dotColor = '#3b82f6'; statusLabel = 'BASELINE';
                } else {
                    badgeClass = 'color-alarm'; dotColor = 'var(--red)'; statusLabel = 'ALARM';
                }

                const card = document.createElement('div');
                card.className = 'machine-card glass-panel' + (metrics.status === 'ALARM' ? ' alarm-breathing' : '');
                card.setAttribute('data-id', machine.id);
                card.onclick = (e) => {
                    if (typeof onSelectMachine === 'function') {
                        onSelectMachine(machine.id, e.currentTarget);
                    }
                };

                const crit = metrics.mostCriticalLaser;
                const formatHrs = Math.abs(crit.remainingTotal);
                const remainText = crit.remainingTotal < 0 ? `-${formatHrs} hrs` : `${formatHrs} hrs`;

                let replaceDaysText = '—';
                if (crit.remainingDaysInfo && crit.remainingDaysInfo.daysVal !== null && !isNaN(crit.remainingDaysInfo.daysVal)) {
                    const daysVal = Math.abs(crit.remainingDaysInfo.daysVal);
                    replaceDaysText = crit.remainingTotal < 0 ? `${daysVal}d Overdue` : `${daysVal}d`;
                }

                const currentHrsText = crit.currentHour !== null && crit.currentHour !== '—' ? `${crit.currentHour} hrs` : '—';
                const lifeRemainingDisplay = crit.isContingencyActive ? '0%' : crit.formattedLifeRemaining;
                const lifeRemainingPct = crit.isContingencyActive ? 0 : crit.lifeRemainingPercent;

                card.innerHTML = `
                    <div class="mc-header">
                        <div class="mc-title">${machine.machineName || machine.machineNo}</div>
                        <div class="mc-status-badge ${badgeClass}" style="border-color:${dotColor}40;">
                            <div class="mc-led" style="background:${dotColor}; box-shadow: 0 0 8px ${dotColor}"></div>
                            ${statusLabel}
                        </div>
                    </div>

                    <div class="mc-primary-hour-box">
                        <div class="mc-primary-hour">${currentHrsText}</div>
                    </div>

                    <div class="mc-metrics-split">
                        <div class="mc-split-item">
                            <span class="mc-split-label">Remaining</span>
                            <span class="mc-split-val mc-stat-val-remain ${crit.status === 'ALARM' ? 'color-alarm' : (crit.status === 'WARNING' ? 'color-warning' : 'color-safe')}">${remainText}</span>
                        </div>
                        <div class="mc-split-item">
                            <span class="mc-split-label">Replace In</span>
                            <span class="mc-split-val mc-stat-val-days" style="${crit.remainingTotal < 0 ? 'color:var(--red); font-weight:800;' : ''}">${replaceDaysText}</span>
                        </div>
                    </div>

                    <div class="mc-progress-section">
                        <div class="mc-progress-track">
                            <div class="mc-progress-fill" style="width: ${lifeRemainingPct}%; background: ${dotColor};"></div>
                        </div>
                        <span class="mc-progress-label">${lifeRemainingDisplay}</span>
                    </div>
                `;

                sectionGrid.appendChild(card);
            });

            container.appendChild(sectionEl);
        });
    }
};

window.DashboardController = DashboardController;
