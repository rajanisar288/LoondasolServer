import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExpenseDocument = Expense & Document;

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REIMBURSED = 'REIMBURSED',
  REJECTED = 'REJECTED',
}

@Schema({ collection: 'expenses', timestamps: true })
export class Expense {
  @Prop({ required: true, unique: true, index: true })
  expenseId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: false, index: true })
  branchId?: string;

  @Prop({ required: false, trim: true })
  branchName?: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, index: true })
  category: string;

  @Prop({ required: true, default: 0 })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ required: true, index: true })
  date: string;

  @Prop({ required: false })
  receiptUrl?: string;

  @Prop({ required: true, index: true })
  paidByUserId: string;

  @Prop({ required: true, trim: true })
  paidByName: string;

  @Prop({ required: false, trim: true })
  notes?: string;

  @Prop({
    required: true,
    enum: Object.values(ExpenseStatus),
    default: ExpenseStatus.PENDING,
    index: true,
  })
  status: ExpenseStatus;

  @Prop({ required: false })
  approvedBy?: string;

  @Prop({ required: false })
  approvedAt?: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

ExpenseSchema.index({ companyId: 1, date: -1 });
ExpenseSchema.index({ companyId: 1, branchId: 1 });
ExpenseSchema.index({ companyId: 1, category: 1 });
