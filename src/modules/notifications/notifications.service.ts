import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import {
  Notification,
  NotificationSchema,
  NotificationType,
} from './schemas/notification.schema';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { ChatGateway } from '../chat/chat.gateway';
import { RegionCode } from '../../common/constants/regions.constant';

export interface CreateNotificationParams {
  region: RegionCode;
  companyId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly regionalDbManager: RegionalDatabaseManager,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  // Fetch recent notifications for authenticated user
  async getUserNotifications(
    tenant: TenantContext,
    user: JwtPayload,
    limit = 30,
  ): Promise<Notification[]> {
    const model = await this.regionalDbManager.getModel<Notification>(
      tenant.region,
      Notification.name,
      NotificationSchema,
    );

    return model
      .find({ companyId: tenant.companyId, userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  // Count unread notifications
  async getUnreadCount(
    tenant: TenantContext,
    user: JwtPayload,
  ): Promise<number> {
    const model = await this.regionalDbManager.getModel<Notification>(
      tenant.region,
      Notification.name,
      NotificationSchema,
    );

    return model.countDocuments({
      companyId: tenant.companyId,
      userId: user.userId,
      isRead: false,
    });
  }

  // Mark single notification as read
  async markAsRead(
    tenant: TenantContext,
    user: JwtPayload,
    notificationId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<Notification>(
      tenant.region,
      Notification.name,
      NotificationSchema,
    );

    await model.updateOne(
      { companyId: tenant.companyId, userId: user.userId, notificationId },
      { isRead: true },
    );

    return { success: true };
  }

  // Mark all user notifications as read
  async markAllAsRead(
    tenant: TenantContext,
    user: JwtPayload,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<Notification>(
      tenant.region,
      Notification.name,
      NotificationSchema,
    );

    await model.updateMany(
      { companyId: tenant.companyId, userId: user.userId, isRead: false },
      { isRead: true },
    );

    return { success: true };
  }

  // Creates persistent notification and pushes in real-time over WebSocket
  async createAndPush(params: CreateNotificationParams): Promise<Notification> {
    const model = await this.regionalDbManager.getModel<Notification>(
      params.region,
      Notification.name,
      NotificationSchema,
    );

    const notificationId = `notif_${randomUUID()}`;
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

    // Real-time dispatch via Socket.IO
    if (this.chatGateway) {
      this.chatGateway.notifyUser(params.userId, notification);
    }

    return notification;
  }
}
