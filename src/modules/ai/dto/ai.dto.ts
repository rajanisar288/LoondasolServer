import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ParseTaskPromptDto {
  @ApiProperty({ example: 'Create task to finalize Q4 budget due next Friday assign to Sarah with high priority' })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export class GenerateSocialPostDto {
  @ApiProperty({ example: 'Product launch of our new AI collaboration feature' })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({ example: 'LINKEDIN', enum: ['LINKEDIN', 'TWITTER', 'FACEBOOK', 'INSTAGRAM'] })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiPropertyOptional({ example: 'inspiring' })
  @IsString()
  @IsOptional()
  tone?: string;
}

export class SmartSearchDto {
  @ApiProperty({ example: 'Find upcoming tasks due this week or marketing campaigns' })
  @IsString()
  @IsNotEmpty()
  query: string;
}

export class DispatchTaskReportDto {
  @ApiPropertyOptional({ example: 'general' })
  @IsString()
  @IsOptional()
  channelId?: string;

  @ApiPropertyOptional({ example: 'user_123' })
  @IsString()
  @IsOptional()
  recipientId?: string;
}

export class AskAiDto {
  @ApiProperty({ example: 'What are the main priorities for this sprint?' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional()
  @IsOptional()
  context?: Record<string, any>;
}

