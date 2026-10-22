import 'multer';
import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadLogo(file: Express.Multer.File): Promise<{
        success: boolean;
        url: string;
        publicId: string;
    }>;
    uploadAttachment(file: Express.Multer.File): Promise<{
        success: boolean;
        url: string;
        publicId: string;
        fileName: string;
        fileType: string;
        fileSize: number;
    }>;
}
