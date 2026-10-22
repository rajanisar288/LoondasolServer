import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendBroadcastDto {
  @IsEnum(['all', 'department', 'selected'])
  targetType: 'all' | 'department' | 'selected';

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];

  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Message body is required' })
  body: string;
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty({ message: 'Template name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Message body is required' })
  body: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class GenerateAiDraftDto {
  @IsString()
  @IsNotEmpty({ message: 'Topic is required' })
  topic: string;

  @IsOptional()
  @IsString()
  tone?: string;

  @IsOptional()
  @IsString()
  audience?: string;
}
