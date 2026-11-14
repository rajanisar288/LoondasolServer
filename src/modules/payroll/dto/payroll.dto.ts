import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsObject,
  Matches,
} from 'class-validator';
import { PayrollSlipStatus } from '../schemas/payroll-slip.schema';

export class GeneratePayrollDto {
  @ApiProperty({ example: '2026-09', description: 'Month in YYYY-MM format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be in YYYY-MM format' })
  month: string;

  @ApiPropertyOptional({ example: ['emp_123'] })
  @IsArray()
  @IsOptional()
  employeeIds?: string[];

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  sendEmails?: boolean;
}

export class UpdateSlipStatusDto {
  @ApiProperty({ enum: PayrollSlipStatus, example: PayrollSlipStatus.PAID })
  @IsEnum(PayrollSlipStatus)
  status: PayrollSlipStatus;

  @ApiPropertyOptional({ example: 'Paid via direct bank deposit' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CustomizePayrollSlipDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  customBonus?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fuelAllowance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  otherAllowances?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  otherDeductions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  overtimeBonus?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lateDeductions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lopDeductions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxDeductions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  earningsBreakdown?: Array<{
    id: string;
    name: string;
    amount: number;
    calcMode?: string;
    formula?: string;
    isManual?: boolean;
  }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  deductionsBreakdown?: Array<{
    id: string;
    name: string;
    amount: number;
    calcMode?: string;
    formula?: string;
    isManual?: boolean;
  }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkEmailPayrollDto {
  @ApiProperty({ example: '2026-09' })
  @IsString()
  @IsNotEmpty()
  month: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  slipIds?: string[];
}

export class PreviewPayrollHtmlDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  templateConfig?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payrollConfigOverride?: Record<string, any>;
}
