import { ChatService, CreateChannelDto } from './chat.service';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { Message } from './schemas/message.schema';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getChannels(tenant: TenantContext, user: JwtPayload): Promise<import("./schemas/channel.schema").Channel[]>;
    createChannel(tenant: TenantContext, user: JwtPayload, dto: CreateChannelDto): Promise<import("./schemas/channel.schema").Channel>;
    addMembers(tenant: TenantContext, channelId: string, memberIds: string[]): Promise<import("./schemas/channel.schema").Channel>;
    getMessages(tenant: TenantContext, channelId?: string, limit?: number): Promise<Message[]>;
    getDirectMessages(tenant: TenantContext, user: JwtPayload, recipientId: string, limit?: number): Promise<Message[]>;
    getConversations(tenant: TenantContext, user: JwtPayload): Promise<import("./chat.service").ConversationSummary[]>;
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
    markChannelRead(tenant: TenantContext, user: JwtPayload, channelName: string): Promise<{
        success: boolean;
    }>;
    markDirectRead(tenant: TenantContext, user: JwtPayload, peerId: string): Promise<{
        success: boolean;
    }>;
}
