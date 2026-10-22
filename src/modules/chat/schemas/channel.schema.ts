import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChannelDocument = Channel & Document;

@Schema({ collection: 'channels', timestamps: true })
export class Channel {
  @Prop({ required: true, unique: true, index: true })
  channelId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, trim: true, default: '' })
  description?: string;

  @Prop({ required: true, default: false })
  isPrivate: boolean;

  @Prop({ required: true, index: true })
  createdBy: string;

  @Prop({ type: [String], default: [] })
  memberIds: string[];

  @Prop({ type: [String], default: [] })
  pinnedByUserIds: string[];

  createdAt: Date;
  updatedAt: Date;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);

ChannelSchema.index({ companyId: 1, name: 1 });
