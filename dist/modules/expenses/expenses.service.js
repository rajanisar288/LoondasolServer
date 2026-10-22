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
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const expense_schema_1 = require("./schemas/expense.schema");
const company_schema_1 = require("../companies/schemas/company.schema");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
let ExpensesService = class ExpensesService {
    constructor(regionalDbManager) {
        this.regionalDbManager = regionalDbManager;
    }
    async findAll(tenant, user, filters) {
        const model = await this.regionalDbManager.getModel(tenant.region, expense_schema_1.Expense.name, expense_schema_1.ExpenseSchema);
        const canManageAll = user.isOwner ||
            user.role === 'OWNER' ||
            user.role === 'ADMIN' ||
            user.permissions?.includes(permissions_constant_1.PERMISSIONS.EXPENSES_DELETE) ||
            user.permissions?.includes(permissions_constant_1.PERMISSIONS.REPORTS_VIEW);
        const query = { companyId: tenant.companyId };
        if (!canManageAll) {
            query.paidByUserId = user.userId;
        }
        if (filters?.branchId)
            query.branchId = filters.branchId;
        if (filters?.category)
            query.category = filters.category;
        if (filters?.startDate || filters?.endDate) {
            query.date = {};
            if (filters.startDate)
                query.date.$gte = filters.startDate;
            if (filters.endDate)
                query.date.$lte = filters.endDate;
        }
        return model.find(query).sort({ date: -1, createdAt: -1 }).lean();
    }
    async getSummary(tenant, user) {
        const model = await this.regionalDbManager.getModel(tenant.region, expense_schema_1.Expense.name, expense_schema_1.ExpenseSchema);
        const canManageAll = user.isOwner ||
            user.role === 'OWNER' ||
            user.role === 'ADMIN' ||
            user.permissions?.includes(permissions_constant_1.PERMISSIONS.EXPENSES_DELETE) ||
            user.permissions?.includes(permissions_constant_1.PERMISSIONS.REPORTS_VIEW);
        const query = { companyId: tenant.companyId };
        if (!canManageAll) {
            query.paidByUserId = user.userId;
        }
        const expenses = await model.find(query).lean();
        let totalExpenses = 0;
        let pendingCount = 0;
        let approvedCount = 0;
        const byCategory = {};
        const byBranch = {};
        for (const exp of expenses) {
            totalExpenses += exp.amount;
            if (exp.status === expense_schema_1.ExpenseStatus.PENDING)
                pendingCount++;
            if (exp.status === expense_schema_1.ExpenseStatus.APPROVED || exp.status === expense_schema_1.ExpenseStatus.REIMBURSED) {
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
    async create(tenant, user, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, expense_schema_1.Expense.name, expense_schema_1.ExpenseSchema);
        const compModel = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const company = await compModel.findOne({ companyId: tenant.companyId }).lean();
        const expenseId = `exp_${(0, crypto_1.randomUUID)()}`;
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
            status: expense_schema_1.ExpenseStatus.PENDING,
        });
    }
    async updateStatus(tenant, user, expenseId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, expense_schema_1.Expense.name, expense_schema_1.ExpenseSchema);
        const updated = await model
            .findOneAndUpdate({ companyId: tenant.companyId, expenseId }, {
            $set: {
                status: dto.status,
                approvedBy: user.userId,
                approvedAt: new Date(),
            },
        }, { new: true })
            .lean();
        if (!updated)
            throw new common_1.NotFoundException('Expense record not found');
        return updated;
    }
    async delete(tenant, expenseId) {
        const model = await this.regionalDbManager.getModel(tenant.region, expense_schema_1.Expense.name, expense_schema_1.ExpenseSchema);
        const result = await model.deleteOne({
            companyId: tenant.companyId,
            expenseId,
        });
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Expense record not found');
        }
        return { success: true };
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map