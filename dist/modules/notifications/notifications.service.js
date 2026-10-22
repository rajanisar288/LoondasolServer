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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const notification_schema_1 = require("./schemas/notification.schema");
const chat_gateway_1 = require("../chat/chat.gateway");
let NotificationsService = class NotificationsService {
    constructor(regionalDbManager, chatGateway) {
        this.regionalDbManager = regionalDbManager;
        this.chatGateway = chatGateway;
    }
    async getUserNotifications(tenant, user, limit = 30) {
        const model = await this.regionalDbManager.getModel(tenant.region, notification_schema_1.Notification.name, notification_schema_1.NotificationSchema);
        return model
            .find({ companyId: tenant.companyId, userId: user.userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
    async getUnreadCount(tenant, user) {
        const model = await this.regionalDbManager.getModel(tenant.region, notification_schema_1.Notification.name, notification_schema_1.NotificationSchema);
        return model.countDocuments({
            companyId: tenant.companyId,
            userId: user.userId,
            isRead: false,
        });
    }
    async markAsRead(tenant, user, notificationId) {
        const model = await this.regionalDbManager.getModel(tenant.region, notification_schema_1.Notification.name, notification_schema_1.NotificationSchema);
        await model.updateOne({ companyId: tenant.companyId, userId: user.userId, notificationId }, { isRead: true });
        return { success: true };
    }
    async markAllAsRead(tenant, user) {
        const model = await this.regionalDbManager.getModel(tenant.region, notification_schema_1.Notification.name, notification_schema_1.NotificationSchema);
        await model.updateMany({ companyId: tenant.companyId, userId: user.userId, isRead: false }, { isRead: true });
        return { success: true };
    }
    async createAndPush(params) {
        const model = await this.regionalDbManager.getModel(params.region, notification_schema_1.Notification.name, notification_schema_1.NotificationSchema);
        const notificationId = `notif_${(0, crypto_1.randomUUID)()}`;
        const notification = await model.create({
            notificationId,
            companyId: params.companyId,
            userId: params.userId,
            title: params.title,
            message: params.message,
            type: params.type,
            data: params.data || {},
            isRead: false,
        });
        if (this.chatGateway) {
            this.chatGateway.notifyUser(params.userId, notification);
        }
        return notification;
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_gateway_1.ChatGateway))),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager,
        chat_gateway_1.ChatGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map