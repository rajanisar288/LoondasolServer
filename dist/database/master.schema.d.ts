import { Document } from 'mongoose';
import { RegionCode } from '../common/constants/regions.constant';
export type MasterIdentityDocument = MasterIdentity & Document;
export declare enum AccountStatus {
    ACTIVE = "ACTIVE",
    PENDING = "PENDING",
    SUSPENDED = "SUSPENDED",
    DEACTIVATED = "DEACTIVATED"
}
export declare class MasterIdentity {
    userId: string;
    email: string;
    normalizedEmail: string;
    companyId: string;
    region: RegionCode;
    databaseCluster: string;
    status: AccountStatus;
    isEmailVerified: boolean;
    verificationCode?: string;
    verificationCodeExpiresAt?: Date;
    passwordResetOtpHash?: string;
    passwordResetOtpExpiresAt?: Date;
    lastLoginAt?: Date;
    lastSeen?: Date;
    isOnline: boolean;
    userLocationRegion?: string;
}
export declare const MasterIdentitySchema: import("mongoose").Schema<MasterIdentity, import("mongoose").Model<MasterIdentity, any, any, any, Document<unknown, any, MasterIdentity, any, {}> & MasterIdentity & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MasterIdentity, Document<unknown, {}, import("mongoose").FlatRecord<MasterIdentity>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MasterIdentity> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
