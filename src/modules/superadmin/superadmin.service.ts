import {
  Injectable,
  OnModuleInit,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { MasterIdentity, MasterIdentityDocument, AccountStatus } from '../../database/master.schema';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { PasswordService } from '../auth/password.service';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { REGIONS, RegionCode } from '../../common/constants/regions.constant';
import { ALL_PERMISSIONS } from '../../common/constants/permissions.constant';
import { ROLES } from '../../common/constants/roles.constant';

@Injectable()
export class SuperAdminService implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    @InjectModel(MasterIdentity.name)
    private readonly masterIdentityModel: Model<MasterIdentityDocument>,
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
    private readonly regionalDbManager: RegionalDatabaseManager,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
  ) {}

  /** Automatically seeds or updates the Super Admin identity on backend boot. */
  async onModuleInit(): Promise<void> {
    const email = (
      this.configService.get<string>('SUPERADMIN_EMAIL') || 'admin@admin.com'
    ).toLowerCase().trim();
    const rawPassword =
      this.configService.get<string>('SUPERADMIN_PASSWORD') || '9546167mobile191';

    try {
      const passwordHash = await this.passwordService.hash(rawPassword);
      const superAdminUserId = 'superadmin_system_id';
      const companyId = 'superadmin_workspace';
      const region: RegionCode = 'PK';

      // 1. Ensure Master Identity for SuperAdmin
      let master = await this.masterIdentityModel.findOne({ normalizedEmail: email });
      if (!master) {
        master = await this.masterIdentityModel.create({
          userId: superAdminUserId,
          email,
          normalizedEmail: email,
          companyId,
          region,
          status: AccountStatus.ACTIVE,
          isEmailVerified: true,
        });
      } else {
        await this.masterIdentityModel.updateOne(
          { normalizedEmail: email },
          { $set: { status: AccountStatus.ACTIVE, isEmailVerified: true } },
        );
      }

      // 2. Ensure SuperAdmin User record in Primary Regional DB
      const userModel = await this.regionalDbManager.getModel<User>(
        region,
        User.name,
        UserSchema,
      );

      const existingUser = await userModel.findOne({ email });
      if (!existingUser) {
        await userModel.create({
          userId: master.userId,
          companyId,
          region,
          email,
          normalizedEmail: email,
          passwordHash,
          firstName: 'Super',
          lastName: 'Admin',
          displayName: 'Super Admin',
          roleId: 'role_superadmin',
          roleName: ROLES.SUPERADMIN || 'SUPERADMIN',
          permissions: ALL_PERMISSIONS,
          isOwner: true,
          isSuperAdmin: true,
          status: AccountStatus.ACTIVE,
          isEmailVerified: true,
        });
      } else {
        await userModel.updateOne(
          { email },
          {
            $set: {
              passwordHash,
              roleName: ROLES.SUPERADMIN || 'SUPERADMIN',
              isSuperAdmin: true,
              permissions: ALL_PERMISSIONS,
              status: AccountStatus.ACTIVE,
            },
          },
        );
      }

      this.logger.log(`Super Admin credentials initialized for [${email}]`);
    } catch (err: any) {
      this.logger.error(`Failed to initialize Super Admin: ${err.message}`);
    }
  }

  /** Logs an audit event to the system audit trail. */
  async logEvent(params: {
    action: string;
    userId?: string;
    userEmail?: string;
    companyId?: string;
    companyName?: string;
    region?: string;
    ipAddress?: string;
    details?: Record<string, any>;
  }): Promise<AuditLogDocument> {
    try {
      return await this.auditLogModel.create({
        logId: `log_${randomUUID()}`,
        action: params.action,
        userId: params.userId,
        userEmail: params.userEmail,
        companyId: params.companyId,
        companyName: params.companyName,
        region: params.region,
        ipAddress: params.ipAddress,
        details: params.details || {},
      });
    } catch (err: any) {
      this.logger.warn(`Failed to write audit log: ${err.message}`);
      return null as any;
    }
  }

  /** Calculates system-wide KPIs and telemetry. */
  async getSystemStats(): Promise<Record<string, any>> {
    const totalIdentities = await this.masterIdentityModel.countDocuments();
    const activeIdentities = await this.masterIdentityModel.countDocuments({
      status: AccountStatus.ACTIVE,
    });
    const totalLogs = await this.auditLogModel.countDocuments();

    let totalCompanies = 0;
    let activeCompanies = 0;
    let inactiveCompanies = 0;
    let freeTrialCompanies = 0;
    let paidCompanies = 0;
    let proPlanCompanies = 0;
    let ultraPlanCompanies = 0;
    let totalEmployees = 0;

    for (const region of Object.values(REGIONS)) {
      try {
        const companyModel = await this.regionalDbManager.getModel<Company>(
          region as RegionCode,
          Company.name,
          CompanySchema,
        );
        const employeeModel = await this.regionalDbManager.getModel<Employee>(
          region as RegionCode,
          Employee.name,
          EmployeeSchema,
        );

        const companies = await companyModel.find().select('status subscription').lean();
        totalCompanies += companies.length;
        activeCompanies += companies.filter((c) => (c.status || 'ACTIVE') === 'ACTIVE').length;
        inactiveCompanies += companies.filter((c) => c.status && c.status !== 'ACTIVE').length;

        for (const comp of companies) {
          const plan = comp.subscription?.plan || 'FREE_TRIAL';
          if (plan === 'PRO') {
            paidCompanies++;
            proPlanCompanies++;
          } else if (plan === 'ULTRA') {
            paidCompanies++;
            ultraPlanCompanies++;
          } else {
            freeTrialCompanies++;
          }
        }

        const empCount = await employeeModel.countDocuments();
        totalEmployees += empCount;
      } catch (e) {
        // Skip uninitialized region DBs
      }
    }

    return {
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      freeTrialCompanies,
      paidCompanies,
      proPlanCompanies,
      ultraPlanCompanies,
      totalUsers: totalIdentities,
      activeUsers: activeIdentities,
      totalEmployees,
      totalLogs,
      regions: Object.values(REGIONS),
    };
  }

  /** Retrieves all registered companies across all regional databases. */
  async getAllCompanies(): Promise<any[]> {
    const allCompanies: any[] = [];

    for (const region of Object.values(REGIONS)) {
      try {
        const companyModel = await this.regionalDbManager.getModel<Company>(
          region as RegionCode,
          Company.name,
          CompanySchema,
        );
        const employeeModel = await this.regionalDbManager.getModel<Employee>(
          region as RegionCode,
          Employee.name,
          EmployeeSchema,
        );

        const companies = await companyModel.find().lean();
        for (const comp of companies) {
          const empCount = await employeeModel.countDocuments({ companyId: comp.companyId });
          allCompanies.push({
            ...comp,
            status: comp.status || 'ACTIVE',
            employeeCount: empCount,
          });
        }
      } catch (e) {
        // Skip region error
      }
    }

    return allCompanies.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
  }

  /** Retrieves full company detail including employee directory. */
  async getCompanyDetails(companyId: string): Promise<any> {
    for (const region of Object.values(REGIONS)) {
      try {
        const companyModel = await this.regionalDbManager.getModel<Company>(
          region as RegionCode,
          Company.name,
          CompanySchema,
        );
        const company = await companyModel.findOne({ companyId }).lean();
        if (company) {
          const employeeModel = await this.regionalDbManager.getModel<Employee>(
            region as RegionCode,
            Employee.name,
            EmployeeSchema,
          );
          const employees = await employeeModel.find({ companyId }).lean();
          const logs = await this.auditLogModel
            .find({ companyId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

          return {
            company: {
              ...company,
              status: company.status || 'ACTIVE',
            },
            employees,
            recentLogs: logs,
          };
        }
      } catch (e) {
        // Continue search across regions
      }
    }

    throw new NotFoundException(`Company [${companyId}] not found`);
  }

  /** Updates company operational status (ACTIVE, INACTIVE, SUSPENDED). */
  async updateCompanyStatus(
    companyId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    superAdminUser: { userId: string; email: string },
  ): Promise<any> {
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      throw new BadRequestException('Invalid status value');
    }

    let targetCompany: Company | null = null;
    let companyRegion: RegionCode = 'PK';

    for (const region of Object.values(REGIONS)) {
      try {
        const companyModel = await this.regionalDbManager.getModel<Company>(
          region as RegionCode,
          Company.name,
          CompanySchema,
        );
        const comp = await companyModel.findOne({ companyId });
        if (comp) {
          targetCompany = comp;
          companyRegion = region as RegionCode;
          comp.status = status;
          await comp.save();

          // Update all regional user records for this company
          const userModel = await this.regionalDbManager.getModel<User>(
            region as RegionCode,
            User.name,
            UserSchema,
          );
          const accountStatus =
            status === 'ACTIVE' ? AccountStatus.ACTIVE : AccountStatus.SUSPENDED;
          await userModel.updateMany({ companyId }, { $set: { status: accountStatus } });
          break;
        }
      } catch (e) {
        // Skip
      }
    }

    if (!targetCompany) {
      throw new NotFoundException(`Company [${companyId}] not found`);
    }

    // Update master identities status for all users in this company
    const masterAccountStatus =
      status === 'ACTIVE' ? AccountStatus.ACTIVE : AccountStatus.SUSPENDED;
    await this.masterIdentityModel.updateMany(
      { companyId },
      { $set: { status: masterAccountStatus } },
    );

    // Log Super Admin Audit Event
    await this.logEvent({
      action: 'COMPANY_STATUS_UPDATED',
      userId: superAdminUser.userId,
      userEmail: superAdminUser.email,
      companyId,
      companyName: targetCompany.name,
      region: companyRegion,
      details: { newStatus: status, previousStatus: targetCompany.status },
    });

    return {
      success: true,
      message: `Company [${targetCompany.name}] status updated to ${status}`,
      companyId,
      status,
    };
  }

  /** Queries system audit logs with filtering and pagination. */
  async getAuditLogs(query?: {
    action?: string;
    companyId?: string;
    search?: string;
    limit?: number;
    page?: number;
  }): Promise<{ logs: AuditLog[]; total: number; page: number; limit: number }> {
    const limit = Math.min(Number(query?.limit) || 50, 200);
    const page = Math.max(Number(query?.page) || 1, 1);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query?.action) {
      filter.action = query.action;
    }
    if (query?.companyId) {
      filter.companyId = query.companyId;
    }
    if (query?.search) {
      const reg = new RegExp(query.search, 'i');
      filter.$or = [
        { action: reg },
        { userEmail: reg },
        { companyName: reg },
        { companyId: reg },
      ];
    }

    const [logs, total] = await Promise.all([
      this.auditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.auditLogModel.countDocuments(filter),
    ]);

    return {
      logs: logs as AuditLog[],
      total,
      page,
      limit,
    };
  }

  /** Returns all users across all companies in the platform. */
  async getAllUsers(search?: string): Promise<any[]> {
    const allUsers: any[] = [];
    const reg = search ? new RegExp(search, 'i') : null;

    for (const region of Object.values(REGIONS)) {
      try {
        const userModel = await this.regionalDbManager.getModel<User>(
          region as RegionCode,
          User.name,
          UserSchema,
        );

        const filter: Record<string, any> = {};
        if (reg) {
          filter.$or = [
            { email: reg },
            { firstName: reg },
            { lastName: reg },
            { companyId: reg },
          ];
        }

        const users = await userModel.find(filter).select('-passwordHash').limit(100).lean();
        allUsers.push(...users);
      } catch (e) {
        // Skip region
      }
    }

    return allUsers;
  }
}
