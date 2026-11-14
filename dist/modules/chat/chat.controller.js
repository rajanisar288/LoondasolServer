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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const chat_service_1 = require("./chat.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../../common/decorators/require-permissions.decorator");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_constant_1 = require("../../common/constants/permissions.constant");
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async getChannels(tenant, user) {
        return this.chatService.getChannels(tenant, user);
    }
    async createChannel(tenant, user, dto) {
        return this.chatService.createChannel(tenant, user, dto);
    }
    async addMembers(tenant, channelId, memberIds) {
        return this.chatService.addMembers(tenant, channelId, memberIds || []);
    }
    async getMessages(tenant, channelId, limit) {
        return this.chatService.getMessages(tenant, channelId || 'general', limit);
    }
    async sendMessage(tenant, user, dto) {
        return this.chatService.sendMessage(tenant, user, dto);
    }
    async editMessage(tenant, user, messageId, content) {
        return this.chatService.editMessage(tenant, user, messageId, content);
    }
    async deleteMessage(tenant, user, messageId) {
        return this.chatService.deleteMessage(tenant, user, messageId);
    }
    async reactMessage(tenant, user, messageId, emoji) {
        return this.chatService.reactMessage(tenant, user, messageId, emoji);
    }
    async getDirectMessages(tenant, user, recipientId, limit) {
        return this.chatService.getDirectMessages(tenant, user.userId, recipientId, limit);
    }
    async getConversations(tenant, user) {
        return this.chatService.getDirectConversationsSummary(tenant, user);
    }
    async togglePinChannel(tenant, user, channelId) {
        return this.chatService.togglePinChannel(tenant, user, channelId);
    }
    async getPinnedMessages(tenant, channelId) {
        return this.chatService.getPinnedMessages(tenant, channelId);
    }
    async togglePinMessage(tenant, user, messageId) {
        return this.chatService.togglePinMessage(tenant, user, messageId);
    }
    async getUnreadCounts(tenant, user) {
        return this.chatService.getUnreadCounts(tenant, user);
    }
    async markChannelRead(tenant, user, channelName) {
        return this.chatService.markChannelRead(tenant, user, channelName);
    }
    async markDirectRead(tenant, user, peerId) {
        return this.chatService.markDirectRead(tenant, user, peerId);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('channels'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get accessible channels for workspace' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChannels", null);
__decorate([
    (0, common_1.Post)('channels'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.CHANNELS_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new team channel' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Post)('channels/:id/members'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.CHANNELS_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Add members to a channel' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('memberIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addMembers", null);
__decorate([
    (0, common_1.Get)('messages'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get channel message history' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('channelId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('messages'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message (direct or channel) via HTTP REST' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Patch)('messages/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Edit message content via HTTP REST' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)('content')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "editMessage", null);
__decorate([
    (0, common_1.Delete)('messages/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a message via HTTP REST' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Post)('messages/:id/react'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'React to a message via HTTP REST' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)('emoji')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "reactMessage", null);
__decorate([
    (0, common_1.Get)('direct/:recipientId'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get 1v1 direct message conversation history' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('recipientId')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getDirectMessages", null);
__decorate([
    (0, common_1.Get)('conversations'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_VIEW),
    (0, swagger_1.ApiOperation)({
        summary: 'Get 1v1 conversation summaries and latest messages',
    }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Post)('channels/:id/pin'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle pinned state of a channel for current user' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "togglePinChannel", null);
__decorate([
    (0, common_1.Get)('messages/:channelId/pinned'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get all pinned messages for a channel' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('channelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getPinnedMessages", null);
__decorate([
    (0, common_1.Post)('messages/:id/pin'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle pinned state of a message' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "togglePinMessage", null);
__decorate([
    (0, common_1.Get)('unread-counts'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get unread message counts for channels and direct messages' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUnreadCounts", null);
__decorate([
    (0, common_1.Post)('channels/:name/read'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all messages in a channel as read' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markChannelRead", null);
__decorate([
    (0, common_1.Post)('direct/:peerId/read'),
    (0, require_permissions_decorator_1.RequirePermissions)(permissions_constant_1.PERMISSIONS.MESSAGES_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all direct messages from a peer as read' }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Param)('peerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markDirectRead", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('Chat & Messaging'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map