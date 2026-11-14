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
exports.CompaniesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const companies_service_1 = require("./companies.service");
const update_company_dto_1 = require("./dto/update-company.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
let CompaniesController = class CompaniesController {
    constructor(companiesService) {
        this.companiesService = companiesService;
    }
    async getCurrent(tenant) {
        return this.companiesService.getCompany(tenant);
    }
    async getSeatsStatus(tenant) {
        return this.companiesService.getSeatStatus(tenant);
    }
    async expandSeats(tenant, additionalSeats) {
        return this.companiesService.addSeats(tenant, Number(additionalSeats));
    }
    async updateCurrent(tenant, dto) {
        return this.companiesService.updateCompany(tenant, dto);
    }
    async deleteCurrent(tenant, user) {
        return this.companiesService.deleteCompany(tenant, user);
    }
};
exports.CompaniesController = CompaniesController;
__decorate([
    (0, common_1.Get)('current'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.COMPANY_SETTINGS_VIEW),
    (0, swagger_1.ApiOperation)({
        summary: 'Get active company profile and operating settings',
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "getCurrent", null);
__decorate([
    (0, common_1.Get)('seats/status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get active seat quota, occupied seats, and AI request statistics',
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "getSeatsStatus", null);
__decorate([
    (0, common_1.Patch)('seats/expand'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.COMPANY_SETTINGS_UPDATE),
    (0, swagger_1.ApiOperation)({
        summary: 'Expand company employee seats quota and charge incremental seats',
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)('additionalSeats')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "expandSeats", null);
__decorate([
    (0, common_1.Patch)('current'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.COMPANY_SETTINGS_UPDATE),
    (0, swagger_1.ApiOperation)({
        summary: 'Update company profile, working hours, and localization',
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_company_dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "updateCurrent", null);
__decorate([
    (0, common_1.Delete)('current'),
    (0, swagger_1.ApiOperation)({
        summary: 'Permanently delete company workspace and all regional data (Owner only)',
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "deleteCurrent", null);
exports.CompaniesController = CompaniesController = __decorate([
    (0, swagger_1.ApiTags)('Companies'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('companies'),
    __metadata("design:paramtypes", [companies_service_1.CompaniesService])
], CompaniesController);
//# sourceMappingURL=companies.controller.js.map