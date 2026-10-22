import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWorkingHoursDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber({}, { each: true })
  workingDays?: number[];

  @IsOptional()
  @IsBoolean()
  loginRestriction?: boolean;

  @IsOptional()
  @IsNumber()
  lateGracePeriodMinutes?: number;
}

export class UpdateOnboardingConfigDto {
  @IsOptional()
  @IsBoolean()
  requireCnic?: boolean;

  @IsOptional()
  @IsBoolean()
  requireAddress?: boolean;

  @IsOptional()
  @IsBoolean()
  requireBankDetails?: boolean;

  @IsOptional()
  @IsBoolean()
  allowBranchCustomForms?: boolean;

  @IsOptional()
  @IsBoolean()
  allowBranchDepartments?: boolean;
}

export class UpdateSalaryComponentDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  type: 'EARNING' | 'DEDUCTION';

  @IsString()
  calcMode: 'FIXED' | 'PERCENTAGE_OF_BASE' | 'FORMULA';

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  formula?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdatePayrollConfigDto {
  @IsOptional()
  @IsString()
  lateFineType?: string;

  @IsOptional()
  @IsNumber()
  lateFineValue?: number;

  @IsOptional()
  @IsNumber()
  overtimeMultiplier?: number;

  @IsOptional()
  @IsNumber()
  salaryPayDay?: number;

  @IsOptional()
  @IsBoolean()
  autoSalarySlipEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoSendEmail?: boolean;

  @IsOptional()
  @IsNumber()
  defaultTaxPercentage?: number;

  @IsOptional()
  @IsBoolean()
  enableLopDeduction?: boolean;

  @IsOptional()
  @IsNumber()
  standardWorkingDays?: number;

  @IsOptional()
  @IsBoolean()
  passwordProtectPdf?: boolean;

  @IsOptional()
  @IsString()
  pdfPasswordRule?: string;

  @IsOptional()
  @IsNumber()
  templateVersion?: number;

  @IsOptional()
  @IsString()
  templateLayout?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  headerTitle?: string;

  @IsOptional()
  @IsString()
  headerSubtitle?: string;

  @IsOptional()
  @IsString()
  headerCustomNote?: string;

  @IsOptional()
  @IsString()
  headerAlignment?: string;

  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsString()
  footerDisclaimer?: string;

  @IsOptional()
  @IsBoolean()
  showCompanyLogo?: boolean;

  @IsOptional()
  @IsBoolean()
  showEmployeeId?: boolean;

  @IsOptional()
  @IsBoolean()
  showDesignation?: boolean;

  @IsOptional()
  @IsBoolean()
  showDepartment?: boolean;

  @IsOptional()
  @IsBoolean()
  showBranch?: boolean;

  @IsOptional()
  @IsBoolean()
  showAttendanceSummary?: boolean;

  @IsOptional()
  @IsBoolean()
  showPaidLeaves?: boolean;

  @IsOptional()
  @IsBoolean()
  showLopDays?: boolean;

  @IsOptional()
  @IsBoolean()
  showOvertimeHours?: boolean;

  @IsOptional()
  @IsBoolean()
  showLateArrivals?: boolean;

  @IsOptional()
  @IsBoolean()
  showBankDetails?: boolean;

  @IsOptional()
  @IsBoolean()
  showTaxBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  showNetPayInWords?: boolean;

  @IsOptional()
  @IsString()
  numberWordsFormat?: string;

  @IsOptional()
  @IsBoolean()
  showSignature?: boolean;

  @IsOptional()
  @IsString()
  signatureImageUrl?: boolean | string;

  @IsOptional()
  @IsString()
  signatoryName?: string;

  @IsOptional()
  @IsString()
  signatoryTitle?: string;

  @IsOptional()
  @IsBoolean()
  enableESignStamp?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateSalaryComponentDto)
  customComponents?: UpdateSalaryComponentDto[];
}

export class UpdateSocialPlatformDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsBoolean()
  connected?: boolean;
}

export class UpdateSocialMediaDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSocialPlatformDto)
  linkedin?: UpdateSocialPlatformDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSocialPlatformDto)
  twitter?: UpdateSocialPlatformDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSocialPlatformDto)
  facebook?: UpdateSocialPlatformDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSocialPlatformDto)
  instagram?: UpdateSocialPlatformDto;
}

export class UpdateLeaveTypeDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  quota: number;

  @IsOptional()
  @IsNumber()
  monthlyLimit?: number;

  @IsBoolean()
  isPaid: boolean;
}

export class UpdateLeavePolicyDto {
  @IsOptional()
  @IsNumber()
  totalYearlyQuota?: number;

  @IsOptional()
  @IsNumber()
  monthlyLimit?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateLeaveTypeDto)
  leaveTypes?: UpdateLeaveTypeDto[];
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateWorkingHoursDto)
  workingHours?: UpdateWorkingHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateOnboardingConfigDto)
  onboardingConfig?: UpdateOnboardingConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePayrollConfigDto)
  payrollConfig?: UpdatePayrollConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateLeavePolicyDto)
  leavePolicy?: UpdateLeavePolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSocialMediaDto)
  socialMedia?: UpdateSocialMediaDto;

  @IsOptional()
  @IsBoolean()
  topPerformerEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  topPerformerEvalDay?: number;
}
