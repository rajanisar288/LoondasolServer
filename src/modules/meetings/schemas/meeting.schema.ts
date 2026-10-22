import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MeetingDocument = Meeting & Document;

export enum MeetingType {
  VIDEO = 'VIDEO',
  SYNC = 'SYNC',
  STANDUP = 'STANDUP',
  ONE_ON_ONE = 'ONE_ON_ONE',
}

export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Schema({ collection: 'meetings', timestamps: true })
export class Meeting {
  @Prop({ required: true, unique: true, index: true })
  meetingId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: false, trim: true, default: '' })
  description?: string;

  @Prop({ required: true, index: true })
  hostId: string;

  @Prop({ required: true, trim: true })
  hostName: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({
    required: true,
    enum: Object.values(MeetingType),
    default: MeetingType.VIDEO,
  })
  meetingType: MeetingType;

  @Prop({ type: [String], default: [] })
  attendeeIds: string[];

  @Prop({ required: false, index: true })
  departmentId?: string;

  @Prop({ required: true, unique: true, index: true })
  roomId: string;

  @Prop({ required: false, index: true })
  meetingCode?: string;

  @Prop({
    required: true,
    enum: Object.values(MeetingStatus),
    default: MeetingStatus.SCHEDULED,
    index: true,
  })
  status: MeetingStatus;

  createdAt: Date;
  updatedAt: Date;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);

MeetingSchema.index({ companyId: 1, startTime: -1 });
MeetingSchema.index({ companyId: 1, status: 1 });
