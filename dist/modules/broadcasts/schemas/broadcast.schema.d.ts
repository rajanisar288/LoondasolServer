import { Document } from 'mongoose';
export type BroadcastTemplateDocument = BroadcastTemplate & Document;
export type BroadcastLogDocument = BroadcastLog & Document;
export declare class BroadcastTemplate {
    templateId: string;
    companyId: string;
    name: string;
    subject: string;
    body: string;
    category?: string;
}
export declare const BroadcastTemplateSchema: import("mongoose").Schema<BroadcastTemplate, import("mongoose").Model<BroadcastTemplate, any, any, any, Document<unknown, any, BroadcastTemplate, any, {}> & BroadcastTemplate & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, BroadcastTemplate, Document<unknown, {}, import("mongoose").FlatRecord<BroadcastTemplate>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<BroadcastTemplate> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare class BroadcastLog {
    broadcastId: string;
    companyId: string;
    subject: string;
    body: string;
    targetType: 'all' | 'department' | 'selected';
    targetDepartmentName?: string;
    recipientCount: number;
    sentBy: string;
    sentAt: Date;
}
export declare const BroadcastLogSchema: import("mongoose").Schema<BroadcastLog, import("mongoose").Model<BroadcastLog, any, any, any, Document<unknown, any, BroadcastLog, any, {}> & BroadcastLog & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, BroadcastLog, Document<unknown, {}, import("mongoose").FlatRecord<BroadcastLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<BroadcastLog> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
