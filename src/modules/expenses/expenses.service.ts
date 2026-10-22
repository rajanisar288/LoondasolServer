import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Expense, ExpenseSchema, ExpenseStatus } from './schemas/expense.schema';
import { CreateExpenseDto, UpdateExpenseStatusDto } from './dto/expense.dto';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

@Injectable()
export class ExpensesService {
  constructor(private readonly regionalDbManager: RegionalDatabaseManager) {}

  async findAll(
    tenant: TenantContext,
    user: JwtPayload,
    filters?: {
      branchId?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Expense[]> {
    const model = await this.regionalDbManager.getModel<Expense>(
      tenant.region,
      Expense.name,
      ExpenseSchema,
    );

    const canManageAll =
      user.isOwner ||
      user.role === 'OWNER' ||
      user.role === 'ADMIN' ||
      user.permissions?.includes(PERMISSIONS.EXPENSES_DELETE) ||
      user.permissions?.includes(PERMISSIONS.REPORTS_VIEW);

    const query: any = { companyId: tenant.companyId };
    if (!canManageAll) {
      query.paidByUserId = user.userId;
    }

    if (filters?.branchId) query.branchId = filters.branchId;
    if (filters?.category) query.category = filters.category;
    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    }

    return model.find(query).sort({ date: -1, createdAt: -1 }).lean();
  }

  async getSummary(
    tenant: TenantContext,
    user: JwtPayload,
  ): Promise<{
    totalExpenses: number;
    pendingCount: number;
    approvedCount: number;
    byCategory: Record<string, number>;
    byBranch: Record<string, number>;
  }> {
    const model = await this.regionalDbManager.getModel<Expense>(
      tenant.region,
      Expense.name,
      ExpenseSchema,
    );

    const canManageAll =
      user.isOwner ||
      user.role === 'OWNER' ||
      user.role === 'ADMIN' ||
      user.permissions?.includes(PERMISSIONS.EXPENSES_DELETE) ||
      user.permissions?.includes(PERMISSIONS.REPORTS_VIEW);

    const query: any = { companyId: tenant.companyId };
    if (!canManageAll) {
      query.paidByUserId = user.userId;
    }

    const expenses = await model.find(query).lean();
    let totalExpenses = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    const byCategory: Record<string, number> = {};
    const byBranch: Record<string, number> = {};

    for (const exp of expenses) {
      totalExpenses += exp.amount;
      if (exp.status === ExpenseStatus.PENDING) pendingCount++;
      if (exp.status === ExpenseStatus.APPROVED || exp.status === ExpenseStatus.REIMBURSED) {
        approvedCount++;
      }

      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
      const bKey = exp.branchName || 'Main Office';
      byBranch[bKey] = (byBranch[bKey] || 0) + exp.amount;
    }

    return {
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      pendingCount,
      approvedCount,
      byCategory,
      byBranch,
    };
  }

  async create(
    tenant: TenantContext,
    user: JwtPayload,
    dto: CreateExpenseDto,
  ): Promise<Expense> {
    const model = await this.regionalDbManager.getModel<Expense>(
      tenant.region,
      Expense.name,
      ExpenseSchema,
    );
    const compModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );
    const company = await compModel.findOne({ companyId: tenant.companyId }).lean();

    const expenseId = `exp_${randomUUID()}`;
    return model.create({
      expenseId,
      companyId: tenant.companyId,
      branchId: dto.branchId,
      branchName: dto.branchName,
      title: dto.title.trim(),
      category: dto.category.toUpperCase().trim(),
      amount: dto.amount,
      currency: dto.currency || company?.currency || 'USD',
      date: dto.date,
      receiptUrl: dto.receiptUrl,
      paidByUserId: user.userId,
      paidByName: user.email.split('@')[0],
      notes: dto.notes?.trim(),
      status: ExpenseStatus.PENDING,
    });
  }

  async updateStatus(
    tenant: TenantContext,
    user: JwtPayload,
    expenseId: string,
    dto: UpdateExpenseStatusDto,
  ): Promise<Expense> {
    const model = await this.regionalDbManager.getModel<Expense>(
      tenant.region,
      Expense.name,
      ExpenseSchema,
    );

    const updated = await model
      .findOneAndUpdate(
        { companyId: tenant.companyId, expenseId },
        {
          $set: {
            status: dto.status,
            approvedBy: user.userId,
            approvedAt: new Date(),
          },
        },
        { new: true },
      )
      .lean();

    if (!updated) throw new NotFoundException('Expense record not found');
    return updated;
  }

  async delete(
    tenant: TenantContext,
    expenseId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<Expense>(
      tenant.region,
      Expense.name,
      ExpenseSchema,
    );

    const result = await model.deleteOne({
      companyId: tenant.companyId,
      expenseId,
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Expense record not found');
    }

    return { success: true };
  }
}
