import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { MailService } from '../mail/mail.service';
import { AiService } from '../ai/ai.service';
import {
  BroadcastTemplate,
  BroadcastTemplateSchema,
  BroadcastLog,
  BroadcastLogSchema,
} from './schemas/broadcast.schema';
import {
  Employee,
  EmployeeSchema,
  EmployeeStatus,
} from '../employees/schemas/employee.schema';
import {
  Department,
  DepartmentSchema,
} from '../departments/schemas/department.schema';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import {
  SendBroadcastDto,
  CreateTemplateDto,
  GenerateAiDraftDto,
} from './dto/broadcast.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class BroadcastsService {
  constructor(
    private readonly regionalDbManager: RegionalDatabaseManager,
    private readonly mailService: MailService,
    private readonly aiService: AiService,
  ) {}

  // Dispatches broadcast email to selected audience
  async sendBroadcast(
    tenant: TenantContext,
    user: JwtPayload,
    dto: SendBroadcastDto,
  ): Promise<{
    success: boolean;
    recipientCount: number;
    broadcastId: string;
  }> {
    const employeeModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );
    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );
    const logModel = await this.regionalDbManager.getModel<BroadcastLog>(
      tenant.region,
      BroadcastLog.name,
      BroadcastLogSchema,
    );

    const company = await companyModel
      .findOne({ companyId: tenant.companyId })
      .lean();
    const companyName = company?.name || 'WorkivLab';

    // 1. Resolve recipients
    const query: Record<string, unknown> = {
      companyId: tenant.companyId,
      status: EmployeeStatus.ACTIVE,
    };

    let targetDepartmentName: string | undefined;

    if (dto.targetType === 'department') {
      if (!dto.departmentId) {
        throw new BadRequestException(
          'Department is required when targetType is department',
        );
      }
      query['departmentId'] = dto.departmentId;

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
      targetDepartmentName = dept?.name;
    } else if (dto.targetType === 'selected') {
      if (!dto.employeeIds || dto.employeeIds.length === 0) {
        throw new BadRequestException('At least one employee must be selected');
      }
      query['employeeId'] = { $in: dto.employeeIds };
    }

    const recipients = await employeeModel
      .find(query, { email: 1, firstName: 1, lastName: 1 })
      .lean();

    if (recipients.length === 0) {
      throw new BadRequestException(
        'No active recipients found for selected criteria',
      );
    }

    // 2. Dispatch emails via MailService
    const broadcastId = `bcast_${randomUUID()}`;
    const emailPromises = recipients.map((r) =>
      this.mailService.sendBroadcastEmail(r.email, {
        companyName,
        subject: dto.subject,
        body: dto.body,
        senderName: user.email,
      }),
    );

    // Fire dispatches in background
    Promise.allSettled(emailPromises);

    // 3. Record broadcast log
    await logModel.create({
      broadcastId,
      companyId: tenant.companyId,
      subject: dto.subject,
      body: dto.body,
      targetType: dto.targetType,
      targetDepartmentName,
      recipientCount: recipients.length,
      sentBy: user.email,
      sentAt: new Date(),
    });

    return {
      success: true,
      recipientCount: recipients.length,
      broadcastId,
    };
  }

  // Retrieve saved company templates
  async listTemplates(tenant: TenantContext): Promise<BroadcastTemplate[]> {
    const model = await this.regionalDbManager.getModel<BroadcastTemplate>(
      tenant.region,
      BroadcastTemplate.name,
      BroadcastTemplateSchema,
    );
    return model
      .find({ companyId: tenant.companyId })
      .sort({ createdAt: -1 })
      .lean();
  }

  // Save new reusable email template
  async createTemplate(
    tenant: TenantContext,
    dto: CreateTemplateDto,
  ): Promise<BroadcastTemplate> {
    const model = await this.regionalDbManager.getModel<BroadcastTemplate>(
      tenant.region,
      BroadcastTemplate.name,
      BroadcastTemplateSchema,
    );

    const templateId = `tmpl_${randomUUID()}`;
    return model.create({
      templateId,
      companyId: tenant.companyId,
      name: dto.name.trim(),
      subject: dto.subject.trim(),
      body: dto.body.trim(),
      category: dto.category || 'General',
    });
  }

  // Delete template
  async deleteTemplate(
    tenant: TenantContext,
    templateId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<BroadcastTemplate>(
      tenant.region,
      BroadcastTemplate.name,
      BroadcastTemplateSchema,
    );

    const res = await model.deleteOne({
      companyId: tenant.companyId,
      templateId,
    });
    if (res.deletedCount === 0) {
      throw new NotFoundException('Template not found');
    }
    return { success: true };
  }

  // Get broadcast delivery history
  async getHistory(tenant: TenantContext): Promise<BroadcastLog[]> {
    const model = await this.regionalDbManager.getModel<BroadcastLog>(
      tenant.region,
      BroadcastLog.name,
      BroadcastLogSchema,
    );
    return model
      .find({ companyId: tenant.companyId })
      .sort({ sentAt: -1 })
      .limit(50)
      .lean();
  }

  // Generate AI Draft using Google Gemini or intelligent engine
  async generateAiDraft(
    tenant: TenantContext,
    dto: GenerateAiDraftDto,
  ): Promise<{ subject: string; body: string; modelUsed: string }> {
    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );
    const company = await companyModel
      .findOne({ companyId: tenant.companyId })
      .lean();
    const companyName = company?.name || 'WorkivLab';

    return this.aiService.generateEmailDraft(
      dto.topic,
      dto.tone || 'professional',
      companyName,
      dto.audience || 'all employees',
    );
  }
}
