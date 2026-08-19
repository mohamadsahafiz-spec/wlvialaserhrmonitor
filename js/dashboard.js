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
                    const currentVal = card.querySelector('.mc-stat-val-current');
                    const remainVal = card.querySelector('.mc-stat-val-remain');
                    const daysVal = card.querySelector('.mc-stat-val-days');
                    const healthFill = card.querySelector('.mini-health-fill');
                    const healthText = card.querySelector('.mc-health-text');
                    if (currentVal) currentVal.textContent = `${metrics.currentHour} hrs`;
                    if (remainVal) {
                        const formatHrs = Math.abs(metrics.remainingTotal);
                        remainVal.textContent = metrics.remainingTotal < 0 ? `-${formatHrs} hrs` : `${formatHrs} hrs`;
                    }
                    if (daysVal) {
                        daysVal.textContent = metrics.remainingDaysInfo.formattedText;
                    }
                    ChartRenderer.updateMiniHealthTrack(healthFill, metrics.lifeRemainingPercent, metrics.status);
                    if (healthText) healthText.textContent = `Life Remaining: ${metrics.formattedLifeRemaining}`;
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
                title: 'SAFE',
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
                let badgeClass = '', dotColor = '';

                if (metrics.status === 'SAFE') {
                    badgeClass = 'color-safe'; dotColor = 'var(--green)';
                } else if (metrics.status === 'WARNING') {
                    badgeClass = 'color-warning'; dotColor = 'var(--yellow)';
                } else if (metrics.status === 'BASELINE_REQUIRED') {
                    badgeClass = 'color-baseline'; dotColor = '#3b82f6';
                } else {
                    badgeClass = 'color-alarm'; dotColor = 'var(--red)';
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
                const recalDateStr = crit.lastRecalibrationDate ? formatDate(crit.lastRecalibrationDate) : 'N/A';
                const limitInfo = crit.recommendedLimitInfo || { daysText: crit.remainingDaysInfo.formattedText, subText: '', isExceeded: crit.isContingencyActive };
                const lifeRemainingDisplay = crit.isContingencyActive ? '0%' : crit.formattedLifeRemaining;
                const lifeRemainingPct = crit.isContingencyActive ? 0 : crit.lifeRemainingPercent;

                const alarmBannerHtml = crit.isContingencyActive ? `
                    <div style="margin-top: 8px; padding: 4px 8px; background: rgba(239, 68, 68, 0.15); border: 1px solid var(--red); border-radius: 4px; color: var(--red); font-size: 11px; font-weight: 800; text-align: center; letter-spacing: 0.3px;">
                        RECOMMENDED LIFE EXCEEDED
                    </div>
                ` : '';

                // Generate Laser Heads Indicator Row (Pills/Dots)
                const laserPillsHtml = metrics.laserMetricsList.map((lm, idx) => {
                    let pColor = 'var(--green)';
                    if (lm.status === 'WARNING') pColor = 'var(--yellow)';
                    if (lm.status === 'ALARM') pColor = 'var(--red)';
                    return `<span class="laser-head-pill" title="${lm.name}: ${lm.currentHour} hrs, ${lm.isContingencyActive ? '0%' : lm.formattedLifeRemaining} Life Remaining (${lm.status})">
                        <span class="laser-pill-dot" style="background:${pColor}; box-shadow: 0 0 6px ${pColor};"></span>
                        <span class="laser-pill-name">L${idx + 1}</span>
                    </span>`;
                }).join('');

                card.innerHTML = `
                    <div class="mc-header">
                        <div>
                            <div class="mc-title">${machine.machineName}</div>
                            <div class="mc-subtitle">
                                <span class="mc-num-badge">${machine.machineNo}</span> • SN: ${machine.serialNo} • ${machine.department}
                            </div>
                        </div>
                        <div class="mc-status-badge ${badgeClass}" style="border-color:${dotColor}40;">
                            <div class="mc-led" style="background:${dotColor}; box-shadow: 0 0 8px ${dotColor}"></div>
                            ${metrics.status}
                        </div>
                    </div>

                    <!-- Laser Heads Status Row -->
                    <div class="mc-lasers-row">
                        <span class="mc-lasers-label">${metrics.totalLasers} Laser ${metrics.totalLasers === 1 ? 'Head' : 'Heads'}:</span>
                        <div class="mc-lasers-pills">${laserPillsHtml}</div>
                    </div>

                    <div class="mc-stats">
                        <div class="mc-stat-item">
                            <span class="mc-stat-label">Critical: ${crit.name}</span>
                            <span class="mc-stat-val mc-stat-val-current">${crit.currentHour} hrs</span>
                        </div>
                        <div class="mc-stat-item">
                            <span class="mc-stat-label">Remaining Hr</span>
                            <span class="mc-stat-val mc-stat-val-remain ${badgeClass}">${remainText}</span>
                        </div>
                        <div class="mc-stat-item">
                            <span class="mc-stat-label">Days to Limit</span>
                            <span class="mc-stat-val mc-stat-val-days" style="font-size:13px; margin-top:2px; ${limitInfo.isExceeded ? 'color:var(--red); font-weight:800;' : ''}">${limitInfo.daysText}</span>
                            <div style="font-size:11px; color:var(--muted); font-weight:500; margin-top:2px;">${limitInfo.subText}</div>
                        </div>
                    </div>

                    ${alarmBannerHtml}

                    <div class="mc-extra-info">
                        <div>Accuracy: <strong style="color:${crit.accuracy.color}">${crit.accuracy.label}</strong></div>
                        <div>EOL Date: <strong>${crit.eolDate}</strong></div>
                        <div>Last Recal: <strong>${recalDateStr}</strong></div>
                    </div>

                    <div class="mc-footer">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="mc-health-text">Life Remaining: <strong>${lifeRemainingDisplay}</strong></span>
                            <div class="mini-health-track" title="Life Remaining: ${lifeRemainingDisplay}">
                                <div class="mini-health-fill" style="width: ${lifeRemainingPct}%;"></div>
                            </div>
                        </div>
                        <div class="mc-card-actions">
                            <button class="btn-card-action btn-edit-card" title="Edit Machine Properties" data-id="${machine.id}">
                                <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-card-action btn-delete-card" title="Delete Machine" data-id="${machine.id}">
                                <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px;stroke:var(--red)"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                `;

                const fillEl = card.querySelector('.mini-health-fill');
                ChartRenderer.updateMiniHealthTrack(fillEl, lifeRemainingPct, crit.status);

                const editBtn = card.querySelector('.btn-edit-card');
                if (editBtn) {
                    editBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (typeof onEditMachine === 'function') {
                            onEditMachine(machine.id);
                        }
                    };
                }

                const deleteBtn = card.querySelector('.btn-delete-card');
                if (deleteBtn) {
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (typeof onDeleteMachine === 'function') {
                            onDeleteMachine(machine.id);
                        }
                    };
                }

                sectionGrid.appendChild(card);
            });

            container.appendChild(sectionEl);
        });
    }
};

window.DashboardController = DashboardController;
