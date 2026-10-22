import { PayrollSlipStatus } from '../schemas/payroll-slip.schema';
export declare class GeneratePayrollDto {
    month: string;
    employeeIds?: string[];
    sendEmails?: boolean;
}
export declare class UpdateSlipStatusDto {
    status: PayrollSlipStatus;
    notes?: string;
}
export declare class CustomizePayrollSlipDto {
    baseSalary?: number;
    customBonus?: number;
    fuelAllowance?: number;
    otherAllowances?: number;
    otherDeductions?: number;
    overtimeBonus?: number;
    lateDeductions?: number;
    lopDeductions?: number;
    taxDeductions?: number;
    earningsBreakdown?: Array<{
        id: string;
        name: string;
        amount: number;
        calcMode?: string;
        formula?: string;
        isManual?: boolean;
    }>;
    deductionsBreakdown?: Array<{
        id: string;
        name: string;
        amount: number;
        calcMode?: string;
        formula?: string;
        isManual?: boolean;
    }>;
    notes?: string;
}
export declare class BulkEmailPayrollDto {
    month: string;
    slipIds?: string[];
}
export declare class PreviewPayrollHtmlDto {
    templateConfig?: Record<string, any>;
}
