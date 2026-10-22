"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanySchema = exports.Company = exports.SocialMediaConfig = exports.SocialPlatformConfig = exports.LeavePolicyConfig = exports.LeaveTypeConfig = exports.PayrollConfig = exports.SalaryComponentConfig = exports.OnboardingConfig = exports.SubscriptionConfig = exports.WorkingHoursConfig = exports.SubscriptionStatus = exports.SubscriptionPlan = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["FREE_TRIAL"] = "FREE_TRIAL";
    SubscriptionPlan["PRO"] = "PRO";
    SubscriptionPlan["ULTRA"] = "ULTRA";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["TRIALING"] = "TRIALING";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
    SubscriptionStatus["CANCELED"] = "CANCELED";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
let WorkingHoursConfig = class WorkingHoursConfig {
};
exports.WorkingHoursConfig = WorkingHoursConfig;
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], WorkingHoursConfig.prototype, "enabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: '09:00' }),
    __metadata("design:type", String)
], WorkingHoursConfig.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: '18:00' }),
    __metadata("design:type", String)
], WorkingHoursConfig.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: [Number], default: [1, 2, 3, 4, 5] }),
    __metadata("design:type", Array)
], WorkingHoursConfig.prototype, "workingDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], WorkingHoursConfig.prototype, "loginRestriction", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 15 }),
    __metadata("design:type", Number)
], WorkingHoursConfig.prototype, "lateGracePeriodMinutes", void 0);
exports.WorkingHoursConfig = WorkingHoursConfig = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], WorkingHoursConfig);
let SubscriptionConfig = class SubscriptionConfig {
};
exports.SubscriptionConfig = SubscriptionConfig;
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(SubscriptionPlan),
        default: SubscriptionPlan.FREE_TRIAL,
    }),
    __metadata("design:type", String)
], SubscriptionConfig.prototype, "plan", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(SubscriptionStatus),
        default: SubscriptionStatus.TRIALING,
    }),
    __metadata("design:type", String)
], SubscriptionConfig.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], SubscriptionConfig.prototype, "trialEndsAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], SubscriptionConfig.prototype, "currentPeriodEnd", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], SubscriptionConfig.prototype, "stripeCustomerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], SubscriptionConfig.prototype, "stripeSubscriptionId", void 0);
exports.SubscriptionConfig = SubscriptionConfig = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SubscriptionConfig);
let OnboardingConfig = class OnboardingConfig {
};
exports.OnboardingConfig = OnboardingConfig;
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], OnboardingConfig.prototype, "requireCnic", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], OnboardingConfig.prototype, "requireAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], OnboardingConfig.prototype, "requireBankDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: true }),
    __metadata("design:type", Boolean)
], OnboardingConfig.prototype, "allowBranchCustomForms", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: true }),
    __metadata("design:type", Boolean)
], OnboardingConfig.prototype, "allowBranchDepartments", void 0);
exports.OnboardingConfig = OnboardingConfig = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], OnboardingConfig);
let SalaryComponentConfig = class SalaryComponentConfig {
};
exports.SalaryComponentConfig = SalaryComponentConfig;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SalaryComponentConfig.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], SalaryComponentConfig.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['EARNING', 'DEDUCTION'], default: 'EARNING' }),
    __metadata("design:type", String)
], SalaryComponentConfig.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: ['FIXED', 'PERCENTAGE_OF_BASE', 'FORMULA'],
        default: 'FIXED',
    }),
    __metadata("design:type", String)
], SalaryComponentConfig.prototype, "calcMode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], SalaryComponentConfig.prototype, "value", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], SalaryComponentConfig.prototype, "formula", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], SalaryComponentConfig.prototype, "enabled", void 0);
exports.SalaryComponentConfig = SalaryComponentConfig = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SalaryComponentConfig);
let PayrollConfig = class PayrollConfig {
};
exports.PayrollConfig = PayrollConfig;
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'PERCENTAGE', enum: ['PERCENTAGE', 'FIXED_AMOUNT'] }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "lateFineType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 2 }),
    __metadata("design:type", Number)
], PayrollConfig.prototype, "lateFineValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 1.5 }),
    __metadata("design:type", Number)
], PayrollConfig.prototype, "overtimeMultiplier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 1 }),
    __metadata("design:type", Number)
], PayrollConfig.prototype, "salaryPayDay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "autoSalarySlipEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "autoSendEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 0 }),
    __metadata("design:type", Number)
], PayrollConfig.prototype, "defaultTaxPercentage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "enableLopDeduction", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 22 }),
    __metadata("design:type", Number)
], PayrollConfig.prototype, "standardWorkingDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "passwordProtectPdf", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'EMP_ID_LAST4' }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "pdfPasswordRule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 1 }),
    __metadata("design:type", Number)
], PayrollConfig.prototype, "templateVersion", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        default: 'MODERN_EXECUTIVE',
        enum: ['MODERN_EXECUTIVE', 'CLASSIC_CORPORATE', 'MINIMAL_COMPACT'],
    }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "templateLayout", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '#2A65F6' }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "primaryColor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'SALARY SLIP' }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "headerTitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Official Monthly Remuneration Statement' }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "headerSubtitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "headerCustomNote", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'SPLIT', enum: ['SPLIT', 'CENTERED', 'LEFT'] }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "headerAlignment", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        default: 'This is a computer-generated document and is digitally verified.',
    }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "footerText", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        default: 'Confidential — For Authorized Recipient Only',
    }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "footerDisclaimer", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showCompanyLogo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showEmployeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showDesignation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showDepartment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showBranch", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showAttendanceSummary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showPaidLeaves", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showLopDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showOvertimeHours", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showLateArrivals", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showBankDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showTaxBreakdown", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showNetPayInWords", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        default: 'INTERNATIONAL',
        enum: ['INTERNATIONAL', 'INDIAN_SOUTH_ASIAN'],
    }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "numberWordsFormat", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "showSignature", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "signatureImageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Authorized Signatory' }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "signatoryName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Head of Human Resources & Finance' }),
    __metadata("design:type", String)
], PayrollConfig.prototype, "signatoryTitle", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: true }),
    __metadata("design:type", Boolean)
], PayrollConfig.prototype, "enableESignStamp", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [SalaryComponentConfig],
        default: () => [
            {
                id: 'HRA',
                name: 'House Rent Allowance (HRA)',
                type: 'EARNING',
                calcMode: 'PERCENTAGE_OF_BASE',
                value: 15,
                formula: 'BASE * 0.15',
                enabled: false,
            },
            {
                id: 'MEDICAL',
                name: 'Medical Allowance',
                type: 'EARNING',
                calcMode: 'PERCENTAGE_OF_BASE',
                value: 5,
                formula: 'BASE * 0.05',
                enabled: false,
            },
            {
                id: 'FUEL',
                name: 'Fuel & Conveyance Allowance',
                type: 'EARNING',
                calcMode: 'FIXED',
                value: 150,
                formula: '150',
                enabled: false,
            },
            {
                id: 'PF',
                name: 'Provident Fund (PF)',
                type: 'DEDUCTION',
                calcMode: 'PERCENTAGE_OF_BASE',
                value: 5,
                formula: 'BASE * 0.05',
                enabled: false,
            },
        ],
    }),
    __metadata("design:type", Array)
], PayrollConfig.prototype, "customComponents", void 0);
exports.PayrollConfig = PayrollConfig = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], PayrollConfig);
let LeaveTypeConfig = class LeaveTypeConfig {
};
exports.LeaveTypeConfig = LeaveTypeConfig;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], LeaveTypeConfig.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], LeaveTypeConfig.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 7 }),
    __metadata("design:type", Number)
], LeaveTypeConfig.prototype, "quota", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 2 }),
    __metadata("design:type", Number)
], LeaveTypeConfig.prototype, "monthlyLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: true }),
    __metadata("design:type", Boolean)
], LeaveTypeConfig.prototype, "isPaid", void 0);
exports.LeaveTypeConfig = LeaveTypeConfig = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], LeaveTypeConfig);
let LeavePolicyConfig = class LeavePolicyConfig {
};
exports.LeavePolicyConfig = LeavePolicyConfig;
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 24 }),
    __metadata("design:type", Number)
], LeavePolicyConfig.prototype, "totalYearlyQuota", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 2 }),
    __metadata("design:type", Number)
], LeavePolicyConfig.prototype, "monthlyLimit", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [LeaveTypeConfig],
        default: () => [
            { id: 'ANNUAL', name: 'Annual / Paid Leave', quota: 10, monthlyLimit: 2, isPaid: true },
            { id: 'SICK', name: 'Sick Leave', quota: 7, monthlyLimit: 2, isPaid: true },
            { id: 'CASUAL', name: 'Casual Leave', quota: 7, monthlyLimit: 2, isPaid: true },
        ],
    }),
    __metadata("design:type", Array)
], LeavePolicyConfig.prototype, "leaveTypes", void 0);
exports.LeavePolicyConfig = LeavePolicyConfig = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], LeavePolicyConfig);
let SocialPlatformConfig = class SocialPlatformConfig {
};
exports.SocialPlatformConfig = SocialPlatformConfig;
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], SocialPlatformConfig.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], SocialPlatformConfig.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], SocialPlatformConfig.prototype, "apiKey", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], SocialPlatformConfig.prototype, "connected", void 0);
exports.SocialPlatformConfig = SocialPlatformConfig = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SocialPlatformConfig);
let SocialMediaConfig = class SocialMediaConfig {
};
exports.SocialMediaConfig = SocialMediaConfig;
__decorate([
    (0, mongoose_1.Prop)({ type: SocialPlatformConfig, default: () => ({}) }),
    __metadata("design:type", SocialPlatformConfig)
], SocialMediaConfig.prototype, "linkedin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: SocialPlatformConfig, default: () => ({}) }),
    __metadata("design:type", SocialPlatformConfig)
], SocialMediaConfig.prototype, "twitter", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: SocialPlatformConfig, default: () => ({}) }),
    __metadata("design:type", SocialPlatformConfig)
], SocialMediaConfig.prototype, "facebook", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: SocialPlatformConfig, default: () => ({}) }),
    __metadata("design:type", SocialPlatformConfig)
], SocialMediaConfig.prototype, "instagram", void 0);
exports.SocialMediaConfig = SocialMediaConfig = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SocialMediaConfig);
let Company = class Company {
};
exports.Company = Company;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], Company.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Company.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], Company.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Company.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Company.prototype, "registrationNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Company.prototype, "website", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Company.prototype, "industry", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Company.prototype, "companySize", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Company.prototype, "logoUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Company.prototype, "country", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Company.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Company.prototype, "state", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Company.prototype, "postalCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Company.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, index: true }),
    __metadata("design:type", String)
], Company.prototype, "region", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'UTC' }),
    __metadata("design:type", String)
], Company.prototype, "timezone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'USD' }),
    __metadata("design:type", String)
], Company.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: WorkingHoursConfig, default: () => ({}) }),
    __metadata("design:type", WorkingHoursConfig)
], Company.prototype, "workingHours", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: SubscriptionConfig, default: () => ({}) }),
    __metadata("design:type", SubscriptionConfig)
], Company.prototype, "subscription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: OnboardingConfig, default: () => ({}) }),
    __metadata("design:type", OnboardingConfig)
], Company.prototype, "onboardingConfig", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: PayrollConfig, default: () => ({}) }),
    __metadata("design:type", PayrollConfig)
], Company.prototype, "payrollConfig", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: LeavePolicyConfig, default: () => ({}) }),
    __metadata("design:type", LeavePolicyConfig)
], Company.prototype, "leavePolicy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], Company.prototype, "topPerformerEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: SocialMediaConfig, default: () => ({}) }),
    __metadata("design:type", SocialMediaConfig)
], Company.prototype, "socialMedia", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'ACTIVE' }),
    __metadata("design:type", String)
], Company.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Company.prototype, "ownerId", void 0);
exports.Company = Company = __decorate([
    (0, mongoose_1.Schema)({ collection: 'companies', timestamps: true })
], Company);
exports.CompanySchema = mongoose_1.SchemaFactory.createForClass(Company);
exports.CompanySchema.index({ companyId: 1, region: 1 });
exports.CompanySchema.index({ email: 1 });
//# sourceMappingURL=company.schema.js.map