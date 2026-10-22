import { Document } from 'mongoose';
export type MeetingDocument = Meeting & Document;
export declare enum MeetingType {
    VIDEO = "VIDEO",
    SYNC = "SYNC",
    STANDUP = "STANDUP",
    ONE_ON_ONE = "ONE_ON_ONE"
}
export declare enum MeetingStatus {
    SCHEDULED = "SCHEDULED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare class Meeting {
    meetingId: string;
    companyId: string;
    title: string;
    description?: string;
    hostId: string;
    hostName: string;
    startTime: Date;
    endTime: Date;
    meetingType: MeetingType;
    attendeeIds: string[];
    departmentId?: string;
    roomId: string;
    meetingCode?: string;
    status: MeetingStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare const MeetingSchema: import("mongoose").Schema<Meeting, import("mongoose").Model<Meeting, any, any, any, Document<unknown, any, Meeting, any, {}> & Meeting & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Meeting, Document<unknown, {}, import("mongoose").FlatRecord<Meeting>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Meeting> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
