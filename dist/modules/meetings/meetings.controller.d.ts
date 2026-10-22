import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class MeetingsController {
    private readonly meetingsService;
    constructor(meetingsService: MeetingsService);
    createMeeting(tenant: TenantContext, user: JwtPayload, dto: CreateMeetingDto): Promise<import("./schemas/meeting.schema").Meeting>;
    getMeetings(tenant: TenantContext, user: JwtPayload, status?: string, limit?: number): Promise<import("./schemas/meeting.schema").Meeting[]>;
    getMeeting(tenant: TenantContext, id: string): Promise<import("./schemas/meeting.schema").Meeting>;
    joinMeeting(tenant: TenantContext, user: JwtPayload, id: string): Promise<import("./schemas/meeting.schema").Meeting>;
    updateMeeting(tenant: TenantContext, id: string, dto: UpdateMeetingDto): Promise<import("./schemas/meeting.schema").Meeting>;
    deleteMeeting(tenant: TenantContext, id: string): Promise<{
        success: boolean;
    }>;
}
