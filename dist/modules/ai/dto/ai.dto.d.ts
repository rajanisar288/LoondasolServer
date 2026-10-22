export declare class ParseTaskPromptDto {
    prompt: string;
}
export declare class GenerateSocialPostDto {
    topic: string;
    platform: string;
    tone?: string;
}
export declare class SmartSearchDto {
    query: string;
}
export declare class DispatchTaskReportDto {
    channelId?: string;
    recipientId?: string;
}
export declare class AskAiDto {
    prompt: string;
    context?: Record<string, any>;
}
