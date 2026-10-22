import { Document } from 'mongoose';
export type MessageDocument = Message & Document;
export declare class Message {
    messageId: string;
    companyId: string;
    channelId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content?: string;
    type?: string;
    audioDurationSeconds?: number;
    recipientId?: string;
    isDirect?: boolean;
    isEdited?: boolean;
    isDeleted?: boolean;
    isPinned?: boolean;
    pinnedBy?: string;
    pinnedAt?: Date;
    attachments?: {
        url: string;
        fileName: string;
        fileType: string;
        fileSize?: number;
    }[];
    replyTo?: {
        messageId: string;
        senderId: string;
        senderName: string;
        content?: string;
        attachmentName?: string;
    };
    reactions?: {
        emoji: string;
        userIds: string[];
    }[];
    mentions?: string[];
    readBy?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const MessageSchema: import("mongoose").Schema<Message, import("mongoose").Model<Message, any, any, any, Document<unknown, any, Message, any, {}> & Message & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, Document<unknown, {}, import("mongoose").FlatRecord<Message>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Message> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
