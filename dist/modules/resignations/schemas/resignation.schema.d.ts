import { Document } from 'mongoose';
export type ResignationDocument = Resignation & Document;
export declare enum ResignationStatus {
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    COMPLETED = "COMPLETED"
}
export declare class ExitClearanceChecklist {
    itAssetsReturned: boolean;
    accessRevoked: boolean;
    idBadgeReturned: boolean;
    financeDuesCleared: boolean;
    knowledgeTransferDone: boolean;
}
export declare class Resignation {
    resignationId: string;
    companyId: string;
    employeeId: string;
    userId: string;
    employeeName: string;
    employeeEmail: string;
    departmentName?: string;
    submissionDate: Date;
    intendedLastWorkingDay: Date;
    reason: string;
    status: ResignationStatus;
    clearanceChecklist: ExitClearanceChecklist;
    reviewedBy?: string;
    reviewedAt?: Date;
    exitInterviewNotes?: string;
}
export declare const ResignationSchema: import("mongoose").Schema<Resignation, import("mongoose").Model<Resignation, any, any, any, Document<unknown, any, Resignation, any, {}> & Resignation & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Resignation, Document<unknown, {}, import("mongoose").FlatRecord<Resignation>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Resignation> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
