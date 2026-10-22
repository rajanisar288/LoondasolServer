import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { StripeService } from './stripe.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [StripeService],
  exports: [StripeService],
})
export class SubscriptionsModule {}
