export declare class UpdateWorkingHoursDto {
    enabled?: boolean;
    startTime?: string;
    endTime?: string;
    workingDays?: number[];
    loginRestriction?: boolean;
    lateGracePeriodMinutes?: number;
}
export declare class UpdateOnboardingConfigDto {
    requireCnic?: boolean;
    requireAddress?: boolean;
    requireBankDetails?: boolean;
    allowBranchCustomForms?: boolean;
    allowBranchDepartments?: boolean;
}
export declare class UpdateSalaryComponentDto {
    id: string;
    name: string;
    type: 'EARNING' | 'DEDUCTION';
    calcMode: 'FIXED' | 'PERCENTAGE_OF_BASE' | 'FORMULA';
    value?: number;
    formula?: string;
    enabled?: boolean;
}
export declare class UpdatePayrollConfigDto {
    lateFineType?: string;
    lateFineValue?: number;
    overtimeMultiplier?: number;
    salaryPayDay?: number;
    autoSalarySlipEnabled?: boolean;
    autoSendEmail?: boolean;
    defaultTaxPercentage?: number;
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
    signatureImageUrl?: boolean | string;
    signatoryName?: string;
    signatoryTitle?: string;
    enableESignStamp?: boolean;
    customComponents?: UpdateSalaryComponentDto[];
}
export declare class UpdateSocialPlatformDto {
    username?: string;
    password?: string;
    apiKey?: string;
    connected?: boolean;
}
export declare class UpdateSocialMediaDto {
    linkedin?: UpdateSocialPlatformDto;
    twitter?: UpdateSocialPlatformDto;
    facebook?: UpdateSocialPlatformDto;
    instagram?: UpdateSocialPlatformDto;
}
export declare class UpdateLeaveTypeDto {
    id: string;
    name: string;
    quota: number;
    monthlyLimit?: number;
    isPaid: boolean;
}
export declare class UpdateLeavePolicyDto {
    totalYearlyQuota?: number;
    monthlyLimit?: number;
    leaveTypes?: UpdateLeaveTypeDto[];
}
export declare class UpdateCompanyDto {
    name?: string;
    phone?: string;
    website?: string;
    industry?: string;
    companySize?: string;
    logoUrl?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    address?: string;
    timezone?: string;
    currency?: string;
    workingHours?: UpdateWorkingHoursDto;
    onboardingConfig?: UpdateOnboardingConfigDto;
    payrollConfig?: UpdatePayrollConfigDto;
    leavePolicy?: UpdateLeavePolicyDto;
    socialMedia?: UpdateSocialMediaDto;
    topPerformerEnabled?: boolean;
    topPerformerEvalDay?: number;
}
