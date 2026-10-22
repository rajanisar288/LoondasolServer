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
exports.SuperAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const superadmin_service_1 = require("./superadmin.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../../common/guards/super-admin.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let SuperAdminController = class SuperAdminController {
    constructor(superAdminService) {
        this.superAdminService = superAdminService;
    }
    async getSystemStats() {
        return this.superAdminService.getSystemStats();
    }
    async getAllCompanies() {
        return this.superAdminService.getAllCompanies();
    }
    async getCompanyDetails(id) {
        return this.superAdminService.getCompanyDetails(id);
    }
    async updateCompanyStatus(id, dto, user) {
        return this.superAdminService.updateCompanyStatus(id, dto.status, user);
    }
    async getAuditLogs(action, companyId, search, limit, page) {
        return this.superAdminService.getAuditLogs({ action, companyId, search, limit, page });
    }
    async getAllUsers(search) {
        return this.superAdminService.getAllUsers(search);
    }
};
exports.SuperAdminController = SuperAdminController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system-wide telemetry stats & KPIs' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getSystemStats", null);
__decorate([
    (0, common_1.Get)('companies'),
    (0, swagger_1.ApiOperation)({ summary: 'List all registered companies across system' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getAllCompanies", null);
__decorate([
    (0, common_1.Get)('companies/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get company details including employees directory' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getCompanyDetails", null);
__decorate([
    (0, common_1.Patch)('companies/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate, deactivate, or suspend a company' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateCompanyStatus", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Query and filter system audit event logs' }),
    __param(0, (0, common_1.Query)('action')),
    __param(1, (0, common_1.Query)('companyId')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Search and list users across all companies' }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getAllUsers", null);
exports.SuperAdminController = SuperAdminController = __decorate([
    (0, swagger_1.ApiTags)('Super Admin System Management'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Controller)('superadmin'),
    __metadata("design:paramtypes", [superadmin_service_1.SuperAdminService])
], SuperAdminController);
//# sourceMappingURL=superadmin.controller.js.map