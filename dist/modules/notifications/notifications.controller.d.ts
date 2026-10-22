import { NotificationsService } from './notifications.service';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(tenant: TenantContext, user: JwtPayload, limit?: number): Promise<import("./schemas/notification.schema").Notification[]>;
    getUnreadCount(tenant: TenantContext, user: JwtPayload): Promise<{
        count: number;
    }>;
    markAsRead(tenant: TenantContext, user: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(tenant: TenantContext, user: JwtPayload): Promise<{
        success: boolean;
    }>;
}
