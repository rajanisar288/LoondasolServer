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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_service_1 = require("./roles.service");
const role_dto_1 = require("./dto/role.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
let RolesController = class RolesController {
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    async findAll(tenant) {
        return this.rolesService.findAll(tenant);
    }
    getPermissions() {
        return this.rolesService.getAvailablePermissions();
    }
    async create(tenant, dto) {
        return this.rolesService.create(tenant, dto);
    }
    async update(tenant, id, dto) {
        return this.rolesService.update(tenant, id, dto);
    }
    async delete(tenant, id) {
        return this.rolesService.delete(tenant, id);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.ROLES_VIEW, permissions_constant_1.PERMISSIONS.EMPLOYEES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List all company roles' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.PERMISSIONS_VIEW, permissions_constant_1.PERMISSIONS.ROLES_VIEW, permissions_constant_1.PERMISSIONS.EMPLOYEES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List all available granular system permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], RolesController.prototype, "getPermissions", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.ROLES_CREATE, permissions_constant_1.PERMISSIONS.EMPLOYEES_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a custom role' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.ROLES_UPDATE, permissions_constant_1.PERMISSIONS.EMPLOYEES_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update role permissions' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.ROLES_DELETE, permissions_constant_1.PERMISSIONS.EMPLOYEES_DELETE),
    (0, swagger_1.ApiOperation)({ summary: 'Delete custom role' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "delete", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)('Roles & Permissions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('roles'),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map