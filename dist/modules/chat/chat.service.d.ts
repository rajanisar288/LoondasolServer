import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Message } from './schemas/message.schema';
import { Channel } from './schemas/channel.schema';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { ChatGateway } from './chat.gateway';
export interface CreateChannelDto {
    name: string;
    description?: string;
    isPrivate?: boolean;
    memberIds?: string[];
}
export interface ConversationSummary {
    channelId: string;
    peerId: string;
    lastMessage?: {
        content: string;
        createdAt: Date;
        senderId: string;
    };
}
export declare class ChatService {
    private readonly regionalDbManager;
    private readonly chatGateway;
    constructor(regionalDbManager: RegionalDatabaseManager, chatGateway: ChatGateway);
    getChannels(tenant: TenantContext, user: JwtPayload): Promise<Channel[]>;
    createChannel(tenant: TenantContext, user: JwtPayload, dto: CreateChannelDto): Promise<Channel>;
    addMembers(tenant: TenantContext, channelId: string, memberIds: string[]): Promise<Channel>;
    getMessages(tenant: TenantContext, channelId?: string, limit?: number): Promise<Message[]>;
    getDirectMessages(tenant: TenantContext, userId: string, peerId: string, limit?: number): Promise<Message[]>;
    getDirectConversationsSummary(tenant: TenantContext, user: JwtPayload): Promise<ConversationSummary[]>;
    togglePinChannel(tenant: TenantContext, user: JwtPayload, channelId: string): Promise<{
        pinned: boolean;
        channelId: string;
    }>;
    getPinnedMessages(tenant: TenantContext, channelId: string): Promise<Message[]>;
    togglePinMessage(tenant: TenantContext, user: JwtPayload, messageId: string): Promise<Message>;
    getUnreadCounts(tenant: TenantContext, user: JwtPayload): Promise<{
        channels: Record<string, number>;
        direct: Record<string, number>;
    }>;
    markChannelRead(tenant: TenantContext, user: JwtPayload, channelNameOrId: string): Promise<{
        success: boolean;
    }>;
    markDirectRead(tenant: TenantContext, user: JwtPayload, peerId: string): Promise<{
        success: boolean;
    }>;
}
