import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { ClockInDto, ClockOutDto, ManualAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Attendance } from './schemas/attendance.schema';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /** Records employee clock-in for the current workday. */
  @Post('clock-in')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_CREATE)
  @ApiOperation({ summary: 'Clock in for the workday' })
  async clockIn(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ClockInDto,
  ): Promise<Attendance> {
    return this.attendanceService.clockIn(tenant, user, dto);
  }

  /** Records employee clock-out and calculates total hours worked. */
  @Post('clock-out')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_CREATE)
  @ApiOperation({ summary: 'Clock out and compute daily hours' })
  async clockOut(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ClockOutDto,
  ): Promise<Attendance> {
    return this.attendanceService.clockOut(tenant, user, dto);
  }

  /** Records or updates a manual attendance punch for a specific date and time. */
  @Post('manual')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_CREATE)
  @ApiOperation({ summary: 'Add or update manual attendance by date and time' })
  async manualPunch(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ManualAttendanceDto,
  ): Promise<Attendance> {
    return this.attendanceService.manualPunch(tenant, user, dto);
  }

  /** Retrieves the authenticated user's attendance record for today. */
  @Get('today')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_VIEW)
  @ApiOperation({ summary: "Get current user's attendance status for today" })
  async getToday(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
  ): Promise<Attendance | null> {
    return this.attendanceService.getTodayStatus(tenant, user);
  }

  /** Lists attendance records optionally filtered by date. */
  @Get()
  @RequirePermissions(PERMISSIONS.ATTENDANCE_VIEW)
  @ApiOperation({
    summary: 'List company attendance records',
  })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Query('date') date?: string,
  ): Promise<Attendance[]> {
    return this.attendanceService.findAll(tenant, user, date);
  }
}
