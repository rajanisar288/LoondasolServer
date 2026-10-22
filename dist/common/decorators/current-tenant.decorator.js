"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentTenant = void 0;
const common_1 = require("@nestjs/common");
const sharding_config_1 = require("../../config/sharding.config");
exports.CurrentTenant = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.companyId) {
        throw new common_1.UnauthorizedException('Tenant context could not be resolved from authenticated session');
    }
    const countryOrRegion = request.countryCode || user.region || user.country;
    const shard = sharding_config_1.shardingConfig.getShardForCountry(user.region || countryOrRegion);
    const resolvedRegion = user.region || shard.name;
    return {
        companyId: user.companyId,
        region: resolvedRegion,
        countryCode: request.countryCode || user.country,
        userId: user.userId,
        role: user.role,
        permissions: user.permissions || [],
    };
});
//# sourceMappingURL=current-tenant.decorator.js.map