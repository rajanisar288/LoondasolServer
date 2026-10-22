import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BranchDocument = Branch & Document;

@Schema({ _id: false })
export class BranchWorkingHours {
  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ required: true, default: '09:00' })
  startTime: string;

  @Prop({ required: true, default: '18:00' })
  endTime: string;

  @Prop({ required: true, type: [Number], default: [1, 2, 3, 4, 5] })
  workingDays: number[];

  @Prop({ required: true, default: false })
  enforceLoginRestriction: boolean;
}

@Schema({ collection: 'branches', timestamps: true })
export class Branch {
  @Prop({ required: true, unique: true, index: true })
  branchId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ required: false, trim: true })
  phone?: string;

  @Prop({ required: true, default: 'UTC' })
  timezone: string;

  @Prop({ required: false, trim: true })
  currency?: string;

  @Prop({ type: BranchWorkingHours, default: () => ({}) })
  workingHours: BranchWorkingHours;

  @Prop({ required: false, default: 0 })
  employeeCount?: number;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

BranchSchema.index({ companyId: 1, name: 1 });
