import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private readonly configService;
    private readonly logger;
    private isConfigured;
    constructor(configService: ConfigService);
    private initCloudinary;
    uploadImage(buffer: Buffer, folder?: string): Promise<{
        url: string;
        publicId: string;
    }>;
    uploadAttachment(buffer: Buffer, fileName: string, mimeType: string): Promise<{
        url: string;
        publicId: string;
        fileName: string;
        fileType: string;
        fileSize: number;
    }>;
}
