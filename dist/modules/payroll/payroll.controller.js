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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payroll_service_1 = require("./payroll.service");
const payroll_dto_1 = require("./dto/payroll.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
let PayrollController = class PayrollController {
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    async findAll(tenant, month, employeeId) {
        return this.payrollService.findAll(tenant, month, employeeId);
    }
    async findOne(tenant, id) {
        return this.payrollService.findOne(tenant, id);
    }
    async getHtmlSlip(tenant, id) {
        return this.payrollService.generateHtmlSlip(tenant, id);
    }
    async previewHtml(tenant, dto) {
        return this.payrollService.generatePreviewHtml(tenant, dto);
    }
    async generate(tenant, dto) {
        return this.payrollService.generatePayroll(tenant, dto);
    }
    async customizeSlip(tenant, id, dto) {
        return this.payrollService.customizeSlip(tenant, id, dto);
    }
    async sendSingleEmail(tenant, id) {
        return this.payrollService.sendSingleSlipEmail(tenant, id);
    }
    async sendBulkEmail(tenant, dto) {
        return this.payrollService.sendBulkSlipEmails(tenant, dto);
    }
    async updateStatus(tenant, id, dto) {
        return this.payrollService.updateStatus(tenant, id, dto);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)('slips'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.PAYROLL_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List payroll slips with optional month & employee filter' }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: false, example: '2026-09' }),
    (0, swagger_1.ApiQuery)({ name: 'employeeId', required: false }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('slips/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.PAYROLL_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get single payroll slip' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('slips/:id/html'),
    (0, common_1.Header)('Content-Type', 'text/html'),
    (0, swagger_1.ApiOperation)({ summary: 'Get print-ready / PDF HTML format of salary slip' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getHtmlSlip", null);
__decorate([
    (0, common_1.Post)('preview-html'),
    (0, swagger_1.ApiOperation)({ summary: 'Render live HTML preview for Salary Slip Studio in settings' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payroll_dto_1.PreviewPayrollHtmlDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "previewHtml", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.PAYROLL_GENERATE),
    (0, swagger_1.ApiOperation)({ summary: 'Generate monthly payroll slips, archive PDFs in Cloudinary, and optionally email' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payroll_dto_1.GeneratePayrollDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "generate", null);
__decorate([
    (0, common_1.Patch)('slips/:id/customize'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.PAYROLL_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Customize individual salary slip (bonus, fuel, allowances, deductions, notes)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, payroll_dto_1.CustomizePayrollSlipDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "customizeSlip", null);
__decorate([
    (0, common_1.Post)('slips/:id/send-email'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.PAYROLL_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Send salary slip email with PDF attachment to an individual employee' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "sendSingleEmail", null);
__decorate([
    (0, common_1.Post)('send-bulk-email'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.PAYROLL_GENERATE),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk send salary slip emails to all employees for a selected month' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, payroll_dto_1.BulkEmailPayrollDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "sendBulkEmail", null);
__decorate([
    (0, common_1.Patch)('slips/:id/status'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.PAYROLL_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update payroll slip status (PAID/CANCELLED)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, payroll_dto_1.UpdateSlipStatusDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "updateStatus", null);
exports.PayrollController = PayrollController = __decorate([
    (0, swagger_1.ApiTags)('Payroll'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('payroll'),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map