import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { TaskStatus, TaskPriority } from '../schemas/task.schema';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'Task title is required' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  assigneeIds?: string[];

  @IsOptional()
  @IsArray()
  assignees?: Array<{ userId: string; name: string; avatarUrl?: string }>;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  subtasks?: Array<{ subtaskId?: string; title: string; isCompleted?: boolean }>;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  assigneeIds?: string[];

  @IsOptional()
  @IsArray()
  assignees?: Array<{ userId: string; name: string; avatarUrl?: string }>;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  subtasks?: Array<{ subtaskId?: string; title: string; isCompleted?: boolean }>;
}

export class CreateSubtaskDto {
  @IsString()
  @IsNotEmpty({ message: 'Subtask title is required' })
  title: string;
}

export class UpdateSubtaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  isCompleted?: boolean;
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment content cannot be empty' })
  content: string;
}

export class CreateReplyDto {
  @IsString()
  @IsNotEmpty({ message: 'Reply content cannot be empty' })
  content: string;
}

export class ToggleReactionDto {
  @IsString()
  @IsNotEmpty({ message: 'Emoji reaction is required' })
  emoji: string;
}

export class LogTaskTimeDto {
  @IsNotEmpty()
  durationMinutes: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
