import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import {
  Company,
  CompanySchema,
  SubscriptionPlan,
  SubscriptionStatus,
} from './schemas/company.schema';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { Role, RoleSchema } from '../roles/schemas/role.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import {
  Attendance,
  AttendanceSchema,
} from '../attendance/schemas/attendance.schema';
import { Leave, LeaveSchema } from '../leave/schemas/leave.schema';
import { Channel, ChannelSchema } from '../chat/schemas/channel.schema';
import { Message, MessageSchema } from '../chat/schemas/message.schema';
import { Meeting, MeetingSchema } from '../meetings/schemas/meeting.schema';
import {
  Notification,
  NotificationSchema,
} from '../notifications/schemas/notification.schema';
import {
  MasterIdentity,
  MasterIdentityDocument,
} from '../../database/master.schema';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly regionalDbManager: RegionalDatabaseManager,
    @InjectModel(MasterIdentity.name)
    private readonly masterIdentityModel: Model<MasterIdentityDocument>,
  ) {}

  // Retrieves tenant company profile from regional database
  async getCompany(tenant: TenantContext): Promise<Company> {
    const model = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );

    const company = await model.findOne({ companyId: tenant.companyId }).lean();
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }
    return company;
  }

  // Updates tenant settings, timezone, currency, and working hours
  async updateCompany(
    tenant: TenantContext,
    dto: UpdateCompanyDto,
  ): Promise<Company> {
    const model = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );

    const updated = await model
      .findOneAndUpdate(
        { companyId: tenant.companyId },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .lean();

    if (!updated) {
      throw new NotFoundException('Company profile not found');
    }

    return updated;
  }

  // Permanently deletes company, purging all regional shard collections and master identities
  async deleteCompany(
    tenant: TenantContext,
    user: JwtPayload,
  ): Promise<{ message: string; success: boolean }> {
    if (!user.isOwner) {
      throw new ForbiddenException(
        'Security Violation: Only the registered company owner can permanently delete this workspace.',
      );
    }

    const companyId = tenant.companyId;
    const region = tenant.region;

    const companyModel = await this.regionalDbManager.getModel<Company>(
      region,
      Company.name,
      CompanySchema,
    );
    const userModel = await this.regionalDbManager.getModel<User>(
      region,
      User.name,
      UserSchema,
    );
    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      region,
      Employee.name,
      EmployeeSchema,
    );
    const roleModel = await this.regionalDbManager.getModel<Role>(
      region,
      Role.name,
      RoleSchema,
    );
    const deptModel = await this.regionalDbManager.getModel<Department>(
      region,
      Department.name,
      DepartmentSchema,
    );
    const taskModel = await this.regionalDbManager.getModel<Task>(
      region,
      Task.name,
      TaskSchema,
    );
    const attendanceModel = await this.regionalDbManager.getModel<Attendance>(
      region,
      Attendance.name,
      AttendanceSchema,
    );
    const leaveModel = await this.regionalDbManager.getModel<Leave>(
      region,
      Leave.name,
      LeaveSchema,
    );
    const channelModel = await this.regionalDbManager.getModel<Channel>(
      region,
      Channel.name,
      ChannelSchema,
    );
    const messageModel = await this.regionalDbManager.getModel<Message>(
      region,
      Message.name,
      MessageSchema,
    );
    const meetingModel = await this.regionalDbManager.getModel<Meeting>(
      region,
      Meeting.name,
      MeetingSchema,
    );
    const notifModel = await this.regionalDbManager.getModel<Notification>(
      region,
      Notification.name,
      NotificationSchema,
    );

    // Purge regional collections in parallel
    await Promise.all([
      companyModel.deleteOne({ companyId }),
      userModel.deleteMany({ companyId }),
      employeeModel.deleteMany({ companyId }),
      roleModel.deleteMany({ companyId }),
      deptModel.deleteMany({ companyId }),
      taskModel.deleteMany({ companyId }),
      attendanceModel.deleteMany({ companyId }),
      leaveModel.deleteMany({ companyId }),
      channelModel.deleteMany({ companyId }),
      messageModel.deleteMany({ companyId }),
      meetingModel.deleteMany({ companyId }),
      notifModel.deleteMany({ companyId }),
    ]);

    // Purge all master identity entries
    await this.masterIdentityModel.deleteMany({ companyId });

    return {
      message: 'Company workspace and all associated data permanently deleted.',
      success: true,
    };
  }

  // getSeatStatus: computes total active seats used by owner and employees against purchased quota
  async getSeatStatus(tenant: TenantContext): Promise<{
    purchasedSeats: number;
    totalActiveSeats: number;
    availableSeats: number;
    plan: string;
    pricePerSeat: number;
    aiLimit: number;
    aiUsed: number;
  }> {
    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );
    const company = await companyModel.findOne({ companyId: tenant.companyId }).lean();
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    const activeEmployees = await employeeModel.countDocuments({
      companyId: tenant.companyId,
      status: { $nin: ['TERMINATED', 'DEACTIVATED', 'INACTIVE'] },
    });

    const totalActiveSeats = activeEmployees + 1;
    const purchasedSeats = company.subscription?.purchasedSeats ?? 5;
    const plan = company.subscription?.plan || 'PRO';
    const pricePerSeat = company.subscription?.pricePerSeat ?? 5;
    const aiLimit = company.subscription?.aiRequestLimit ?? 5000;
    const aiUsed = company.subscription?.aiRequestsUsedThisMonth ?? 0;
    const availableSeats = Math.max(0, purchasedSeats - totalActiveSeats);

    return {
      purchasedSeats,
      totalActiveSeats,
      availableSeats,
      plan,
      pricePerSeat,
      aiLimit,
      aiUsed,
    };
  }

  // addSeats: expands company purchased seats and calculates incremental seat charge
  async addSeats(
    tenant: TenantContext,
    additionalSeats: number,
  ): Promise<{ success: boolean; additionalSeats: number; totalSeats: number; chargedAmount: number }> {
    if (!additionalSeats || additionalSeats < 1) {
      throw new BadRequestException('Additional seats count must be at least 1');
    }

    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );

    const company = await companyModel.findOne({ companyId: tenant.companyId });
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const pricePerSeat = company.subscription?.pricePerSeat ?? 5;
    const chargedAmount = additionalSeats * pricePerSeat;
    const currentSeats = company.subscription?.purchasedSeats ?? 5;
    const newTotalSeats = currentSeats + additionalSeats;

    if (!company.subscription) {
      company.subscription = {
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        purchasedSeats: newTotalSeats,
        pricePerSeat,
        aiRequestLimit: 5000,
        aiRequestsUsedThisMonth: 0,
      } as any;
    } else {
      company.subscription.purchasedSeats = newTotalSeats;
    }

    await company.save();

    return {
      success: true,
      additionalSeats,
      totalSeats: newTotalSeats,
      chargedAmount,
    };
  }
}
