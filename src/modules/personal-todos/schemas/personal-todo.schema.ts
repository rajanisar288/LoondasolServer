import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PersonalTodoDocument = PersonalTodo & Document;

export enum PersonalTodoStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

@Schema({ _id: false })
export class TimeInterval {
  @Prop({ required: true })
  intervalId: string;

  @Prop({ required: true })
  start: Date;

  @Prop({ required: false })
  end?: Date;

  @Prop({ required: true, default: 0 })
  durationMinutes: number;
}

@Schema({ collection: 'personal_todos', timestamps: true })
export class PersonalTodo {
  @Prop({ required: true, unique: true, index: true })
  todoId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: false, trim: true })
  description?: string;

  @Prop({
    required: true,
    enum: Object.values(PersonalTodoStatus),
    default: PersonalTodoStatus.PENDING,
  })
  status: PersonalTodoStatus;

  @Prop({ required: true, default: false })
  isRunning: boolean;

  @Prop({ required: false })
  currentIntervalStartedAt?: Date;

  @Prop({ type: [TimeInterval], default: [] })
  intervals: TimeInterval[];

  @Prop({ required: true, default: 0 })
  totalDurationMinutes: number;
}

export const PersonalTodoSchema = SchemaFactory.createForClass(PersonalTodo);

PersonalTodoSchema.index({ companyId: 1, userId: 1, createdAt: -1 });
