import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ collection: 'roles', timestamps: true })
export class Role {
  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, default: false })
  isSystem: boolean;

  @Prop({ required: true, type: [String], default: [] })
  permissions: string[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ companyId: 1, name: 1 }, { unique: true });
