import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ResignationStatus } from '../schemas/resignation.schema';

export class SubmitResignationDto {
  @ApiProperty({ example: '2026-10-31' })
  @IsString()
  @IsNotEmpty()
  intendedLastWorkingDay: string;

  @ApiProperty({ example: 'Pursuing higher education and new career opportunities.' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateClearanceChecklistDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  itAssetsReturned?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  accessRevoked?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  idBadgeReturned?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  financeDuesCleared?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  knowledgeTransferDone?: boolean;
}

export class UpdateResignationStatusDto {
  @ApiProperty({ enum: ResignationStatus, example: ResignationStatus.APPROVED })
  @IsEnum(ResignationStatus)
  status: ResignationStatus;

  @ApiPropertyOptional({ example: 'Exit interview conducted. Full clearance granted.' })
  @IsString()
  @IsOptional()
  exitInterviewNotes?: string;
}
