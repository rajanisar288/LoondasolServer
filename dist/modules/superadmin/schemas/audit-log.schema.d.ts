import { Document } from 'mongoose';
export type AuditLogDocument = AuditLog & Document;
export declare class AuditLog {
    logId: string;
    action: string;
    userId?: string;
    userEmail?: string;
    companyId?: string;
    companyName?: string;
    region?: string;
    ipAddress?: string;
    details?: Record<string, any>;
}
export declare const AuditLogSchema: import("mongoose").Schema<AuditLog, import("mongoose").Model<AuditLog, any, any, any, Document<unknown, any, AuditLog, any, {}> & AuditLog & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AuditLog, Document<unknown, {}, import("mongoose").FlatRecord<AuditLog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<AuditLog> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
