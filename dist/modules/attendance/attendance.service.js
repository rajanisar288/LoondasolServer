"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const attendance_schema_1 = require("./schemas/attendance.schema");
const company_schema_1 = require("../companies/schemas/company.schema");
const branch_schema_1 = require("../branches/schemas/branch.schema");
const employee_schema_1 = require("../employees/schemas/employee.schema");
let AttendanceService = class AttendanceService {
    constructor(regionalDbManager) {
        this.regionalDbManager = regionalDbManager;
    }
    async getEffectiveWorkContext(tenant, branchId) {
        const companyModel = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const company = await companyModel
            .findOne({ companyId: tenant.companyId })
            .lean();
        let timezone = company?.timezone || 'UTC';
        let workingHours = company?.workingHours;
        if (branchId) {
            const branchModel = await this.regionalDbManager.getModel(tenant.region, branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
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
        let dateStr;
        try {
            dateStr = new Intl.DateTimeFormat('en-CA', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(new Date());
        }
        catch {
            dateStr = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'UTC',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(new Date());
        }
        return { dateStr, timezone, workingHours };
    }
    async clockIn(tenant, user, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, attendance_schema_1.Attendance.name, attendance_schema_1.AttendanceSchema);
        const employeeModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const employee = await employeeModel
            .findOne({
            companyId: tenant.companyId,
            $or: [{ userId: user.userId }, { email: user.email }],
        })
            .lean();
        if (!employee) {
            throw new common_1.NotFoundException('Employee record not linked to current user account');
        }
        const { dateStr, timezone, workingHours } = await this.getEffectiveWorkContext(tenant, employee.branchId);
        const existing = await model.findOne({
            companyId: tenant.companyId,
            employeeId: employee.employeeId,
            date: dateStr,
        });
        if (existing) {
            throw new common_1.ConflictException('You have already clocked in for today');
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
            status: isLate ? attendance_schema_1.AttendanceStatus.LATE : attendance_schema_1.AttendanceStatus.PRESENT,
            isLate,
            minutesLate,
            scheduledStartTime,
            notes: dto.notes,
            ipAddress: dto.ipAddress,
        });
    }
    async clockOut(tenant, user, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, attendance_schema_1.Attendance.name, attendance_schema_1.AttendanceSchema);
        const employeeModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const employee = await employeeModel
            .findOne({
            companyId: tenant.companyId,
            $or: [{ userId: user.userId }, { email: user.email }],
        })
            .lean();
        if (!employee) {
            throw new common_1.NotFoundException('Employee record not linked to current user account');
        }
        const { dateStr } = await this.getEffectiveWorkContext(tenant, employee.branchId);
        const record = await model.findOne({
            companyId: tenant.companyId,
            employeeId: employee.employeeId,
            date: dateStr,
        });
        if (!record) {
            throw new common_1.BadRequestException('No active clock-in found for today. Please clock in first.');
        }
        if (record.clockOutTime) {
            throw new common_1.ConflictException('You have already clocked out for today');
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
    async manualPunch(tenant, user, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, attendance_schema_1.Attendance.name, attendance_schema_1.AttendanceSchema);
        const employeeModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const employee = await employeeModel
            .findOne({
            companyId: tenant.companyId,
            $or: [{ userId: user.userId }, { email: user.email }],
        })
            .lean();
        if (!employee) {
            throw new common_1.NotFoundException('Employee record not linked to current user account');
        }
        const { timezone, workingHours } = await this.getEffectiveWorkContext(tenant, employee.branchId);
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
            const [inHour, inMin] = this.extractHourMinute(dto.clockInTime, clockInDate, timezone);
            const scheduledTotalMins = schedHour * 60 + schedMin;
            const punchTotalMins = inHour * 60 + inMin;
            const thresholdMins = scheduledTotalMins + graceMinutes;
            if (punchTotalMins > thresholdMins) {
                isLate = true;
                minutesLate = punchTotalMins - scheduledTotalMins;
            }
        }
        let totalHours;
        if (clockOutDate) {
            const diffMs = clockOutDate.getTime() - clockInDate.getTime();
            totalHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
        }
        const employeeName = `${employee.firstName} ${employee.lastName}`;
        const updateData = {
            companyId: tenant.companyId,
            employeeId: employee.employeeId,
            userId: user.userId,
            employeeName,
            date: dateStr,
            clockInTime: clockInDate,
            status: isLate ? attendance_schema_1.AttendanceStatus.LATE : attendance_schema_1.AttendanceStatus.PRESENT,
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
            .findOneAndUpdate({
            companyId: tenant.companyId,
            employeeId: employee.employeeId,
            date: dateStr,
        }, { $set: updateData }, { upsert: true, new: true })
            .lean();
        return saved;
    }
    buildDateTime(dateStr, timeInput, timezone = 'UTC') {
        const trimmed = timeInput.trim();
        if (trimmed.includes('T')) {
            const parsed = new Date(trimmed);
            if (!isNaN(parsed.getTime()))
                return parsed;
        }
        const [hoursStr, minsStr] = trimmed.split(':');
        const hours = Number(hoursStr || 0);
        const minutes = Number((minsStr || '0').replace(/[^0-9]/g, ''));
        const [year, month, day] = dateStr.split('-').map(Number);
        const utcTimestamp = Date.UTC(year, (month || 1) - 1, day || 1, hours, minutes, 0, 0);
        if (isNaN(utcTimestamp))
            return new Date();
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
            const map = {};
            for (const p of parts) {
                if (p.type !== 'literal')
                    map[p.type] = Number(p.value);
            }
            const tzHour = map.hour === 24 ? 0 : map.hour;
            const tzAsUtc = Date.UTC(map.year, map.month - 1, map.day, tzHour, map.minute, map.second || 0);
            const offsetMs = tzAsUtc - utcTimestamp;
            return new Date(utcTimestamp - offsetMs);
        }
        catch {
            return new Date(year, (month || 1) - 1, day || 1, hours, minutes, 0, 0);
        }
    }
    extractHourMinute(timeInput, fallback, timezone = 'UTC') {
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
        }
        catch {
            return [fallback.getHours(), fallback.getMinutes()];
        }
    }
    async getTodayStatus(tenant, user) {
        const model = await this.regionalDbManager.getModel(tenant.region, attendance_schema_1.Attendance.name, attendance_schema_1.AttendanceSchema);
        const employeeModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const employee = await employeeModel
            .findOne({
            companyId: tenant.companyId,
            $or: [{ userId: user.userId }, { email: user.email }],
        })
            .lean();
        if (!employee)
            return null;
        const { dateStr } = await this.getEffectiveWorkContext(tenant, employee.branchId);
        return model
            .findOne({
            companyId: tenant.companyId,
            employeeId: employee.employeeId,
            date: dateStr,
        })
            .lean();
    }
    async findAll(tenant, user, date) {
        const model = await this.regionalDbManager.getModel(tenant.region, attendance_schema_1.Attendance.name, attendance_schema_1.AttendanceSchema);
        const canManageAll = user.isOwner ||
            user.role === 'OWNER' ||
            user.role === 'ADMIN' ||
            user.permissions?.includes('attendance.update') ||
            user.permissions?.includes('reports.view');
        const query = { companyId: tenant.companyId };
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
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map