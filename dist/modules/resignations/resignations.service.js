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
exports.ResignationsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const resignation_schema_1 = require("./schemas/resignation.schema");
const employee_schema_1 = require("../employees/schemas/employee.schema");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
let ResignationsService = class ResignationsService {
    constructor(regionalDbManager) {
        this.regionalDbManager = regionalDbManager;
    }
    async findAll(tenant, user) {
        const model = await this.regionalDbManager.getModel(tenant.region, resignation_schema_1.Resignation.name, resignation_schema_1.ResignationSchema);
        const isHrOrOwner = user.isOwner ||
            user.role === 'OWNER' ||
            user.permissions?.includes(permissions_constant_1.PERMISSIONS.RESIGNATIONS_APPROVE);
        const query = { companyId: tenant.companyId };
        if (!isHrOrOwner) {
            query.userId = user.userId;
        }
        return model.find(query).sort({ createdAt: -1 }).lean();
    }
    async findOne(tenant, resignationId) {
        const model = await this.regionalDbManager.getModel(tenant.region, resignation_schema_1.Resignation.name, resignation_schema_1.ResignationSchema);
        const resignation = await model
            .findOne({ companyId: tenant.companyId, resignationId })
            .lean();
        if (!resignation) {
            throw new common_1.NotFoundException('Resignation request not found');
        }
        return resignation;
    }
    async submit(tenant, user, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, resignation_schema_1.Resignation.name, resignation_schema_1.ResignationSchema);
        const empModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const emp = await empModel.findOne({
            companyId: tenant.companyId,
            $or: [{ userId: user.userId }, { email: user.email }],
        });
        const employeeId = emp?.employeeId || `emp_${user.userId}`;
        const employeeName = emp
            ? `${emp.firstName} ${emp.lastName}`
            : user.email.split('@')[0];
        const departmentName = emp?.departmentName;
        const resignationId = `resig_${(0, crypto_1.randomUUID)()}`;
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
            status: resignation_schema_1.ResignationStatus.SUBMITTED,
            clearanceChecklist: {
                itAssetsReturned: false,
                accessRevoked: false,
                idBadgeReturned: false,
                financeDuesCleared: false,
                knowledgeTransferDone: false,
            },
        });
    }
    async updateClearance(tenant, user, resignationId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, resignation_schema_1.Resignation.name, resignation_schema_1.ResignationSchema);
        const updateFields = {};
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
            .findOneAndUpdate({ companyId: tenant.companyId, resignationId }, { $set: updateFields }, { new: true })
            .lean();
        if (!updated)
            throw new common_1.NotFoundException('Resignation request not found');
        return updated;
    }
    async updateStatus(tenant, user, resignationId, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, resignation_schema_1.Resignation.name, resignation_schema_1.ResignationSchema);
        const updateFields = {
            status: dto.status,
            reviewedBy: user.userId,
            reviewedAt: new Date(),
        };
        if (dto.exitInterviewNotes) {
            updateFields.exitInterviewNotes = dto.exitInterviewNotes.trim();
        }
        const updated = await model
            .findOneAndUpdate({ companyId: tenant.companyId, resignationId }, { $set: updateFields }, { new: true })
            .lean();
        if (!updated)
            throw new common_1.NotFoundException('Resignation request not found');
        if (dto.status === resignation_schema_1.ResignationStatus.COMPLETED) {
            const empModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
            await empModel.updateOne({ companyId: tenant.companyId, employeeId: updated.employeeId }, { $set: { status: employee_schema_1.EmployeeStatus.TERMINATED } });
        }
        return updated;
    }
};
exports.ResignationsService = ResignationsService;
exports.ResignationsService = ResignationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager])
], ResignationsService);
//# sourceMappingURL=resignations.service.js.map