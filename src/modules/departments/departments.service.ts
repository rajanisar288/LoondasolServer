import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Department, DepartmentSchema } from './schemas/department.schema';
import { Branch, BranchSchema } from '../branches/schemas/branch.schema';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/create-department.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';

@Injectable()
export class DepartmentsService {
  constructor(private readonly regionalDbManager: RegionalDatabaseManager) {}

  // List departments belonging to caller's company, optionally filtered by branch
  async findAll(tenant: TenantContext, branchId?: string): Promise<Department[]> {
    const model = await this.regionalDbManager.getModel<Department>(
      tenant.region,
      Department.name,
      DepartmentSchema,
    );

    const filter: Record<string, any> = { companyId: tenant.companyId };
    if (branchId) {
      if (branchId === 'COMPANY_WIDE') {
        filter.$or = [
          { isCompanyWide: true },
          { branchId: null },
          { branchId: '' },
          { branchId: { $exists: false } },
        ];
      } else {
        // Return departments specifically assigned to this branch OR company-wide departments
        filter.$or = [
          { branchId },
          { isCompanyWide: true },
          { branchId: null },
          { branchId: '' },
          { branchId: { $exists: false } },
        ];
      }
    }

    return model.find(filter).sort({ name: 1 }).lean();
  }

  // Create department with duplicate name check per branch/scope
  async create(
    tenant: TenantContext,
    dto: CreateDepartmentDto,
  ): Promise<Department> {
    const model = await this.regionalDbManager.getModel<Department>(
      tenant.region,
      Department.name,
      DepartmentSchema,
    );

    const branchId = dto.branchId ? dto.branchId.trim() : null;
    let branchName = dto.branchName?.trim();
    if (branchId && !branchName) {
      const branchModel = await this.regionalDbManager.getModel<Branch>(
        tenant.region,
        Branch.name,
        BranchSchema,
      );
      const b = await branchModel.findOne({ companyId: tenant.companyId, branchId }).lean();
      if (b) branchName = b.name;
    }

    const isCompanyWide = dto.isCompanyWide ?? !branchId;

    const existingFilter: Record<string, any> = {
      companyId: tenant.companyId,
      name: dto.name.trim(),
    };
    if (branchId) {
      existingFilter.branchId = branchId;
    } else {
      existingFilter.$or = [{ branchId: null }, { branchId: '' }, { isCompanyWide: true }];
    }

    const existing = await model.findOne(existingFilter).lean();
    if (existing) {
      throw new ConflictException(
        `A department named "${dto.name}" already exists for this scope`,
      );
    }

    const departmentId = `dept_${randomUUID()}`;
    return model.create({
      departmentId,
      companyId: tenant.companyId,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      managerId: dto.managerId,
      branchId: branchId || undefined,
      branchName: branchName || undefined,
      isCompanyWide,
      employeeCount: 0,
    });
  }

  // Update existing department
  async update(
    tenant: TenantContext,
    departmentId: string,
    dto: UpdateDepartmentDto,
  ): Promise<Department> {
    const model = await this.regionalDbManager.getModel<Department>(
      tenant.region,
      Department.name,
      DepartmentSchema,
    );

    const updated = await model
      .findOneAndUpdate(
        { companyId: tenant.companyId, departmentId },
        { $set: dto },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Department not found');
    }

    return updated;
  }

  // Delete department
  async delete(
    tenant: TenantContext,
    departmentId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<Department>(
      tenant.region,
      Department.name,
      DepartmentSchema,
    );

    const result = await model.deleteOne({
      companyId: tenant.companyId,
      departmentId,
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Department not found');
    }

    return { success: true };
  }
}
