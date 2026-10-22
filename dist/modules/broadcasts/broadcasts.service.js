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
exports.BroadcastsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const mail_service_1 = require("../mail/mail.service");
const ai_service_1 = require("../ai/ai.service");
const broadcast_schema_1 = require("./schemas/broadcast.schema");
const employee_schema_1 = require("../employees/schemas/employee.schema");
const department_schema_1 = require("../departments/schemas/department.schema");
const company_schema_1 = require("../companies/schemas/company.schema");
let BroadcastsService = class BroadcastsService {
    constructor(regionalDbManager, mailService, aiService) {
        this.regionalDbManager = regionalDbManager;
        this.mailService = mailService;
        this.aiService = aiService;
    }
    async sendBroadcast(tenant, user, dto) {
        const employeeModel = await this.regionalDbManager.getModel(tenant.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
        const companyModel = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const logModel = await this.regionalDbManager.getModel(tenant.region, broadcast_schema_1.BroadcastLog.name, broadcast_schema_1.BroadcastLogSchema);
        const company = await companyModel
            .findOne({ companyId: tenant.companyId })
            .lean();
        const companyName = company?.name || 'WorkivLab';
        const query = {
            companyId: tenant.companyId,
            status: employee_schema_1.EmployeeStatus.ACTIVE,
        };
        let targetDepartmentName;
        if (dto.targetType === 'department') {
            if (!dto.departmentId) {
                throw new common_1.BadRequestException('Department is required when targetType is department');
            }
            query['departmentId'] = dto.departmentId;
            const deptModel = await this.regionalDbManager.getModel(tenant.region, department_schema_1.Department.name, department_schema_1.DepartmentSchema);
            const dept = await deptModel
                .findOne({
                companyId: tenant.companyId,
                departmentId: dto.departmentId,
            })
                .lean();
            targetDepartmentName = dept?.name;
        }
        else if (dto.targetType === 'selected') {
            if (!dto.employeeIds || dto.employeeIds.length === 0) {
                throw new common_1.BadRequestException('At least one employee must be selected');
            }
            query['employeeId'] = { $in: dto.employeeIds };
        }
        const recipients = await employeeModel
            .find(query, { email: 1, firstName: 1, lastName: 1 })
            .lean();
        if (recipients.length === 0) {
            throw new common_1.BadRequestException('No active recipients found for selected criteria');
        }
        const broadcastId = `bcast_${(0, crypto_1.randomUUID)()}`;
        const emailPromises = recipients.map((r) => this.mailService.sendBroadcastEmail(r.email, {
            companyName,
            subject: dto.subject,
            body: dto.body,
            senderName: user.email,
        }));
        Promise.allSettled(emailPromises);
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
    async listTemplates(tenant) {
        const model = await this.regionalDbManager.getModel(tenant.region, broadcast_schema_1.BroadcastTemplate.name, broadcast_schema_1.BroadcastTemplateSchema);
        return model
            .find({ companyId: tenant.companyId })
            .sort({ createdAt: -1 })
            .lean();
    }
    async createTemplate(tenant, dto) {
        const model = await this.regionalDbManager.getModel(tenant.region, broadcast_schema_1.BroadcastTemplate.name, broadcast_schema_1.BroadcastTemplateSchema);
        const templateId = `tmpl_${(0, crypto_1.randomUUID)()}`;
        return model.create({
            templateId,
            companyId: tenant.companyId,
            name: dto.name.trim(),
            subject: dto.subject.trim(),
            body: dto.body.trim(),
            category: dto.category || 'General',
        });
    }
    async deleteTemplate(tenant, templateId) {
        const model = await this.regionalDbManager.getModel(tenant.region, broadcast_schema_1.BroadcastTemplate.name, broadcast_schema_1.BroadcastTemplateSchema);
        const res = await model.deleteOne({
            companyId: tenant.companyId,
            templateId,
        });
        if (res.deletedCount === 0) {
            throw new common_1.NotFoundException('Template not found');
        }
        return { success: true };
    }
    async getHistory(tenant) {
        const model = await this.regionalDbManager.getModel(tenant.region, broadcast_schema_1.BroadcastLog.name, broadcast_schema_1.BroadcastLogSchema);
        return model
            .find({ companyId: tenant.companyId })
            .sort({ sentAt: -1 })
            .limit(50)
            .lean();
    }
    async generateAiDraft(tenant, dto) {
        const companyModel = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const company = await companyModel
            .findOne({ companyId: tenant.companyId })
            .lean();
        const companyName = company?.name || 'WorkivLab';
        return this.aiService.generateEmailDraft(dto.topic, dto.tone || 'professional', companyName, dto.audience || 'all employees');
    }
};
exports.BroadcastsService = BroadcastsService;
exports.BroadcastsService = BroadcastsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager,
        mail_service_1.MailService,
        ai_service_1.AiService])
], BroadcastsService);
//# sourceMappingURL=broadcasts.service.js.map