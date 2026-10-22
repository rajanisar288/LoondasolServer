import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { MarketingPost } from './schemas/marketing-post.schema';
import { CreateMarketingPostDto } from './dto/marketing.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class MarketingService {
    private readonly regionalDbManager;
    constructor(regionalDbManager: RegionalDatabaseManager);
    findAll(tenant: TenantContext): Promise<MarketingPost[]>;
    create(tenant: TenantContext, user: JwtPayload, dto: CreateMarketingPostDto): Promise<MarketingPost>;
    delete(tenant: TenantContext, postId: string): Promise<{
        success: boolean;
    }>;
}
