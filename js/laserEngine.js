/* =====================================================
   LASER ENGINE (laserEngine.js)
   Calculation engine for multi-laser operating hours, remaining
   lifetime %, worst-state status aggregation, accuracy,
   and recalibration logic.
   ===================================================== */
import { formatDate } from './utils.js';

/**
 * Helper: Format Life Remaining percentage according to system precision rules:
 * - >= 10%: Whole % (e.g., 53%)
 * - 1% - 10%: 1 decimal place (e.g., 4.8%)
 * - < 1% and > 0%: 1 decimal place (e.g., 0.5%). Never round down positive values to 0%.
 * - <= 0%: 0%
 */
export function formatLifeRemainingPercent(val) {
    const p = Number(val);
    if (isNaN(p) || p <= 0) return '0%';
    if (p >= 10) return Math.round(p) + '%';
    // 0 < p < 10
    const str = p.toFixed(1);
    return str.endsWith('.0') ? Math.round(p) + '%' : str + '%';
}

export const LaserEngine = {
    /**
     * Calculate continuous estimated laser hour from baseline and timestamp.
     * Assumes continuous 24-hour daily operation.
     * Formula: Current Laser Hour = Base Laser Hour + Elapsed Time (in Hours)
     * Current Laser Hour is NEVER permanently stored; calculated dynamically.
     */
    calculateEstimatedHour(baseLaserHour, baseTimestamp, currentTime) {
        if (baseLaserHour === null || baseLaserHour === undefined || isNaN(Number(baseLaserHour))) return null;
        if (!baseTimestamp || isNaN(new Date(baseTimestamp).getTime())) return null;
        const baseHour = Number(baseLaserHour);
        const baseMs = new Date(baseTimestamp).getTime();
        const currentMs = new Date(currentTime).getTime();

        if (isNaN(currentMs) || currentMs < baseMs) {
            return baseHour;
        }

        const elapsedMs = currentMs - baseMs;
        const elapsedHours = elapsedMs / (1000 * 60 * 60);
        return baseHour + elapsedHours;
    },

    /**
     * Calculate remaining operating hours before rated life limit.
     * Allowed to be negative if overdue!
     */
    calculateRemainingHours(currentHour, ratedLife) {
        const rated = Number(ratedLife) || 25000;
        return rated - Number(currentHour || 0);
    },

    /**
     * Calculate remaining days based on remaining hours (assuming 24h/day continuous operation).
     */
    calculateRemainingDays(remainingHours) {
        const rem = Number(remainingHours) || 0;
        if (rem < 0) {
            return Math.floor(Math.abs(rem) / 24);
        }
        return Math.floor(rem / 24);
    },

    /**
     * Calculate remaining days breakdown and warning/alarm threshold info.
     */
    calculateRemainingDaysInfo(remainingTotal, ratedLife, warningLife) {
        const rated = Number(ratedLife) || 25000;
        const warn = Number(warningLife) || Math.floor(rated * 0.8);
        const warningThreshold = rated - warn;

        let daysVal = 0;
        let statusMsg = "";
        let urgency = "SAFE";

        if (remainingTotal > warningThreshold) {
            daysVal = Math.floor((remainingTotal - warningThreshold) / 24);
            statusMsg = "Days to WARNING";
            urgency = "SAFE";
        } else if (remainingTotal >= 0) {
            daysVal = Math.floor(remainingTotal / 24);
            statusMsg = "Days to ALARM";
            urgency = "WARNING";
        } else {
            daysVal = Math.floor(Math.abs(remainingTotal) / 24);
            statusMsg = "Days Overdue";
            urgency = "ALARM";
        }

        return {
            daysVal,
            statusMsg,
            urgency,
            formattedText: remainingTotal < 0 ? `${daysVal}d overdue` : `${daysVal.toLocaleString()} days`
        };
    },

    /**
     * Calculate Life Remaining Percentage:
     * Life Remaining % = (Remaining Hours / Rated Lifetime) * 100
     * Clamped between 0% and 100%.
     */
    calculateLifeRemainingPercent(remainingHours, ratedLife) {
        const rated = Number(ratedLife) || 25000;
        const rem = Number(remainingHours);
        if (rated <= 0 || rem <= 0) return 0;
        const rawPct = (rem / rated) * 100;
        return Math.max(0, Math.min(100, rawPct));
    },

    /**
     * Determine laser status based on current laser hour and rated/warning limits.
     * - ALARM: Current hour >= Rated life (Remaining hours <= 0)
     * - WARNING: Current hour >= Warning life
     * - SAFE: Current hour < Warning life
     */
    calculateLaserStatus(currentHour, ratedLife, warningLife) {
        const curr = Number(currentHour) || 0;
        const rated = Number(ratedLife) || 25000;
        const warn = Number(warningLife) || Math.floor(rated * 0.8);

        if (curr >= rated) {
            return 'ALARM';
        } else if (curr >= warn) {
            return 'WARNING';
        } else {
            return 'SAFE';
        }
    },

    /**
     * Calculate equivalent laser age in Years and Days based on current laser hour.
     */
    calculateLaserAge(currentHour) {
        const hrs = Number(currentHour) || 0;
        const years = Math.floor(hrs / 8760);
        const remainDays = Math.floor((hrs % 8760) / 24);
        return { years, remainDays, formattedText: `${years} Years • ${remainDays} Days` };
    },

    /**
     * Calculate days elapsed since last recalibration.
     */
    calculateDaysSinceRecalibration(lastRecalibrationDate, currentTime) {
        const recalMs = new Date(lastRecalibrationDate).getTime();
        const currentMs = new Date(currentTime).getTime();
        if (isNaN(recalMs) || isNaN(currentMs) || currentMs < recalMs) {
            return 0;
        }
        return Math.floor((currentMs - recalMs) / (1000 * 60 * 60 * 24));
    },

    /**
     * Determine Accuracy level based solely on days since last recalibration.
     * 0–30 days -> HIGH (Green)
     * 31–90 days -> MEDIUM (Yellow)
     * >90 days -> LOW (Red)
     */
    calculateAccuracy(daysSinceRecalibration) {
        const days = Number(daysSinceRecalibration) || 0;
        if (days <= 30) {
            return { level: 'HIGH', label: '🟢 HIGH', color: 'var(--green)', code: 'HIGH', icon: '🟢' };
        } else if (days <= 90) {
            return { level: 'MEDIUM', label: '🟡 MEDIUM', color: 'var(--yellow)', code: 'MEDIUM', icon: '🟡' };
        } else {
            return { level: 'LOW', label: '🔴 LOW', color: 'var(--red)', code: 'LOW', icon: '🔴' };
        }
    },

    /**
     * Determine advisory status for next recommended recalibration.
     */
    calculateRecalibrationRecommendation(daysSinceRecalibration) {
        const days = Number(daysSinceRecalibration) || 0;
        if (days <= 30) {
            return { status: 'No Action Required', urgency: 'SAFE', color: 'var(--green)' };
        } else if (days <= 90) {
            return { status: 'Verify During Next Service Visit', urgency: 'WARNING', color: 'var(--yellow)' };
        } else {
            return { status: 'Recalibration Recommended', urgency: 'ALARM', color: 'var(--red)' };
        }
    },

    /**
     * Calculate suggested next recalibration date (30 days from last recalibration).
     */
    calculateNextRecalibrationDate(lastRecalibrationDate) {
        if (!lastRecalibrationDate) return new Date().toISOString().split('T')[0];
        const recalDate = new Date(lastRecalibrationDate);
        if (isNaN(recalDate.getTime())) return new Date().toISOString().split('T')[0];
        const nextDate = new Date(recalDate);
        nextDate.setDate(nextDate.getDate() + 30);
        if (isNaN(nextDate.getTime())) return new Date().toISOString().split('T')[0];
        try {
            return nextDate.toISOString().split('T')[0];
        } catch (e) {
            return new Date().toISOString().split('T')[0];
        }
    },

    /**
     * Calculate estimated End-of-Life date based on rated life and continuous 24h consumption.
     */
    calculateEstimatedEndOfLifeDate(currentHour, ratedLife, currentTime) {
        const remainingHours = this.calculateRemainingHours(currentHour, ratedLife);
        let now = currentTime ? new Date(currentTime) : new Date();
        if (isNaN(now.getTime())) now = new Date();
        if (remainingHours <= 0) {
            return 'EXCEEDED';
        }
        const eolMs = now.getTime() + (remainingHours * 3600 * 1000);
        const eolDate = new Date(eolMs);
        if (isNaN(eolDate.getTime())) return 'N/A';
        try {
            return eolDate.toISOString().split('T')[0];
        } catch (e) {
            return 'N/A';
        }
    },

    /**
     * Calculate deviation between actual machine hour meter reading and estimated hour.
     * Deviation = Actual Hour - Estimated Hour
     */
    calculateDeviation(actualHour, estimatedHour) {
        return Number(actualHour) - Number(estimatedHour);
    },

    /**
     * Rating scale based on deviation absolute difference.
     */
    calculateDeviationRating(differenceHours) {
        const absDiff = Math.abs(Number(differenceHours) || 0);
        let rating = '';
        let label = '';
        let warningMsg = null;

        if (absDiff <= 10) {
            rating = '★★★★★ Excellent';
            label = 'Excellent';
        } else if (absDiff <= 25) {
            rating = '★★★★☆ Very Good';
            label = 'Very Good';
        } else if (absDiff <= 50) {
            rating = '★★★☆☆ Good';
            label = 'Good';
        } else if (absDiff <= 100) {
            rating = '★★☆☆☆ Fair';
            label = 'Fair';
        } else {
            rating = '★☆☆☆☆ Poor';
            label = 'Poor';
            warningMsg = 'Laser head experienced extended downtime or deviation. Baseline updated.';
        }

        return { absDiff, rating, label, warningMsg };
    },

    /**
     * Calculate metrics for an individual laser head.
     */
    calculateLaserMetrics(laser, currentTime) {
        let now = currentTime ? new Date(currentTime) : new Date();
        if (isNaN(now.getTime())) now = new Date();

        const validBaseHour = (typeof laser.baseLaserHour === 'number' && !isNaN(laser.baseLaserHour));
        const validBaseTs = !!(laser.baseTimestamp && !isNaN(new Date(laser.baseTimestamp).getTime()));
        const hasValidBaseline = validBaseHour && validBaseTs;

        const ratedLife = Number(laser.ratedLife) || 25000;
        const warningLife = Number(laser.warningLife) || 20000;
        const contingencyCeiling = Number(laser.contingencyCeiling) || (ratedLife + 3000);

        if (!hasValidBaseline) {
            return {
                id: laser.id,
                name: laser.name || 'Laser Head',
                serialNo: laser.serialNo || '',
                baseLaserHour: validBaseHour ? laser.baseLaserHour : null,
                baseTimestamp: validBaseTs ? laser.baseTimestamp : null,
                ratedLife,
                warningLife,
                contingencyCeiling,
                isContingencyActive: false,
                hoursExceeded: 0,
                contingencyMargin: null,
                warningMessage: "Record the current physical laser hour-meter reading and capture date/time to begin automatic runtime estimation.",
                currentHour: null,
                currentHourRaw: null,
                estimatedCurrentHour: null,
                recommendedRemainingHour: null,
                remainingDays: null,
                remainingTotal: null,
                lifeRemainingPercent: null,
                formattedLifeRemaining: '—',
                status: 'BASELINE_REQUIRED',
                runtimeState: 'BASELINE_REQUIRED',
                baselineRequired: true,
                estimatedRecommendedEOL: null,
                contingencyActive: false,
                remainingDaysInfo: {
                    daysVal: '—',
                    statusMsg: 'Baseline Required',
                    urgency: 'BASELINE_REQUIRED',
                    formattedText: '—'
                },
                recommendedLimitInfo: {
                    daysText: '—',
                    subText: 'Baseline Required',
                    dateFormatted: '—',
                    isExceeded: false
                },
                daysSinceRecal: null,
                accuracy: { level: 'UNKNOWN', label: '⚪ UNKNOWN', color: 'var(--muted)', code: 'UNKNOWN', icon: '⚪' },
                recalRecommendation: { status: 'Baseline Required', urgency: 'BASELINE_REQUIRED', color: 'var(--muted)' },
                nextRecalDate: '—',
                eolDate: '—',
                age: { years: null, remainDays: null, formattedText: '—' },
                lastRecalibrationDate: laser.lastRecalibrationDate || null,
                calibrationHistory: Array.isArray(laser.calibrationHistory) ? laser.calibrationHistory : []
            };
        }

        const baseHour = Number(laser.baseLaserHour);
        const baseTs = laser.baseTimestamp;

        const currentHour = this.calculateEstimatedHour(baseHour, baseTs, now);
        const remainingTotal = this.calculateRemainingHours(currentHour, ratedLife);
        const lifeRemainingPercent = this.calculateLifeRemainingPercent(remainingTotal, ratedLife);
        const formattedLifeRemaining = formatLifeRemainingPercent(lifeRemainingPercent);
        const status = this.calculateLaserStatus(currentHour, ratedLife, warningLife);
        const remainingDaysInfo = this.calculateRemainingDaysInfo(remainingTotal, ratedLife, warningLife);
        const age = this.calculateLaserAge(currentHour);

        const isContingencyActive = currentHour >= ratedLife;
        const hoursExceeded = isContingencyActive ? Math.round((currentHour - ratedLife) * 10) / 10 : 0;
        const contingencyMargin = isContingencyActive ? Math.max(0, Math.round((contingencyCeiling - currentHour) * 10) / 10) : null;

        let warningMessage = "";
        if (status === 'WARNING') {
            warningMessage = "REPLACEMENT PLANNING REQUIRED • RECOMMENDED LIFE LIMIT APPROACHING";
        } else if (status === 'ALARM') {
            warningMessage = "RECOMMENDED LASER LIFE EXCEEDED";
        }

        const recalDateValid = laser.lastRecalibrationDate && !isNaN(new Date(laser.lastRecalibrationDate).getTime());
        const recalTs = recalDateValid ? laser.lastRecalibrationDate : baseTs;
        const daysSinceRecal = this.calculateDaysSinceRecalibration(recalTs, now);
        const accuracy = this.calculateAccuracy(daysSinceRecal);
        const recalRecommendation = this.calculateRecalibrationRecommendation(daysSinceRecal);
        const nextRecalDate = this.calculateNextRecalibrationDate(recalTs);
        const eolDate = this.calculateEstimatedEndOfLifeDate(currentHour, ratedLife, now);

        let limitDateFormatted = 'N/A';
        let limitDaysText = '';
        let limitSubText = '';

        if (!isContingencyActive) {
            const remainingMs = Math.max(0, remainingTotal) * 3600 * 1000;
            const limitTimestamp = now.getTime() + remainingMs;
            limitDateFormatted = formatDate(limitTimestamp);

            if (remainingTotal < 24 && remainingTotal >= 0) {
                limitDaysText = '<1 day';
            } else {
                const days = Math.floor(remainingTotal / 24);
                limitDaysText = `${days.toLocaleString()} days`;
            }
            limitSubText = `Est. ${limitDateFormatted}`;
        } else {
            const exceededMs = hoursExceeded * 3600 * 1000;
            const exceededTimestamp = now.getTime() - exceededMs;
            limitDateFormatted = formatDate(exceededTimestamp);

            const daysOverdue = Math.floor(hoursExceeded / 24);
            if (daysOverdue < 1) {
                limitDaysText = '<1 day overdue';
            } else {
                limitDaysText = `${daysOverdue.toLocaleString()} days overdue`;
            }
            limitSubText = `Exceeded ${limitDateFormatted}`;
        }

        const recommendedLimitInfo = {
            daysText: limitDaysText,
            subText: limitSubText,
            dateFormatted: limitDateFormatted,
            isExceeded: isContingencyActive
        };

        return {
            id: laser.id,
            name: laser.name || 'Laser Head',
            serialNo: laser.serialNo || '',
            baseLaserHour: baseHour,
            baseTimestamp: baseTs,
            ratedLife,
            warningLife,
            contingencyCeiling,
            isContingencyActive,
            hoursExceeded,
            contingencyMargin,
            warningMessage,
            currentHour: Math.round(currentHour * 10) / 10,
            currentHourRaw: currentHour,
            estimatedCurrentHour: Math.round(currentHour * 10) / 10,
            recommendedRemainingHour: Math.round(remainingTotal * 10) / 10,
            remainingDays: remainingDaysInfo.daysVal,
            remainingTotal: Math.round(remainingTotal * 10) / 10,
            lifeRemainingPercent,
            formattedLifeRemaining,
            status,
            runtimeState: 'NORMAL',
            baselineRequired: false,
            estimatedRecommendedEOL: eolDate,
            contingencyActive: isContingencyActive,
            remainingDaysInfo,
            recommendedLimitInfo,
            daysSinceRecal,
            accuracy,
            recalRecommendation,
            nextRecalDate,
            eolDate,
            age,
            lastRecalibrationDate: recalTs,
            calibrationHistory: Array.isArray(laser.calibrationHistory) ? laser.calibrationHistory : []
        };
    },

    /**
     * Calculate machine metrics across all of its laser heads.
     * Uses "WORST STATE WINS" logic (ALARM > BASELINE_REQUIRED > WARNING > SAFE) for overall machine status.
     */
    calculateMachineMetrics(machine, currentTime) {
        let now = currentTime ? new Date(currentTime) : new Date();
        if (isNaN(now.getTime())) now = new Date();

        // Check if machine has lasers array
        let lasers = Array.isArray(machine.lasers) && machine.lasers.length > 0 ? machine.lasers : [];

        if (lasers.length === 0) {
            // Fallback for single legacy machine format
            const validBaseTs = (machine.baseTimestamp && !isNaN(new Date(machine.baseTimestamp).getTime())) ? machine.baseTimestamp : null;
            const validBaseHour = (typeof machine.baseLaserHour === 'number' && !isNaN(machine.baseLaserHour)) ? machine.baseLaserHour : null;
            const fallbackLaser = {
                id: (machine.id || 'L-101') + '-L1',
                name: 'Laser Head 1',
                serialNo: machine.serialNo || '',
                ratedLife: Number(machine.ratedLife) || 25000,
                warningLife: Number(machine.warningLife) || Math.floor((Number(machine.ratedLife) || 25000) * 0.8),
                baseLaserHour: validBaseHour,
                baseTimestamp: validBaseTs,
                lastRecalibrationDate: (machine.lastRecalibrationDate && !isNaN(new Date(machine.lastRecalibrationDate).getTime())) ? machine.lastRecalibrationDate : null,
                calibrationHistory: Array.isArray(machine.calibrationHistory) ? machine.calibrationHistory : []
            };
            lasers = [fallbackLaser];
        }

        const laserMetricsList = lasers.map(l => this.calculateLaserMetrics(l, now));

        // Determine aggregate status (Worst State Wins: ALARM > BASELINE_REQUIRED > WARNING > SAFE)
        let safeCount = 0;
        let warningCount = 0;
        let alarmCount = 0;
        let baselineRequiredCount = 0;

        laserMetricsList.forEach(lm => {
            if (lm.status === 'ALARM') alarmCount++;
            else if (lm.status === 'BASELINE_REQUIRED') baselineRequiredCount++;
            else if (lm.status === 'WARNING') warningCount++;
            else safeCount++;
        });

        let machineStatus = 'SAFE';
        if (alarmCount > 0) machineStatus = 'ALARM';
        else if (baselineRequiredCount > 0) machineStatus = 'BASELINE_REQUIRED';
        else if (warningCount > 0) machineStatus = 'WARNING';

        // Identify most critical laser head (lowest life remaining % or worst status)
        let mostCriticalLaser = laserMetricsList[0];
        const statusPriority = { ALARM: 4, BASELINE_REQUIRED: 3, WARNING: 2, SAFE: 1 };

        laserMetricsList.forEach(lm => {
            const currentPri = statusPriority[mostCriticalLaser.status] || 0;
            const targetPri = statusPriority[lm.status] || 0;

            if (targetPri > currentPri) {
                mostCriticalLaser = lm;
            } else if (targetPri === currentPri) {
                const targetPct = (typeof lm.lifeRemainingPercent === 'number' && lm.lifeRemainingPercent !== null) ? lm.lifeRemainingPercent : -1;
                const currentPct = (typeof mostCriticalLaser.lifeRemainingPercent === 'number' && mostCriticalLaser.lifeRemainingPercent !== null) ? mostCriticalLaser.lifeRemainingPercent : -1;
                if (targetPct < currentPct) {
                    mostCriticalLaser = lm;
                }
            }
        });

        // Calculate Average Life Remaining % across valid lasers
        const validPctLasers = laserMetricsList.filter(l => typeof l.lifeRemainingPercent === 'number' && l.lifeRemainingPercent !== null);
        const totalLifePct = validPctLasers.reduce((acc, l) => acc + l.lifeRemainingPercent, 0);
        const avgLifeRemaining = validPctLasers.length > 0 ? totalLifePct / validPctLasers.length : null;
        const formattedAvgLifeRemaining = avgLifeRemaining !== null ? formatLifeRemainingPercent(avgLifeRemaining) : '—';

        return {
            status: machineStatus,
            totalLasers: laserMetricsList.length,
            safeCount,
            warningCount,
            alarmCount,
            baselineRequiredCount,
            avgLifeRemaining: avgLifeRemaining !== null ? Math.round(avgLifeRemaining * 10) / 10 : null,
            formattedAvgLifeRemaining,
            laserMetricsList,
            mostCriticalLaser,
            // Backwards compatibility shortcuts mapped to most critical laser
            currentHour: mostCriticalLaser.currentHour !== null ? mostCriticalLaser.currentHour : '—',
            currentHourRaw: mostCriticalLaser.currentHourRaw,
            remainingTotal: mostCriticalLaser.remainingTotal !== null ? mostCriticalLaser.remainingTotal : '—',
            remainingDaysInfo: mostCriticalLaser.remainingDaysInfo,
            recommendedLimitInfo: mostCriticalLaser.recommendedLimitInfo,
            lifeRemainingPercent: mostCriticalLaser.lifeRemainingPercent,
            formattedLifeRemaining: mostCriticalLaser.formattedLifeRemaining,
            accuracy: mostCriticalLaser.accuracy,
            daysSinceRecal: mostCriticalLaser.daysSinceRecal,
            recalRecommendation: mostCriticalLaser.recalRecommendation,
            nextRecalDate: mostCriticalLaser.nextRecalDate,
            eolDate: mostCriticalLaser.eolDate,
            age: mostCriticalLaser.age,
            lastRecalibrationDate: mostCriticalLaser.lastRecalibrationDate,
            healthPercent: mostCriticalLaser.lifeRemainingPercent,
            baselineRequired: mostCriticalLaser.baselineRequired || baselineRequiredCount > 0
        };
    },

    /**
     * Perform Recalibration logic for a specific laser head in a machine.
     */
    executeRecalibration(machine, laserId, actualHour, reason, timestamp) {
        let recalTime = timestamp ? new Date(timestamp) : new Date();
        if (isNaN(recalTime.getTime())) recalTime = new Date();
        const recalISO = recalTime.toISOString();

        const lasers = Array.isArray(machine.lasers) ? [...machine.lasers] : [];
        const laserIndex = lasers.findIndex(l => l.id === laserId) >= 0 ? lasers.findIndex(l => l.id === laserId) : 0;
        const targetLaser = lasers[laserIndex];

        if (!targetLaser) {
            throw new Error(`Laser ${laserId} not found in machine`);
        }

        const currentEstimated = this.calculateEstimatedHour(targetLaser.baseLaserHour, targetLaser.baseTimestamp, recalTime);
        const diff = this.calculateDeviation(actualHour, currentEstimated);
        const ratingInfo = this.calculateDeviationRating(diff);

        let dateStr = 'N/A';
        let timeStr = '00:00';
        try {
            dateStr = recalTime.toISOString().split('T')[0];
            timeStr = recalTime.toTimeString().split(' ')[0].substring(0, 5);
        } catch (e) {
            const fallback = new Date();
            dateStr = fallback.toISOString().split('T')[0];
            timeStr = fallback.toTimeString().split(' ')[0].substring(0, 5);
        }

        const historyRecord = {
            date: dateStr,
            time: timeStr,
            laserId: targetLaser.id,
            laserName: targetLaser.name,
            estimatedHour: Math.round(currentEstimated * 10) / 10,
            actualHour: Number(actualHour),
            difference: Math.round(diff * 10) / 10,
            reason: reason || 'Manual Verification',
            rating: ratingInfo.rating
        };

        const existingLaserHistory = Array.isArray(targetLaser.calibrationHistory) ? targetLaser.calibrationHistory : [];
        const updatedLaserHistory = [historyRecord, ...existingLaserHistory].slice(0, 10);

        lasers[laserIndex] = {
            ...targetLaser,
            baseLaserHour: Number(actualHour),
            baseTimestamp: recalISO,
            lastRecalibrationDate: recalISO,
            calibrationHistory: updatedLaserHistory
        };

        const updatedMachine = {
            ...machine,
            lasers,
            lastUpdated: recalISO
        };

        return {
            updatedMachine,
            analysis: {
                laserName: targetLaser.name,
                estimatedHour: Math.round(currentEstimated * 10) / 10,
                actualHour: Number(actualHour),
                difference: Math.round(diff * 10) / 10,
                ratingInfo
            }
        };
    },

    /**
     * Add a new laser head to a machine.
     */
    addLaserToMachine(machine, laserData) {
        const lasers = Array.isArray(machine.lasers) ? [...machine.lasers] : [];
        const newIndex = lasers.length + 1;
        const validTs = (laserData.baseTimestamp && !isNaN(new Date(laserData.baseTimestamp).getTime())) ? laserData.baseTimestamp : null;
        const newLaser = {
            id: `${machine.id}-L${Date.now().toString().slice(-4)}`,
            name: laserData.name || `Laser Head ${newIndex}`,
            serialNo: laserData.serialNo || `${machine.serialNo || 'SN'}-L${newIndex}`,
            ratedLife: Number(laserData.ratedLife) || 25000,
            warningLife: Number(laserData.warningLife) || Math.floor((Number(laserData.ratedLife) || 25000) * 0.8),
            baseLaserHour: (typeof laserData.baseLaserHour === 'number' && !isNaN(laserData.baseLaserHour)) ? laserData.baseLaserHour : null,
            baseTimestamp: validTs,
            lastRecalibrationDate: validTs,
            calibrationHistory: []
        };

        lasers.push(newLaser);
        return {
            ...machine,
            lasers,
            lastUpdated: new Date().toISOString()
        };
    },

    /**
     * Update an existing laser head parameters.
     */
    updateLaserInMachine(machine, laserId, laserData) {
        const lasers = Array.isArray(machine.lasers) ? [...machine.lasers] : [];
        const index = lasers.findIndex(l => l.id === laserId);
        if (index === -1) return machine;

        lasers[index] = {
            ...lasers[index],
            name: laserData.name || lasers[index].name,
            serialNo: laserData.serialNo || lasers[index].serialNo,
            ratedLife: Number(laserData.ratedLife) || lasers[index].ratedLife,
            warningLife: Number(laserData.warningLife) || lasers[index].warningLife,
            ...(typeof laserData.baseLaserHour === 'number' ? { baseLaserHour: laserData.baseLaserHour } : {})
        };

        return {
            ...machine,
            lasers,
            lastUpdated: new Date().toISOString()
        };
    },

    /**
     * Delete a laser head from a machine (if > 1 laser exists).
     */
    deleteLaserFromMachine(machine, laserId) {
        const lasers = Array.isArray(machine.lasers) ? [...machine.lasers] : [];
        if (lasers.length <= 1) {
            throw new Error('A machine must have at least one laser head.');
        }

        const filtered = lasers.filter(l => l.id !== laserId);
        return {
            ...machine,
            lasers: filtered,
            lastUpdated: new Date().toISOString()
        };
    }
};

window.LaserEngine = LaserEngine;


