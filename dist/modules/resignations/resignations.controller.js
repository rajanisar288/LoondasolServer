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
exports.ResignationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const resignations_service_1 = require("./resignations.service");
const resignation_dto_1 = require("./dto/resignation.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
let ResignationsController = class ResignationsController {
    constructor(resignationsService) {
        this.resignationsService = resignationsService;
    }
    async findAll(tenant, user) {
        return this.resignationsService.findAll(tenant, user);
    }
    async findOne(tenant, id) {
        return this.resignationsService.findOne(tenant, id);
    }
    async submit(tenant, user, dto) {
        return this.resignationsService.submit(tenant, user, dto);
    }
    async updateClearance(tenant, user, id, dto) {
        return this.resignationsService.updateClearance(tenant, user, id, dto);
    }
    async updateStatus(tenant, user, id, dto) {
        return this.resignationsService.updateStatus(tenant, user, id, dto);
    }
};
exports.ResignationsController = ResignationsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.RESIGNATIONS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List resignations (HR sees all, employee sees own)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ResignationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.RESIGNATIONS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get single resignation details' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ResignationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.RESIGNATIONS_SUBMIT),
    (0, swagger_1.ApiOperation)({ summary: 'Submit an employee resignation request' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, resignation_dto_1.SubmitResignationDto]),
    __metadata("design:returntype", Promise)
], ResignationsController.prototype, "submit", null);
__decorate([
    (0, common_1.Patch)(':id/clearance'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.RESIGNATIONS_APPROVE),
    (0, swagger_1.ApiOperation)({ summary: 'Update exit clearance checklist items' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, resignation_dto_1.UpdateClearanceChecklistDto]),
    __metadata("design:returntype", Promise)
], ResignationsController.prototype, "updateClearance", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.RESIGNATIONS_APPROVE),
    (0, swagger_1.ApiOperation)({ summary: 'Update resignation status (APPROVED / REJECTED / COMPLETED)' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, resignation_dto_1.UpdateResignationStatusDto]),
    __metadata("design:returntype", Promise)
], ResignationsController.prototype, "updateStatus", null);
exports.ResignationsController = ResignationsController = __decorate([
    (0, swagger_1.ApiTags)('Resignations & Exit Clearance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('resignations'),
    __metadata("design:paramtypes", [resignations_service_1.ResignationsService])
], ResignationsController);
//# sourceMappingURL=resignations.controller.js.map