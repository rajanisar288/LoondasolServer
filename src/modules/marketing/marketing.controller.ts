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
import { MarketingService } from './marketing.service';
import { CreateMarketingPostDto } from './dto/marketing.dto';
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
import { MarketingPost } from './schemas/marketing-post.schema';

@ApiTags('Marketing & Social Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('posts')
  @RequirePermissions(PERMISSIONS.MARKETING_POSTS_VIEW)
  @ApiOperation({ summary: 'List social media posts' })
  async findAll(@CurrentTenant() tenant: TenantContext): Promise<MarketingPost[]> {
    return this.marketingService.findAll(tenant);
  }

  @Post('posts')
  @RequirePermissions(PERMISSIONS.MARKETING_POSTS_CREATE)
  @ApiOperation({ summary: 'Save generated or drafted social media post' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMarketingPostDto,
  ): Promise<MarketingPost> {
    return this.marketingService.create(tenant, user, dto);
  }

  @Delete('posts/:id')
  @RequirePermissions(PERMISSIONS.MARKETING_POSTS_CREATE)
  @ApiOperation({ summary: 'Delete a social media post' })
  async delete(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.marketingService.delete(tenant, id);
  }
}
