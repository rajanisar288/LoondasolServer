import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ResignationDocument = Resignation & Document;

export enum ResignationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

@Schema({ _id: false })
export class ExitClearanceChecklist {
  @Prop({ required: true, default: false })
  itAssetsReturned: boolean;

  @Prop({ required: true, default: false })
  accessRevoked: boolean;

  @Prop({ required: true, default: false })
  idBadgeReturned: boolean;

  @Prop({ required: true, default: false })
  financeDuesCleared: boolean;

  @Prop({ required: true, default: false })
  knowledgeTransferDone: boolean;
}

@Schema({ collection: 'resignations', timestamps: true })
export class Resignation {
  @Prop({ required: true, unique: true, index: true })
  resignationId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  employeeId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true })
  employeeName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  employeeEmail: string;

  @Prop({ required: false, trim: true })
  departmentName?: string;

  @Prop({ required: true })
  submissionDate: Date;

  @Prop({ required: true })
  intendedLastWorkingDay: Date;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({
    required: true,
    enum: Object.values(ResignationStatus),
    default: ResignationStatus.SUBMITTED,
  })
  status: ResignationStatus;

  @Prop({ type: ExitClearanceChecklist, default: () => ({}) })
  clearanceChecklist: ExitClearanceChecklist;

  @Prop({ required: false })
  reviewedBy?: string;

  @Prop({ required: false })
  reviewedAt?: Date;

  @Prop({ required: false, trim: true })
  exitInterviewNotes?: string;
}

export const ResignationSchema = SchemaFactory.createForClass(Resignation);

ResignationSchema.index({ companyId: 1, employeeId: 1, status: 1 });
