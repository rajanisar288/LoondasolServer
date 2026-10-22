"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
let UploadService = UploadService_1 = class UploadService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(UploadService_1.name);
        this.isConfigured = false;
        this.initCloudinary();
    }
    initCloudinary() {
        const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.configService.get('CLOUDINARY_API_KEY');
        const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');
        if (!cloudName || !apiKey || !apiSecret || cloudName === 'placeholder') {
            this.logger.warn('Cloudinary credentials not configured; upload service will be mocked');
            return;
        }
        cloudinary_1.v2.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
        });
        this.isConfigured = true;
        this.logger.log(`Cloudinary configured successfully for cloud: ${cloudName}`);
    }
    async uploadImage(buffer, folder = 'workivlab/logos') {
        if (!this.isConfigured) {
            throw new common_1.BadRequestException('Cloudinary storage is not properly configured on this server');
        }
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: 'image',
                transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            }, (error, result) => {
                if (error || !result) {
                    this.logger.error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`);
                    return reject(new common_1.BadRequestException(`Failed to upload image: ${error?.message}`));
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            });
            uploadStream.end(buffer);
        });
    }
    async uploadAttachment(buffer, fileName, mimeType) {
        const fileSize = buffer.length;
        if (!this.isConfigured) {
            const base64 = buffer.toString('base64');
            const dataUrl = `data:${mimeType};base64,${base64}`;
            return {
                url: dataUrl,
                publicId: `local_${Date.now()}`,
                fileName,
                fileType: mimeType,
                fileSize,
            };
        }
        const isImage = mimeType.startsWith('image/');
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'workivlab/chat-attachments',
                resource_type: isImage ? 'image' : 'raw',
                public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
            }, (error, result) => {
                if (error || !result) {
                    this.logger.error(`Cloudinary attachment upload failed: ${error?.message || 'Unknown error'}`);
                    return reject(new common_1.BadRequestException(`Failed to upload attachment: ${error?.message}`));
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    fileName,
                    fileType: mimeType,
                    fileSize,
                });
            });
            uploadStream.end(buffer);
        });
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map