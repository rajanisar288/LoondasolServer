import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({ collection: 'departments', timestamps: true })
export class Department {
  @Prop({ required: true, unique: true, index: true })
  departmentId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false })
  managerId?: string;

  @Prop({ required: false })
  managerName?: string;

  @Prop({ required: false, index: true })
  branchId?: string;

  @Prop({ required: false, trim: true })
  branchName?: string;

  @Prop({ required: true, default: true })
  isCompanyWide: boolean;

  @Prop({ required: false, default: 0 })
  employeeCount: number;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

DepartmentSchema.index({ companyId: 1, branchId: 1, name: 1 }, { unique: true });
