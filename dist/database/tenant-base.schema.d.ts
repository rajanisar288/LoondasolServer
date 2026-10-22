import { Schema as MongooseSchema } from 'mongoose';
export declare abstract class TenantBaseEntity {
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare function applyTenantIndexes(schema: MongooseSchema): void;
