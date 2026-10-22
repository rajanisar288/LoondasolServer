import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from './dto/subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import {
  CurrentTenant,
  TenantContext,
} from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Subscriptions & Billing')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly stripeService: StripeService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Post('checkout')
  @ApiOperation({
    summary: 'Create Stripe Checkout Session for Pro or Ultra plan',
  })
  async createCheckout(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.stripeService.createCheckoutSession(tenant, user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Post('portal')
  @ApiOperation({
    summary: 'Open Stripe Customer Billing Portal for self-service invoices',
  })
  async createPortal(@CurrentTenant() tenant: TenantContext) {
    return this.stripeService.createCustomerPortalSession(tenant);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get('current')
  @ApiOperation({
    summary: 'Get current workspace subscription tier and status',
  })
  async getCurrent(@CurrentTenant() tenant: TenantContext) {
    return this.stripeService.getCurrentSubscription(tenant);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook receiver' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    const rawBody =
      (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
    return this.stripeService.handleWebhook(rawBody, signature);
  }
}
