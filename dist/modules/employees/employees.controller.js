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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employees_service_1 = require("./employees.service");
const employee_dto_1 = require("./dto/employee.dto");
const onboarding_form_dto_1 = require("./dto/onboarding-form.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
let EmployeesController = class EmployeesController {
    constructor(employeesService) {
        this.employeesService = employeesService;
    }
    async getOnboardingForms(tenant, branchId, departmentId) {
        return this.employeesService.getOnboardingForms(tenant, {
            branchId,
            departmentId,
        });
    }
    async getActiveOnboardingForm(tenant, branchId, departmentId) {
        return this.employeesService.getActiveOnboardingForm(tenant, {
            branchId,
            departmentId,
        });
    }
    async createOnboardingForm(tenant, dto) {
        return this.employeesService.createOnboardingForm(tenant, dto);
    }
    async updateOnboardingForm(tenant, templateId, dto) {
        return this.employeesService.updateOnboardingForm(tenant, templateId, dto);
    }
    async deleteOnboardingForm(tenant, templateId) {
        return this.employeesService.deleteOnboardingForm(tenant, templateId);
    }
    async findAll(tenant, user, page, limit, search, departmentId, branchId, status, pagination, paginate) {
        return this.employeesService.findAll(tenant, user, {
            page,
            limit,
            search,
            departmentId,
            branchId,
            status,
            pagination,
            paginate,
        });
    }
    async findOne(tenant, user, id) {
        return this.employeesService.findOne(tenant, user, id);
    }
    async create(tenant, dto) {
        return this.employeesService.create(tenant, dto);
    }
    async update(tenant, id, dto) {
        return this.employeesService.update(tenant, id, dto);
    }
    async updateStatus(tenant, id, status) {
        return this.employeesService.updateStatus(tenant, id, status);
    }
    async delete(tenant, id) {
        return this.employeesService.delete(tenant, id);
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Get)('onboarding-forms'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMPLOYEES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List custom onboarding form templates' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "getOnboardingForms", null);
__decorate([
    (0, common_1.Get)('onboarding-forms/active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active onboarding form for branch/department' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "getActiveOnboardingForm", null);
__decorate([
    (0, common_1.Post)('onboarding-forms'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMPLOYEES_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create custom onboarding form template' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboarding_form_dto_1.CreateOnboardingFormDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "createOnboardingForm", null);
__decorate([
    (0, common_1.Patch)('onboarding-forms/:templateId'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMPLOYEES_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update custom onboarding form template' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('templateId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, onboarding_form_dto_1.UpdateOnboardingFormDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "updateOnboardingForm", null);
__decorate([
    (0, common_1.Delete)('onboarding-forms/:templateId'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMPLOYEES_DELETE),
    (0, swagger_1.ApiOperation)({ summary: 'Delete custom onboarding form template' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('templateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "deleteOnboardingForm", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMPLOYEES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Search and paginate employee directory' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('departmentId')),
    __param(6, (0, common_1.Query)('branchId')),
    __param(7, (0, common_1.Query)('status')),
    __param(8, (0, common_1.Query)('pagination')),
    __param(9, (0, common_1.Query)('paginate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number, Number, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMPLOYEES_VIEW),
    (0, swagger_1.ApiOperation)({
        summary: 'Get single employee details with permission-checked compensation',
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMPLOYEES_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new employee and create invitation link' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, employee_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMPLOYEES_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee record' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, employee_dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMPLOYEES_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee active or inactive status' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMPLOYEES_DELETE),
    (0, swagger_1.ApiOperation)({ summary: 'Delete employee record' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "delete", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, swagger_1.ApiTags)('Employees'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('employees'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map