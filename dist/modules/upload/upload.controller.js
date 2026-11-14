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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
require("multer");
const upload_service_1 = require("./upload.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let UploadController = class UploadController {
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    async uploadLogo(files) {
        const file = (files?.file && files.file[0]) || (files?.logo && files.logo[0]);
        if (!file) {
            throw new common_1.BadRequestException('Image file is required');
        }
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/svg+xml',
            'image/gif',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Only JPEG, PNG, WEBP, SVG, and GIF images are allowed.');
        }
        const maxSizeBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            throw new common_1.BadRequestException('Image file size must not exceed 5MB');
        }
        const result = await this.uploadService.uploadImage(file.buffer, 'workivlab/logos');
        return {
            success: true,
            url: result.url,
            publicId: result.publicId,
        };
    }
    async uploadAttachment(file) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        const maxSizeBytes = 25 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            throw new common_1.BadRequestException('Attachment file size must not exceed 25MB');
        }
        const result = await this.uploadService.uploadAttachment(file.buffer, file.originalname, file.mimetype);
        return {
            success: true,
            ...result,
        };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('logo'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'file', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
    ])),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload company logo or workspace asset to Cloudinary',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File uploaded successfully' }),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadLogo", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('attachment'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload chat file attachment, image, or document to Cloudinary CDN',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attachment uploaded successfully' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadAttachment", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('File Uploads'),
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map