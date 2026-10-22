import { Document } from 'mongoose';
import { AccountStatus } from '../../../database/master.schema';
import { RegionCode } from '../../../common/constants/regions.constant';
export type UserDocument = User & Document;
export declare class BankDetails {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    branchCode?: string;
}
export declare class User {
    userId: string;
    companyId: string;
    region: RegionCode;
    email: string;
    normalizedEmail: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatarUrl?: string;
    phone?: string;
    dateOfBirth?: string;
    cnic?: string;
    address?: string;
    bankDetails?: BankDetails;
    branchId?: string;
    branchName?: string;
    roleId: string;
    roleName: string;
    permissions: string[];
    isOwner: boolean;
    isSuperAdmin?: boolean;
    status: AccountStatus;
    isEmailVerified: boolean;
    hashedRefreshToken?: string;
    tokenVersion: number;
    lastLoginAt?: Date;
    lastSeen?: Date;
    isOnline: boolean;
    userLocationRegion?: string;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
