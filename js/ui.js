/* =====================================================
   UI.JS - User Interface Utilities & Modal Management
   ===================================================== */
import { formatHours, formatDate } from './utils.js';

export const UI = {
    /**
     * Toggle Theme (Light / Dark)
     */
    toggleTheme() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const nextTheme = isLight ? 'dark' : 'light';
        this.applyTheme(nextTheme);
        return nextTheme;
    },

    /**
     * Apply initial theme from saved preference
     */
    applyTheme(theme) {
        if (theme) {
            document.documentElement.setAttribute('data-theme', theme);
        }
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const btnTheme = document.getElementById('btn-theme');
        if (btnTheme) {
            const sun = btnTheme.querySelector('.icon-sun');
            const moon = btnTheme.querySelector('.icon-moon');
            if (currentTheme === 'light') {
                if (sun) sun.classList.add('hidden');
                if (moon) moon.classList.remove('hidden');
                btnTheme.title = 'Switch to Dark Mode';
            } else {
                if (sun) sun.classList.remove('hidden');
                if (moon) moon.classList.add('hidden');
                btnTheme.title = 'Switch to Light Mode';
            }
        }
    },

    /**
     * Show Modal Overlay
     */
    showModal(overlayElement) {
        if (overlayElement) {
            overlayElement.classList.add('active');
        }
    },

    /**
     * Hide Modal Overlay
     */
    hideModal(overlayElement) {
        if (overlayElement) {
            overlayElement.classList.remove('active');
        }
    },

    /**
     * Export machine fleet report to CSV
     */
    exportToCSV(machines, evalTime, simulatedDateStr) {
        if (!machines || machines.length === 0) return;
        let csvContent = "";
        if (typeof window !== 'undefined' && window.StorageService && typeof window.StorageService.generateCsvReport === 'function') {
            csvContent = window.StorageService.generateCsvReport(machines, evalTime);
        } else {
            csvContent = "Machine No,Machine Name,Serial No,Department,Model,Laser Count,Rated Life (hrs),Current Laser Hour,Remaining Hours,Life Remaining %,Status,Accuracy,Last Recalibration Date\n";
            machines.forEach(m => {
                const met = window.LaserEngine ? window.LaserEngine.calculateMachineMetrics(m, evalTime) : {};
                const crit = met.mostCriticalLaser || {};
                const ratedLife = crit.ratedLife || m.ratedLife || 25000;
                const currentHr = (crit.currentHour !== null && crit.currentHour !== undefined && crit.currentHour !== '—') ? crit.currentHour : 'N/A';
                const remainingHr = (crit.remainingTotal !== null && crit.remainingTotal !== undefined && crit.remainingTotal !== '—') ? crit.remainingTotal : 'N/A';
                const lifePct = (crit.lifeRemainingPercent !== null && crit.lifeRemainingPercent !== undefined) ? `${Math.round(crit.lifeRemainingPercent)}%` : 'N/A';
                const status = met.status || 'SAFE';
                const accuracy = met.accuracy ? met.accuracy.level : 'HIGH';
                const lastRecal = crit.lastRecalibrationDate || m.lastRecalibrationDate || 'N/A';
                const laserCount = met.totalLasers || (Array.isArray(m.lasers) ? m.lasers.length : 1);

                const row = [
                    `"${(m.machineNo || '').replace(/"/g, '""')}"`,
                    `"${(m.machineName || '').replace(/"/g, '""')}"`,
                    `"${(m.serialNo || '').replace(/"/g, '""')}"`,
                    `"${(m.department || '').replace(/"/g, '""')}"`,
                    `"${(m.model || '').replace(/"/g, '""')}"`,
                    laserCount,
                    ratedLife,
                    currentHr,
                    remainingHr,
                    `"${lifePct}"`,
                    status,
                    accuracy,
                    `"${lastRecal}"`
                ].join(",");
                csvContent += row + "\n";
            });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `LMS_Fleet_Report_${simulatedDateStr || new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Trigger browser print dialog
     */
    printReport() {
        window.print();
    },

    /**
     * Show Toast Notification
     */
    showToast(message, type = 'info', duration = 3000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let icon = 'ℹ️';
        if (type === 'success') icon = '✓';
        if (type === 'warning') icon = '⚠️';
        if (type === 'error') icon = '✕';

        toast.innerHTML = `<span style="font-size:16px;">${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    },

    /**
     * Animates a number from 0 to the target value.
     */
    animateValue(obj, start, end, duration, formatStr = '') {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOut = progress * (2 - progress);
            const current = Math.floor(easeOut * (end - start) + start);
            obj.textContent = current + formatStr;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.textContent = end + formatStr;
            }
        };
        window.requestAnimationFrame(step);
    }
};

window.UI = UI;
