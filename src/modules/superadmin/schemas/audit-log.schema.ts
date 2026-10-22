import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ collection: 'audit_logs', timestamps: true })
export class AuditLog {
  @Prop({ required: true, unique: true, index: true })
  logId: string;

  @Prop({ required: true, index: true })
  action: string;

  @Prop({ required: false, index: true })
  userId?: string;

  @Prop({ required: false, index: true })
  userEmail?: string;

  @Prop({ required: false, index: true })
  companyId?: string;

  @Prop({ required: false })
  companyName?: string;

  @Prop({ required: false })
  region?: string;

  @Prop({ required: false })
  ipAddress?: string;

  @Prop({ type: Object, required: false, default: {} })
  details?: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ companyId: 1, createdAt: -1 });
