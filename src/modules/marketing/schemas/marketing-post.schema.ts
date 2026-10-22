import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketingPostDocument = MarketingPost & Document;

@Schema({ collection: 'marketing_posts', timestamps: true })
export class MarketingPost {
  @Prop({ required: true, unique: true, index: true })
  postId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true })
  platform: string; // LINKEDIN, TWITTER, FACEBOOK, INSTAGRAM

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  hashtags: string[];

  @Prop({ required: false })
  mediaUrl?: string;

  @Prop({ required: true, default: 'DRAFT', enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED'] })
  status: string;

  @Prop({ required: false })
  scheduledFor?: Date;

  @Prop({ required: true })
  createdBy: string;
}

export const MarketingPostSchema = SchemaFactory.createForClass(MarketingPost);

MarketingPostSchema.index({ companyId: 1, createdAt: -1 });
