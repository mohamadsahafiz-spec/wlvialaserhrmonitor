/* =====================================================
   UTILS.JS - Helper Functions & Date/String Utilities
   ===================================================== */

/**
 * Format hours to string without comma separators.
 */
export function formatHours(val) {
    const num = Number(val) || 0;
    return String(Math.round(num));
}

export function safeToISOString(val, fallback = null) {
    if (!val) return fallback;
    try {
        const date = new Date(val);
        if (isNaN(date.getTime())) return fallback;
        return date.toISOString();
    } catch (e) {
        return fallback;
    }
}

export function safeToDatetimeLocal(val, fallback = '') {
    const iso = safeToISOString(val, null);
    if (!iso) return fallback;
    return iso.slice(0, 16);
}

/**
 * Format ISO date string to localized date string (DD MMM YYYY e.g. 30 Nov 2027).
 */
export function formatDate(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return 'N/A';
    }
}

/**
 * Format ISO date string to localized Date & Time string.
 */
export function formatDateTime(isoString) {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'N/A';
    }
}

/**
 * Get URL query parameter by name.
 */
export function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

/**
 * Set or update URL query parameter without full reload.
 */
export function setQueryParam(name, val) {
    const url = new URL(window.location.href);
    if (val) {
        url.searchParams.set(name, val);
    } else {
        url.searchParams.delete(name);
    }
    window.history.pushState({}, '', url);
}

/**
 * Calculate simulated time based on selected simulation date and current wall-clock time.
 */
export function getCurrentEvalTime(simulatedDateStr) {
    const now = new Date();
    if (!simulatedDateStr) return now;
    const simDate = new Date(simulatedDateStr);
    if (isNaN(simDate.getTime())) return now;
    simDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    return simDate;
}

/**
 * Generate ISO date string shifted by specified days relative to today.
 */
export function dateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}
