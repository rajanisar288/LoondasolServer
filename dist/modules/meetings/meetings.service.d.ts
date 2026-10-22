import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Meeting } from './schemas/meeting.schema';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { NotificationsService } from '../notifications/notifications.service';
export declare class MeetingsService {
    private readonly regionalDbManager;
    private readonly notificationsService;
    constructor(regionalDbManager: RegionalDatabaseManager, notificationsService: NotificationsService);
    createMeeting(tenant: TenantContext, user: JwtPayload, dto: CreateMeetingDto): Promise<Meeting>;
    getMeetings(tenant: TenantContext, user: JwtPayload, query?: {
        status?: string;
        limit?: number;
    }): Promise<Meeting[]>;
    getMeeting(tenant: TenantContext, identifier: string): Promise<Meeting>;
    joinMeeting(tenant: TenantContext, identifier: string, user: JwtPayload): Promise<Meeting>;
    updateMeeting(tenant: TenantContext, meetingId: string, dto: UpdateMeetingDto): Promise<Meeting>;
    deleteMeeting(tenant: TenantContext, meetingId: string): Promise<{
        success: boolean;
    }>;
}
