import { WorkingHoursConfig } from './schemas/company.schema';

export interface WorkingHoursValidationResult {
  allowed: boolean;
  code?: 'COMPANY_OUTSIDE_WORKING_HOURS' | 'RESTRICTION_DISABLED';
  message?: string;
}

// Validates whether current time falls within company operating hours for restricted logins
export function validateCompanyWorkingHours(
  config?: WorkingHoursConfig,
  timezone = 'UTC',
): WorkingHoursValidationResult {
  if (!config || !config.enabled || !config.loginRestriction) {
    return { allowed: true, code: 'RESTRICTION_DISABLED' };
  }

  try {
    // Determine current weekday and time formatted in company timezone
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

    // Get 0-indexed day: 0 = Sunday, 1 = Monday ... 6 = Saturday
    const dayOfWeek = new Date(
      now.toLocaleString('en-US', { timeZone: timezone }),
    ).getDay();

    // Verify if current weekday is an allowed working day
    if (!config.workingDays.includes(dayOfWeek)) {
      return {
        allowed: false,
        code: 'COMPANY_OUTSIDE_WORKING_HOURS',
        message: 'Your company is currently outside its allowed login hours.',
      };
    }

    const currentMinutes =
      parseInt(hourPart, 10) * 60 + parseInt(minutePart, 10);

    const [startH, startM] = config.startTime
      .split(':')
      .map((s) => parseInt(s, 10));
    const [endH, endM] = config.endTime.split(':').map((s) => parseInt(s, 10));

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Normal shift (e.g. 09:00 to 18:00)
    if (startMinutes <= endMinutes) {
      const isWithin =
        currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      if (!isWithin) {
        return {
          allowed: false,
          code: 'COMPANY_OUTSIDE_WORKING_HOURS',
          message: 'Your company is currently outside its allowed login hours.',
        };
      }
    } else {
      // Overnight shift (e.g. 22:00 to 06:00)
      const isWithin =
        currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      if (!isWithin) {
        return {
          allowed: false,
          code: 'COMPANY_OUTSIDE_WORKING_HOURS',
          message: 'Your company is currently outside its allowed login hours.',
        };
      }
    }

    return { allowed: true };
  } catch {
    // If timezone parsing fails, fall back safely to allowing access
    return { allowed: true };
  }
}
