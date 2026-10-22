import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService, CreateChannelDto } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Message } from './schemas/message.schema';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Chat & Messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('channels')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  @ApiOperation({ summary: 'Get accessible channels for workspace' })
  async getChannels(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.getChannels(tenant, user);
  }

  @Post('channels')
  @RequirePermissions(PERMISSIONS.CHANNELS_CREATE)
  @ApiOperation({ summary: 'Create a new team channel' })
  async createChannel(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateChannelDto,
  ) {
    return this.chatService.createChannel(tenant, user, dto);
  }

  @Post('channels/:id/members')
  @RequirePermissions(PERMISSIONS.CHANNELS_MANAGE)
  @ApiOperation({ summary: 'Add members to a channel' })
  async addMembers(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') channelId: string,
    @Body('memberIds') memberIds: string[],
  ) {
    return this.chatService.addMembers(tenant, channelId, memberIds || []);
  }

  @Get('messages')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  @ApiOperation({ summary: 'Get channel message history' })
  async getMessages(
    @CurrentTenant() tenant: TenantContext,
    @Query('channelId') channelId?: string,
    @Query('limit') limit?: number,
  ): Promise<Message[]> {
    return this.chatService.getMessages(tenant, channelId || 'general', limit);
  }

  @Get('direct/:recipientId')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  @ApiOperation({ summary: 'Get 1v1 direct message conversation history' })
  async getDirectMessages(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('recipientId') recipientId: string,
    @Query('limit') limit?: number,
  ): Promise<Message[]> {
    return this.chatService.getDirectMessages(
      tenant,
      user.userId,
      recipientId,
      limit,
    );
  }

  @Get('conversations')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  @ApiOperation({
    summary: 'Get 1v1 conversation summaries and latest messages',
  })
  async getConversations(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.getDirectConversationsSummary(tenant, user);
  }

  @Post('channels/:id/pin')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  @ApiOperation({ summary: 'Toggle pinned state of a channel for current user' })
  async togglePinChannel(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') channelId: string,
  ) {
    return this.chatService.togglePinChannel(tenant, user, channelId);
  }

  @Get('messages/:channelId/pinned')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  @ApiOperation({ summary: 'Get all pinned messages for a channel' })
  async getPinnedMessages(
    @CurrentTenant() tenant: TenantContext,
    @Param('channelId') channelId: string,
  ) {
    return this.chatService.getPinnedMessages(tenant, channelId);
  }

  @Post('messages/:id/pin')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  @ApiOperation({ summary: 'Toggle pinned state of a message' })
  async togglePinMessage(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('id') messageId: string,
  ) {
    return this.chatService.togglePinMessage(tenant, user, messageId);
  }

  @Get('unread-counts')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  @ApiOperation({ summary: 'Get unread message counts for channels and direct messages' })
  async getUnreadCounts(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatService.getUnreadCounts(tenant, user);
  }

  @Post('channels/:name/read')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  @ApiOperation({ summary: 'Mark all messages in a channel as read' })
  async markChannelRead(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('name') channelName: string,
  ) {
    return this.chatService.markChannelRead(tenant, user, channelName);
  }

  @Post('direct/:peerId/read')
  @RequirePermissions(PERMISSIONS.MESSAGES_VIEW)
  @ApiOperation({ summary: 'Mark all direct messages from a peer as read' })
  async markDirectRead(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Param('peerId') peerId: string,
  ) {
    return this.chatService.markDirectRead(tenant, user, peerId);
  }
}
