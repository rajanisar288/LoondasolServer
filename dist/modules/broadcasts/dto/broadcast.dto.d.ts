export declare class SendBroadcastDto {
    targetType: 'all' | 'department' | 'selected';
    departmentId?: string;
    employeeIds?: string[];
    subject: string;
    body: string;
}
export declare class CreateTemplateDto {
    name: string;
    subject: string;
    body: string;
    category?: string;
}
export declare class GenerateAiDraftDto {
    topic: string;
    tone?: string;
    audience?: string;
}
