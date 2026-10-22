import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateOnboardingFormDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  branchName?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  departmentName?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsArray()
  fields: Array<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'date' | 'file';
    required: boolean;
    options?: string[];
    placeholder?: string;
    helperText?: string;
  }>;
}

export class UpdateOnboardingFormDto extends CreateOnboardingFormDto {}
