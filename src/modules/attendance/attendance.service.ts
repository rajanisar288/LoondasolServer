import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import {
  Attendance,
  AttendanceSchema,
  AttendanceStatus,
} from './schemas/attendance.schema';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { Branch, BranchSchema } from '../branches/schemas/branch.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { ClockInDto, ClockOutDto, ManualAttendanceDto } from './dto/attendance.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class AttendanceService {
  constructor(private readonly regionalDbManager: RegionalDatabaseManager) {}

  /** Resolves effective timezone, working hours, and current YYYY-MM-DD date string for an employee or company. */
  private async getEffectiveWorkContext(
    tenant: TenantContext,
    branchId?: string,
  ): Promise<{
    dateStr: string;
    timezone: string;
    workingHours?: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      lateGracePeriodMinutes?: number;
    };
  }> {
    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );
    const company = await companyModel
      .findOne({ companyId: tenant.companyId })
      .lean();

    let timezone = company?.timezone || 'UTC';
    let workingHours:
      | {
          enabled: boolean;
          startTime: string;
          endTime: string;
          lateGracePeriodMinutes?: number;
        }
      | undefined = company?.workingHours;

    if (branchId) {
      const branchModel = await this.regionalDbManager.getModel<Branch>(
        tenant.region,
        Branch.name,
        BranchSchema,
      );
      const branch = await branchModel
        .findOne({ companyId: tenant.companyId, branchId })
        .lean();
      if (branch?.timezone) {
        timezone = branch.timezone;
      }
      if (branch?.workingHours?.enabled) {
        workingHours = {
          enabled: branch.workingHours.enabled,
          startTime: branch.workingHours.startTime,
          endTime: branch.workingHours.endTime,
          lateGracePeriodMinutes: company?.workingHours?.lateGracePeriodMinutes,
        };
      }
    }

    let dateStr: string;
    try {
      dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    }

    return { dateStr, timezone, workingHours };
  }

  /** Records employee clock-in for the current workday in their effective branch/company timezone. */
  async clockIn(
    tenant: TenantContext,
    user: JwtPayload,
    dto: ClockInDto,
  ): Promise<Attendance> {
    const model = await this.regionalDbManager.getModel<Attendance>(
      tenant.region,
      Attendance.name,
      AttendanceSchema,
    );
    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    const employee = await employeeModel
      .findOne({
        companyId: tenant.companyId,
        $or: [{ userId: user.userId }, { email: user.email }],
      })
      .lean();
    if (!employee) {
      throw new NotFoundException(
        'Employee record not linked to current user account',
      );
    }

    const { dateStr, timezone, workingHours } =
      await this.getEffectiveWorkContext(tenant, employee.branchId);

    const existing = await model.findOne({
      companyId: tenant.companyId,
      employeeId: employee.employeeId,
      date: dateStr,
    });

    if (existing) {
      throw new ConflictException('You have already clocked in for today');
    }

    const employeeName = `${employee.firstName} ${employee.lastName}`;
    const now = new Date();

    let isLate = false;
    let minutesLate = 0;
    const scheduledStartTime = workingHours?.startTime || '09:00';
    const graceMinutes = workingHours?.lateGracePeriodMinutes ?? 15;

    if (workingHours?.enabled && scheduledStartTime) {
      const [schedHour, schedMin] = scheduledStartTime.split(':').map(Number);
      const localTimeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }).format(now);
      const [nowHour, nowMin] = localTimeStr.split(':').map(Number);

      const scheduledTotalMins = schedHour * 60 + schedMin;
      const currentTotalMins = (nowHour === 24 ? 0 : nowHour) * 60 + nowMin;
      const thresholdMins = scheduledTotalMins + graceMinutes;

      if (currentTotalMins > thresholdMins) {
        isLate = true;
        minutesLate = currentTotalMins - scheduledTotalMins;
      }
    }

    return model.create({
      companyId: tenant.companyId,
      employeeId: employee.employeeId,
      userId: user.userId,
      employeeName,
      date: dateStr,
      clockInTime: now,
      status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
      isLate,
      minutesLate,
      scheduledStartTime,
      notes: dto.notes,
      ipAddress: dto.ipAddress,
    });
  }

  /** Records employee clock-out and computes total working hours. */
  async clockOut(
    tenant: TenantContext,
    user: JwtPayload,
    dto: ClockOutDto,
  ): Promise<Attendance> {
    const model = await this.regionalDbManager.getModel<Attendance>(
      tenant.region,
      Attendance.name,
      AttendanceSchema,
    );
    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    const employee = await employeeModel
      .findOne({
        companyId: tenant.companyId,
        $or: [{ userId: user.userId }, { email: user.email }],
      })
      .lean();
    if (!employee) {
      throw new NotFoundException(
        'Employee record not linked to current user account',
      );
    }

    const { dateStr } = await this.getEffectiveWorkContext(
      tenant,
      employee.branchId,
    );

    const record = await model.findOne({
      companyId: tenant.companyId,
      employeeId: employee.employeeId,
      date: dateStr,
    });

    if (!record) {
      throw new BadRequestException(
        'No active clock-in found for today. Please clock in first.',
      );
    }

    if (record.clockOutTime) {
      throw new ConflictException('You have already clocked out for today');
    }

    const clockOutTime = new Date();
    const diffMs = clockOutTime.getTime() - record.clockInTime.getTime();
    const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    record.clockOutTime = clockOutTime;
    record.totalHours = totalHours;
    if (dto.notes) {
      record.notes = record.notes ? `${record.notes}; ${dto.notes}` : dto.notes;
    }

    return record.save();
  }

  /** Creates or updates a manual attendance punch for a selected date and time in the employee's branch/company timezone. */
  async manualPunch(
    tenant: TenantContext,
    user: JwtPayload,
    dto: ManualAttendanceDto,
  ): Promise<Attendance> {
    const model = await this.regionalDbManager.getModel<Attendance>(
      tenant.region,
      Attendance.name,
      AttendanceSchema,
    );
    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    const employee = await employeeModel
      .findOne({
        companyId: tenant.companyId,
        $or: [{ userId: user.userId }, { email: user.email }],
      })
      .lean();
    if (!employee) {
      throw new NotFoundException(
        'Employee record not linked to current user account',
      );
    }

    const { timezone, workingHours } = await this.getEffectiveWorkContext(
      tenant,
      employee.branchId,
    );

    const dateStr = dto.date.trim();
    const clockInDate = this.buildDateTime(dateStr, dto.clockInTime, timezone);
    const clockOutDate = dto.clockOutTime
      ? this.buildDateTime(dateStr, dto.clockOutTime, timezone)
      : undefined;

    if (clockOutDate && clockOutDate.getTime() < clockInDate.getTime()) {
      clockOutDate.setTime(clockOutDate.getTime() + 24 * 60 * 60 * 1000);
    }

    let isLate = false;
    let minutesLate = 0;
    const scheduledStartTime = workingHours?.startTime || '09:00';
    const graceMinutes = workingHours?.lateGracePeriodMinutes ?? 15;

    if (workingHours?.enabled && scheduledStartTime) {
      const [schedHour, schedMin] = scheduledStartTime.split(':').map(Number);
      const [inHour, inMin] = this.extractHourMinute(
        dto.clockInTime,
        clockInDate,
        timezone,
      );
      const scheduledTotalMins = schedHour * 60 + schedMin;
      const punchTotalMins = inHour * 60 + inMin;
      const thresholdMins = scheduledTotalMins + graceMinutes;

      if (punchTotalMins > thresholdMins) {
        isLate = true;
        minutesLate = punchTotalMins - scheduledTotalMins;
      }
    }

    let totalHours: number | undefined;
    if (clockOutDate) {
      const diffMs = clockOutDate.getTime() - clockInDate.getTime();
      totalHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
    }

    const employeeName = `${employee.firstName} ${employee.lastName}`;
    const updateData: Record<string, any> = {
      companyId: tenant.companyId,
      employeeId: employee.employeeId,
      userId: user.userId,
      employeeName,
      date: dateStr,
      clockInTime: clockInDate,
      status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
      isLate,
      minutesLate,
      scheduledStartTime,
    };

    if (clockOutDate) {
      updateData.clockOutTime = clockOutDate;
      updateData.totalHours = totalHours;
    }
    if (dto.notes !== undefined) {
      updateData.notes = dto.notes.trim();
    }

    const saved = await model
      .findOneAndUpdate(
        {
          companyId: tenant.companyId,
          employeeId: employee.employeeId,
          date: dateStr,
        },
        { $set: updateData },
        { upsert: true, new: true },
      )
      .lean();

    return saved as Attendance;
  }

  /** Combines a YYYY-MM-DD date string and a time string in a given timezone into a UTC Date instance. */
  private buildDateTime(
    dateStr: string,
    timeInput: string,
    timezone = 'UTC',
  ): Date {
    const trimmed = timeInput.trim();
    if (trimmed.includes('T')) {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const [hoursStr, minsStr] = trimmed.split(':');
    const hours = Number(hoursStr || 0);
    const minutes = Number((minsStr || '0').replace(/[^0-9]/g, ''));
    const [year, month, day] = dateStr.split('-').map(Number);
    const utcTimestamp = Date.UTC(
      year,
      (month || 1) - 1,
      day || 1,
      hours,
      minutes,
      0,
      0,
    );
    if (isNaN(utcTimestamp)) return new Date();

    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(new Date(utcTimestamp));
      const map: Record<string, number> = {};
      for (const p of parts) {
        if (p.type !== 'literal') map[p.type] = Number(p.value);
      }
      const tzHour = map.hour === 24 ? 0 : map.hour;
      const tzAsUtc = Date.UTC(
        map.year,
        map.month - 1,
        map.day,
        tzHour,
        map.minute,
        map.second || 0,
      );
      const offsetMs = tzAsUtc - utcTimestamp;
      return new Date(utcTimestamp - offsetMs);
    } catch {
      return new Date(year, (month || 1) - 1, day || 1, hours, minutes, 0, 0);
    }
  }

  /** Extracts 24-hour and minute numbers from a time string or Date fallback in the given timezone. */
  private extractHourMinute(
    timeInput: string,
    fallback: Date,
    timezone = 'UTC',
  ): [number, number] {
    const parts = timeInput.trim().split(':');
    if (parts.length >= 2 && !timeInput.includes('T')) {
      const h = Number(parts[0]);
      const m = Number(parts[1].replace(/[^0-9]/g, ''));
      if (!isNaN(h) && !isNaN(m)) {
        return [h, m];
      }
    }
    try {
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }).format(fallback);
      const [h, m] = formatted.split(':').map(Number);
      return [h === 24 ? 0 : h, m || 0];
    } catch {
      return [fallback.getHours(), fallback.getMinutes()];
    }
  }

  /** Retrieves today's attendance status for the current user in their effective timezone. */
  async getTodayStatus(
    tenant: TenantContext,
    user: JwtPayload,
  ): Promise<Attendance | null> {
    const model = await this.regionalDbManager.getModel<Attendance>(
      tenant.region,
      Attendance.name,
      AttendanceSchema,
    );
    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    const employee = await employeeModel
      .findOne({
        companyId: tenant.companyId,
        $or: [{ userId: user.userId }, { email: user.email }],
      })
      .lean();
    if (!employee) return null;

    const { dateStr } = await this.getEffectiveWorkContext(
      tenant,
      employee.branchId,
    );

    return model
      .findOne({
        companyId: tenant.companyId,
        employeeId: employee.employeeId,
        date: dateStr,
      })
      .lean();
  }

  /** Retrieves attendance logs optionally filtered by date. */
  async findAll(
    tenant: TenantContext,
    user: JwtPayload,
    date?: string,
  ): Promise<Attendance[]> {
    const model = await this.regionalDbManager.getModel<Attendance>(
      tenant.region,
      Attendance.name,
      AttendanceSchema,
    );

    const canManageAll =
      user.isOwner ||
      user.role === 'OWNER' ||
      user.role === 'ADMIN' ||
      user.permissions?.includes('attendance.update') ||
      user.permissions?.includes('reports.view');

    const query: Record<string, any> = { companyId: tenant.companyId };
    if (date && date.trim()) {
      query.date = date.trim();
    }
    if (!canManageAll) {
      query.userId = user.userId;
    }

    return model
      .find(query)
      .sort({ date: -1, clockInTime: -1 })
      .lean();
  }
}
