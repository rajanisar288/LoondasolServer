import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RegionCode, REGIONS } from '../common/constants/regions.constant';

export type MasterIdentityDocument = MasterIdentity & Document;

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

// Global identity document located in the Master Database for regional routing
@Schema({ collection: 'master_identities', timestamps: true })
export class MasterIdentity {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  normalizedEmail: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, type: String, index: true })
  region: RegionCode;

  @Prop({ required: false, default: 'primary' })
  databaseCluster: string;

  @Prop({
    required: true,
    enum: Object.values(AccountStatus),
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  @Prop({ required: false, default: false })
  isEmailVerified: boolean;

  @Prop({ required: false })
  verificationCode?: string;

  @Prop({ required: false })
  verificationCodeExpiresAt?: Date;

  @Prop({ required: false })
  passwordResetOtpHash?: string;

  @Prop({ required: false })
  passwordResetOtpExpiresAt?: Date;

  @Prop({ required: false })
  lastLoginAt?: Date;

  @Prop({ required: false })
  lastSeen?: Date;

  @Prop({ required: false, default: false })
  isOnline: boolean;

  @Prop({ required: false })
  userLocationRegion?: string;
}

export const MasterIdentitySchema =
  SchemaFactory.createForClass(MasterIdentity);

// Compound index for fast regional lookups
MasterIdentitySchema.index({ email: 1, region: 1 });
MasterIdentitySchema.index({ companyId: 1, status: 1 });
