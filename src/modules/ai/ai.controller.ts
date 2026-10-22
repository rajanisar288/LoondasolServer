import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  ParseTaskPromptDto,
  GenerateSocialPostDto,
  SmartSearchDto,
  DispatchTaskReportDto,
  AskAiDto,
} from './dto/ai.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

@ApiTags('AI Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('parse-task')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_USE)
  @ApiOperation({ summary: 'Parse natural language task description into structured task fields' })
  async parseTaskPrompt(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: ParseTaskPromptDto,
  ) {
    await this.aiService.checkAiAccess(tenant, user);
    return this.aiService.parseTaskPrompt(dto.prompt);
  }

  @Post('generate-social-post')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_USE)
  @ApiOperation({ summary: 'Generate social media post for LinkedIn, Twitter, Facebook, or Instagram' })
  async generateSocialPost(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateSocialPostDto,
  ) {
    await this.aiService.checkAiAccess(tenant, user);
    return this.aiService.generateSocialPost(dto.topic, dto.platform, dto.tone);
  }

  @Get('top-performers')
  @RequirePermissions(PERMISSIONS.EMPLOYEES_VIEW)
  @ApiOperation({ summary: 'Get AI top performers of the month leaderboard' })
  async getTopPerformers(@CurrentTenant() tenant: TenantContext) {
    return this.aiService.calculateTopPerformers(tenant);
  }

  @Post('smart-search')
  @ApiOperation({ summary: 'RBAC-enforced AI global search across company resources' })
  async smartSearch(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SmartSearchDto,
  ) {
    return this.aiService.smartSearch(tenant, user, dto.query);
  }

  @Post('dispatch-task-report')
  @RequirePermissions(PERMISSIONS.AI_TOOLS_USE)
  @ApiOperation({ summary: 'Dispatch AI task progress report into chat channel or direct message' })
  async dispatchTaskReport(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: DispatchTaskReportDto,
  ) {
    await this.aiService.checkAiAccess(tenant, user);
    return this.aiService.dispatchTaskReport(
      tenant,
      user,
      dto.channelId || 'general',
      dto.recipientId,
    );
  }

  @Post('ask')
  @ApiOperation({ summary: 'Ask AI assistant any workspace query or question' })
  async askAi(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AskAiDto,
  ) {
    return this.aiService.askAi(tenant, user, dto.prompt, dto.context);
  }
}

