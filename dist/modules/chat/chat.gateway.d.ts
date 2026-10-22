import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Message } from './schemas/message.schema';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    private readonly regionalDbManager;
    server: Server;
    private readonly logger;
    private readonly onlineUsersByCompany;
    constructor(jwtService: JwtService, configService: ConfigService, regionalDbManager: RegionalDatabaseManager);
    handleConnection(client: Socket): Promise<void>;
    private markUserOffline;
    handleDisconnect(client: Socket): Promise<void>;
    handleGetOnlineUsers(client: Socket): void;
    handleUserLogout(client: Socket): Promise<void>;
    notifyChannelCreated(companyId: string, channel: any): void;
    handleMessage(client: Socket, data: {
        content?: string;
        channelId?: string;
        recipientId?: string;
        type?: string;
        audioDurationSeconds?: number;
        replyTo?: {
            messageId: string;
            senderId: string;
            senderName: string;
            content?: string;
            attachmentName?: string;
        };
        mentions?: string[];
        attachments?: {
            url: string;
            fileName: string;
            fileType: string;
            fileSize?: number;
        }[];
    }): Promise<Message | null>;
    handleEditMessage(client: Socket, data: {
        messageId: string;
        content: string;
        channelId?: string;
        recipientId?: string;
    }): Promise<Message | null>;
    handleDeleteMessage(client: Socket, data: {
        messageId: string;
        channelId?: string;
        recipientId?: string;
    }): Promise<{
        success: boolean;
        messageId: string;
    } | null>;
    handlePinMessage(client: Socket, data: {
        messageId: string;
        channelId?: string;
        recipientId?: string;
    }): Promise<Message | null>;
    handleReactMessage(client: Socket, data: {
        messageId: string;
        emoji: string;
        channelId?: string;
        recipientId?: string;
    }): Promise<Message | null>;
    handleTyping(client: Socket, data: {
        channelId?: string;
        recipientId?: string;
        isTyping: boolean;
    }): void;
    handleCallInitiate(client: Socket, data: {
        receiverId: string;
        callType: 'video' | 'audio';
        offer?: any;
    }): void;
    handleCallAccept(client: Socket, data: {
        callId: string;
        callerId: string;
        answer?: any;
    }): void;
    handleCallReject(client: Socket, data: {
        callId: string;
        callerId: string;
        reason?: string;
    }): void;
    handleCallEnd(client: Socket, data: {
        callId: string;
        peerId: string;
    }): void;
    handleIceCandidate(client: Socket, data: {
        peerId: string;
        candidate: any;
    }): void;
    handleMeetingJoin(client: Socket, data: {
        roomId: string;
    }): Promise<void>;
    handleMeetingLeave(client: Socket, data: {
        roomId: string;
    }): Promise<void>;
    handleMeetingSignal(client: Socket, data: {
        roomId: string;
        targetUserId: string;
        signal: any;
    }): void;
    notifyUser(userId: string, notification: any): void;
}
