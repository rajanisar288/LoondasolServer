import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { shardingConfig } from '../../config/sharding.config';

export interface TenantContext {
  companyId: string;
  region: string;
  countryCode?: string;
  userId?: string;
  role?: string;
  permissions?: string[];
}

// Extracts trusted tenant identity derived from validated JWT session and resolved shard
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.companyId) {
      throw new UnauthorizedException(
        'Tenant context could not be resolved from authenticated session',
      );
    }

    // Resolve shard: check request.countryCode, user.region, or user.country
    const countryOrRegion = request.countryCode || user.region || user.country;
    const shard = shardingConfig.getShardForCountry(user.region || countryOrRegion);
    const resolvedRegion = user.region || shard.name;

    return {
      companyId: user.companyId,
      region: resolvedRegion,
      countryCode: request.countryCode || user.country,
      userId: user.userId,
      role: user.role,
      permissions: user.permissions || [],
    };
  },
);
