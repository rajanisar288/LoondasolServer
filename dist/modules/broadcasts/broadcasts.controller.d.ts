import { BroadcastsService } from './broadcasts.service';
import { SendBroadcastDto, CreateTemplateDto, GenerateAiDraftDto } from './dto/broadcast.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class BroadcastsController {
    private readonly broadcastsService;
    constructor(broadcastsService: BroadcastsService);
    send(tenant: TenantContext, user: JwtPayload, dto: SendBroadcastDto): Promise<{
        success: boolean;
        recipientCount: number;
        broadcastId: string;
    }>;
    listTemplates(tenant: TenantContext): Promise<import("./schemas/broadcast.schema").BroadcastTemplate[]>;
    createTemplate(tenant: TenantContext, dto: CreateTemplateDto): Promise<import("./schemas/broadcast.schema").BroadcastTemplate>;
    deleteTemplate(tenant: TenantContext, id: string): Promise<{
        success: boolean;
    }>;
    getHistory(tenant: TenantContext): Promise<import("./schemas/broadcast.schema").BroadcastLog[]>;
    generateAi(tenant: TenantContext, dto: GenerateAiDraftDto): Promise<{
        subject: string;
        body: string;
        modelUsed: string;
    }>;
}
