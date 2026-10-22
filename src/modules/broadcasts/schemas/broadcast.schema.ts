import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BroadcastTemplateDocument = BroadcastTemplate & Document;
export type BroadcastLogDocument = BroadcastLog & Document;

@Schema({ collection: 'broadcast_templates', timestamps: true })
export class BroadcastTemplate {
  @Prop({ required: true, unique: true, index: true })
  templateId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ required: true })
  body: string;

  @Prop({ required: false, default: 'General' })
  category?: string;
}

export const BroadcastTemplateSchema =
  SchemaFactory.createForClass(BroadcastTemplate);

BroadcastTemplateSchema.index({ companyId: 1, name: 1 });

@Schema({ collection: 'broadcast_logs', timestamps: true })
export class BroadcastLog {
  @Prop({ required: true, unique: true, index: true })
  broadcastId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, trim: true })
  subject: string;

  @Prop({ required: true })
  body: string;

  @Prop({
    required: true,
    enum: ['all', 'department', 'selected'],
    default: 'all',
  })
  targetType: 'all' | 'department' | 'selected';

  @Prop({ required: false })
  targetDepartmentName?: string;

  @Prop({ required: true, default: 0 })
  recipientCount: number;

  @Prop({ required: true })
  sentBy: string;

  @Prop({ required: true, default: Date.now })
  sentAt: Date;
}

export const BroadcastLogSchema = SchemaFactory.createForClass(BroadcastLog);

BroadcastLogSchema.index({ companyId: 1, sentAt: -1 });
