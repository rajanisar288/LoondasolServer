import { ConfigService } from '@nestjs/config';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { TaskPriority } from '../tasks/schemas/task.schema';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export interface EmailDraftResult {
    subject: string;
    body: string;
    modelUsed: string;
}
export interface ParsedTaskResult {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate?: string;
    assigneeName?: string;
    modelUsed: string;
}
export interface TopPerformer {
    rank: number;
    employeeId: string;
    name: string;
    email: string;
    departmentName?: string;
    avatarUrl?: string;
    score: number;
    completedTasksCount: number;
    punctualityRate: number;
    badge: string;
}
export declare class AiService {
    private readonly configService;
    private readonly regionalDbManager;
    private readonly logger;
    constructor(configService: ConfigService, regionalDbManager: RegionalDatabaseManager);
    private getGeminiApiKey;
    getGeminiModel(): string;
    callGemini(prompt: string, options?: {
        temperature?: number;
        responseMimeType?: string;
        maxOutputTokens?: number;
    }): Promise<string | null>;
    buildRbacWorkspaceContext(tenant: TenantContext, user: JwtPayload): Promise<Record<string, any>>;
    askAi(tenant: TenantContext, user: JwtPayload, promptText: string, dtoContext?: Record<string, any>): Promise<{
        answer: string;
        modelUsed: string;
    }>;
    checkAiAccess(tenant: TenantContext, user: JwtPayload): Promise<void>;
    parseTaskPrompt(promptText: string): Promise<ParsedTaskResult>;
    generateSocialPost(topic: string, platform: string, tone?: string, companyName?: string): Promise<{
        content: string;
        hashtags: string[];
        platform: string;
        modelUsed: string;
    }>;
    generateEmailDraft(topic: string, tone?: string, companyName?: string, audience?: string): Promise<EmailDraftResult>;
    generateExecutiveReport(analytics: Record<string, any>, companyName?: string): Promise<{
        reportMarkdown: string;
        modelUsed: string;
    }>;
    calculateTopPerformers(tenant: TenantContext): Promise<TopPerformer[]>;
    smartSearch(tenant: TenantContext, user: JwtPayload, queryText: string): Promise<{
        results: Array<{
            type: string;
            title: string;
            subtitle?: string;
            link: string;
            icon: string;
        }>;
    }>;
    dispatchTaskReport(tenant: TenantContext, user: JwtPayload, channelId?: string, recipientId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
