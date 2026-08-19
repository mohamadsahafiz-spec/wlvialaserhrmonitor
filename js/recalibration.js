/* =====================================================
   RECALIBRATION.JS - Recalibration Logic & Dialog Flow
   ===================================================== */
import { LaserEngine } from './laserEngine.js';

export const RecalibrationController = {
    /**
     * Compute deviation and prepare audit record for recalibration.
     */
    prepareRecalibration(machine, laserId, actualHour, reason, evalTime) {
        if (!machine) return null;
        return LaserEngine.executeRecalibration(machine, laserId, actualHour, reason, evalTime);
    },

    /**
     * Get rating color depending on deviation magnitude.
     */
    getDeviationColor(differenceHours) {
        const absDiff = Math.abs(Number(differenceHours) || 0);
        if (absDiff <= 25) return 'var(--green)';
        if (absDiff <= 100) return 'var(--yellow)';
        return 'var(--red)';
    }
};

window.RecalibrationController = RecalibrationController;
