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
exports.BroadcastsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const broadcasts_service_1 = require("./broadcasts.service");
const broadcast_dto_1 = require("./dto/broadcast.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
let BroadcastsController = class BroadcastsController {
    constructor(broadcastsService) {
        this.broadcastsService = broadcastsService;
    }
    async send(tenant, user, dto) {
        return this.broadcastsService.sendBroadcast(tenant, user, dto);
    }
    async listTemplates(tenant) {
        return this.broadcastsService.listTemplates(tenant);
    }
    async createTemplate(tenant, dto) {
        return this.broadcastsService.createTemplate(tenant, dto);
    }
    async deleteTemplate(tenant, id) {
        return this.broadcastsService.deleteTemplate(tenant, id);
    }
    async getHistory(tenant) {
        return this.broadcastsService.getHistory(tenant);
    }
    async generateAi(tenant, dto) {
        return this.broadcastsService.generateAiDraft(tenant, dto);
    }
};
exports.BroadcastsController = BroadcastsController;
__decorate([
    (0, common_1.Post)('send'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMAIL_CAMPAIGNS_SEND),
    (0, swagger_1.ApiOperation)({ summary: 'Send email announcement to employees' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, broadcast_dto_1.SendBroadcastDto]),
    __metadata("design:returntype", Promise)
], BroadcastsController.prototype, "send", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMAIL_CAMPAIGNS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List reusable email templates' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BroadcastsController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMAIL_CAMPAIGNS_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Save new email template' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, broadcast_dto_1.CreateTemplateDto]),
    __metadata("design:returntype", Promise)
], BroadcastsController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMAIL_CAMPAIGNS_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Delete email template' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BroadcastsController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMAIL_CAMPAIGNS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get broadcast transmission history' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BroadcastsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)('generate-ai'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMAIL_CAMPAIGNS_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Generate email draft with Google Gemini AI' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, broadcast_dto_1.GenerateAiDraftDto]),
    __metadata("design:returntype", Promise)
], BroadcastsController.prototype, "generateAi", null);
exports.BroadcastsController = BroadcastsController = __decorate([
    (0, swagger_1.ApiTags)('Broadcasts & Email Campaigns'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('broadcasts'),
    __metadata("design:paramtypes", [broadcasts_service_1.BroadcastsService])
], BroadcastsController);
//# sourceMappingURL=broadcasts.controller.js.map