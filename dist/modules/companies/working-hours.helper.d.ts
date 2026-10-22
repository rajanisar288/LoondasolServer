import { WorkingHoursConfig } from './schemas/company.schema';
export interface WorkingHoursValidationResult {
    allowed: boolean;
    code?: 'COMPANY_OUTSIDE_WORKING_HOURS' | 'RESTRICTION_DISABLED';
    message?: string;
}
export declare function validateCompanyWorkingHours(config?: WorkingHoursConfig, timezone?: string): WorkingHoursValidationResult;
