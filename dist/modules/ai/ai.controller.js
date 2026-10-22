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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_service_1 = require("./ai.service");
const ai_dto_1 = require("./dto/ai.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
let AiController = class AiController {
    constructor(aiService) {
        this.aiService = aiService;
    }
    async parseTaskPrompt(tenant, user, dto) {
        await this.aiService.checkAiAccess(tenant, user);
        return this.aiService.parseTaskPrompt(dto.prompt);
    }
    async generateSocialPost(tenant, user, dto) {
        await this.aiService.checkAiAccess(tenant, user);
        return this.aiService.generateSocialPost(dto.topic, dto.platform, dto.tone);
    }
    async getTopPerformers(tenant) {
        return this.aiService.calculateTopPerformers(tenant);
    }
    async smartSearch(tenant, user, dto) {
        return this.aiService.smartSearch(tenant, user, dto.query);
    }
    async dispatchTaskReport(tenant, user, dto) {
        await this.aiService.checkAiAccess(tenant, user);
        return this.aiService.dispatchTaskReport(tenant, user, dto.channelId || 'general', dto.recipientId);
    }
    async askAi(tenant, user, dto) {
        return this.aiService.askAi(tenant, user, dto.prompt, dto.context);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('parse-task'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.AI_TOOLS_USE),
    (0, swagger_1.ApiOperation)({ summary: 'Parse natural language task description into structured task fields' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, ai_dto_1.ParseTaskPromptDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "parseTaskPrompt", null);
__decorate([
    (0, common_1.Post)('generate-social-post'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.AI_TOOLS_USE),
    (0, swagger_1.ApiOperation)({ summary: 'Generate social media post for LinkedIn, Twitter, Facebook, or Instagram' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, ai_dto_1.GenerateSocialPostDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateSocialPost", null);
__decorate([
    (0, common_1.Get)('top-performers'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.EMPLOYEES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI top performers of the month leaderboard' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getTopPerformers", null);
__decorate([
    (0, common_1.Post)('smart-search'),
    (0, swagger_1.ApiOperation)({ summary: 'RBAC-enforced AI global search across company resources' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, ai_dto_1.SmartSearchDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "smartSearch", null);
__decorate([
    (0, common_1.Post)('dispatch-task-report'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.AI_TOOLS_USE),
    (0, swagger_1.ApiOperation)({ summary: 'Dispatch AI task progress report into chat channel or direct message' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, ai_dto_1.DispatchTaskReportDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "dispatchTaskReport", null);
__decorate([
    (0, common_1.Post)('ask'),
    (0, swagger_1.ApiOperation)({ summary: 'Ask AI assistant any workspace query or question' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, ai_dto_1.AskAiDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "askAi", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('AI Intelligence'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map