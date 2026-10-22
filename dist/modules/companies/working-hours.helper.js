"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCompanyWorkingHours = validateCompanyWorkingHours;
function validateCompanyWorkingHours(config, timezone = 'UTC') {
    if (!config || !config.enabled || !config.loginRestriction) {
        return { allowed: true, code: 'RESTRICTION_DISABLED' };
    }
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour12: false,
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
        const parts = formatter.formatToParts(now);
        const hourPart = parts.find((p) => p.type === 'hour')?.value || '00';
        const minutePart = parts.find((p) => p.type === 'minute')?.value || '00';
        const dayOfWeek = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getDay();
        if (!config.workingDays.includes(dayOfWeek)) {
            return {
                allowed: false,
                code: 'COMPANY_OUTSIDE_WORKING_HOURS',
                message: 'Your company is currently outside its allowed login hours.',
            };
        }
        const currentMinutes = parseInt(hourPart, 10) * 60 + parseInt(minutePart, 10);
        const [startH, startM] = config.startTime
            .split(':')
            .map((s) => parseInt(s, 10));
        const [endH, endM] = config.endTime.split(':').map((s) => parseInt(s, 10));
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        if (startMinutes <= endMinutes) {
            const isWithin = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
            if (!isWithin) {
                return {
                    allowed: false,
                    code: 'COMPANY_OUTSIDE_WORKING_HOURS',
                    message: 'Your company is currently outside its allowed login hours.',
                };
            }
        }
        else {
            const isWithin = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
            if (!isWithin) {
                return {
                    allowed: false,
                    code: 'COMPANY_OUTSIDE_WORKING_HOURS',
                    message: 'Your company is currently outside its allowed login hours.',
                };
            }
        }
        return { allowed: true };
    }
    catch {
        return { allowed: true };
    }
}
//# sourceMappingURL=working-hours.helper.js.map