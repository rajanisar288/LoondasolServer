import { Document } from 'mongoose';
export type BranchDocument = Branch & Document;
export declare class BranchWorkingHours {
    enabled: boolean;
    startTime: string;
    endTime: string;
    workingDays: number[];
    enforceLoginRestriction: boolean;
}
export declare class Branch {
    branchId: string;
    companyId: string;
    name: string;
    address: string;
    phone?: string;
    timezone: string;
    currency?: string;
    workingHours: BranchWorkingHours;
    employeeCount?: number;
}
export declare const BranchSchema: import("mongoose").Schema<Branch, import("mongoose").Model<Branch, any, any, any, Document<unknown, any, Branch, any, {}> & Branch & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Branch, Document<unknown, {}, import("mongoose").FlatRecord<Branch>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Branch> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
