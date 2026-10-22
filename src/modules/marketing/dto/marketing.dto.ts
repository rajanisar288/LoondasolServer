import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateMarketingPostDto {
  @ApiProperty({ example: 'LINKEDIN' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({ example: 'Excited to announce our newest product update!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: ['#Innovation', '#Tech'] })
  @IsArray()
  @IsOptional()
  hashtags?: string[];

  @ApiPropertyOptional({ example: 'https://cloudinary.../image.jpg' })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiPropertyOptional({ example: 'PUBLISHED' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: '2026-09-20T10:00:00Z' })
  @IsString()
  @IsOptional()
  scheduledFor?: string;
}
