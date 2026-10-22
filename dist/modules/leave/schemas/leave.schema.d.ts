import { Document } from 'mongoose';
export type LeaveDocument = Leave & Document;
export declare enum LeaveType {
    ANNUAL = "ANNUAL",
    SICK = "SICK",
    CASUAL = "CASUAL",
    MATERNITY = "MATERNITY",
    PATERNITY = "PATERNITY",
    UNPAID = "UNPAID"
}
export declare enum LeaveStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}
export declare class Leave {
    leaveId: string;
    companyId: string;
    employeeId: string;
    userId: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
    status: LeaveStatus;
    reviewedBy?: string;
    reviewerNotes?: string;
    reviewedAt?: Date;
}
export declare const LeaveSchema: import("mongoose").Schema<Leave, import("mongoose").Model<Leave, any, any, any, Document<unknown, any, Leave, any, {}> & Leave & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Leave, Document<unknown, {}, import("mongoose").FlatRecord<Leave>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Leave> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
