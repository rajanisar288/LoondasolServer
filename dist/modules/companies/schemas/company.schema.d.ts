import { Document } from 'mongoose';
import { RegionCode } from '../../../common/constants/regions.constant';
export type CompanyDocument = Company & Document;
export declare enum SubscriptionPlan {
    FREE_TRIAL = "FREE_TRIAL",
    STARTER = "STARTER",
    PRO = "PRO",
    ENTERPRISE = "ENTERPRISE",
    ULTRA = "ULTRA"
}
export declare enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    TRIALING = "TRIALING",
    PAST_DUE = "PAST_DUE",
    CANCELED = "CANCELED",
    EXPIRED = "EXPIRED"
}
export declare class WorkingHoursConfig {
    enabled: boolean;
    startTime: string;
    endTime: string;
    workingDays: number[];
    loginRestriction: boolean;
    lateGracePeriodMinutes?: number;
}
export declare class SubscriptionConfig {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    purchasedSeats: number;
    pricePerSeat: number;
    aiRequestLimit: number;
    aiRequestsUsedThisMonth: number;
    aiCycleResetDate?: Date;
    trialEndsAt?: Date;
    currentPeriodEnd?: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
}
export declare class OnboardingConfig {
    requireCnic: boolean;
    requireAddress: boolean;
    requireBankDetails: boolean;
    allowBranchCustomForms: boolean;
    allowBranchDepartments: boolean;
}
export declare class SalaryComponentConfig {
    id: string;
    name: string;
    type: 'EARNING' | 'DEDUCTION';
    calcMode: 'FIXED' | 'PERCENTAGE_OF_BASE' | 'FORMULA';
    value: number;
    formula?: string;
    enabled: boolean;
}
export declare class PayrollConfig {
    lateFineType: string;
    lateFineValue: number;
    overtimeMultiplier: number;
    salaryPayDay: number;
    autoSalarySlipEnabled: boolean;
    autoSendEmail?: boolean;
    defaultTaxPercentage: number;
    enableLopDeduction?: boolean;
    standardWorkingDays?: number;
    passwordProtectPdf?: boolean;
    pdfPasswordRule?: string;
    templateVersion?: number;
    templateLayout?: string;
    primaryColor?: string;
    headerTitle?: string;
    headerSubtitle?: string;
    headerCustomNote?: string;
    headerAlignment?: string;
    footerText?: string;
    footerDisclaimer?: string;
    showCompanyLogo?: boolean;
    showEmployeeId?: boolean;
    showDesignation?: boolean;
    showDepartment?: boolean;
    showBranch?: boolean;
    showAttendanceSummary?: boolean;
    showPaidLeaves?: boolean;
    showLopDays?: boolean;
    showOvertimeHours?: boolean;
    showLateArrivals?: boolean;
    showBankDetails?: boolean;
    showTaxBreakdown?: boolean;
    showNetPayInWords?: boolean;
    numberWordsFormat?: string;
    showSignature?: boolean;
    signatureImageUrl?: string;
    signatoryName?: string;
    signatoryTitle?: string;
    enableESignStamp?: boolean;
    customComponents?: SalaryComponentConfig[];
}
export declare class LeaveTypeConfig {
    id: string;
    name: string;
    quota: number;
    monthlyLimit?: number;
    isPaid: boolean;
}
export declare class LeavePolicyConfig {
    totalYearlyQuota: number;
    monthlyLimit: number;
    leaveTypes: LeaveTypeConfig[];
}
export declare class SocialPlatformConfig {
    username?: string;
    password?: string;
    apiKey?: string;
    connected: boolean;
}
export declare class SocialMediaConfig {
    linkedin: SocialPlatformConfig;
    twitter: SocialPlatformConfig;
    facebook: SocialPlatformConfig;
    instagram: SocialPlatformConfig;
}
export declare class Company {
    companyId: string;
    name: string;
    email: string;
    phone?: string;
    registrationNumber?: string;
    website?: string;
    industry?: string;
    companySize?: string;
    logoUrl?: string;
    country: string;
    city?: string;
    state?: string;
    postalCode?: string;
    address?: string;
    region: RegionCode;
    timezone: string;
    currency: string;
    workingHours: WorkingHoursConfig;
    subscription: SubscriptionConfig;
    onboardingConfig: OnboardingConfig;
    payrollConfig: PayrollConfig;
    leavePolicy: LeavePolicyConfig;
    topPerformerEnabled: boolean;
    socialMedia: SocialMediaConfig;
    status?: string;
    ownerId: string;
}
export declare const CompanySchema: import("mongoose").Schema<Company, import("mongoose").Model<Company, any, any, any, Document<unknown, any, Company, any, {}> & Company & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Company, Document<unknown, {}, import("mongoose").FlatRecord<Company>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Company> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
