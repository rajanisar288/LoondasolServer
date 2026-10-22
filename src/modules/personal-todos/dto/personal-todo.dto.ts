import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { PersonalTodoStatus } from '../schemas/personal-todo.schema';

export class CreatePersonalTodoDto {
  @ApiProperty({ example: 'Review quarterly architecture design' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Check database schema and redis sharding' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePersonalTodoDto {
  @ApiPropertyOptional({ example: 'Review quarterly architecture design' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Check database schema and redis sharding' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: PersonalTodoStatus })
  @IsEnum(PersonalTodoStatus)
  @IsOptional()
  status?: PersonalTodoStatus;
}
