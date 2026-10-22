import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LeaveDocument = Leave & Document;

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  CASUAL = 'CASUAL',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  UNPAID = 'UNPAID',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Schema({ collection: 'leave_requests', timestamps: true })
export class Leave {
  @Prop({ required: true, unique: true, index: true })
  leaveId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  employeeId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true })
  employeeName: string;

  @Prop({ required: true, trim: true, default: 'ANNUAL' })
  leaveType: string;

  @Prop({ required: true })
  startDate: string;

  @Prop({ required: true })
  endDate: string;

  @Prop({ required: true, default: 1 })
  daysCount: number;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({
    required: true,
    enum: Object.values(LeaveStatus),
    default: LeaveStatus.PENDING,
    index: true,
  })
  status: LeaveStatus;

  @Prop({ required: false })
  reviewedBy?: string;

  @Prop({ required: false })
  reviewerNotes?: string;

  @Prop({ required: false })
  reviewedAt?: Date;
}

export const LeaveSchema = SchemaFactory.createForClass(Leave);

LeaveSchema.index({ companyId: 1, status: 1 });
LeaveSchema.index({ companyId: 1, employeeId: 1 });
