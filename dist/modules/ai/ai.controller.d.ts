import { AiService } from './ai.service';
import { ParseTaskPromptDto, GenerateSocialPostDto, SmartSearchDto, DispatchTaskReportDto, AskAiDto } from './dto/ai.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    parseTaskPrompt(tenant: TenantContext, user: JwtPayload, dto: ParseTaskPromptDto): Promise<import("./ai.service").ParsedTaskResult>;
    generateSocialPost(tenant: TenantContext, user: JwtPayload, dto: GenerateSocialPostDto): Promise<{
        content: string;
        hashtags: string[];
        platform: string;
        modelUsed: string;
    }>;
    getTopPerformers(tenant: TenantContext): Promise<import("./ai.service").TopPerformer[]>;
    smartSearch(tenant: TenantContext, user: JwtPayload, dto: SmartSearchDto): Promise<{
        results: Array<{
            type: string;
            title: string;
            subtitle?: string;
            link: string;
            icon: string;
        }>;
    }>;
    dispatchTaskReport(tenant: TenantContext, user: JwtPayload, dto: DispatchTaskReportDto): Promise<{
        success: boolean;
        message: string;
    }>;
    askAi(tenant: TenantContext, user: JwtPayload, dto: AskAiDto): Promise<{
        answer: string;
        modelUsed: string;
    }>;
}
