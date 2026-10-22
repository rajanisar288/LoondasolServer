import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PayrollSlipDocument = PayrollSlip & Document;

export enum PayrollSlipStatus {
  GENERATED = 'GENERATED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Schema({ collection: 'payroll_slips', timestamps: true })
export class PayrollSlip {
  @Prop({ required: true, unique: true, index: true })
  slipId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  employeeId: string;

  @Prop({ required: true, trim: true })
  employeeName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  employeeEmail: string;

  @Prop({ required: false, trim: true })
  designation?: string;

  @Prop({ required: false, trim: true })
  departmentName?: string;

  @Prop({ required: false, trim: true })
  branchName?: string;

  // e.g. "2026-09"
  @Prop({ required: true, index: true })
  month: string;

  @Prop({ required: true, default: 0 })
  baseSalary: number;

  @Prop({ required: true, default: 0 })
  workingDays: number;

  @Prop({ required: true, default: 0 })
  presentDays: number;

  @Prop({ required: true, default: 0 })
  absentDays: number;

  @Prop({ required: false, default: 0 })
  paidLeaveDays?: number;

  @Prop({ required: false, default: 0 })
  unpaidLeaveDays?: number;

  @Prop({ required: false, default: 0 })
  lopDays?: number;

  @Prop({ required: false, default: 0 })
  lopDeductions?: number;

  @Prop({ required: true, default: 0 })
  lateDays: number;

  @Prop({ required: true, default: 0 })
  overtimeHours: number;

  @Prop({ required: true, default: 0 })
  lateDeductions: number;

  @Prop({ required: false, default: 0 })
  taxPercentage?: number;

  @Prop({ required: false, default: 0 })
  taxDeductions?: number;

  @Prop({ required: true, default: 0 })
  overtimeBonus: number;

  @Prop({ required: false, default: 0 })
  customBonus?: number;

  @Prop({ required: false, default: 0 })
  fuelAllowance?: number;

  @Prop({ required: false, default: 0 })
  otherAllowances?: number;

  @Prop({ required: false, default: 0 })
  otherDeductions?: number;

  @Prop({ required: false, default: 0 })
  grossEarnings?: number;

  @Prop({ required: false, default: 0 })
  totalDeductions?: number;

  @Prop({ required: true, default: 0 })
  netSalary: number;

  @Prop({ required: false, default: '' })
  netPayInWords?: string;

  @Prop({ type: [Object], required: false, default: [] })
  earningsBreakdown?: Array<{
    id: string;
    name: string;
    amount: number;
    calcMode?: string;
    formula?: string;
    isManual?: boolean;
  }>;

  @Prop({ type: [Object], required: false, default: [] })
  deductionsBreakdown?: Array<{
    id: string;
    name: string;
    amount: number;
    calcMode?: string;
    formula?: string;
    isManual?: boolean;
  }>;

  @Prop({ required: false, default: 1 })
  templateVersion?: number;

  @Prop({ type: Object, required: false })
  templateSnapshot?: Record<string, any>;

  @Prop({ required: false, default: '' })
  pdfUrl?: string;

  @Prop({ required: false, default: false })
  isPasswordProtected?: boolean;

  @Prop({ required: false, default: '' })
  pdfPasswordHint?: string;

  @Prop({ required: false, default: '' })
  pdfPassword?: string;

  @Prop({ required: false, default: '' })
  eSignHash?: string;

  @Prop({ required: false })
  eSignedAt?: Date;

  @Prop({ required: false, default: false })
  emailSent?: boolean;

  @Prop({ required: false })
  emailSentAt?: Date;

  @Prop({
    required: true,
    enum: Object.values(PayrollSlipStatus),
    default: PayrollSlipStatus.GENERATED,
  })
  status: PayrollSlipStatus;

  @Prop({ type: Object, required: false })
  bankDetails?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
  };

  @Prop({ required: false })
  paidAt?: Date;

  @Prop({ required: false })
  notes?: string;
}

export const PayrollSlipSchema = SchemaFactory.createForClass(PayrollSlip);

PayrollSlipSchema.index({ companyId: 1, month: 1, employeeId: 1 }, { unique: true });
