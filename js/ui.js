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
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Machine No,Machine Name,Serial,Department,Rated Life,Current Hour,Remaining,Status,Accuracy,Health %\n";

        machines.forEach(m => {
            const met = window.LaserEngine ? window.LaserEngine.calculateMachineMetrics(m, evalTime) : {};
            const row = [
                m.machineNo,
                m.machineName,
                m.serialNo,
                m.department,
                m.ratedLife,
                met.currentHour || 0,
                met.remainingTotal || 0,
                met.status || 'SAFE',
                met.accuracy ? met.accuracy.level : 'HIGH',
                Math.round(met.healthPercent || 0)
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `WaferDriller_v5_Report_${simulatedDateStr || 'export'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
