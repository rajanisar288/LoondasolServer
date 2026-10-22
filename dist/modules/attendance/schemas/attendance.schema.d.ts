import { Document } from 'mongoose';
export type AttendanceDocument = Attendance & Document;
export declare enum AttendanceStatus {
    PRESENT = "PRESENT",
    LATE = "LATE",
    HALF_DAY = "HALF_DAY",
    ABSENT = "ABSENT"
}
export declare class Attendance {
    companyId: string;
    employeeId: string;
    userId: string;
    employeeName: string;
    date: string;
    clockInTime: Date;
    clockOutTime?: Date;
    totalHours: number;
    status: AttendanceStatus;
    isLate: boolean;
    minutesLate: number;
    scheduledStartTime?: string;
    ipAddress?: string;
    notes?: string;
}
export declare const AttendanceSchema: import("mongoose").Schema<Attendance, import("mongoose").Model<Attendance, any, any, any, Document<unknown, any, Attendance, any, {}> & Attendance & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Attendance, Document<unknown, {}, import("mongoose").FlatRecord<Attendance>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Attendance> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
