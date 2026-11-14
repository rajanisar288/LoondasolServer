import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  RegionCode,
  REGIONS,
} from '../../../common/constants/regions.constant';

export enum RegistrationType {
  COMPANY = 'company',
  EMPLOYEE = 'employee',
}

export class RegisterDto {
  @IsEnum(RegistrationType)
  type: RegistrationType;

  // Account credentials
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  // Company Onboarding details (required when type = 'company')
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyPhone?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

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
  country?: string;

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
  @Transform(({ value }) => {
    if (!value) return undefined;
    const str = String(value).toUpperCase().trim();
    if (str === 'US') return 'USA';
    if (str === 'ME') return 'UAE';
    if (str === 'IN') return 'IND';
    return str;
  })
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  subscriptionPlan?: string;

  @IsOptional()
  purchasedSeats?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  // Employee invitation token (required when type = 'employee')
  @IsOptional()
  @IsString()
  invitationToken?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  cnic?: string;

  @IsOptional()
  bankDetails?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    branchCode?: string;
  };

  @IsOptional()
  @IsString()
  companyRegion?: string;

  @IsOptional()
  @IsString()
  userLocationRegion?: string;

  @IsOptional()
  customFields?: Record<string, any>;

  @IsOptional()
  documents?: Array<{
    name: string;
    url: string;
    fileType?: string;
    uploadedAt?: Date;
  }>;
}
