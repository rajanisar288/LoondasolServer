import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeetingType, MeetingStatus } from '../schemas/meeting.schema';

export class CreateMeetingDto {
  @ApiProperty({ example: 'Q4 Product Roadmap Sync' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Review sprint deliverables and milestones' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-09-20T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2026-09-20T11:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ enum: MeetingType, default: MeetingType.VIDEO })
  @IsEnum(MeetingType)
  @IsOptional()
  meetingType?: MeetingType;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of attendee employee/user IDs',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attendeeIds?: string[];

  @ApiPropertyOptional({ description: 'Optional target department ID' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Optional custom meeting code' })
  @IsString()
  @IsOptional()
  meetingCode?: string;
}

export class UpdateMeetingDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ enum: MeetingStatus })
  @IsEnum(MeetingStatus)
  @IsOptional()
  status?: MeetingStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attendeeIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  meetingCode?: string;
}
