import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  Company,
  CompanySchema,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../companies/schemas/company.schema';
import { CreateCheckoutSessionDto } from './dto/subscription.dto';
import { REGIONS } from '../../common/constants/regions.constant';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe | null = null;
  private readonly secretKey: string;
  private readonly publishableKey: string;
  private readonly webhookSecret: string;
  private readonly appUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly regionalDbManager: RegionalDatabaseManager,
  ) {
    this.secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    this.publishableKey =
      this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') || '';
    this.webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
    this.appUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:4200';

    if (this.secretKey && !this.secretKey.includes('placeholder')) {
      this.stripe = new Stripe(this.secretKey, {
        apiVersion: '2025-02-24.acacia' as any,
      });
      this.logger.log('Stripe client initialized for live payment processing');
    } else {
      this.logger.warn(
        'STRIPE_SECRET_KEY is not configured or is a placeholder. Running in sandbox mock subscription mode.',
      );
    }
  }

  // Check if Stripe credentials are ready for live processing
  isConfigured(): boolean {
    return !!this.stripe;
  }

  // Get public publishable key for client SDK
  getPublishableKey(): string {
    return this.publishableKey;
  }

  // Creates a Stripe Checkout Session or returns sandbox mock URL
  async createCheckoutSession(
    tenant: TenantContext,
    user: JwtPayload,
    dto: CreateCheckoutSessionDto,
  ): Promise<{ url: string; sessionId: string; isSandbox: boolean }> {
    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );

    const company = await companyModel.findOne({ companyId: tenant.companyId });
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const successUrl =
      dto.successUrl ||
      `${this.appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${dto.plan}`;
    const cancelUrl = dto.cancelUrl || `${this.appUrl}/settings?canceled=true`;

    // Production mode with Stripe API
    if (this.stripe) {
      let customerId = company.subscription?.stripeCustomerId;

      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: company.email || user.email,
          name: company.name,
          metadata: {
            companyId: tenant.companyId,
            region: tenant.region,
          },
        });
        customerId = customer.id;

        // Persist customerId in regional database
        await companyModel.updateOne(
          { companyId: tenant.companyId },
          { 'subscription.stripeCustomerId': customerId },
        );
      }

      // Compute pricing parameters
      const unitAmount = dto.plan === SubscriptionPlan.PRO ? 2900 : 9900;
      const planName =
        dto.plan === SubscriptionPlan.PRO
          ? 'WorkivLab Pro Plan'
          : 'WorkivLab Ultra Enterprise';
      const planDescription =
        dto.plan === SubscriptionPlan.PRO
          ? 'Up to 50 active team members, granular permissions accordion, email broadcasts, and analytics.'
          : 'Unlimited team members, multi-region database shards, Google Gemini AI reports, and 24/7 SLA.';

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: planName,
                description: planDescription,
              },
              unit_amount: unitAmount,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          companyId: tenant.companyId,
          region: tenant.region,
          plan: dto.plan,
        },
      });

      return {
        url: session.url || successUrl,
        sessionId: session.id,
        isSandbox: false,
      };
    }

    // Sandbox Fallback Mode when STRIPE_SECRET_KEY is not yet defined
    const mockSessionId = `sandbox_sub_${randomUUID()}`;
    await companyModel.updateOne(
      { companyId: tenant.companyId },
      {
        'subscription.plan': dto.plan,
        'subscription.status': SubscriptionStatus.ACTIVE,
        'subscription.stripeSubscriptionId': mockSessionId,
      },
    );

    this.logger.log(
      `[Sandbox] Company ${tenant.companyId} upgraded to ${dto.plan} in sandbox mode`,
    );

    return {
      url: successUrl.replace('{CHECKOUT_SESSION_ID}', mockSessionId),
      sessionId: mockSessionId,
      isSandbox: true,
    };
  }

  // Generates Stripe Customer Billing Portal session for self-service invoices and cancellations
  async createCustomerPortalSession(
    tenant: TenantContext,
  ): Promise<{ url: string }> {
    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );

    const company = await companyModel.findOne({ companyId: tenant.companyId });
    const customerId = company?.subscription?.stripeCustomerId;

    if (this.stripe && customerId) {
      const portal = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${this.appUrl}/settings`,
      });
      return { url: portal.url };
    }

    return { url: `${this.appUrl}/settings` };
  }

  // Retrieves current subscription telemetry for workspace
  async getCurrentSubscription(tenant: TenantContext) {
    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );

    const company = await companyModel.findOne({ companyId: tenant.companyId });
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }

    const sub = company.subscription || {
      plan: SubscriptionPlan.FREE_TRIAL,
      status: SubscriptionStatus.TRIALING,
    };

    return {
      plan: sub.plan,
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      stripeCustomerId: sub.stripeCustomerId,
      isStripeConfigured: this.isConfigured(),
      publishableKey: this.publishableKey,
    };
  }

  // Processes incoming Stripe webhook events
  async handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    let event: Stripe.Event;

    if (
      this.stripe &&
      this.webhookSecret &&
      !this.webhookSecret.includes('placeholder')
    ) {
      try {
        event = this.stripe.webhooks.constructEvent(
          payload,
          signature,
          this.webhookSecret,
        );
      } catch (err: any) {
        this.logger.error(
          `Webhook signature verification failed: ${err?.message}`,
        );
        throw new BadRequestException('Webhook signature verification failed');
      }
    } else {
      try {
        event = JSON.parse(payload.toString());
      } catch {
        throw new BadRequestException('Invalid payload');
      }
    }

    this.logger.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId = session.metadata?.companyId;
        const region = session.metadata?.region;
        const plan = session.metadata?.plan as SubscriptionPlan;

        if (companyId && region) {
          const companyModel = await this.regionalDbManager.getModel<Company>(
            region as any,
            Company.name,
            CompanySchema,
          );
          await companyModel.updateOne(
            { companyId },
            {
              'subscription.plan': plan || SubscriptionPlan.PRO,
              'subscription.status': SubscriptionStatus.ACTIVE,
              'subscription.stripeCustomerId': session.customer as string,
              'subscription.stripeSubscriptionId':
                session.subscription as string,
            },
          );
          this.logger.log(`Subscription activated for company ${companyId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.updateSubscriptionStatusAcrossRegions(
          sub.id,
          SubscriptionStatus.CANCELED,
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          await this.updateSubscriptionStatusAcrossRegions(
            invoice.subscription as string,
            SubscriptionStatus.PAST_DUE,
          );
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          await this.updateSubscriptionStatusAcrossRegions(
            invoice.subscription as string,
            SubscriptionStatus.ACTIVE,
          );
        }
        break;
      }
    }

    return { received: true };
  }

  // Utility to locate company by Stripe subscription ID and sync status
  private async updateSubscriptionStatusAcrossRegions(
    subscriptionId: string,
    status: SubscriptionStatus,
  ): Promise<void> {
    for (const region of Object.values(REGIONS)) {
      const companyModel = await this.regionalDbManager.getModel<Company>(
        region,
        Company.name,
        CompanySchema,
      );
      const updated = await companyModel.updateOne(
        { 'subscription.stripeSubscriptionId': subscriptionId },
        { 'subscription.status': status },
      );
      if (updated.modifiedCount > 0) {
        this.logger.log(
          `Updated subscription ${subscriptionId} status to ${status} in ${region}`,
        );
        break;
      }
    }
  }
}
