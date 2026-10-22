import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BroadcastsService } from './broadcasts.service';
import {
  SendBroadcastDto,
  CreateTemplateDto,
  GenerateAiDraftDto,
} from './dto/broadcast.dto';
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
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Broadcasts & Email Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Post('send')
  @RequirePermissions(PERMISSIONS.EMAIL_CAMPAIGNS_SEND)
  @ApiOperation({ summary: 'Send email announcement to employees' })
  async send(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendBroadcastDto,
  ) {
    return this.broadcastsService.sendBroadcast(tenant, user, dto);
  }

  @Get('templates')
  @RequirePermissions(PERMISSIONS.EMAIL_CAMPAIGNS_VIEW)
  @ApiOperation({ summary: 'List reusable email templates' })
  async listTemplates(@CurrentTenant() tenant: TenantContext) {
    return this.broadcastsService.listTemplates(tenant);
  }

  @Post('templates')
  @RequirePermissions(PERMISSIONS.EMAIL_CAMPAIGNS_CREATE)
  @ApiOperation({ summary: 'Save new email template' })
  async createTemplate(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.broadcastsService.createTemplate(tenant, dto);
  }

  @Delete('templates/:id')
  @RequirePermissions(PERMISSIONS.EMAIL_CAMPAIGNS_CREATE)
  @ApiOperation({ summary: 'Delete email template' })
  async deleteTemplate(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.broadcastsService.deleteTemplate(tenant, id);
  }

  @Get('history')
  @RequirePermissions(PERMISSIONS.EMAIL_CAMPAIGNS_VIEW)
  @ApiOperation({ summary: 'Get broadcast transmission history' })
  async getHistory(@CurrentTenant() tenant: TenantContext) {
    return this.broadcastsService.getHistory(tenant);
  }

  @Post('generate-ai')
  @RequirePermissions(PERMISSIONS.EMAIL_CAMPAIGNS_CREATE)
  @ApiOperation({ summary: 'Generate email draft with Google Gemini AI' })
  async generateAi(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: GenerateAiDraftDto,
  ) {
    return this.broadcastsService.generateAiDraft(tenant, dto);
  }
}
