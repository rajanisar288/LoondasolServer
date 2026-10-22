import { Document } from 'mongoose';
export type MarketingPostDocument = MarketingPost & Document;
export declare class MarketingPost {
    postId: string;
    companyId: string;
    platform: string;
    content: string;
    hashtags: string[];
    mediaUrl?: string;
    status: string;
    scheduledFor?: Date;
    createdBy: string;
}
export declare const MarketingPostSchema: import("mongoose").Schema<MarketingPost, import("mongoose").Model<MarketingPost, any, any, any, Document<unknown, any, MarketingPost, any, {}> & MarketingPost & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MarketingPost, Document<unknown, {}, import("mongoose").FlatRecord<MarketingPost>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<MarketingPost> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
