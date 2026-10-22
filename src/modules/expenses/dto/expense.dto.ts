import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ExpenseStatus } from '../schemas/expense.schema';

export class CreateExpenseDto {
  @ApiProperty({ example: 'High-speed office router and cables' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'EQUIPMENT' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 149.99 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: '2026-09-19' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ example: 'br_123' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Headquarters' })
  @IsString()
  @IsOptional()
  branchName?: string;

  @ApiPropertyOptional({ example: 'https://cloudinary.../receipt.pdf' })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiPropertyOptional({ example: 'Purchased for new server room rack' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateExpenseStatusDto {
  @ApiProperty({ enum: ExpenseStatus, example: ExpenseStatus.APPROVED })
  @IsEnum(ExpenseStatus)
  status: ExpenseStatus;
}
