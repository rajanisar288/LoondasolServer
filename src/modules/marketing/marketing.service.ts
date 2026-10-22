import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import {
  MarketingPost,
  MarketingPostSchema,
} from './schemas/marketing-post.schema';
import { CreateMarketingPostDto } from './dto/marketing.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class MarketingService {
  constructor(private readonly regionalDbManager: RegionalDatabaseManager) {}

  async findAll(tenant: TenantContext): Promise<MarketingPost[]> {
    const model = await this.regionalDbManager.getModel<MarketingPost>(
      tenant.region,
      MarketingPost.name,
      MarketingPostSchema,
    );
    return model.find({ companyId: tenant.companyId }).sort({ createdAt: -1 }).lean();
  }

  async create(
    tenant: TenantContext,
    user: JwtPayload,
    dto: CreateMarketingPostDto,
  ): Promise<MarketingPost> {
    const model = await this.regionalDbManager.getModel<MarketingPost>(
      tenant.region,
      MarketingPost.name,
      MarketingPostSchema,
    );

    const postId = `post_${randomUUID()}`;
    return model.create({
      postId,
      companyId: tenant.companyId,
      platform: dto.platform.toUpperCase().trim(),
      content: dto.content.trim(),
      hashtags: dto.hashtags || [],
      mediaUrl: dto.mediaUrl,
      status: dto.status || 'DRAFT',
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      createdBy: user.userId,
    });
  }

  async delete(
    tenant: TenantContext,
    postId: string,
  ): Promise<{ success: boolean }> {
    const model = await this.regionalDbManager.getModel<MarketingPost>(
      tenant.region,
      MarketingPost.name,
      MarketingPostSchema,
    );

    const result = await model.deleteOne({
      companyId: tenant.companyId,
      postId,
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Post not found');
    }

    return { success: true };
  }
}
