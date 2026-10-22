import { Document } from 'mongoose';
export type PayrollSlipDocument = PayrollSlip & Document;
export declare enum PayrollSlipStatus {
    GENERATED = "GENERATED",
    PAID = "PAID",
    CANCELLED = "CANCELLED"
}
export declare class PayrollSlip {
    slipId: string;
    companyId: string;
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    designation?: string;
    departmentName?: string;
    branchName?: string;
    month: string;
    baseSalary: number;
    workingDays: number;
    presentDays: number;
    absentDays: number;
    paidLeaveDays?: number;
    unpaidLeaveDays?: number;
    lopDays?: number;
    lopDeductions?: number;
    lateDays: number;
    overtimeHours: number;
    lateDeductions: number;
    taxPercentage?: number;
    taxDeductions?: number;
    overtimeBonus: number;
    customBonus?: number;
    fuelAllowance?: number;
    otherAllowances?: number;
    otherDeductions?: number;
    grossEarnings?: number;
    totalDeductions?: number;
    netSalary: number;
    netPayInWords?: string;
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
    templateVersion?: number;
    templateSnapshot?: Record<string, any>;
    pdfUrl?: string;
    isPasswordProtected?: boolean;
    pdfPasswordHint?: string;
    pdfPassword?: string;
    eSignHash?: string;
    eSignedAt?: Date;
    emailSent?: boolean;
    emailSentAt?: Date;
    status: PayrollSlipStatus;
    bankDetails?: {
        bankName?: string;
        accountTitle?: string;
        accountNumber?: string;
        iban?: string;
    };
    paidAt?: Date;
    notes?: string;
}
export declare const PayrollSlipSchema: import("mongoose").Schema<PayrollSlip, import("mongoose").Model<PayrollSlip, any, any, any, Document<unknown, any, PayrollSlip, any, {}> & PayrollSlip & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PayrollSlip, Document<unknown, {}, import("mongoose").FlatRecord<PayrollSlip>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<PayrollSlip> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
