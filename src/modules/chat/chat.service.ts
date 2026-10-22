import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Message, MessageSchema } from './schemas/message.schema';
import { Channel, ChannelSchema } from './schemas/channel.schema';
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

@Injectable()
export class ChatService {
  constructor(
    private readonly regionalDbManager: RegionalDatabaseManager,
    private readonly chatGateway: ChatGateway,
  ) {}

  // Fetch or auto-seed available channels for workspace
  async getChannels(
    tenant: TenantContext,
    user: JwtPayload,
  ): Promise<Channel[]> {
    const channelModel = await this.regionalDbManager.getModel<Channel>(
      tenant.region,
      Channel.name,
      ChannelSchema,
    );

    let channels = await channelModel
      .find({
        companyId: tenant.companyId,
        $or: [
          { isPrivate: false },
          { memberIds: user.userId },
          { createdBy: user.userId },
        ],
      })
      .sort({ createdAt: 1 })
      .lean();

    // Auto-seed standard channels on first workspace access
    if (channels.length === 0) {
      const defaults = [
        {
          name: 'general',
          description: 'Company-wide discussion and general updates',
        },
        {
          name: 'announcements',
          description: 'Official corporate announcements',
        },
        {
          name: 'engineering',
          description: 'Technical architecture, code reviews, deployments',
        },
        {
          name: 'random',
          description: 'Watercooler talk, fun, and casual bonding',
        },
      ];

      for (const d of defaults) {
        await channelModel.create({
          channelId: `chan_${randomUUID()}`,
          companyId: tenant.companyId,
          name: d.name,
          description: d.description,
          isPrivate: false,
          createdBy: user.userId,
          memberIds: [],
        });
      }

      channels = await channelModel
        .find({ companyId: tenant.companyId })
        .sort({ createdAt: 1 })
        .lean();
    }

    return channels;
  }

  // Creates a new public or private team channel
  async createChannel(
    tenant: TenantContext,
    user: JwtPayload,
    dto: CreateChannelDto,
  ): Promise<Channel> {
    const channelModel = await this.regionalDbManager.getModel<Channel>(
      tenant.region,
      Channel.name,
      ChannelSchema,
    );

    const cleanName = dto.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, '-');
    const existing = await channelModel.findOne({
      companyId: tenant.companyId,
      name: cleanName,
    });

    if (existing) {
      throw new ConflictException(`Channel #${cleanName} already exists`);
    }

    const channelId = `chan_${randomUUID()}`;
    const members = dto.memberIds || [];
    if (!members.includes(user.userId)) {
      members.push(user.userId);
    }

    const channel = await channelModel.create({
      channelId,
      companyId: tenant.companyId,
      name: cleanName,
      description: dto.description ? dto.description.trim() : '',
      isPrivate: dto.isPrivate ?? false,
      createdBy: user.userId,
      memberIds: members,
    });

    this.chatGateway.notifyChannelCreated(tenant.companyId, channel);
    return channel;
  }

  // Adds members to a private or restricted channel
  async addMembers(
    tenant: TenantContext,
    channelId: string,
    memberIds: string[],
  ): Promise<Channel> {
    const channelModel = await this.regionalDbManager.getModel<Channel>(
      tenant.region,
      Channel.name,
      ChannelSchema,
    );

    const updated = await channelModel.findOneAndUpdate(
      { companyId: tenant.companyId, channelId },
      { $addToSet: { memberIds: { $each: memberIds } } },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Channel not found');
    }

    return updated;
  }

  // Fetch recent messages for channel
  async getMessages(
    tenant: TenantContext,
    channelId = 'general',
    limit = 50,
  ): Promise<Message[]> {
    const model = await this.regionalDbManager.getModel<Message>(
      tenant.region,
      Message.name,
      MessageSchema,
    );

    return model
      .find({ companyId: tenant.companyId, channelId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
  }

  // Fetch 1v1 direct messages between authenticated user and peer
  async getDirectMessages(
    tenant: TenantContext,
    userId: string,
    peerId: string,
    limit = 50,
  ): Promise<Message[]> {
    const model = await this.regionalDbManager.getModel<Message>(
      tenant.region,
      Message.name,
      MessageSchema,
    );

    const dmChannelId = `dm_${[userId, peerId].sort().join('_')}`;

    return model
      .find({ companyId: tenant.companyId, channelId: dmChannelId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
  }

  // Summarizes recent direct message conversations with latest message text and timestamp
  async getDirectConversationsSummary(
    tenant: TenantContext,
    user: JwtPayload,
  ): Promise<ConversationSummary[]> {
    const model = await this.regionalDbManager.getModel<Message>(
      tenant.region,
      Message.name,
      MessageSchema,
    );

    // Find all direct messages involving current user
    const messages = await model
      .find({
        companyId: tenant.companyId,
        isDirect: true,
        $or: [{ senderId: user.userId }, { recipientId: user.userId }],
      })
      .sort({ createdAt: -1 })
      .lean();

    const seenChannels = new Set<string>();
    const summaries: ConversationSummary[] = [];

    for (const msg of messages) {
      if (!seenChannels.has(msg.channelId)) {
        seenChannels.add(msg.channelId);
        const peerId =
          msg.senderId === user.userId ? msg.recipientId! : msg.senderId;
        summaries.push({
          channelId: msg.channelId,
          peerId,
          lastMessage: {
            content:
              msg.content ||
              (msg.attachments && msg.attachments.length > 0
                ? `[File] ${msg.attachments[0].fileName}`
                : ''),
            createdAt: (msg as any).createdAt,
            senderId: msg.senderId,
          },
        });
      }
    }

    return summaries;
  }

  async togglePinChannel(
    tenant: TenantContext,
    user: JwtPayload,
    channelId: string,
  ): Promise<{ pinned: boolean; channelId: string }> {
    const channelModel = await this.regionalDbManager.getModel<Channel>(
      tenant.region,
      Channel.name,
      ChannelSchema,
    );

    const channel = await channelModel.findOne({
      companyId: tenant.companyId,
      channelId,
    });
    if (!channel) throw new NotFoundException('Channel not found');

    const pinnedList = channel.pinnedByUserIds || [];
    const isPinned = pinnedList.includes(user.userId);

    if (isPinned) {
      channel.pinnedByUserIds = pinnedList.filter((id) => id !== user.userId);
    } else {
      channel.pinnedByUserIds = [...pinnedList, user.userId];
    }

    await channel.save();
    return { pinned: !isPinned, channelId };
  }

  async getPinnedMessages(
    tenant: TenantContext,
    channelId: string,
  ): Promise<Message[]> {
    const model = await this.regionalDbManager.getModel<Message>(
      tenant.region,
      Message.name,
      MessageSchema,
    );

    return model
      .find({
        companyId: tenant.companyId,
        channelId,
        isPinned: true,
        isDeleted: { $ne: true },
      })
      .sort({ pinnedAt: -1 })
      .lean();
  }

  async togglePinMessage(
    tenant: TenantContext,
    user: JwtPayload,
    messageId: string,
  ): Promise<Message> {
    const model = await this.regionalDbManager.getModel<Message>(
      tenant.region,
      Message.name,
      MessageSchema,
    );

    const msg = await model.findOne({
      companyId: tenant.companyId,
      messageId,
    });
    if (!msg) throw new NotFoundException('Message not found');

    msg.isPinned = !msg.isPinned;
    msg.pinnedBy = msg.isPinned ? user.userId : undefined;
    msg.pinnedAt = msg.isPinned ? new Date() : undefined;

    await msg.save();
    return msg.toObject();
  }

  // Retrieves unread counts for all channels and direct message peers
  async getUnreadCounts(
    tenant: TenantContext,
    user: JwtPayload,
  ): Promise<{ channels: Record<string, number>; direct: Record<string, number> }> {
    const messageModel = await this.regionalDbManager.getModel<Message>(
      tenant.region,
      Message.name,
      MessageSchema,
    );

    // 1. Direct messages unread: recipient is current user, readBy does not include user
    const directUnread = await messageModel.aggregate([
      {
        $match: {
          companyId: tenant.companyId,
          recipientId: user.userId,
          readBy: { $ne: user.userId },
        },
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 },
        },
      },
    ]);

    const directMap: Record<string, number> = {};
    for (const d of directUnread) {
      if (d._id) directMap[d._id] = d.count;
    }

    // 2. Channel messages unread: channel messages where senderId !== user.userId and readBy does not include user
    const channelUnread = await messageModel.aggregate([
      {
        $match: {
          companyId: tenant.companyId,
          isDirect: { $ne: true },
          senderId: { $ne: user.userId },
          readBy: { $ne: user.userId },
        },
      },
      {
        $group: {
          _id: '$channelId',
          count: { $sum: 1 },
        },
      },
    ]);

    const channelMap: Record<string, number> = {};
    for (const c of channelUnread) {
      if (c._id) channelMap[c._id] = c.count;
    }

    return { channels: channelMap, direct: directMap };
  }

  // Marks all messages in a specific channel as read by the current user
  async markChannelRead(
    tenant: TenantContext,
    user: JwtPayload,
    channelNameOrId: string,
  ): Promise<{ success: boolean }> {
    const messageModel = await this.regionalDbManager.getModel<Message>(
      tenant.region,
      Message.name,
      MessageSchema,
    );

    await messageModel.updateMany(
      {
        companyId: tenant.companyId,
        channelId: channelNameOrId,
        readBy: { $ne: user.userId },
      },
      {
        $addToSet: { readBy: user.userId },
      },
    );

    return { success: true };
  }

  // Marks all direct messages from a specific peer as read
  async markDirectRead(
    tenant: TenantContext,
    user: JwtPayload,
    peerId: string,
  ): Promise<{ success: boolean }> {
    const messageModel = await this.regionalDbManager.getModel<Message>(
      tenant.region,
      Message.name,
      MessageSchema,
    );

    await messageModel.updateMany(
      {
        companyId: tenant.companyId,
        senderId: peerId,
        recipientId: user.userId,
        readBy: { $ne: user.userId },
      },
      {
        $addToSet: { readBy: user.userId },
      },
    );

    return { success: true };
  }
}

