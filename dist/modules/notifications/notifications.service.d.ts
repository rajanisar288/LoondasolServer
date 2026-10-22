import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Notification, NotificationType } from './schemas/notification.schema';
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
export declare class NotificationsService {
    private readonly regionalDbManager;
    private readonly chatGateway;
    constructor(regionalDbManager: RegionalDatabaseManager, chatGateway: ChatGateway);
    getUserNotifications(tenant: TenantContext, user: JwtPayload, limit?: number): Promise<Notification[]>;
    getUnreadCount(tenant: TenantContext, user: JwtPayload): Promise<number>;
    markAsRead(tenant: TenantContext, user: JwtPayload, notificationId: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(tenant: TenantContext, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    createAndPush(params: CreateNotificationParams): Promise<Notification>;
}
