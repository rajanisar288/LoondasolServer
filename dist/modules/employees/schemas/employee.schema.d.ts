import { Document } from 'mongoose';
export type EmployeeDocument = Employee & Document;
export declare enum EmploymentType {
    FULL_TIME = "FULL_TIME",
    PART_TIME = "PART_TIME",
    CONTRACT = "CONTRACT",
    INTERN = "INTERN"
}
export declare enum EmployeeStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    ON_LEAVE = "ON_LEAVE",
    INVITED = "INVITED",
    RESIGNED = "RESIGNED",
    TERMINATED = "TERMINATED"
}
export declare class BankDetails {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    branchCode?: string;
}
export declare class Employee {
    employeeId: string;
    companyId: string;
    userId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    dateOfBirth?: string;
    cnic?: string;
    address?: string;
    bankDetails?: BankDetails;
    branchId?: string;
    branchName?: string;
    departmentId?: string;
    departmentName?: string;
    designation: string;
    employmentType: EmploymentType;
    permissions: string[];
    roleName?: string;
    roleId?: string;
    salary?: number;
    joiningDate: Date;
    status: EmployeeStatus;
    invitationTokenHash?: string;
    invitationExpiresAt?: Date;
    invitationAcceptedAt?: Date;
    lastSeen?: Date;
    isOnline: boolean;
    userLocationRegion?: string;
    taxPercentage?: number;
    customFields?: Record<string, any>;
    documents?: Array<{
        name: string;
        url: string;
        fileType: string;
        uploadedAt: Date;
    }>;
}
export declare const EmployeeSchema: import("mongoose").Schema<Employee, import("mongoose").Model<Employee, any, any, any, Document<unknown, any, Employee, any, {}> & Employee & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Employee, Document<unknown, {}, import("mongoose").FlatRecord<Employee>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Employee> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
