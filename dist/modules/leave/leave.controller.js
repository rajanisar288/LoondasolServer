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
exports.LeaveController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const leave_service_1 = require("./leave.service");
const leave_dto_1 = require("./dto/leave.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
const leave_schema_1 = require("./schemas/leave.schema");
let LeaveController = class LeaveController {
    constructor(leaveService) {
        this.leaveService = leaveService;
    }
    async apply(tenant, user, dto) {
        return this.leaveService.apply(tenant, user, dto);
    }
    async findMyLeaves(tenant, user) {
        return this.leaveService.findMyLeaves(tenant, user);
    }
    async getBalances(tenant, user) {
        return this.leaveService.getBalances(tenant, user);
    }
    async findAll(tenant, status) {
        return this.leaveService.findAll(tenant, status);
    }
    async approve(tenant, user, id, dto) {
        return this.leaveService.approve(tenant, user, id, dto);
    }
    async reject(tenant, user, id, dto) {
        return this.leaveService.reject(tenant, user, id, dto);
    }
};
exports.LeaveController = LeaveController;
__decorate([
    (0, common_1.Post)('apply'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.LEAVE_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a new leave application' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, leave_dto_1.ApplyLeaveDto]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.LEAVE_VIEW),
    (0, swagger_1.ApiOperation)({ summary: "Get current user's submitted leave applications" }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "findMyLeaves", null);
__decorate([
    (0, common_1.Get)('balances'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.LEAVE_VIEW),
    (0, swagger_1.ApiOperation)({ summary: "Get current user's leave balances & type breakdown" }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "getBalances", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.LEAVE_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List all company leave requests' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.LEAVE_APPROVE),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a pending leave application' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, leave_dto_1.ReviewLeaveDto]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.LEAVE_REJECT),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a pending leave application' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, leave_dto_1.ReviewLeaveDto]),
    __metadata("design:returntype", Promise)
], LeaveController.prototype, "reject", null);
exports.LeaveController = LeaveController = __decorate([
    (0, swagger_1.ApiTags)('Leave Management'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('leave'),
    __metadata("design:paramtypes", [leave_service_1.LeaveService])
], LeaveController);
//# sourceMappingURL=leave.controller.js.map