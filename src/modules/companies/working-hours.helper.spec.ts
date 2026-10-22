import { validateCompanyWorkingHours } from './working-hours.helper';
import { WorkingHoursConfig } from './schemas/company.schema';

describe('validateCompanyWorkingHours (Access Windows)', () => {
  it('should allow access when loginRestriction is false', () => {
    const config: WorkingHoursConfig = {
      enabled: true,
      loginRestriction: false,
      startTime: '09:00',
      endTime: '18:00',
      workingDays: [1, 2, 3, 4, 5],
    };

    const result = validateCompanyWorkingHours(config, 'UTC');
    expect(result.allowed).toBe(true);
    expect(result.code).toBe('RESTRICTION_DISABLED');
  });

  it('should allow access when working hours restriction is not enabled', () => {
    const config: WorkingHoursConfig = {
      enabled: false,
      loginRestriction: true,
      startTime: '09:00',
      endTime: '18:00',
      workingDays: [1, 2, 3, 4, 5],
    };

    const result = validateCompanyWorkingHours(config, 'UTC');
    expect(result.allowed).toBe(true);
  });

  it('should restrict access on non-working days', () => {
    const config: WorkingHoursConfig = {
      enabled: true,
      loginRestriction: true,
      startTime: '00:00',
      endTime: '23:59',
      workingDays: [], // No days allowed
    };

    const result = validateCompanyWorkingHours(config, 'UTC');
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('COMPANY_OUTSIDE_WORKING_HOURS');
  });
});
