import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { MailService } from '../mail/mail.service';
import { AiService } from '../ai/ai.service';
import { BroadcastTemplate, BroadcastLog } from './schemas/broadcast.schema';
import { SendBroadcastDto, CreateTemplateDto, GenerateAiDraftDto } from './dto/broadcast.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class BroadcastsService {
    private readonly regionalDbManager;
    private readonly mailService;
    private readonly aiService;
    constructor(regionalDbManager: RegionalDatabaseManager, mailService: MailService, aiService: AiService);
    sendBroadcast(tenant: TenantContext, user: JwtPayload, dto: SendBroadcastDto): Promise<{
        success: boolean;
        recipientCount: number;
        broadcastId: string;
    }>;
    listTemplates(tenant: TenantContext): Promise<BroadcastTemplate[]>;
    createTemplate(tenant: TenantContext, dto: CreateTemplateDto): Promise<BroadcastTemplate>;
    deleteTemplate(tenant: TenantContext, templateId: string): Promise<{
        success: boolean;
    }>;
    getHistory(tenant: TenantContext): Promise<BroadcastLog[]>;
    generateAiDraft(tenant: TenantContext, dto: GenerateAiDraftDto): Promise<{
        subject: string;
        body: string;
        modelUsed: string;
    }>;
}
