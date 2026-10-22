import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ collection: 'messages', timestamps: true })
export class Message {
  @Prop({ required: true, unique: true, index: true })
  messageId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, default: 'general', index: true })
  channelId: string;

  @Prop({ required: true, index: true })
  senderId: string;

  @Prop({ required: true, trim: true })
  senderName: string;

  @Prop({ required: false })
  senderAvatar?: string;

  @Prop({ required: false, trim: true, default: '' })
  content?: string;

  @Prop({ required: false, default: 'TEXT', enum: ['TEXT', 'VOICE', 'IMAGE', 'FILE'] })
  type?: string;

  @Prop({ required: false, default: 0 })
  audioDurationSeconds?: number;

  @Prop({ required: false, index: true })
  recipientId?: string;

  @Prop({ required: false, default: false, index: true })
  isDirect?: boolean;

  @Prop({ required: false, default: false })
  isEdited?: boolean;

  @Prop({ required: false, default: false })
  isDeleted?: boolean;

  @Prop({ required: false, default: false })
  isPinned?: boolean;

  @Prop({ required: false })
  pinnedBy?: string;

  @Prop({ required: false })
  pinnedAt?: Date;

  @Prop({
    type: [
      {
        url: String,
        fileName: String,
        fileType: String,
        fileSize: Number,
      },
    ],
    default: [],
  })
  attachments?: {
    url: string;
    fileName: string;
    fileType: string;
    fileSize?: number;
  }[];

  @Prop({
    type: {
      messageId: String,
      senderId: String,
      senderName: String,
      content: String,
      attachmentName: String,
    },
    required: false,
  })
  replyTo?: {
    messageId: string;
    senderId: string;
    senderName: string;
    content?: string;
    attachmentName?: string;
  };

  @Prop({
    type: [
      {
        emoji: String,
        userIds: [String],
      },
    ],
    default: [],
  })
  reactions?: {
    emoji: string;
    userIds: string[];
  }[];

  @Prop({ type: [String], default: [] })
  mentions?: string[];

  @Prop({ type: [String], default: [] })
  readBy?: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ companyId: 1, channelId: 1, createdAt: 1 });
MessageSchema.index({ companyId: 1, recipientId: 1 });
MessageSchema.index({ companyId: 1, channelId: 1, isPinned: 1 });
