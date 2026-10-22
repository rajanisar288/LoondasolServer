import { TaskStatus, TaskPriority } from '../schemas/task.schema';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    assigneeIds?: string[];
    assignees?: Array<{
        userId: string;
        name: string;
        avatarUrl?: string;
    }>;
    dueDate?: string;
    subtasks?: Array<{
        subtaskId?: string;
        title: string;
        isCompleted?: boolean;
    }>;
}
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    assigneeIds?: string[];
    assignees?: Array<{
        userId: string;
        name: string;
        avatarUrl?: string;
    }>;
    dueDate?: string;
    subtasks?: Array<{
        subtaskId?: string;
        title: string;
        isCompleted?: boolean;
    }>;
}
export declare class CreateSubtaskDto {
    title: string;
}
export declare class UpdateSubtaskDto {
    title?: string;
    isCompleted?: boolean;
}
export declare class CreateCommentDto {
    content: string;
}
export declare class CreateReplyDto {
    content: string;
}
export declare class ToggleReactionDto {
    emoji: string;
}
export declare class LogTaskTimeDto {
    durationMinutes: number;
    notes?: string;
}
