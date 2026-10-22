import { SubscriptionPlan } from '../../companies/schemas/company.schema';
export declare class CreateCheckoutSessionDto {
    plan: SubscriptionPlan;
    successUrl?: string;
    cancelUrl?: string;
}
export declare class SwitchPlanDto {
    plan: SubscriptionPlan;
}
