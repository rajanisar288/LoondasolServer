import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmployeeDocument = Employee & Document;

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  INVITED = 'INVITED',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
}

@Schema({ _id: false })
export class BankDetails {
  @Prop({ required: false, default: '' })
  bankName: string;

  @Prop({ required: false, default: '' })
  accountTitle: string;

  @Prop({ required: false, default: '' })
  accountNumber: string;

  @Prop({ required: false, default: '' })
  iban: string;

  @Prop({ required: false, default: '' })
  branchCode?: string;
}

@Schema({ collection: 'employees', timestamps: true })
export class Employee {
  @Prop({ required: true, unique: true, index: true })
  employeeId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: false, index: true })
  userId?: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: false })
  avatarUrl?: string;

  @Prop({ required: false })
  dateOfBirth?: string;

  @Prop({ required: false })
  cnic?: string;

  @Prop({ required: false })
  address?: string;

  @Prop({ type: BankDetails, default: () => ({}) })
  bankDetails?: BankDetails;

  @Prop({ required: false, index: true })
  branchId?: string;

  @Prop({ required: false })
  branchName?: string;

  @Prop({ required: false, index: true })
  departmentId?: string;

  @Prop({ required: false })
  departmentName?: string;

  @Prop({ required: true, trim: true })
  designation: string;

  @Prop({
    required: true,
    enum: Object.values(EmploymentType),
    default: EmploymentType.FULL_TIME,
  })
  employmentType: EmploymentType;

  @Prop({ required: false, type: [String], default: [] })
  permissions: string[];

  @Prop({ required: false, default: 'EMPLOYEE' })
  roleName?: string;

  @Prop({ required: false, index: true })
  roleId?: string;

  // Sensitive field: only exposed when caller holds employees.salary.view permission
  @Prop({ required: false, default: 0 })
  salary?: number;

  @Prop({ required: true, default: Date.now })
  joiningDate: Date;

  @Prop({
    required: true,
    enum: Object.values(EmployeeStatus),
    default: EmployeeStatus.ACTIVE,
  })
  status: EmployeeStatus;

  // Invitation tracking
  @Prop({ required: false })
  invitationTokenHash?: string;

  @Prop({ required: false })
  invitationExpiresAt?: Date;

  @Prop({ required: false })
  invitationAcceptedAt?: Date;

  @Prop({ required: false })
  lastSeen?: Date;

  @Prop({ required: false, default: false })
  isOnline: boolean;

  @Prop({ required: false })
  userLocationRegion?: string;

  // Custom tax percentage deduction override (e.g. 5 for 5%)
  @Prop({ required: false })
  taxPercentage?: number;

  // Dynamic custom onboarding fields collected during invite acceptance
  @Prop({ type: Object, default: () => ({}) })
  customFields?: Record<string, any>;

  // Uploaded onboarding documents
  @Prop({
    type: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        fileType: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  documents?: Array<{
    name: string;
    url: string;
    fileType: string;
    uploadedAt: Date;
  }>;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

EmployeeSchema.index({ companyId: 1, email: 1 }, { unique: true });
EmployeeSchema.index({ companyId: 1, departmentId: 1 });
EmployeeSchema.index({ companyId: 1, status: 1 });
