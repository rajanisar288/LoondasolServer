import { Document } from 'mongoose';
export type TaskDocument = Task & Document;
export declare enum TaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    IN_REVIEW = "IN_REVIEW",
    COMPLETED = "COMPLETED",
    LAUNCHED = "LAUNCHED"
}
export declare enum TaskPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare class TaskAssignee {
    userId: string;
    name: string;
    avatarUrl?: string;
}
export declare class TaskTimeLog {
    logId: string;
    userId: string;
    userName: string;
    startTime: Date;
    endTime?: Date;
    durationMinutes: number;
}
export declare class TaskSubtask {
    subtaskId: string;
    title: string;
    isCompleted: boolean;
    createdAt: Date;
}
export declare class CommentReaction {
    userId: string;
    userName: string;
    emoji: string;
    createdAt: Date;
}
export declare class CommentReply {
    replyId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    reactions?: CommentReaction[];
    createdAt: Date;
}
export declare class TaskComment {
    commentId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    reactions?: CommentReaction[];
    replies?: CommentReply[];
    createdAt: Date;
}
export declare class Task {
    taskId: string;
    companyId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: string;
    assigneeName?: string;
    assignees: TaskAssignee[];
    dueDate?: Date;
    createdBy: string;
    timeLogs: TaskTimeLog[];
    totalSpentMinutes: number;
    isTimerRunning?: boolean;
    activeTimerUserId?: string;
    activeTimerStartTime?: Date;
    subtasks: TaskSubtask[];
    comments: TaskComment[];
}
export declare const TaskSchema: import("mongoose").Schema<Task, import("mongoose").Model<Task, any, any, any, Document<unknown, any, Task, any, {}> & Task & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Task, Document<unknown, {}, import("mongoose").FlatRecord<Task>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Task> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
