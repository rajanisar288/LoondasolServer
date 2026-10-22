import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  ABSENT = 'ABSENT',
}

@Schema({ collection: 'attendance_records', timestamps: true })
export class Attendance {
  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  employeeId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true })
  employeeName: string;

  // Stored as YYYY-MM-DD string in company timezone for daily indexing
  @Prop({ required: true, index: true })
  date: string;

  @Prop({ required: true })
  clockInTime: Date;

  @Prop({ required: false })
  clockOutTime?: Date;

  @Prop({ required: false, default: 0 })
  totalHours: number;

  @Prop({
    required: true,
    enum: Object.values(AttendanceStatus),
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @Prop({ required: false, default: false })
  isLate: boolean;

  @Prop({ required: false, default: 0 })
  minutesLate: number;

  @Prop({ required: false })
  scheduledStartTime?: string;

  @Prop({ required: false })
  ipAddress?: string;

  @Prop({ required: false })
  notes?: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

AttendanceSchema.index(
  { companyId: 1, employeeId: 1, date: 1 },
  { unique: true },
);
AttendanceSchema.index({ companyId: 1, date: 1 });
