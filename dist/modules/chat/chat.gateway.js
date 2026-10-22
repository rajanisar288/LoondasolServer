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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const regional_database_manager_1 = require("../../database/regional-database.manager");
const message_schema_1 = require("./schemas/message.schema");
const channel_schema_1 = require("./schemas/channel.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const employee_schema_1 = require("../employees/schemas/employee.schema");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    constructor(jwtService, configService, regionalDbManager) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.regionalDbManager = regionalDbManager;
        this.logger = new common_1.Logger(ChatGateway_1.name);
        this.onlineUsersByCompany = new Map();
    }
    async handleConnection(client) {
        try {
            const rawHeader = client.handshake.auth?.token ||
                client.handshake.headers.authorization;
            if (!rawHeader || typeof rawHeader !== 'string') {
                client.disconnect(true);
                return;
            }
            const token = rawHeader.replace(/^Bearer\s+/i, '');
            const secret = this.configService.get('JWT_ACCESS_SECRET') || '';
            const payload = await this.jwtService.verifyAsync(token, {
                secret,
            });
            client.data.user = payload;
            const companyRoom = `company:${payload.companyId}`;
            const userRoom = `user:${payload.userId}`;
            await client.join(companyRoom);
            await client.join(userRoom);
            if (!this.onlineUsersByCompany.has(payload.companyId)) {
                this.onlineUsersByCompany.set(payload.companyId, new Set());
            }
            this.onlineUsersByCompany.get(payload.companyId).add(payload.userId);
            try {
                const userModel = await this.regionalDbManager.getModel(payload.region, user_schema_1.User.name, user_schema_1.UserSchema);
                await userModel.updateOne({ userId: payload.userId }, { isOnline: true, lastSeen: new Date() });
                const empModel = await this.regionalDbManager.getModel(payload.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
                await empModel.updateOne({ userId: payload.userId }, { isOnline: true, lastSeen: new Date() });
            }
            catch (err) {
                this.logger.debug(`Could not update online status in DB: ${err.message}`);
            }
            this.server
                .to(companyRoom)
                .emit('userOnline', {
                userId: payload.userId,
                isOnline: true,
                lastSeen: new Date().toISOString(),
            });
            const onlineList = Array.from(this.onlineUsersByCompany.get(payload.companyId) || []);
            this.server.to(companyRoom).emit('onlineUsersSnapshot', onlineList);
            this.logger.log(`Socket client [${client.id}] authenticated for user [${payload.userId}] in company [${payload.companyId}]`);
        }
        catch {
            this.logger.warn(`Unauthenticated socket connection rejected: ${client.id}`);
            client.disconnect(true);
        }
    }
    async markUserOffline(user) {
        const companySet = this.onlineUsersByCompany.get(user.companyId);
        if (companySet) {
            companySet.delete(user.userId);
            if (companySet.size === 0) {
                this.onlineUsersByCompany.delete(user.companyId);
            }
        }
        const lastSeen = new Date();
        if (user.region) {
            try {
                const userModel = await this.regionalDbManager.getModel(user.region, user_schema_1.User.name, user_schema_1.UserSchema);
                await userModel.updateOne({ userId: user.userId }, { isOnline: false, lastSeen });
                const empModel = await this.regionalDbManager.getModel(user.region, employee_schema_1.Employee.name, employee_schema_1.EmployeeSchema);
                await empModel.updateOne({ userId: user.userId }, { isOnline: false, lastSeen });
            }
            catch (err) {
                this.logger.debug(`Could not update offline status in DB: ${err.message}`);
            }
        }
        const companyRoom = `company:${user.companyId}`;
        this.server.to(companyRoom).emit('userOffline', {
            userId: user.userId,
            isOnline: false,
            lastSeen: lastSeen.toISOString(),
        });
        const onlineList = Array.from(this.onlineUsersByCompany.get(user.companyId) || []);
        this.server.to(companyRoom).emit('onlineUsersSnapshot', onlineList);
    }
    async handleDisconnect(client) {
        const user = client.data.user;
        if (user && user.companyId && user.userId) {
            const remainingSockets = await this.server
                .in(`user:${user.userId}`)
                .fetchSockets();
            const otherSockets = remainingSockets.filter((s) => s.id !== client.id);
            if (otherSockets.length === 0) {
                await this.markUserOffline(user);
            }
            this.logger.log(`Socket client [${client.id}] disconnected for user [${user.userId}]`);
        }
    }
    handleGetOnlineUsers(client) {
        const user = client.data.user;
        if (!user?.companyId)
            return;
        const onlineList = Array.from(this.onlineUsersByCompany.get(user.companyId) || []);
        client.emit('onlineUsersSnapshot', onlineList);
    }
    async handleUserLogout(client) {
        const user = client.data.user;
        if (user && user.companyId && user.userId) {
            await this.markUserOffline(user);
        }
        client.disconnect(true);
    }
    notifyChannelCreated(companyId, channel) {
        if (this.server) {
            this.server.to(`company:${companyId}`).emit('channelCreated', channel);
        }
    }
    async handleMessage(client, data) {
        const user = client.data.user;
        if (!user || !user.companyId || !user.region) {
            client.disconnect(true);
            return null;
        }
        const hasText = !!data.content && !!data.content.trim();
        const hasAttachments = !!data.attachments && data.attachments.length > 0;
        const isVoice = data.type === 'VOICE';
        if (!hasText && !hasAttachments && !isVoice) {
            return null;
        }
        const messageId = `msg_${(0, crypto_1.randomUUID)()}`;
        const model = await this.regionalDbManager.getModel(user.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        const contentText = hasText ? data.content.trim() : (isVoice ? '🎤 Voice message' : '');
        const attachments = data.attachments || [];
        const msgType = data.type || (hasAttachments ? 'FILE' : 'TEXT');
        if (data.recipientId) {
            const dmChannelId = `dm_${[user.userId, data.recipientId].sort().join('_')}`;
            const message = await model.create({
                messageId,
                companyId: user.companyId,
                channelId: dmChannelId,
                senderId: user.userId,
                senderName: user.email.split('@')[0],
                content: contentText,
                type: msgType,
                audioDurationSeconds: data.audioDurationSeconds || 0,
                recipientId: data.recipientId,
                isDirect: true,
                attachments,
                replyTo: data.replyTo || undefined,
                mentions: data.mentions || [],
                readBy: [user.userId],
            });
            this.server.to(`user:${data.recipientId}`).emit('newMessage', message);
            if (data.recipientId !== user.userId) {
                this.server.to(`user:${user.userId}`).emit('newMessage', message);
                const notifPreview = contentText ||
                    (attachments.length > 0
                        ? `[File] ${attachments[0].fileName}`
                        : 'New message');
                this.server.to(`user:${data.recipientId}`).emit('notification:new', {
                    notificationId: `notif_${(0, crypto_1.randomUUID)()}`,
                    companyId: user.companyId,
                    userId: data.recipientId,
                    title: user.email.split('@')[0],
                    message: notifPreview,
                    type: 'CHAT',
                    data: {
                        senderId: user.userId,
                        channelId: dmChannelId,
                    },
                    isRead: false,
                    createdAt: new Date(),
                });
            }
            return message;
        }
        const channelId = data.channelId || 'general';
        const message = await model.create({
            messageId,
            companyId: user.companyId,
            channelId,
            senderId: user.userId,
            senderName: user.email.split('@')[0],
            content: contentText,
            type: msgType,
            audioDurationSeconds: data.audioDurationSeconds || 0,
            isDirect: false,
            attachments,
            replyTo: data.replyTo || undefined,
            mentions: data.mentions || [],
            readBy: [user.userId],
        });
        const channelModel = await this.regionalDbManager.getModel(user.region, channel_schema_1.Channel.name, channel_schema_1.ChannelSchema);
        const channelDoc = await channelModel.findOne({
            companyId: user.companyId,
            $or: [{ name: channelId }, { channelId }],
        });
        if (channelDoc &&
            channelDoc.isPrivate &&
            channelDoc.memberIds &&
            channelDoc.memberIds.length > 0) {
            for (const mId of channelDoc.memberIds) {
                this.server.to(`user:${mId}`).emit('newMessage', message);
            }
        }
        else {
            this.server.to(`company:${user.companyId}`).emit('newMessage', message);
        }
        return message;
    }
    async handleEditMessage(client, data) {
        const user = client.data.user;
        if (!user || !user.companyId || !user.region || !data.messageId) {
            return null;
        }
        const model = await this.regionalDbManager.getModel(user.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        const filter = {
            messageId: data.messageId,
            companyId: user.companyId,
        };
        if (!user.isOwner) {
            filter.senderId = user.userId;
        }
        const updated = await model.findOneAndUpdate(filter, {
            content: (data.content || '').trim(),
            isEdited: true,
            updatedAt: new Date(),
        }, { new: true });
        if (!updated)
            return null;
        if (updated.isDirect && updated.recipientId) {
            this.server
                .to(`user:${updated.recipientId}`)
                .emit('messageEdited', updated);
            if (updated.recipientId !== updated.senderId) {
                this.server.to(`user:${updated.senderId}`).emit('messageEdited', updated);
            }
        }
        else {
            this.server
                .to(`company:${user.companyId}`)
                .emit('messageEdited', updated);
        }
        return updated;
    }
    async handleDeleteMessage(client, data) {
        const user = client.data.user;
        if (!user || !user.companyId || !user.region || !data.messageId) {
            return null;
        }
        const model = await this.regionalDbManager.getModel(user.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        const filter = {
            messageId: data.messageId,
            companyId: user.companyId,
        };
        if (!user.isOwner) {
            filter.senderId = user.userId;
        }
        const existing = await model.findOne(filter);
        if (!existing)
            return null;
        await model.deleteOne({ _id: existing._id });
        const payload = {
            messageId: data.messageId,
            channelId: existing.channelId,
            recipientId: existing.recipientId,
        };
        if (existing.isDirect && existing.recipientId) {
            this.server
                .to(`user:${existing.recipientId}`)
                .emit('messageDeleted', payload);
            if (existing.recipientId !== existing.senderId) {
                this.server
                    .to(`user:${existing.senderId}`)
                    .emit('messageDeleted', payload);
            }
        }
        else {
            this.server
                .to(`company:${user.companyId}`)
                .emit('messageDeleted', payload);
        }
        return { success: true, messageId: data.messageId };
    }
    async handlePinMessage(client, data) {
        const user = client.data.user;
        if (!user || !user.companyId || !user.region || !data.messageId) {
            return null;
        }
        const model = await this.regionalDbManager.getModel(user.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        const msg = await model.findOne({
            companyId: user.companyId,
            messageId: data.messageId,
        });
        if (!msg)
            return null;
        msg.isPinned = !msg.isPinned;
        msg.pinnedBy = msg.isPinned ? user.userId : undefined;
        msg.pinnedAt = msg.isPinned ? new Date() : undefined;
        await msg.save();
        if (data.recipientId) {
            this.server.to(`user:${data.recipientId}`).emit('messagePinned', msg);
            if (data.recipientId !== user.userId) {
                this.server.to(`user:${user.userId}`).emit('messagePinned', msg);
            }
        }
        else {
            this.server.to(`company:${user.companyId}`).emit('messagePinned', msg);
        }
        return msg;
    }
    async handleReactMessage(client, data) {
        const user = client.data.user;
        if (!user || !user.companyId || !user.region || !data.messageId || !data.emoji) {
            return null;
        }
        const model = await this.regionalDbManager.getModel(user.region, message_schema_1.Message.name, message_schema_1.MessageSchema);
        const msg = await model.findOne({
            companyId: user.companyId,
            messageId: data.messageId,
        });
        if (!msg)
            return null;
        const currentReactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
        const existingIdx = currentReactions.findIndex((r) => r.emoji === data.emoji);
        if (existingIdx > -1) {
            const userIds = currentReactions[existingIdx].userIds || [];
            if (userIds.includes(user.userId)) {
                const updatedIds = userIds.filter((id) => id !== user.userId);
                if (updatedIds.length === 0) {
                    currentReactions.splice(existingIdx, 1);
                }
                else {
                    currentReactions[existingIdx].userIds = updatedIds;
                }
            }
            else {
                currentReactions[existingIdx].userIds = [...userIds, user.userId];
            }
        }
        else {
            currentReactions.push({ emoji: data.emoji, userIds: [user.userId] });
        }
        msg.reactions = currentReactions;
        await msg.save();
        if (msg.isDirect && msg.recipientId) {
            this.server.to(`user:${msg.recipientId}`).emit('messageReacted', msg);
            if (msg.recipientId !== msg.senderId) {
                this.server.to(`user:${msg.senderId}`).emit('messageReacted', msg);
            }
        }
        else {
            this.server.to(`company:${user.companyId}`).emit('messageReacted', msg);
        }
        return msg;
    }
    handleTyping(client, data) {
        const user = client.data.user;
        if (!user)
            return;
        if (data.recipientId) {
            this.server.to(`user:${data.recipientId}`).emit('userTyping', {
                userId: user.userId,
                userName: user.email.split('@')[0],
                channelId: data.channelId,
                isTyping: data.isTyping,
            });
        }
        else if (data.channelId) {
            client.to(`company:${user.companyId}`).emit('userTyping', {
                userId: user.userId,
                userName: user.email.split('@')[0],
                channelId: data.channelId,
                isTyping: data.isTyping,
            });
        }
    }
    handleCallInitiate(client, data) {
        const user = client.data.user;
        if (!user)
            return;
        const callId = `call_${(0, crypto_1.randomUUID)()}`;
        this.server.to(`user:${data.receiverId}`).emit('call:incoming', {
            callId,
            callerId: user.userId,
            callerName: user.email.split('@')[0],
            callType: data.callType || 'video',
            offer: data.offer,
        });
    }
    handleCallAccept(client, data) {
        const user = client.data.user;
        if (!user)
            return;
        this.server.to(`user:${data.callerId}`).emit('call:accepted', {
            callId: data.callId,
            receiverId: user.userId,
            receiverName: user.email.split('@')[0],
            answer: data.answer,
        });
    }
    handleCallReject(client, data) {
        this.server.to(`user:${data.callerId}`).emit('call:rejected', {
            callId: data.callId,
            reason: data.reason || 'declined',
        });
    }
    handleCallEnd(client, data) {
        this.server.to(`user:${data.peerId}`).emit('call:ended', {
            callId: data.callId,
        });
    }
    handleIceCandidate(client, data) {
        const user = client.data.user;
        if (!user)
            return;
        this.server.to(`user:${data.peerId}`).emit('call:ice-candidate', {
            candidate: data.candidate,
            senderId: user.userId,
        });
    }
    async handleMeetingJoin(client, data) {
        const user = client.data.user;
        if (!user || !data.roomId)
            return;
        const roomName = `meeting:${data.roomId}`;
        await client.join(roomName);
        client.to(roomName).emit('meeting:peer-joined', {
            userId: user.userId,
            userName: user.email.split('@')[0],
        });
    }
    async handleMeetingLeave(client, data) {
        const user = client.data.user;
        if (!user || !data.roomId)
            return;
        const roomName = `meeting:${data.roomId}`;
        await client.leave(roomName);
        client.to(roomName).emit('meeting:peer-left', {
            userId: user.userId,
        });
    }
    handleMeetingSignal(client, data) {
        const user = client.data.user;
        if (!user)
            return;
        this.server.to(`user:${data.targetUserId}`).emit('meeting:signal', {
            senderId: user.userId,
            senderName: user.email.split('@')[0],
            signal: data.signal,
        });
    }
    notifyUser(userId, notification) {
        if (this.server) {
            this.server.to(`user:${userId}`).emit('notification:new', notification);
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('getOnlineUsers'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleGetOnlineUsers", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('userLogout'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleUserLogout", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('editMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleEditMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('deleteMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeleteMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('pinMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handlePinMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('reactMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleReactMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:initiate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleCallInitiate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:accept'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleCallAccept", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:reject'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleCallReject", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:end'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleCallEnd", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:ice-candidate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleIceCandidate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('meeting:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMeetingJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('meeting:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMeetingLeave", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('meeting:signal'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleMeetingSignal", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/chat',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        regional_database_manager_1.RegionalDatabaseManager])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map