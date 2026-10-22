import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Message, MessageSchema } from './schemas/message.schema';
import { Channel, ChannelSchema } from './schemas/channel.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { JwtPayload } from '../auth/jwt.strategy';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // In-memory presence tracking grouped by workspace company ID
  private readonly onlineUsersByCompany = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly regionalDbManager: RegionalDatabaseManager,
  ) {}

  // Authenticate socket handshake using application JWT access token
  async handleConnection(client: Socket): Promise<void> {
    try {
      const rawHeader =
        (client.handshake.auth as Record<string, unknown> | undefined)?.token ||
        client.handshake.headers.authorization;
      if (!rawHeader || typeof rawHeader !== 'string') {
        client.disconnect(true);
        return;
      }

      const token = rawHeader.replace(/^Bearer\s+/i, '');
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET') || '';
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      // Attach trusted user claims directly to the socket instance
      (client.data as { user: JwtPayload }).user = payload;

      // Join tenant company channel and private user notification channel
      const companyRoom = `company:${payload.companyId}`;
      const userRoom = `user:${payload.userId}`;
      await client.join(companyRoom);
      await client.join(userRoom);

      // Track online presence in memory and database
      if (!this.onlineUsersByCompany.has(payload.companyId)) {
        this.onlineUsersByCompany.set(payload.companyId, new Set<string>());
      }
      this.onlineUsersByCompany.get(payload.companyId)!.add(payload.userId);

      // Persist online state to regional DB
      try {
        const userModel = await this.regionalDbManager.getModel<User>(
          payload.region,
          User.name,
          UserSchema,
        );
        await userModel.updateOne(
          { userId: payload.userId },
          { isOnline: true, lastSeen: new Date() },
        );
        const empModel = await this.regionalDbManager.getModel<Employee>(
          payload.region,
          Employee.name,
          EmployeeSchema,
        );
        await empModel.updateOne(
          { userId: payload.userId },
          { isOnline: true, lastSeen: new Date() },
        );
      } catch (err: any) {
        this.logger.debug(`Could not update online status in DB: ${err.message}`);
      }

      // Broadcast user online event to entire company
      this.server
        .to(companyRoom)
        .emit('userOnline', {
          userId: payload.userId,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        });

      const onlineList = Array.from(
        this.onlineUsersByCompany.get(payload.companyId) || [],
      );
      this.server.to(companyRoom).emit('onlineUsersSnapshot', onlineList);

      this.logger.log(
        `Socket client [${client.id}] authenticated for user [${payload.userId}] in company [${payload.companyId}]`,
      );
    } catch {
      this.logger.warn(
        `Unauthenticated socket connection rejected: ${client.id}`,
      );
      client.disconnect(true);
    }
  }

  /** Marks a user offline across memory and regional DB and notifies the company room. */
  private async markUserOffline(user: JwtPayload): Promise<void> {
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
        const userModel = await this.regionalDbManager.getModel<User>(
          user.region,
          User.name,
          UserSchema,
        );
        await userModel.updateOne(
          { userId: user.userId },
          { isOnline: false, lastSeen },
        );
        const empModel = await this.regionalDbManager.getModel<Employee>(
          user.region,
          Employee.name,
          EmployeeSchema,
        );
        await empModel.updateOne(
          { userId: user.userId },
          { isOnline: false, lastSeen },
        );
      } catch (err: any) {
        this.logger.debug(`Could not update offline status in DB: ${err.message}`);
      }
    }

    const companyRoom = `company:${user.companyId}`;
    this.server.to(companyRoom).emit('userOffline', {
      userId: user.userId,
      isOnline: false,
      lastSeen: lastSeen.toISOString(),
    });

    const onlineList = Array.from(
      this.onlineUsersByCompany.get(user.companyId) || [],
    );
    this.server.to(companyRoom).emit('onlineUsersSnapshot', onlineList);
  }

  /** Handles socket disconnection and updates presence if no active sockets remain for the user. */
  async handleDisconnect(client: Socket): Promise<void> {
    const user = (client.data as { user?: JwtPayload }).user;
    if (user && user.companyId && user.userId) {
      const remainingSockets = await this.server
        .in(`user:${user.userId}`)
        .fetchSockets();
      const otherSockets = remainingSockets.filter((s) => s.id !== client.id);

      if (otherSockets.length === 0) {
        await this.markUserOffline(user);
      }

      this.logger.log(
        `Socket client [${client.id}] disconnected for user [${user.userId}]`,
      );
    }
  }

  /** Returns the current list of online user IDs for the caller's company. */
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket): void {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user?.companyId) return;
    const onlineList = Array.from(
      this.onlineUsersByCompany.get(user.companyId) || [],
    );
    client.emit('onlineUsersSnapshot', onlineList);
  }

  /** Explicitly logs a user out of presence tracking and disconnects their socket. */
  @SubscribeMessage('userLogout')
  async handleUserLogout(@ConnectedSocket() client: Socket): Promise<void> {
    const user = (client.data as { user?: JwtPayload }).user;
    if (user && user.companyId && user.userId) {
      await this.markUserOffline(user);
    }
    client.disconnect(true);
  }

  /** Notifies all connected clients in company about a newly created channel. */
  notifyChannelCreated(companyId: string, channel: any): void {
    if (this.server) {
      this.server.to(`company:${companyId}`).emit('channelCreated', channel);
    }
  }

  // Handle incoming chat message for both channels and 1v1 direct messages
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
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
    },
  ): Promise<Message | null> {
    const user = (client.data as { user?: JwtPayload }).user;
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

    const messageId = `msg_${randomUUID()}`;
    const model = await this.regionalDbManager.getModel<Message>(
      user.region,
      Message.name,
      MessageSchema,
    );

    const contentText = hasText ? data.content!.trim() : (isVoice ? '🎤 Voice message' : '');
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

        const notifPreview =
          contentText ||
          (attachments.length > 0
            ? `[File] ${attachments[0].fileName}`
            : 'New message');
        this.server.to(`user:${data.recipientId}`).emit('notification:new', {
          notificationId: `notif_${randomUUID()}`,
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

    const channelModel = await this.regionalDbManager.getModel<Channel>(
      user.region,
      Channel.name,
      ChannelSchema,
    );
    const channelDoc = await channelModel.findOne({
      companyId: user.companyId,
      $or: [{ name: channelId }, { channelId }],
    });

    if (
      channelDoc &&
      channelDoc.isPrivate &&
      channelDoc.memberIds &&
      channelDoc.memberIds.length > 0
    ) {
      for (const mId of channelDoc.memberIds) {
        this.server.to(`user:${mId}`).emit('newMessage', message);
      }
    } else {
      this.server.to(`company:${user.companyId}`).emit('newMessage', message);
    }
    return message;
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      messageId: string;
      content: string;
      channelId?: string;
      recipientId?: string;
    },
  ): Promise<Message | null> {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user || !user.companyId || !user.region || !data.messageId) {
      return null;
    }

    const model = await this.regionalDbManager.getModel<Message>(
      user.region,
      Message.name,
      MessageSchema,
    );

    const filter: Record<string, unknown> = {
      messageId: data.messageId,
      companyId: user.companyId,
    };
    if (!user.isOwner) {
      filter.senderId = user.userId;
    }

    const updated = await model.findOneAndUpdate(
      filter,
      {
        content: (data.content || '').trim(),
        isEdited: true,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!updated) return null;

    if (updated.isDirect && updated.recipientId) {
      this.server
        .to(`user:${updated.recipientId}`)
        .emit('messageEdited', updated);
      if (updated.recipientId !== updated.senderId) {
        this.server.to(`user:${updated.senderId}`).emit('messageEdited', updated);
      }
    } else {
      this.server
        .to(`company:${user.companyId}`)
        .emit('messageEdited', updated);
    }

    return updated;
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      messageId: string;
      channelId?: string;
      recipientId?: string;
    },
  ): Promise<{ success: boolean; messageId: string } | null> {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user || !user.companyId || !user.region || !data.messageId) {
      return null;
    }

    const model = await this.regionalDbManager.getModel<Message>(
      user.region,
      Message.name,
      MessageSchema,
    );

    const filter: Record<string, unknown> = {
      messageId: data.messageId,
      companyId: user.companyId,
    };
    if (!user.isOwner) {
      filter.senderId = user.userId;
    }

    const existing = await model.findOne(filter);
    if (!existing) return null;

    await model.deleteOne({ _id: (existing as any)._id });

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
    } else {
      this.server
        .to(`company:${user.companyId}`)
        .emit('messageDeleted', payload);
    }

    return { success: true, messageId: data.messageId };
  }

  @SubscribeMessage('pinMessage')
  async handlePinMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      messageId: string;
      channelId?: string;
      recipientId?: string;
    },
  ): Promise<Message | null> {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user || !user.companyId || !user.region || !data.messageId) {
      return null;
    }

    const model = await this.regionalDbManager.getModel<Message>(
      user.region,
      Message.name,
      MessageSchema,
    );

    const msg = await model.findOne({
      companyId: user.companyId,
      messageId: data.messageId,
    });
    if (!msg) return null;

    msg.isPinned = !msg.isPinned;
    msg.pinnedBy = msg.isPinned ? user.userId : undefined;
    msg.pinnedAt = msg.isPinned ? new Date() : undefined;
    await msg.save();

    if (data.recipientId) {
      this.server.to(`user:${data.recipientId}`).emit('messagePinned', msg);
      if (data.recipientId !== user.userId) {
        this.server.to(`user:${user.userId}`).emit('messagePinned', msg);
      }
    } else {
      this.server.to(`company:${user.companyId}`).emit('messagePinned', msg);
    }

    return msg;
  }

  @SubscribeMessage('reactMessage')
  async handleReactMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      messageId: string;
      emoji: string;
      channelId?: string;
      recipientId?: string;
    },
  ): Promise<Message | null> {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user || !user.companyId || !user.region || !data.messageId || !data.emoji) {
      return null;
    }

    const model = await this.regionalDbManager.getModel<Message>(
      user.region,
      Message.name,
      MessageSchema,
    );

    const msg = await model.findOne({
      companyId: user.companyId,
      messageId: data.messageId,
    });
    if (!msg) return null;

    const currentReactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
    const existingIdx = currentReactions.findIndex((r) => r.emoji === data.emoji);

    if (existingIdx > -1) {
      const userIds = currentReactions[existingIdx].userIds || [];
      if (userIds.includes(user.userId)) {
        const updatedIds = userIds.filter((id) => id !== user.userId);
        if (updatedIds.length === 0) {
          currentReactions.splice(existingIdx, 1);
        } else {
          currentReactions[existingIdx].userIds = updatedIds;
        }
      } else {
        currentReactions[existingIdx].userIds = [...userIds, user.userId];
      }
    } else {
      currentReactions.push({ emoji: data.emoji, userIds: [user.userId] });
    }

    msg.reactions = currentReactions;
    await msg.save();

    if (msg.isDirect && msg.recipientId) {
      this.server.to(`user:${msg.recipientId}`).emit('messageReacted', msg);
      if (msg.recipientId !== msg.senderId) {
        this.server.to(`user:${msg.senderId}`).emit('messageReacted', msg);
      }
    } else {
      this.server.to(`company:${user.companyId}`).emit('messageReacted', msg);
    }

    return msg;
  }

  // Live typing indicator broadcast
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { channelId?: string; recipientId?: string; isTyping: boolean },
  ): void {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user) return;

    if (data.recipientId) {
      this.server.to(`user:${data.recipientId}`).emit('userTyping', {
        userId: user.userId,
        userName: user.email.split('@')[0],
        channelId: data.channelId,
        isTyping: data.isTyping,
      });
    } else if (data.channelId) {
      client.to(`company:${user.companyId}`).emit('userTyping', {
        userId: user.userId,
        userName: user.email.split('@')[0],
        channelId: data.channelId,
        isTyping: data.isTyping,
      });
    }
  }

  // WebRTC 1v1 Audio/Video Call: Initiate call to peer
  @SubscribeMessage('call:initiate')
  handleCallInitiate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { receiverId: string; callType: 'video' | 'audio'; offer?: any },
  ): void {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user) return;

    const callId = `call_${randomUUID()}`;
    this.server.to(`user:${data.receiverId}`).emit('call:incoming', {
      callId,
      callerId: user.userId,
      callerName: user.email.split('@')[0],
      callType: data.callType || 'video',
      offer: data.offer,
    });
  }

  // WebRTC 1v1 Audio/Video Call: Accept incoming call
  @SubscribeMessage('call:accept')
  handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { callId: string; callerId: string; answer?: any },
  ): void {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user) return;

    this.server.to(`user:${data.callerId}`).emit('call:accepted', {
      callId: data.callId,
      receiverId: user.userId,
      receiverName: user.email.split('@')[0],
      answer: data.answer,
    });
  }

  // WebRTC 1v1 Audio/Video Call: Reject or decline call
  @SubscribeMessage('call:reject')
  handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { callId: string; callerId: string; reason?: string },
  ): void {
    this.server.to(`user:${data.callerId}`).emit('call:rejected', {
      callId: data.callId,
      reason: data.reason || 'declined',
    });
  }

  // WebRTC 1v1 Audio/Video Call: Terminate active call
  @SubscribeMessage('call:end')
  handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { callId: string; peerId: string },
  ): void {
    this.server.to(`user:${data.peerId}`).emit('call:ended', {
      callId: data.callId,
    });
  }

  // WebRTC 1v1 Audio/Video Call: ICE candidate routing
  @SubscribeMessage('call:ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { peerId: string; candidate: any },
  ): void {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user) return;

    this.server.to(`user:${data.peerId}`).emit('call:ice-candidate', {
      candidate: data.candidate,
      senderId: user.userId,
    });
  }

  // Meeting Room: Join room channel
  @SubscribeMessage('meeting:join')
  async handleMeetingJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user || !data.roomId) return;

    const roomName = `meeting:${data.roomId}`;
    await client.join(roomName);

    client.to(roomName).emit('meeting:peer-joined', {
      userId: user.userId,
      userName: user.email.split('@')[0],
    });
  }

  // Meeting Room: Leave room channel
  @SubscribeMessage('meeting:leave')
  async handleMeetingLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user || !data.roomId) return;

    const roomName = `meeting:${data.roomId}`;
    await client.leave(roomName);

    client.to(roomName).emit('meeting:peer-left', {
      userId: user.userId,
    });
  }

  // Meeting Room: Relay WebRTC signal between meeting participants
  @SubscribeMessage('meeting:signal')
  handleMeetingSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomId: string; targetUserId: string; signal: any },
  ): void {
    const user = (client.data as { user?: JwtPayload }).user;
    if (!user) return;

    this.server.to(`user:${data.targetUserId}`).emit('meeting:signal', {
      senderId: user.userId,
      senderName: user.email.split('@')[0],
      signal: data.signal,
    });
  }

  // Helper method for dispatching real-time notifications
  notifyUser(userId: string, notification: any): void {
    if (this.server) {
      this.server.to(`user:${userId}`).emit('notification:new', notification);
    }
  }
}
