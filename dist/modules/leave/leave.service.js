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
exports.LeaveService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const leave_schema_1 = require("./schemas/leave.schema");
const employee_schema_1 = require("../employees/schemas/employee.schema");
const company_schema_1 = require("../companies/schemas/company.schema");
let LeaveService = class LeaveService {
    constructor(regionalDbManager) {
        this.regionalDbManager = regionalDbManager;
    }
    async apply(tenant, user, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, leave_schema_1.Leave.name, leave_schema_1.LeaveSchema);
        const employeeModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const employee = await employeeModel
            .findOne({ companyId: tenant.companyId, userId: user.userId })
            .lean();
        if (!employee) {
            throw new common_1.NotFoundException('Employee profile not linked to user account');
        }
        const leaveId = `leave_${(0, crypto_1.randomUUID)()}`;
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
            status: leave_schema_1.LeaveStatus.PENDING,
        });
    }
    async findMyLeaves(tenant, user) {
        const model = await this.regionalDbManager.getModel(tenant.region, leave_schema_1.Leave.name, leave_schema_1.LeaveSchema);
        return model
            .find({ companyId: tenant.companyId, userId: user.userId })
            .sort({ createdAt: -1 })
            .lean();
    }
    async findAll(tenant, status) {
        const model = await this.regionalDbManager.getModel(tenant.region, leave_schema_1.Leave.name, leave_schema_1.LeaveSchema);
        const filter = { companyId: tenant.companyId };
        if (status) {
            filter['status'] = status;
        }
        return model.find(filter).sort({ createdAt: -1 }).lean();
    }
    async approve(tenant, user, leaveId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, leave_schema_1.Leave.name, leave_schema_1.LeaveSchema);
        const record = await model.findOne({
            companyId: tenant.companyId,
            leaveId,
        });
        if (!record) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        if (record.status !== leave_schema_1.LeaveStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot approve request that is already ${record.status.toLowerCase()}`);
        }
        record.status = leave_schema_1.LeaveStatus.APPROVED;
        record.reviewedBy = user.userId;
        record.reviewedAt = new Date();
        if (dto.notes)
            record.reviewerNotes = dto.notes;
        return record.save();
    }
    async reject(tenant, user, leaveId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, leave_schema_1.Leave.name, leave_schema_1.LeaveSchema);
        const record = await model.findOne({
            companyId: tenant.companyId,
            leaveId,
        });
        if (!record) {
            throw new common_1.NotFoundException('Leave request not found');
        }
        if (record.status !== leave_schema_1.LeaveStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot reject request that is already ${record.status.toLowerCase()}`);
        }
        record.status = leave_schema_1.LeaveStatus.REJECTED;
        record.reviewedBy = user.userId;
        record.reviewedAt = new Date();
        if (dto.notes)
            record.reviewerNotes = dto.notes;
        return record.save();
    }
    async getBalances(tenant, user) {
        const leaveModel = await this.regionalDbManager.getModel(tenant.region, leave_schema_1.Leave.name, leave_schema_1.LeaveSchema);
        const companyModel = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
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
            status: { $in: [leave_schema_1.LeaveStatus.APPROVED, leave_schema_1.LeaveStatus.PENDING] },
            startDate: { $regex: `^${currentYear}` },
        })
            .lean();
        let totalUsedYearly = 0;
        let totalUsedThisMonth = 0;
        const typeUsageMap = {};
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
};
exports.LeaveService = LeaveService;
exports.LeaveService = LeaveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager])
], LeaveService);
//# sourceMappingURL=leave.service.js.map