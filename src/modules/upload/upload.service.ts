import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    this.initCloudinary();
  }

  // Configures Cloudinary SDK with API credentials
  private initCloudinary(): void {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret || cloudName === 'placeholder') {
      this.logger.warn(
        'Cloudinary credentials not configured; upload service will be mocked',
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.isConfigured = true;
    this.logger.log(
      `Cloudinary configured successfully for cloud: ${cloudName}`,
    );
  }

  // Uploads image buffer to Cloudinary CDN
  async uploadImage(
    buffer: Buffer,
    folder = 'workivlab/logos',
  ): Promise<{ url: string; publicId: string }> {
    if (!this.isConfigured) {
      throw new BadRequestException(
        'Cloudinary storage is not properly configured on this server',
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error(
              `Cloudinary upload failed: ${error?.message || 'Unknown error'}`,
            );
            return reject(
              new BadRequestException(
                `Failed to upload image: ${error?.message}`,
              ),
            );
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      uploadStream.end(buffer);
    });
  }

  // Uploads arbitrary file or image attachment for chat and collaboration
  async uploadAttachment(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<{
    url: string;
    publicId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }> {
    const fileSize = buffer.length;

    if (!this.isConfigured) {
      // Data URI fallback for offline simulation
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
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'workivlab/chat-attachments',
          resource_type: isImage ? 'image' : 'raw',
          public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error(
              `Cloudinary attachment upload failed: ${error?.message || 'Unknown error'}`,
            );
            return reject(
              new BadRequestException(
                `Failed to upload attachment: ${error?.message}`,
              ),
            );
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            fileName,
            fileType: mimeType,
            fileSize,
          });
        },
      );

      uploadStream.end(buffer);
    });
  }
}
