import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Leave, LeaveSchema, LeaveStatus } from './schemas/leave.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { ApplyLeaveDto, ReviewLeaveDto } from './dto/leave.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class LeaveService {
  constructor(private readonly regionalDbManager: RegionalDatabaseManager) {}

  // Submit new leave application
  async apply(
    tenant: TenantContext,
    user: JwtPayload,
    dto: ApplyLeaveDto,
  ): Promise<Leave> {
    const model = await this.regionalDbManager.getModel<Leave>(
      tenant.region,
      Leave.name,
      LeaveSchema,
    );
    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    const employee = await employeeModel
      .findOne({ companyId: tenant.companyId, userId: user.userId })
      .lean();
    if (!employee) {
      throw new NotFoundException(
        'Employee profile not linked to user account',
      );
    }

    const leaveId = `leave_${randomUUID()}`;
    const employeeName = `${employee.firstName} ${employee.lastName}`;

    return model.create({
      leaveId,
      companyId: tenant.companyId,
      employeeId: employee.employeeId,
      userId: user.userId,
      employeeName,
      leaveType: dto.leaveType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      daysCount: dto.daysCount,
      reason: dto.reason.trim(),
      status: LeaveStatus.PENDING,
    });
  }

  // Get current user's leave requests
  async findMyLeaves(
    tenant: TenantContext,
    user: JwtPayload,
  ): Promise<Leave[]> {
    const model = await this.regionalDbManager.getModel<Leave>(
      tenant.region,
      Leave.name,
      LeaveSchema,
    );

    return model
      .find({ companyId: tenant.companyId, userId: user.userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  // List all company leave applications (for HR / Managers)
  async findAll(tenant: TenantContext, status?: LeaveStatus): Promise<Leave[]> {
    const model = await this.regionalDbManager.getModel<Leave>(
      tenant.region,
      Leave.name,
      LeaveSchema,
    );

    const filter: Record<string, unknown> = { companyId: tenant.companyId };
    if (status) {
      filter['status'] = status;
    }

    return model.find(filter).sort({ createdAt: -1 }).lean();
  }

  // Approve a pending leave request
  async approve(
    tenant: TenantContext,
    user: JwtPayload,
    leaveId: string,
    dto: ReviewLeaveDto,
  ): Promise<Leave> {
    const model = await this.regionalDbManager.getModel<Leave>(
      tenant.region,
      Leave.name,
      LeaveSchema,
    );

    const record = await model.findOne({
      companyId: tenant.companyId,
      leaveId,
    });
    if (!record) {
      throw new NotFoundException('Leave request not found');
    }

    if (record.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve request that is already ${record.status.toLowerCase()}`,
      );
    }

    record.status = LeaveStatus.APPROVED;
    record.reviewedBy = user.userId;
    record.reviewedAt = new Date();
    if (dto.notes) record.reviewerNotes = dto.notes;

    return record.save();
  }

  // Reject a pending leave request
  async reject(
    tenant: TenantContext,
    user: JwtPayload,
    leaveId: string,
    dto: ReviewLeaveDto,
  ): Promise<Leave> {
    const model = await this.regionalDbManager.getModel<Leave>(
      tenant.region,
      Leave.name,
      LeaveSchema,
    );

    const record = await model.findOne({
      companyId: tenant.companyId,
      leaveId,
    });
    if (!record) {
      throw new NotFoundException('Leave request not found');
    }

    if (record.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject request that is already ${record.status.toLowerCase()}`,
      );
    }

    record.status = LeaveStatus.REJECTED;
    record.reviewedBy = user.userId;
    record.reviewedAt = new Date();
    if (dto.notes) record.reviewerNotes = dto.notes;

    return record.save();
  }

  // Get leave balance summary & type breakdowns for current employee
  async getBalances(tenant: TenantContext, user: JwtPayload) {
    const leaveModel = await this.regionalDbManager.getModel<Leave>(
      tenant.region,
      Leave.name,
      LeaveSchema,
    );
    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );

    const company = await companyModel.findOne({ companyId: tenant.companyId }).lean();
    const policy = company?.leavePolicy || {
      totalYearlyQuota: 24,
      monthlyLimit: 2,
      leaveTypes: [
        { id: 'ANNUAL', name: 'Annual / Paid Leave', quota: 10, monthlyLimit: 2, isPaid: true },
        { id: 'SICK', name: 'Sick Leave', quota: 7, monthlyLimit: 2, isPaid: true },
        { id: 'CASUAL', name: 'Casual Leave', quota: 7, monthlyLimit: 2, isPaid: true },
      ],
    };

    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const monthPrefix = `${currentYear}-${currentMonth}`;

    const userLeaves = await leaveModel
      .find({
        companyId: tenant.companyId,
        userId: user.userId,
        status: { $in: [LeaveStatus.APPROVED, LeaveStatus.PENDING] },
        startDate: { $regex: `^${currentYear}` },
      })
      .lean();

    let totalUsedYearly = 0;
    let totalUsedThisMonth = 0;

    const typeUsageMap: Record<string, { usedYearly: number; usedThisMonth: number }> = {};

    for (const l of userLeaves) {
      const typeKey = l.leaveType;
      if (!typeUsageMap[typeKey]) {
        typeUsageMap[typeKey] = { usedYearly: 0, usedThisMonth: 0 };
      }
      typeUsageMap[typeKey].usedYearly += l.daysCount || 1;
      totalUsedYearly += l.daysCount || 1;

      if (l.startDate.startsWith(monthPrefix)) {
        typeUsageMap[typeKey].usedThisMonth += l.daysCount || 1;
        totalUsedThisMonth += l.daysCount || 1;
      }
    }

    const configuredTypes = policy.leaveTypes && policy.leaveTypes.length > 0
      ? policy.leaveTypes
      : [
          { id: 'ANNUAL', name: 'Annual / Paid Leave', quota: 10, monthlyLimit: 2, isPaid: true },
          { id: 'SICK', name: 'Sick Leave', quota: 7, monthlyLimit: 2, isPaid: true },
          { id: 'CASUAL', name: 'Casual Leave', quota: 7, monthlyLimit: 2, isPaid: true },
        ];

    const typesBreakdown = configuredTypes.map((t) => {
      const usage = typeUsageMap[t.id] || typeUsageMap[t.name] || { usedYearly: 0, usedThisMonth: 0 };
      const remainingYearly = Math.max(0, t.quota - usage.usedYearly);
      const monthlyCap = t.monthlyLimit ?? policy.monthlyLimit ?? 2;
      const remainingThisMonth = Math.max(0, monthlyCap - usage.usedThisMonth);

      return {
        id: t.id,
        name: t.name,
        quota: t.quota,
        monthlyLimit: monthlyCap,
        usedYearly: usage.usedYearly,
        remainingYearly,
        usedThisMonth: usage.usedThisMonth,
        remainingThisMonth,
        isPaid: t.isPaid,
      };
    });

    const totalYearlyQuota = policy.totalYearlyQuota || 24;
    const remainingYearly = Math.max(0, totalYearlyQuota - totalUsedYearly);
    const monthlyLimit = policy.monthlyLimit || 2;
    const remainingThisMonth = Math.max(0, monthlyLimit - totalUsedThisMonth);

    return {
      totalYearlyQuota,
      totalUsedYearly,
      remainingYearly,
      monthlyLimit,
      totalUsedThisMonth,
      remainingThisMonth,
      types: typesBreakdown,
    };
  }
}
