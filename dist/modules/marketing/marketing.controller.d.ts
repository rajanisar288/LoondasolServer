import { MarketingService } from './marketing.service';
import { CreateMarketingPostDto } from './dto/marketing.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { MarketingPost } from './schemas/marketing-post.schema';
export declare class MarketingController {
    private readonly marketingService;
    constructor(marketingService: MarketingService);
    findAll(tenant: TenantContext): Promise<MarketingPost[]>;
    create(tenant: TenantContext, user: JwtPayload, dto: CreateMarketingPostDto): Promise<MarketingPost>;
    delete(tenant: TenantContext, id: string): Promise<{
        success: boolean;
    }>;
}
