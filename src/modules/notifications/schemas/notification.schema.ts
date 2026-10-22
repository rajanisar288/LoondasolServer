import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  CALL = 'CALL',
  CHAT = 'CHAT',
  MEETING = 'MEETING',
  TASK = 'TASK',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  SYSTEM = 'SYSTEM',
}

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({ required: true, unique: true, index: true })
  notificationId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({
    required: true,
    enum: Object.values(NotificationType),
    default: NotificationType.SYSTEM,
    index: true,
  })
  type: NotificationType;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @Prop({ required: true, default: false, index: true })
  isRead: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ companyId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
