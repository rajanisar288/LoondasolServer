import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ClockInDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class ClockOutDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ManualAttendanceDto {
  @IsNotEmpty()
  @IsString()
  date!: string;

  @IsNotEmpty()
  @IsString()
  clockInTime!: string;

  @IsOptional()
  @IsString()
  clockOutTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
