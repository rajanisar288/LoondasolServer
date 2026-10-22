import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
  LAUNCHED = 'LAUNCHED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Schema({ _id: false })
export class TaskAssignee {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  avatarUrl?: string;
}

@Schema({ _id: false })
export class TaskTimeLog {
  @Prop({ required: true })
  logId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: false })
  endTime?: Date;

  @Prop({ required: true, default: 0 })
  durationMinutes: number;
}

@Schema({ _id: false })
export class TaskSubtask {
  @Prop({ required: true })
  subtaskId: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, default: false })
  isCompleted: boolean;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

@Schema({ _id: false })
export class CommentReaction {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true })
  emoji: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

@Schema({ _id: false })
export class CommentReply {
  @Prop({ required: true })
  replyId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: false })
  userAvatar?: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [CommentReaction], default: [] })
  reactions?: CommentReaction[];

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

@Schema({ _id: false })
export class TaskComment {
  @Prop({ required: true })
  commentId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: false })
  userAvatar?: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [CommentReaction], default: [] })
  reactions?: CommentReaction[];

  @Prop({ type: [CommentReply], default: [] })
  replies?: CommentReply[];

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

@Schema({ collection: 'tasks', timestamps: true })
export class Task {
  @Prop({ required: true, unique: true, index: true })
  taskId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: false })
  description?: string;

  @Prop({
    required: true,
    enum: Object.values(TaskStatus),
    default: TaskStatus.TODO,
    index: true,
  })
  status: TaskStatus;

  @Prop({
    required: true,
    enum: Object.values(TaskPriority),
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  // Kept for backward compatibility
  @Prop({ required: false, index: true })
  assigneeId?: string;

  @Prop({ required: false })
  assigneeName?: string;

  // Multi-assignees
  @Prop({ type: [TaskAssignee], default: [] })
  assignees: TaskAssignee[];

  @Prop({ required: false })
  dueDate?: Date;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ type: [TaskTimeLog], default: [] })
  timeLogs: TaskTimeLog[];

  @Prop({ required: true, default: 0 })
  totalSpentMinutes: number;

  @Prop({ required: false, default: false })
  isTimerRunning?: boolean;

  @Prop({ required: false })
  activeTimerUserId?: string;

  @Prop({ required: false })
  activeTimerStartTime?: Date;

  @Prop({ type: [TaskSubtask], default: [] })
  subtasks: TaskSubtask[];

  @Prop({ type: [TaskComment], default: [] })
  comments: TaskComment[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ companyId: 1, status: 1 });
TaskSchema.index({ companyId: 1, 'assignees.userId': 1 });
TaskSchema.index({ companyId: 1, assigneeId: 1 });
