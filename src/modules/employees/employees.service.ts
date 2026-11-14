import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID, randomBytes } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import {
  Employee,
  EmployeeSchema,
  EmployeeStatus,
} from './schemas/employee.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import { Branch, BranchSchema } from '../branches/schemas/branch.schema';
import { Role, RoleSchema } from '../roles/schemas/role.schema';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import {
  OnboardingFormTemplate,
  OnboardingFormTemplateSchema,
} from './schemas/onboarding-form.schema';
import {
  CreateOnboardingFormDto,
  UpdateOnboardingFormDto,
} from './dto/onboarding-form.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { PasswordService } from '../auth/password.service';

import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  MasterIdentity,
  MasterIdentityDocument,
  AccountStatus,
} from '../../database/master.schema';

export interface PaginatedEmployees {
  data: Partial<Employee>[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class EmployeesService {
  constructor(
    private readonly regionalDbManager: RegionalDatabaseManager,
    private readonly passwordService: PasswordService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @InjectModel(MasterIdentity.name)
    private readonly masterIdentityModel: Model<MasterIdentityDocument>,
  ) {}

  // Retrieves paginated list of employees with search and department filtering
  async findAll(
    tenant: TenantContext,
    user: JwtPayload,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      departmentId?: string;
      branchId?: string;
      status?: string;
      pagination?: boolean | string;
      paginate?: boolean | string;
    },
  ): Promise<PaginatedEmployees> {
    const model = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    const isPaginationDisabled =
      query.pagination === false ||
      query.pagination === 'false' ||
      query.paginate === false ||
      query.paginate === 'false';

    const page = isPaginationDisabled ? 1 : Math.max(1, Number(query.page) || 1);
    const limit = isPaginationDisabled
      ? 10000
      : Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { companyId: tenant.companyId };

    if (query.departmentId) {
      filter['departmentId'] = query.departmentId;
    }
    if (query.branchId) {
      filter['branchId'] = query.branchId;
    }
    if (query.status) {
      filter['status'] = query.status;
    }

    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter['$or'] = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { designation: regex },
      ];
    }

    const [total, records] = await Promise.all([
      model.countDocuments(filter),
      model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(isPaginationDisabled ? 0 : skip)
        .limit(limit)
        .lean(),
    ]);

    // Check if caller is authorized to view compensation details
    const canViewSalary =
      user.isOwner ||
      (user.permissions &&
        user.permissions.includes(PERMISSIONS.EMPLOYEES_SALARY_VIEW));

    const sanitizedData = records.map((emp) => {
      const record = { ...emp };
      if (!canViewSalary) {
        delete record.salary;
      }
      return record;
    });

    return {
      data: sanitizedData,
      total,
      page,
      limit: isPaginationDisabled ? total : limit,
    };
  }

  // Find single employee by ID
  async findOne(
    tenant: TenantContext,
    user: JwtPayload,
    employeeId: string,
  ): Promise<Partial<Employee>> {
    const model = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    const employee = await model
      .findOne({ companyId: tenant.companyId, employeeId })
      .lean();
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const canViewSalary =
      user.isOwner ||
      (user.permissions &&
        user.permissions.includes(PERMISSIONS.EMPLOYEES_SALARY_VIEW));
    if (!canViewSalary) {
      delete employee.salary;
    }

    return employee;
  }

  // Create new employee profile and generate invitation token
  async create(
    tenant: TenantContext,
    dto: CreateEmployeeDto,
  ): Promise<{ employee: Employee; invitationLink: string }> {
    const model = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    // Enforce employee limit according to purchased seats
    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );
    const company = await companyModel
      .findOne({ companyId: tenant.companyId })
      .lean();

    const activeEmployees = await model.countDocuments({
      companyId: tenant.companyId,
      status: { $nin: ['TERMINATED', 'DEACTIVATED', 'INACTIVE'] },
    });
    const totalActiveSeats = activeEmployees + 1;
    const purchasedSeats = company?.subscription?.purchasedSeats ?? 5;

    if (totalActiveSeats >= purchasedSeats) {
      throw new BadRequestException(
        `You have reached your ${purchasedSeats} employee seats limit. To add more employees, please purchase additional seats in Settings.`,
      );
    }

    const existing = await model
      .findOne({
        companyId: tenant.companyId,
        email: dto.email.toLowerCase().trim(),
      })
      .lean();
    if (existing) {
      throw new ConflictException(
        `An employee with email "${dto.email}" already exists`,
      );
    }

    let departmentName: string | undefined;
    if (dto.departmentId) {
      const deptModel = await this.regionalDbManager.getModel<Department>(
        tenant.region,
        Department.name,
        DepartmentSchema,
      );
      const dept = await deptModel
        .findOne({
          companyId: tenant.companyId,
          departmentId: dto.departmentId,
        })
        .lean();
      if (dept) {
        departmentName = dept.name;
        await deptModel.updateOne(
          { _id: dept._id },
          { $inc: { employeeCount: 1 } },
        );
      }
    }

    let branchName: string | undefined;
    if (dto.branchId) {
      const branchModel = await this.regionalDbManager.getModel<Branch>(
        tenant.region,
        Branch.name,
        BranchSchema,
      );
      const branch = await branchModel
        .findOne({
          companyId: tenant.companyId,
          branchId: dto.branchId,
        })
        .lean();
      if (branch) {
        branchName = branch.name;
        await branchModel.updateOne(
          { _id: branch._id },
          { $inc: { employeeCount: 1 } },
        );
      }
    }

    const employeeId = `emp_${randomUUID()}`;
    const rawInvitationToken = randomBytes(32).toString('hex');
    const invitationTokenHash =
      await this.passwordService.hash(rawInvitationToken);

    const invitationExpiresAt = new Date();
    invitationExpiresAt.setHours(invitationExpiresAt.getHours() + 48);

    let roleName = dto.roleName || 'EMPLOYEE';
    let rolePermissions: string[] = dto.permissions || [];
    let roleId: string | undefined = dto.roleId;

    if (dto.roleId || dto.roleName) {
      const roleModel = await this.regionalDbManager.getModel<Role>(
        tenant.region,
        Role.name,
        RoleSchema,
      );
      let role: any = null;
      if (dto.roleId) {
        role = await roleModel
          .findOne({ companyId: tenant.companyId, _id: dto.roleId })
          .lean();
      } else if (dto.roleName) {
        role = await roleModel
          .findOne({ companyId: tenant.companyId, name: dto.roleName })
          .lean();
      }
      if (role) {
        roleId = role._id.toString();
        roleName = role.name;
        rolePermissions = role.permissions || [];
      }
    }

    const employee = await model.create({
      employeeId,
      companyId: tenant.companyId,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone,
      departmentId: dto.departmentId,
      departmentName,
      branchId: dto.branchId,
      branchName,
      designation: dto.designation.trim(),
      employmentType: dto.employmentType,
      salary: dto.salary || 0,
      taxPercentage: dto.taxPercentage,
      customFields: dto.customFields || {},
      documents: dto.documents || [],
      userLocationRegion: dto.userLocationRegion,
      joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
      status: EmployeeStatus.INVITED,
      permissions: rolePermissions,
      roleName,
      roleId,
      invitationTokenHash,
      invitationExpiresAt,
    });

    const companyName = company?.name || 'WorkivLab';

    const appUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:4200';
    const invitationLink = `${appUrl}/register?token=${rawInvitationToken}&email=${encodeURIComponent(employee.email)}&type=employee&region=${tenant.region}&companyId=${tenant.companyId}`;

    // Dispatch professional invitation email in background
    this.mailService
      .sendEmployeeInvitationEmail(employee.email, {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        companyName,
        designation: employee.designation,
        departmentName,
        inviteLink: invitationLink,
        expiresInHours: 48,
      })
      .catch((err) => {
        // Silently log error without failing transaction
        console.error(
          'Failed to send employee invitation email:',
          err?.message,
        );
      });

    return { employee, invitationLink };
  }

  // Update employee record
  async update(
    tenant: TenantContext,
    employeeId: string,
    dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const model = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    let departmentName: string | undefined;
    if (dto.departmentId) {
      const deptModel = await this.regionalDbManager.getModel<Department>(
        tenant.region,
        Department.name,
        DepartmentSchema,
      );
      const dept = await deptModel
        .findOne({
          companyId: tenant.companyId,
          departmentId: dto.departmentId,
        })
        .lean();
      if (dept) {
        departmentName = dept.name;
      }
    }

    const updatePayload: Record<string, unknown> = { ...dto };
    if (departmentName) {
      updatePayload['departmentName'] = departmentName;
    }

    if (dto.branchId) {
      const branchModel = await this.regionalDbManager.getModel<Branch>(
        tenant.region,
        Branch.name,
        BranchSchema,
      );
      const branch = await branchModel
        .findOne({
          companyId: tenant.companyId,
          branchId: dto.branchId,
        })
        .lean();
      if (branch) {
        updatePayload['branchId'] = branch.branchId;
        updatePayload['branchName'] = branch.name;
      }
    } else if (dto.branchId === '' || dto.branchId === null) {
      updatePayload['branchId'] = null;
      updatePayload['branchName'] = null;
    }

    if (dto.roleId || dto.roleName) {
      const roleModel = await this.regionalDbManager.getModel<Role>(
        tenant.region,
        Role.name,
        RoleSchema,
      );
      let role: any = null;
      if (dto.roleId) {
        role = await roleModel
          .findOne({ companyId: tenant.companyId, _id: dto.roleId })
          .lean();
      } else if (dto.roleName) {
        role = await roleModel
          .findOne({ companyId: tenant.companyId, name: dto.roleName })
          .lean();
      }
      if (role) {
        updatePayload['roleId'] = role._id.toString();
        updatePayload['roleName'] = role.name;
        updatePayload['permissions'] = role.permissions || [];
        dto.permissions = role.permissions || [];
        dto.roleName = role.name;
      }
    }

    const updated = await model
      .findOneAndUpdate(
        { companyId: tenant.companyId, employeeId },
        { $set: updatePayload },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Employee not found');
    }

    // Synchronize permissions and account status with associated User and MasterIdentity
    if (updated.userId) {
      const userModel = await this.regionalDbManager.getModel<User>(
        tenant.region,
        User.name,
        UserSchema,
      );
      const userUpdates: Record<string, unknown> = {};
      if (dto.permissions) userUpdates['permissions'] = dto.permissions;
      if (dto.roleName) userUpdates['roleName'] = dto.roleName;
      if (dto.branchId !== undefined) {
        userUpdates['branchId'] = updatePayload['branchId'];
        userUpdates['branchName'] = updatePayload['branchName'];
      }
      if (dto.status) {
        const accStatus =
          dto.status === EmployeeStatus.ACTIVE
            ? AccountStatus.ACTIVE
            : AccountStatus.DEACTIVATED;
        userUpdates['status'] = accStatus;
        await this.masterIdentityModel.updateOne(
          { userId: updated.userId },
          { $set: { status: accStatus } },
        );
      }
      if (Object.keys(userUpdates).length > 0) {
        await userModel.updateOne(
          { userId: updated.userId, companyId: tenant.companyId },
          { $set: userUpdates },
        );
      }
    }

    return updated;
  }

  // Quick toggle status (e.g. ACTIVE vs INACTIVE)
  async updateStatus(
    tenant: TenantContext,
    employeeId: string,
    status: EmployeeStatus,
  ): Promise<Employee> {
    return this.update(tenant, employeeId, { status });
  }

  // Permanently hard delete employee and all associated user accounts and master identities
  async delete(
    tenant: TenantContext,
    employeeId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    const employee = await model
      .findOne({
        companyId: tenant.companyId,
        employeeId,
      })
      .lean();
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Permanently remove regional user accounts by userId and email
    const userModel = await this.regionalDbManager.getModel<User>(
      tenant.region,
      User.name,
      UserSchema,
    );
    if (employee.userId) {
      await userModel.deleteMany({
        companyId: tenant.companyId,
        userId: employee.userId,
      });
    }
    if (employee.email) {
      await userModel.deleteMany({
        companyId: tenant.companyId,
        email: employee.email.toLowerCase().trim(),
      });
    }

    // Permanently remove master identity routing records
    if (employee.userId) {
      await this.masterIdentityModel.deleteMany({ userId: employee.userId });
    }
    if (employee.email) {
      await this.masterIdentityModel.deleteMany({
        email: employee.email.toLowerCase().trim(),
      });
    }

    // Decrement department employee count if department was assigned
    if (employee.departmentId) {
      const deptModel = await this.regionalDbManager.getModel<Department>(
        tenant.region,
        Department.name,
        DepartmentSchema,
      );
      await deptModel.updateOne(
        {
          companyId: tenant.companyId,
          departmentId: employee.departmentId,
          employeeCount: { $gt: 0 },
        },
        { $inc: { employeeCount: -1 } },
      );
    }

    // Permanently erase employee record from regional collection
    await model.deleteOne({
      companyId: tenant.companyId,
      employeeId,
    });

    return { success: true };
  }

  // --- Dynamic Onboarding Form Templates ---
  async getOnboardingForms(
    tenant: TenantContext,
    query?: { branchId?: string; departmentId?: string },
  ): Promise<OnboardingFormTemplate[]> {
    const model = await this.regionalDbManager.getModel<OnboardingFormTemplate>(
      tenant.region,
      OnboardingFormTemplate.name,
      OnboardingFormTemplateSchema,
    );

    const filter: Record<string, any> = { companyId: tenant.companyId };
    if (query?.branchId) filter['branchId'] = query.branchId;
    if (query?.departmentId) filter['departmentId'] = query.departmentId;

    return model.find(filter).sort({ createdAt: -1 }).lean();
  }

  async getActiveOnboardingForm(
    tenant: TenantContext,
    query?: { branchId?: string; departmentId?: string },
  ): Promise<OnboardingFormTemplate | null> {
    const model = await this.regionalDbManager.getModel<OnboardingFormTemplate>(
      tenant.region,
      OnboardingFormTemplate.name,
      OnboardingFormTemplateSchema,
    );

    // 1. Try matching branch and department specifically
    if (query?.branchId && query?.departmentId) {
      const specific = await model
        .findOne({
          companyId: tenant.companyId,
          branchId: query.branchId,
          departmentId: query.departmentId,
        })
        .lean();
      if (specific) return specific;
    }

    // 2. Try matching branch specifically
    if (query?.branchId) {
      const branchSpecific = await model
        .findOne({
          companyId: tenant.companyId,
          branchId: query.branchId,
        })
        .lean();
      if (branchSpecific) return branchSpecific;
    }

    // 3. Fallback to default or any company-wide form
    const defaultForm = await model
      .findOne({
        companyId: tenant.companyId,
        isDefault: true,
      })
      .lean();
    if (defaultForm) return defaultForm;

    return model.findOne({ companyId: tenant.companyId }).lean();
  }

  async createOnboardingForm(
    tenant: TenantContext,
    dto: CreateOnboardingFormDto,
  ): Promise<OnboardingFormTemplate> {
    const model = await this.regionalDbManager.getModel<OnboardingFormTemplate>(
      tenant.region,
      OnboardingFormTemplate.name,
      OnboardingFormTemplateSchema,
    );

    const templateId = `form_${randomUUID()}`;

    // If marked default, unset other defaults
    if (dto.isDefault) {
      await model.updateMany(
        { companyId: tenant.companyId },
        { $set: { isDefault: false } },
      );
    }

    return model.create({
      templateId,
      companyId: tenant.companyId,
      title: dto.title.trim(),
      branchId: dto.branchId,
      branchName: dto.branchName,
      departmentId: dto.departmentId,
      departmentName: dto.departmentName,
      isDefault: !!dto.isDefault,
      fields: dto.fields || [],
    });
  }

  async updateOnboardingForm(
    tenant: TenantContext,
    templateId: string,
    dto: UpdateOnboardingFormDto,
  ): Promise<OnboardingFormTemplate> {
    const model = await this.regionalDbManager.getModel<OnboardingFormTemplate>(
      tenant.region,
      OnboardingFormTemplate.name,
      OnboardingFormTemplateSchema,
    );

    if (dto.isDefault) {
      await model.updateMany(
        { companyId: tenant.companyId, templateId: { $ne: templateId } },
        { $set: { isDefault: false } },
      );
    }

    const updated = await model
      .findOneAndUpdate(
        { companyId: tenant.companyId, templateId },
        { $set: dto },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Onboarding form template not found');
    }

    return updated;
  }

  async deleteOnboardingForm(
    tenant: TenantContext,
    templateId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<OnboardingFormTemplate>(
      tenant.region,
      OnboardingFormTemplate.name,
      OnboardingFormTemplateSchema,
    );

    const res = await model.deleteOne({
      companyId: tenant.companyId,
      templateId,
    });

    if (res.deletedCount === 0) {
      throw new NotFoundException('Onboarding form template not found');
    }

    return { success: true };
  }
}
