import { Request } from 'express';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './dto/subscription.dto';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class SubscriptionsController {
    private readonly stripeService;
    constructor(stripeService: StripeService);
    createCheckout(tenant: TenantContext, user: JwtPayload, dto: CreateCheckoutSessionDto): Promise<{
        url: string;
        sessionId: string;
        isSandbox: boolean;
    }>;
    createPortal(tenant: TenantContext): Promise<{
        url: string;
    }>;
    getCurrent(tenant: TenantContext): Promise<{
        plan: import("../companies/schemas/company.schema").SubscriptionPlan;
        status: import("../companies/schemas/company.schema").SubscriptionStatus;
        trialEndsAt: Date | undefined;
        currentPeriodEnd: Date | undefined;
        stripeCustomerId: string | undefined;
        isStripeConfigured: boolean;
        publishableKey: string;
    }>;
    handleWebhook(signature: string, req: Request): Promise<{
        received: boolean;
    }>;
}
