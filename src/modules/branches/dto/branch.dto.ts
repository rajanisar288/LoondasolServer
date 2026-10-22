import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BranchWorkingHoursDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: [1, 2, 3, 4, 5] })
  @IsArray()
  workingDays: number[];

  @ApiProperty({ example: false })
  @IsBoolean()
  enforceLoginRestriction: boolean;
}

export class CreateBranchDto {
  @ApiProperty({ example: 'Headquarters' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123 Business Way, Suite 100' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: '+1-555-0199' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'UTC' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: 'PKR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ type: BranchWorkingHoursDto })
  @ValidateNested()
  @Type(() => BranchWorkingHoursDto)
  @IsOptional()
  workingHours?: BranchWorkingHoursDto;
}

export class UpdateBranchDto {
  @ApiPropertyOptional({ example: 'Headquarters' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '123 Business Way, Suite 100' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '+1-555-0199' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'UTC' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: 'PKR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ type: BranchWorkingHoursDto })
  @ValidateNested()
  @Type(() => BranchWorkingHoursDto)
  @IsOptional()
  workingHours?: BranchWorkingHoursDto;
}
