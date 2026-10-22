import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import {
  Resignation,
  ResignationSchema,
  ResignationStatus,
} from './schemas/resignation.schema';
import {
  Employee,
  EmployeeSchema,
  EmployeeStatus,
} from '../employees/schemas/employee.schema';
import {
  SubmitResignationDto,
  UpdateClearanceChecklistDto,
  UpdateResignationStatusDto,
} from './dto/resignation.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

@Injectable()
export class ResignationsService {
  constructor(private readonly regionalDbManager: RegionalDatabaseManager) {}

  async findAll(tenant: TenantContext, user: JwtPayload): Promise<Resignation[]> {
    const model = await this.regionalDbManager.getModel<Resignation>(
      tenant.region,
      Resignation.name,
      ResignationSchema,
    );

    const isHrOrOwner =
      user.isOwner ||
      user.role === 'OWNER' ||
      user.permissions?.includes(PERMISSIONS.RESIGNATIONS_APPROVE);

    const query: any = { companyId: tenant.companyId };
    if (!isHrOrOwner) {
      query.userId = user.userId;
    }

    return model.find(query).sort({ createdAt: -1 }).lean();
  }

  async findOne(tenant: TenantContext, resignationId: string): Promise<Resignation> {
    const model = await this.regionalDbManager.getModel<Resignation>(
      tenant.region,
      Resignation.name,
      ResignationSchema,
    );
    const resignation = await model
      .findOne({ companyId: tenant.companyId, resignationId })
      .lean();
    if (!resignation) {
      throw new NotFoundException('Resignation request not found');
    }
    return resignation;
  }

  async submit(
    tenant: TenantContext,
    user: JwtPayload,
    dto: SubmitResignationDto,
  ): Promise<Resignation> {
    const model = await this.regionalDbManager.getModel<Resignation>(
      tenant.region,
      Resignation.name,
      ResignationSchema,
    );
    const empModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );

    const emp = await empModel.findOne({
      companyId: tenant.companyId,
      $or: [{ userId: user.userId }, { email: user.email }],
    });

    const employeeId = emp?.employeeId || `emp_${user.userId}`;
    const employeeName = emp
      ? `${emp.firstName} ${emp.lastName}`
      : user.email.split('@')[0];
    const departmentName = emp?.departmentName;

    const resignationId = `resig_${randomUUID()}`;
    return model.create({
      resignationId,
      companyId: tenant.companyId,
      employeeId,
      userId: user.userId,
      employeeName,
      employeeEmail: user.email,
      departmentName,
      submissionDate: new Date(),
      intendedLastWorkingDay: new Date(dto.intendedLastWorkingDay),
      reason: dto.reason.trim(),
      status: ResignationStatus.SUBMITTED,
      clearanceChecklist: {
        itAssetsReturned: false,
        accessRevoked: false,
        idBadgeReturned: false,
        financeDuesCleared: false,
        knowledgeTransferDone: false,
      },
    });
  }

  async updateClearance(
    tenant: TenantContext,
    user: JwtPayload,
    resignationId: string,
    dto: UpdateClearanceChecklistDto,
  ): Promise<Resignation> {
    const model = await this.regionalDbManager.getModel<Resignation>(
      tenant.region,
      Resignation.name,
      ResignationSchema,
    );

    const updateFields: any = {};
    if (dto.itAssetsReturned !== undefined) {
      updateFields['clearanceChecklist.itAssetsReturned'] = dto.itAssetsReturned;
    }
    if (dto.accessRevoked !== undefined) {
      updateFields['clearanceChecklist.accessRevoked'] = dto.accessRevoked;
    }
    if (dto.idBadgeReturned !== undefined) {
      updateFields['clearanceChecklist.idBadgeReturned'] = dto.idBadgeReturned;
    }
    if (dto.financeDuesCleared !== undefined) {
      updateFields['clearanceChecklist.financeDuesCleared'] = dto.financeDuesCleared;
    }
    if (dto.knowledgeTransferDone !== undefined) {
      updateFields['clearanceChecklist.knowledgeTransferDone'] = dto.knowledgeTransferDone;
    }

    const updated = await model
      .findOneAndUpdate(
        { companyId: tenant.companyId, resignationId },
        { $set: updateFields },
        { new: true },
      )
      .lean();

    if (!updated) throw new NotFoundException('Resignation request not found');
    return updated;
  }

  async updateStatus(
    tenant: TenantContext,
    user: JwtPayload,
    resignationId: string,
    dto: UpdateResignationStatusDto,
  ): Promise<Resignation> {
    const model = await this.regionalDbManager.getModel<Resignation>(
      tenant.region,
      Resignation.name,
      ResignationSchema,
    );

    const updateFields: any = {
      status: dto.status,
      reviewedBy: user.userId,
      reviewedAt: new Date(),
    };
    if (dto.exitInterviewNotes) {
      updateFields.exitInterviewNotes = dto.exitInterviewNotes.trim();
    }

    const updated = await model
      .findOneAndUpdate(
        { companyId: tenant.companyId, resignationId },
        { $set: updateFields },
        { new: true },
      )
      .lean();

    if (!updated) throw new NotFoundException('Resignation request not found');

    // If completed or approved, optionally mark employee status
    if (dto.status === ResignationStatus.COMPLETED) {
      const empModel = await this.regionalDbManager.getModel<Employee>(
        tenant.region,
        Employee.name,
        EmployeeSchema,
      );
      await empModel.updateOne(
        { companyId: tenant.companyId, employeeId: updated.employeeId },
        { $set: { status: EmployeeStatus.TERMINATED } },
      );
    }

    return updated;
  }
}
