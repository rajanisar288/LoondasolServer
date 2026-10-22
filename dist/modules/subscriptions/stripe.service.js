"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const stripe_1 = __importDefault(require("stripe"));
const regional_database_manager_1 = require("../../database/regional-database.manager");
const company_schema_1 = require("../companies/schemas/company.schema");
const regions_constant_1 = require("../../common/constants/regions.constant");
let StripeService = StripeService_1 = class StripeService {
    constructor(configService, regionalDbManager) {
        this.configService = configService;
        this.regionalDbManager = regionalDbManager;
        this.logger = new common_1.Logger(StripeService_1.name);
        this.stripe = null;
        this.secretKey = this.configService.get('STRIPE_SECRET_KEY') || '';
        this.publishableKey =
            this.configService.get('STRIPE_PUBLISHABLE_KEY') || '';
        this.webhookSecret =
            this.configService.get('STRIPE_WEBHOOK_SECRET') || '';
        this.appUrl =
            this.configService.get('APP_URL') || 'http://localhost:4200';
        if (this.secretKey && !this.secretKey.includes('placeholder')) {
            this.stripe = new stripe_1.default(this.secretKey, {
                apiVersion: '2025-02-24.acacia',
            });
            this.logger.log('Stripe client initialized for live payment processing');
        }
        else {
            this.logger.warn('STRIPE_SECRET_KEY is not configured or is a placeholder. Running in sandbox mock subscription mode.');
        }
    }
    isConfigured() {
        return !!this.stripe;
    }
    getPublishableKey() {
        return this.publishableKey;
    }
    async createCheckoutSession(tenant, user, dto) {
        const companyModel = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const company = await companyModel.findOne({ companyId: tenant.companyId });
        if (!company) {
            throw new common_1.NotFoundException('Company profile not found');
        }
        const successUrl = dto.successUrl ||
            `${this.appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${dto.plan}`;
        const cancelUrl = dto.cancelUrl || `${this.appUrl}/settings?canceled=true`;
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
                await companyModel.updateOne({ companyId: tenant.companyId }, { 'subscription.stripeCustomerId': customerId });
            }
            const unitAmount = dto.plan === company_schema_1.SubscriptionPlan.PRO ? 2900 : 9900;
            const planName = dto.plan === company_schema_1.SubscriptionPlan.PRO
                ? 'WorkivLab Pro Plan'
                : 'WorkivLab Ultra Enterprise';
            const planDescription = dto.plan === company_schema_1.SubscriptionPlan.PRO
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
        const mockSessionId = `sandbox_sub_${(0, crypto_1.randomUUID)()}`;
        await companyModel.updateOne({ companyId: tenant.companyId }, {
            'subscription.plan': dto.plan,
            'subscription.status': company_schema_1.SubscriptionStatus.ACTIVE,
            'subscription.stripeSubscriptionId': mockSessionId,
        });
        this.logger.log(`[Sandbox] Company ${tenant.companyId} upgraded to ${dto.plan} in sandbox mode`);
        return {
            url: successUrl.replace('{CHECKOUT_SESSION_ID}', mockSessionId),
            sessionId: mockSessionId,
            isSandbox: true,
        };
    }
    async createCustomerPortalSession(tenant) {
        const companyModel = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
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
    async getCurrentSubscription(tenant) {
        const companyModel = await this.regionalDbManager.getModel(tenant.region, company_schema_1.Company.name, company_schema_1.CompanySchema);
        const company = await companyModel.findOne({ companyId: tenant.companyId });
        if (!company) {
            throw new common_1.NotFoundException('Company profile not found');
        }
        const sub = company.subscription || {
            plan: company_schema_1.SubscriptionPlan.FREE_TRIAL,
            status: company_schema_1.SubscriptionStatus.TRIALING,
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
    async handleWebhook(payload, signature) {
        let event;
        if (this.stripe &&
            this.webhookSecret &&
            !this.webhookSecret.includes('placeholder')) {
            try {
                event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
            }
            catch (err) {
                this.logger.error(`Webhook signature verification failed: ${err?.message}`);
                throw new common_1.BadRequestException('Webhook signature verification failed');
            }
        }
        else {
            try {
                event = JSON.parse(payload.toString());
            }
            catch {
                throw new common_1.BadRequestException('Invalid payload');
            }
        }
        this.logger.log(`Processing Stripe event: ${event.type}`);
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const companyId = session.metadata?.companyId;
                const region = session.metadata?.region;
                const plan = session.metadata?.plan;
                if (companyId && region) {
                    const companyModel = await this.regionalDbManager.getModel(region, company_schema_1.Company.name, company_schema_1.CompanySchema);
                    await companyModel.updateOne({ companyId }, {
                        'subscription.plan': plan || company_schema_1.SubscriptionPlan.PRO,
                        'subscription.status': company_schema_1.SubscriptionStatus.ACTIVE,
                        'subscription.stripeCustomerId': session.customer,
                        'subscription.stripeSubscriptionId': session.subscription,
                    });
                    this.logger.log(`Subscription activated for company ${companyId}`);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                await this.updateSubscriptionStatusAcrossRegions(sub.id, company_schema_1.SubscriptionStatus.CANCELED);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                if (invoice.subscription) {
                    await this.updateSubscriptionStatusAcrossRegions(invoice.subscription, company_schema_1.SubscriptionStatus.PAST_DUE);
                }
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                if (invoice.subscription) {
                    await this.updateSubscriptionStatusAcrossRegions(invoice.subscription, company_schema_1.SubscriptionStatus.ACTIVE);
                }
                break;
            }
        }
        return { received: true };
    }
    async updateSubscriptionStatusAcrossRegions(subscriptionId, status) {
        for (const region of Object.values(regions_constant_1.REGIONS)) {
            const companyModel = await this.regionalDbManager.getModel(region, company_schema_1.Company.name, company_schema_1.CompanySchema);
            const updated = await companyModel.updateOne({ 'subscription.stripeSubscriptionId': subscriptionId }, { 'subscription.status': status });
            if (updated.modifiedCount > 0) {
                this.logger.log(`Updated subscription ${subscriptionId} status to ${status} in ${region}`);
                break;
            }
        }
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        regional_database_manager_1.RegionalDatabaseManager])
], StripeService);
//# sourceMappingURL=stripe.service.js.map