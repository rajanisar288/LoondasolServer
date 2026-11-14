import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import 'multer';
import { UploadService } from './upload.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('File Uploads')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Public()
  @Post('logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ]),
  )
  @ApiOperation({
    summary: 'Upload company logo or workspace asset to Cloudinary',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  async uploadLogo(
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; logo?: Express.Multer.File[] },
  ): Promise<{ success: boolean; url: string; publicId: string }> {
    const file =
      (files?.file && files.file[0]) || (files?.logo && files.logo[0]);
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WEBP, SVG, and GIF images are allowed.',
      );
    }

    // Maximum 5MB file size
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('Image file size must not exceed 5MB');
    }

    const result = await this.uploadService.uploadImage(
      file.buffer,
      'workivlab/logos',
    );

    return {
      success: true,
      url: result.url,
      publicId: result.publicId,
    };
  }

  @Public()
  @Post('attachment')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary:
      'Upload chat file attachment, image, or document to Cloudinary CDN',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Attachment uploaded successfully' })
  async uploadAttachment(@UploadedFile() file: Express.Multer.File): Promise<{
    success: boolean;
    url: string;
    publicId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Maximum 25MB attachment size
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        'Attachment file size must not exceed 25MB',
      );
    }

    const result = await this.uploadService.uploadAttachment(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return {
      success: true,
      ...result,
    };
  }
}
