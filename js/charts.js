/* =====================================================
   CHARTS.JS - Visual Progress & Meter Rendering
   ===================================================== */

export const ChartRenderer = {
    /**
     * Render linear health progress bar with dynamic color transitions.
     */
    updateProgressBar(element, percent) {
        if (!element) return;
        const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
        element.style.width = `${clamped}%`;
    },

    /**
     * Render mini health track fill in machine cards.
     */
    updateMiniHealthTrack(fillElement, percent, status) {
        if (!fillElement) return;
        const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
        fillElement.style.width = `${clamped}%`;
        
        if (status === 'SAFE') {
            fillElement.style.background = 'var(--green)';
        } else if (status === 'WARNING') {
            fillElement.style.background = 'var(--yellow)';
        } else {
            fillElement.style.background = 'var(--red)';
        }
    }
};

window.ChartRenderer = ChartRenderer;
