import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  RegionCode,
  REGIONS,
} from '../../../common/constants/regions.constant';

export type CompanyDocument = Company & Document;

export enum SubscriptionPlan {
  FREE_TRIAL = 'FREE_TRIAL',
  PRO = 'PRO',
  ULTRA = 'ULTRA',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

@Schema({ _id: false })
export class WorkingHoursConfig {
  @Prop({ required: true, default: false })
  enabled: boolean;

  @Prop({ required: true, default: '09:00' })
  startTime: string;

  @Prop({ required: true, default: '18:00' })
  endTime: string;

  @Prop({ required: true, type: [Number], default: [1, 2, 3, 4, 5] })
  workingDays: number[];

  @Prop({ required: true, default: false })
  loginRestriction: boolean;

  @Prop({ required: false, default: 15 })
  lateGracePeriodMinutes?: number;
}

@Schema({ _id: false })
export class SubscriptionConfig {
  @Prop({
    required: true,
    enum: Object.values(SubscriptionPlan),
    default: SubscriptionPlan.FREE_TRIAL,
  })
  plan: SubscriptionPlan;

  @Prop({
    required: true,
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.TRIALING,
  })
  status: SubscriptionStatus;

  @Prop({ required: false })
  trialEndsAt?: Date;

  @Prop({ required: false })
  currentPeriodEnd?: Date;

  @Prop({ required: false })
  stripeCustomerId?: string;

  @Prop({ required: false })
  stripeSubscriptionId?: string;
}

@Schema({ _id: false })
export class OnboardingConfig {
  @Prop({ required: true, default: false })
  requireCnic: boolean;

  @Prop({ required: true, default: false })
  requireAddress: boolean;

  @Prop({ required: true, default: false })
  requireBankDetails: boolean;

  @Prop({ required: true, default: true })
  allowBranchCustomForms: boolean;

  @Prop({ required: true, default: true })
  allowBranchDepartments: boolean;
}

@Schema({ _id: false })
export class SalaryComponentConfig {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: ['EARNING', 'DEDUCTION'], default: 'EARNING' })
  type: 'EARNING' | 'DEDUCTION';

  @Prop({
    required: true,
    enum: ['FIXED', 'PERCENTAGE_OF_BASE', 'FORMULA'],
    default: 'FIXED',
  })
  calcMode: 'FIXED' | 'PERCENTAGE_OF_BASE' | 'FORMULA';

  @Prop({ required: false, default: 0 })
  value: number;

  @Prop({ required: false, default: '' })
  formula?: string;

  @Prop({ required: false, default: true })
  enabled: boolean;
}

@Schema({ _id: false })
export class PayrollConfig {
  @Prop({ required: true, default: 'PERCENTAGE', enum: ['PERCENTAGE', 'FIXED_AMOUNT'] })
  lateFineType: string;

  @Prop({ required: true, default: 2 })
  lateFineValue: number;

  @Prop({ required: true, default: 1.5 })
  overtimeMultiplier: number;

  @Prop({ required: true, default: 1 })
  salaryPayDay: number;

  @Prop({ required: true, default: false })
  autoSalarySlipEnabled: boolean;

  @Prop({ required: false, default: false })
  autoSendEmail?: boolean;

  @Prop({ required: false, default: 0 })
  defaultTaxPercentage: number;

  @Prop({ required: false, default: true })
  enableLopDeduction?: boolean;

  @Prop({ required: false, default: 22 })
  standardWorkingDays?: number;

  @Prop({ required: false, default: false })
  passwordProtectPdf?: boolean;

  @Prop({ required: false, default: 'EMP_ID_LAST4' })
  pdfPasswordRule?: string;

  @Prop({ required: false, default: 1 })
  templateVersion?: number;

  @Prop({
    required: false,
    default: 'MODERN_EXECUTIVE',
    enum: ['MODERN_EXECUTIVE', 'CLASSIC_CORPORATE', 'MINIMAL_COMPACT'],
  })
  templateLayout?: string;

  @Prop({ required: false, default: '#2A65F6' })
  primaryColor?: string;

  @Prop({ required: false, default: 'SALARY SLIP' })
  headerTitle?: string;

  @Prop({ required: false, default: 'Official Monthly Remuneration Statement' })
  headerSubtitle?: string;

  @Prop({ required: false, default: '' })
  headerCustomNote?: string;

  @Prop({ required: false, default: 'SPLIT', enum: ['SPLIT', 'CENTERED', 'LEFT'] })
  headerAlignment?: string;

  @Prop({
    required: false,
    default: 'This is a computer-generated document and is digitally verified.',
  })
  footerText?: string;

  @Prop({
    required: false,
    default: 'Confidential — For Authorized Recipient Only',
  })
  footerDisclaimer?: string;

  @Prop({ required: false, default: true })
  showCompanyLogo?: boolean;

  @Prop({ required: false, default: true })
  showEmployeeId?: boolean;

  @Prop({ required: false, default: true })
  showDesignation?: boolean;

  @Prop({ required: false, default: true })
  showDepartment?: boolean;

  @Prop({ required: false, default: true })
  showBranch?: boolean;

  @Prop({ required: false, default: true })
  showAttendanceSummary?: boolean;

  @Prop({ required: false, default: true })
  showPaidLeaves?: boolean;

  @Prop({ required: false, default: true })
  showLopDays?: boolean;

  @Prop({ required: false, default: true })
  showOvertimeHours?: boolean;

  @Prop({ required: false, default: true })
  showLateArrivals?: boolean;

  @Prop({ required: false, default: true })
  showBankDetails?: boolean;

  @Prop({ required: false, default: true })
  showTaxBreakdown?: boolean;

  @Prop({ required: false, default: true })
  showNetPayInWords?: boolean;

  @Prop({
    required: false,
    default: 'INTERNATIONAL',
    enum: ['INTERNATIONAL', 'INDIAN_SOUTH_ASIAN'],
  })
  numberWordsFormat?: string;

  @Prop({ required: false, default: true })
  showSignature?: boolean;

  @Prop({ required: false, default: '' })
  signatureImageUrl?: string;

  @Prop({ required: false, default: 'Authorized Signatory' })
  signatoryName?: string;

  @Prop({ required: false, default: 'Head of Human Resources & Finance' })
  signatoryTitle?: string;

  @Prop({ required: false, default: true })
  enableESignStamp?: boolean;

  @Prop({
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
  })
  customComponents?: SalaryComponentConfig[];
}

@Schema({ _id: false })
export class LeaveTypeConfig {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, default: 7 })
  quota: number;

  @Prop({ required: false, default: 2 })
  monthlyLimit?: number;

  @Prop({ required: true, default: true })
  isPaid: boolean;
}

@Schema({ _id: false })
export class LeavePolicyConfig {
  @Prop({ required: true, default: 24 })
  totalYearlyQuota: number;

  @Prop({ required: true, default: 2 })
  monthlyLimit: number;

  @Prop({
    type: [LeaveTypeConfig],
    default: () => [
      { id: 'ANNUAL', name: 'Annual / Paid Leave', quota: 10, monthlyLimit: 2, isPaid: true },
      { id: 'SICK', name: 'Sick Leave', quota: 7, monthlyLimit: 2, isPaid: true },
      { id: 'CASUAL', name: 'Casual Leave', quota: 7, monthlyLimit: 2, isPaid: true },
    ],
  })
  leaveTypes: LeaveTypeConfig[];
}

@Schema({ _id: false })
export class SocialPlatformConfig {
  @Prop({ required: false, default: '' })
  username?: string;

  @Prop({ required: false, default: '' })
  password?: string;

  @Prop({ required: false, default: '' })
  apiKey?: string;

  @Prop({ required: false, default: false })
  connected: boolean;
}

@Schema({ _id: false })
export class SocialMediaConfig {
  @Prop({ type: SocialPlatformConfig, default: () => ({}) })
  linkedin: SocialPlatformConfig;

  @Prop({ type: SocialPlatformConfig, default: () => ({}) })
  twitter: SocialPlatformConfig;

  @Prop({ type: SocialPlatformConfig, default: () => ({}) })
  facebook: SocialPlatformConfig;

  @Prop({ type: SocialPlatformConfig, default: () => ({}) })
  instagram: SocialPlatformConfig;
}

@Schema({ collection: 'companies', timestamps: true })
export class Company {
  @Prop({ required: true, unique: true, index: true })
  companyId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: false })
  registrationNumber?: string;

  @Prop({ required: false })
  website?: string;

  @Prop({ required: false })
  industry?: string;

  @Prop({ required: false })
  companySize?: string;

  @Prop({ required: false })
  logoUrl?: string;

  // Address
  @Prop({ required: true })
  country: string;

  @Prop({ required: false })
  city?: string;

  @Prop({ required: false })
  state?: string;

  @Prop({ required: false })
  postalCode?: string;

  @Prop({ required: false })
  address?: string;

  // Datacenter region or database shard
  @Prop({ required: true, type: String, index: true })
  region: RegionCode;

  // Localization settings
  @Prop({ required: true, default: 'UTC' })
  timezone: string;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ type: WorkingHoursConfig, default: () => ({}) })
  workingHours: WorkingHoursConfig;

  @Prop({ type: SubscriptionConfig, default: () => ({}) })
  subscription: SubscriptionConfig;

  @Prop({ type: OnboardingConfig, default: () => ({}) })
  onboardingConfig: OnboardingConfig;

  @Prop({ type: PayrollConfig, default: () => ({}) })
  payrollConfig: PayrollConfig;

  @Prop({ type: LeavePolicyConfig, default: () => ({}) })
  leavePolicy: LeavePolicyConfig;

  @Prop({ required: false, default: false })
  topPerformerEnabled: boolean;

  @Prop({ type: SocialMediaConfig, default: () => ({}) })
  socialMedia: SocialMediaConfig;

  @Prop({ required: false, default: 'ACTIVE' })
  status?: string;

  @Prop({ required: true, index: true })
  ownerId: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.index({ companyId: 1, region: 1 });
CompanySchema.index({ email: 1 });
