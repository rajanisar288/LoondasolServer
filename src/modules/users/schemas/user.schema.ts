import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AccountStatus } from '../../../database/master.schema';
import {
  RegionCode,
  REGIONS,
} from '../../../common/constants/regions.constant';

export type UserDocument = User & Document;

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

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, type: String, index: true })
  region: RegionCode;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, lowercase: true, trim: true })
  normalizedEmail: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ required: false })
  avatarUrl?: string;

  @Prop({ required: false })
  phone?: string;

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

  @Prop({ required: true, index: true })
  roleId: string;

  @Prop({ required: true, default: 'EMPLOYEE' })
  roleName: string;

  @Prop({ required: true, type: [String], default: [] })
  permissions: string[];

  @Prop({ required: true, default: false })
  isOwner: boolean;

  @Prop({ required: false, default: false })
  isSuperAdmin?: boolean;

  @Prop({
    required: true,
    enum: Object.values(AccountStatus),
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  @Prop({ required: false, default: false })
  isEmailVerified: boolean;

  // Hashed refresh token for rotation and replay attack mitigation
  @Prop({ required: false })
  hashedRefreshToken?: string;

  // Token version counter for instant session revocation
  @Prop({ required: true, default: 1 })
  tokenVersion: number;

  @Prop({ required: false })
  lastLoginAt?: Date;

  @Prop({ required: false })
  lastSeen?: Date;

  @Prop({ required: false, default: false })
  isOnline: boolean;

  @Prop({ required: false })
  userLocationRegion?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ companyId: 1, email: 1 }, { unique: true });
UserSchema.index({ companyId: 1, status: 1 });
UserSchema.index({ companyId: 1, roleId: 1 });
