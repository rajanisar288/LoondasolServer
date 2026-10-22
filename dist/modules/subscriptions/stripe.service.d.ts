import { ConfigService } from '@nestjs/config';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { SubscriptionPlan, SubscriptionStatus } from '../companies/schemas/company.schema';
import { CreateCheckoutSessionDto } from './dto/subscription.dto';
export declare class StripeService {
    private readonly configService;
    private readonly regionalDbManager;
    private readonly logger;
    private stripe;
    private readonly secretKey;
    private readonly publishableKey;
    private readonly webhookSecret;
    private readonly appUrl;
    constructor(configService: ConfigService, regionalDbManager: RegionalDatabaseManager);
    isConfigured(): boolean;
    getPublishableKey(): string;
    createCheckoutSession(tenant: TenantContext, user: JwtPayload, dto: CreateCheckoutSessionDto): Promise<{
        url: string;
        sessionId: string;
        isSandbox: boolean;
    }>;
    createCustomerPortalSession(tenant: TenantContext): Promise<{
        url: string;
    }>;
    getCurrentSubscription(tenant: TenantContext): Promise<{
        plan: SubscriptionPlan;
        status: SubscriptionStatus;
        trialEndsAt: Date | undefined;
        currentPeriodEnd: Date | undefined;
        stripeCustomerId: string | undefined;
        isStripeConfigured: boolean;
        publishableKey: string;
    }>;
    handleWebhook(payload: Buffer, signature: string): Promise<{
        received: boolean;
    }>;
    private updateSubscriptionStatusAcrossRegions;
}
