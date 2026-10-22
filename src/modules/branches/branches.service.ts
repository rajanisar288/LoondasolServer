import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Branch, BranchSchema } from './schemas/branch.schema';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { RegionCode } from '../../common/constants/regions.constant';

@Injectable()
export class BranchesService {
  constructor(private readonly regionalDbManager: RegionalDatabaseManager) {}

  async findAll(tenant: TenantContext): Promise<Branch[]> {
    const model = await this.regionalDbManager.getModel<Branch>(
      tenant.region,
      Branch.name,
      BranchSchema,
    );
    return model.find({ companyId: tenant.companyId }).sort({ name: 1 }).lean();
  }

  async findOne(tenant: TenantContext, branchId: string): Promise<Branch> {
    const model = await this.regionalDbManager.getModel<Branch>(
      tenant.region,
      Branch.name,
      BranchSchema,
    );
    const branch = await model
      .findOne({ companyId: tenant.companyId, branchId })
      .lean();
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async create(tenant: TenantContext, dto: CreateBranchDto): Promise<Branch> {
    const model = await this.regionalDbManager.getModel<Branch>(
      tenant.region,
      Branch.name,
      BranchSchema,
    );

    const existing = await model
      .findOne({ companyId: tenant.companyId, name: dto.name.trim() })
      .lean();
    if (existing) {
      throw new ConflictException(`A branch named "${dto.name}" already exists`);
    }

    const branchId = `br_${randomUUID()}`;
    return model.create({
      branchId,
      companyId: tenant.companyId,
      name: dto.name.trim(),
      address: dto.address.trim(),
      phone: dto.phone?.trim(),
      timezone: dto.timezone || 'UTC',
      currency: dto.currency?.trim() || undefined,
      workingHours: {
        enabled: dto.workingHours?.enabled ?? true,
        startTime: dto.workingHours?.startTime ?? '09:00',
        endTime: dto.workingHours?.endTime ?? '18:00',
        workingDays: dto.workingHours?.workingDays ?? [1, 2, 3, 4, 5],
        enforceLoginRestriction: dto.workingHours?.enforceLoginRestriction ?? false,
      },
      employeeCount: 0,
    });
  }

  async update(
    tenant: TenantContext,
    branchId: string,
    dto: UpdateBranchDto,
  ): Promise<Branch> {
    const model = await this.regionalDbManager.getModel<Branch>(
      tenant.region,
      Branch.name,
      BranchSchema,
    );

    const updated = await model
      .findOneAndUpdate(
        { companyId: tenant.companyId, branchId },
        { $set: dto },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Branch not found');
    }

    return updated;
  }

  async delete(
    tenant: TenantContext,
    branchId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<Branch>(
      tenant.region,
      Branch.name,
      BranchSchema,
    );

    const result = await model.deleteOne({
      companyId: tenant.companyId,
      branchId,
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Branch not found');
    }

    return { success: true };
  }

  async validateBranchAccess(
    region: string,
    companyId: string,
    branchId: string,
  ): Promise<void> {
    const model = await this.regionalDbManager.getModel<Branch>(
      region as RegionCode,
      Branch.name,
      BranchSchema,
    );

    const branch = await model.findOne({ companyId, branchId }).lean();
    if (!branch || !branch.workingHours || !branch.workingHours.enforceLoginRestriction) {
      return; // No restriction
    }

    // Check day of week and working hours
    const tz = branch.timezone || 'UTC';
    const now = new Date();
    
    // Format date in branch timezone
    const dayStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'narrow',
    }); // or day of week number
    const dayOfWeek = new Date(now.toLocaleString('en-US', { timeZone: tz })).getDay();
    // JS getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat

    const workingDays = branch.workingHours.workingDays || [1, 2, 3, 4, 5];
    if (!workingDays.includes(dayOfWeek)) {
      throw new ForbiddenException(
        `Login rejected: Today is not an authorized working day for branch "${branch.name}".`,
      );
    }

    // Check time
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const currentBranchTime = timeFormatter.format(now); // e.g. "14:30"

    const start = branch.workingHours.startTime || '09:00';
    const end = branch.workingHours.endTime || '18:00';

    if (currentBranchTime < start || currentBranchTime > end) {
      throw new ForbiddenException(
        `Login rejected: Outside authorized shift hours (${start} - ${end}) for branch "${branch.name}".`,
      );
    }
  }
}
