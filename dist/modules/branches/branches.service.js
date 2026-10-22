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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const branch_schema_1 = require("./schemas/branch.schema");
let BranchesService = class BranchesService {
    constructor(regionalDbManager) {
        this.regionalDbManager = regionalDbManager;
    }
    async findAll(tenant) {
        const model = await this.regionalDbManager.getModel(tenant.region, branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
        return model.find({ companyId: tenant.companyId }).sort({ name: 1 }).lean();
    }
    async findOne(tenant, branchId) {
        const model = await this.regionalDbManager.getModel(tenant.region, branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
        const branch = await model
            .findOne({ companyId: tenant.companyId, branchId })
            .lean();
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        return branch;
    }
    async create(tenant, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
        const existing = await model
            .findOne({ companyId: tenant.companyId, name: dto.name.trim() })
            .lean();
        if (existing) {
            throw new common_1.ConflictException(`A branch named "${dto.name}" already exists`);
        }
        const branchId = `br_${(0, crypto_1.randomUUID)()}`;
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
    async update(tenant, branchId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
        const updated = await model
            .findOneAndUpdate({ companyId: tenant.companyId, branchId }, { $set: dto }, { new: true })
            .lean();
        if (!updated) {
            throw new common_1.NotFoundException('Branch not found');
        }
        return updated;
    }
    async delete(tenant, branchId) {
        const model = await this.regionalDbManager.getModel(tenant.region, branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
        const result = await model.deleteOne({
            companyId: tenant.companyId,
            branchId,
        });
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Branch not found');
        }
        return { success: true };
    }
    async validateBranchAccess(region, companyId, branchId) {
        const model = await this.regionalDbManager.getModel(region, branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
        const branch = await model.findOne({ companyId, branchId }).lean();
        if (!branch || !branch.workingHours || !branch.workingHours.enforceLoginRestriction) {
            return;
        }
        const tz = branch.timezone || 'UTC';
        const now = new Date();
        const dayStr = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            weekday: 'narrow',
        });
        const dayOfWeek = new Date(now.toLocaleString('en-US', { timeZone: tz })).getDay();
        const workingDays = branch.workingHours.workingDays || [1, 2, 3, 4, 5];
        if (!workingDays.includes(dayOfWeek)) {
            throw new common_1.ForbiddenException(`Login rejected: Today is not an authorized working day for branch "${branch.name}".`);
        }
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const currentBranchTime = timeFormatter.format(now);
        const start = branch.workingHours.startTime || '09:00';
        const end = branch.workingHours.endTime || '18:00';
        if (currentBranchTime < start || currentBranchTime > end) {
            throw new common_1.ForbiddenException(`Login rejected: Outside authorized shift hours (${start} - ${end}) for branch "${branch.name}".`);
        }
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager])
], BranchesService);
//# sourceMappingURL=branches.service.js.map