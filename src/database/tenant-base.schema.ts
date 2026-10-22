import { Prop } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

// Base properties inherited by every tenant-isolated document
export abstract class TenantBaseEntity {
  @Prop({ required: true, index: true, type: String })
  companyId: string;

  @Prop({ required: false, default: Date.now })
  createdAt: Date;

  @Prop({ required: false, default: Date.now })
  updatedAt: Date;
}

// Utility to apply compound tenant indexes to any Mongoose schema
export function applyTenantIndexes(schema: MongooseSchema): void {
  schema.index({ companyId: 1, createdAt: -1 });
  schema.index({ companyId: 1, updatedAt: -1 });
}
