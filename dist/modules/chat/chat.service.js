"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const message_schema_1 = require("./schemas/message.schema");
const channel_schema_1 = require("./schemas/channel.schema");
const chat_gateway_1 = require("./chat.gateway");
let ChatService = class ChatService {
    constructor(regionalDbManager, chatGateway) {
        this.regionalDbManager = regionalDbManager;
        this.chatGateway = chatGateway;
    }
    async getChannels(tenant, user) {
        const channelModel = await this.regionalDbManager.getModel(tenant.region, channel_schema_1.Channel.name, channel_schema_1.ChannelSchema);
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
                    channelId: `chan_${(0, crypto_1.randomUUID)()}`,
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
    async createChannel(tenant, user, dto) {
        const channelModel = await this.regionalDbManager.getModel(tenant.region, channel_schema_1.Channel.name, channel_schema_1.ChannelSchema);
        const cleanName = dto.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-_]/g, '-');
        const existing = await channelModel.findOne({
            companyId: tenant.companyId,
            name: cleanName,
        });
        if (existing) {
            throw new common_1.ConflictException(`Channel #${cleanName} already exists`);
        }
        const channelId = `chan_${(0, crypto_1.randomUUID)()}`;
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
    async addMembers(tenant, channelId, memberIds) {
        const channelModel = await this.regionalDbManager.getModel(tenant.region, channel_schema_1.Channel.name, channel_schema_1.ChannelSchema);
        const updated = await channelModel.findOneAndUpdate({ companyId: tenant.companyId, channelId }, { $addToSet: { memberIds: { $each: memberIds } } }, { new: true });
        if (!updated) {
            throw new common_1.NotFoundException('Channel not found');
        }
        return updated;
    }
    async getMessages(tenant, channelId = 'general', limit = 50) {
        const model = await this.regionalDbManager.getModel(tenant.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        return model
            .find({ companyId: tenant.companyId, channelId })
            .sort({ createdAt: 1 })
            .limit(limit)
            .lean();
    }
    async getDirectMessages(tenant, userId, peerId, limit = 50) {
        const model = await this.regionalDbManager.getModel(tenant.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        const dmChannelId = `dm_${[userId, peerId].sort().join('_')}`;
        return model
            .find({ companyId: tenant.companyId, channelId: dmChannelId })
            .sort({ createdAt: 1 })
            .limit(limit)
            .lean();
    }
    async getDirectConversationsSummary(tenant, user) {
        const model = await this.regionalDbManager.getModel(tenant.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        const messages = await model
            .find({
            companyId: tenant.companyId,
            isDirect: true,
            $or: [{ senderId: user.userId }, { recipientId: user.userId }],
        })
            .sort({ createdAt: -1 })
            .lean();
        const seenChannels = new Set();
        const summaries = [];
        for (const msg of messages) {
            if (!seenChannels.has(msg.channelId)) {
                seenChannels.add(msg.channelId);
                const peerId = msg.senderId === user.userId ? msg.recipientId : msg.senderId;
                summaries.push({
                    channelId: msg.channelId,
                    peerId,
                    lastMessage: {
                        content: msg.content ||
                            (msg.attachments && msg.attachments.length > 0
                                ? `[File] ${msg.attachments[0].fileName}`
                                : ''),
                        createdAt: msg.createdAt,
                        senderId: msg.senderId,
                    },
                });
            }
        }
        return summaries;
    }
    async togglePinChannel(tenant, user, channelId) {
        const channelModel = await this.regionalDbManager.getModel(tenant.region, channel_schema_1.Channel.name, channel_schema_1.ChannelSchema);
        const channel = await channelModel.findOne({
            companyId: tenant.companyId,
            channelId,
        });
        if (!channel)
            throw new common_1.NotFoundException('Channel not found');
        const pinnedList = channel.pinnedByUserIds || [];
        const isPinned = pinnedList.includes(user.userId);
        if (isPinned) {
            channel.pinnedByUserIds = pinnedList.filter((id) => id !== user.userId);
        }
        else {
            channel.pinnedByUserIds = [...pinnedList, user.userId];
        }
        await channel.save();
        return { pinned: !isPinned, channelId };
    }
    async getPinnedMessages(tenant, channelId) {
        const model = await this.regionalDbManager.getModel(tenant.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
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
    async togglePinMessage(tenant, user, messageId) {
        const model = await this.regionalDbManager.getModel(tenant.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        const msg = await model.findOne({
            companyId: tenant.companyId,
            messageId,
        });
        if (!msg)
            throw new common_1.NotFoundException('Message not found');
        msg.isPinned = !msg.isPinned;
        msg.pinnedBy = msg.isPinned ? user.userId : undefined;
        msg.pinnedAt = msg.isPinned ? new Date() : undefined;
        await msg.save();
        return msg.toObject();
    }
    async getUnreadCounts(tenant, user) {
        const messageModel = await this.regionalDbManager.getModel(tenant.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
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
        const directMap = {};
        for (const d of directUnread) {
            if (d._id)
                directMap[d._id] = d.count;
        }
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
        const channelMap = {};
        for (const c of channelUnread) {
            if (c._id)
                channelMap[c._id] = c.count;
        }
        return { channels: channelMap, direct: directMap };
    }
    async markChannelRead(tenant, user, channelNameOrId) {
        const messageModel = await this.regionalDbManager.getModel(tenant.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        await messageModel.updateMany({
            companyId: tenant.companyId,
            channelId: channelNameOrId,
            readBy: { $ne: user.userId },
        }, {
            $addToSet: { readBy: user.userId },
        });
        return { success: true };
    }
    async markDirectRead(tenant, user, peerId) {
        const messageModel = await this.regionalDbManager.getModel(tenant.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        await messageModel.updateMany({
            companyId: tenant.companyId,
            senderId: peerId,
            recipientId: user.userId,
            readBy: { $ne: user.userId },
        }, {
            $addToSet: { readBy: user.userId },
        });
        return { success: true };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [regional_database_manager_1.RegionalDatabaseManager,
        chat_gateway_1.ChatGateway])
], ChatService);
//# sourceMappingURL=chat.service.js.map