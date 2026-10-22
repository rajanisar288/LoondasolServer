import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { LeaveType } from '../schemas/leave.schema';

export class ApplyLeaveDto {
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @IsString()
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @IsString()
  @IsNotEmpty({ message: 'End date is required' })
  endDate: string;

  @IsNumber()
  @Min(1)
  daysCount: number;

  @IsString()
  @IsNotEmpty({ message: 'Reason is required' })
  reason: string;
}

export class ReviewLeaveDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
