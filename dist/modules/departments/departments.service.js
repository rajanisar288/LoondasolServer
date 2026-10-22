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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const department_schema_1 = require("./schemas/department.schema");
const branch_schema_1 = require("../branches/schemas/branch.schema");
let DepartmentsService = class DepartmentsService {
    constructor(regionalDbManager) {
        this.regionalDbManager = regionalDbManager;
    }
    async findAll(tenant, branchId) {
        const model = await this.regionalDbManager.getModel(tenant.region, department_schema_1.Department.name, department_schema_1.DepartmentSchema);
        const filter = { companyId: tenant.companyId };
        if (branchId) {
            if (branchId === 'COMPANY_WIDE') {
                filter.$or = [
                    { isCompanyWide: true },
                    { branchId: null },
                    { branchId: '' },
                    { branchId: { $exists: false } },
                ];
            }
            else {
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
    async create(tenant, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, department_schema_1.Department.name, department_schema_1.DepartmentSchema);
        const branchId = dto.branchId ? dto.branchId.trim() : null;
        let branchName = dto.branchName?.trim();
        if (branchId && !branchName) {
            const branchModel = await this.regionalDbManager.getModel(tenant.region, branch_schema_1.Branch.name, branch_schema_1.BranchSchema);
            const b = await branchModel.findOne({ companyId: tenant.companyId, branchId }).lean();
            if (b)
                branchName = b.name;
        }
        const isCompanyWide = dto.isCompanyWide ?? !branchId;
        const existingFilter = {
            companyId: tenant.companyId,
            name: dto.name.trim(),
        };
        if (branchId) {
            existingFilter.branchId = branchId;
        }
        else {
            existingFilter.$or = [{ branchId: null }, { branchId: '' }, { isCompanyWide: true }];
        }
        const existing = await model.findOne(existingFilter).lean();
        if (existing) {
            throw new common_1.ConflictException(`A department named "${dto.name}" already exists for this scope`);
        }
        const departmentId = `dept_${(0, crypto_1.randomUUID)()}`;
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
    async update(tenant, departmentId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, department_schema_1.Department.name, department_schema_1.DepartmentSchema);
        const updated = await model
            .findOneAndUpdate({ companyId: tenant.companyId, departmentId }, { $set: dto }, { new: true })
            .lean();
        if (!updated) {
            throw new common_1.NotFoundException('Department not found');
        }
        return updated;
    }
    async delete(tenant, departmentId) {
        const model = await this.regionalDbManager.getModel(tenant.region, department_schema_1.Department.name, department_schema_1.DepartmentSchema);
        const result = await model.deleteOne({
            companyId: tenant.companyId,
            departmentId,
        });
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Department not found');
        }
        return { success: true };
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map