import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  PaymentInitiateResult,
  PaymentConfirmResult,
  WebhookValidationResult,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private readonly logger = new Logger(StripeProvider.name);
  readonly name = 'stripe';

  constructor(private configService: ConfigService) {}

  async initiate(params: {
    orderId: string;
    amount: number;
    orderName: string;
    customerEmail: string;
  }): Promise<PaymentInitiateResult> {
    // TODO: Implement Stripe Checkout Session
    this.logger.warn('Stripe provider not yet implemented');

    throw new NotImplementedException('Stripe provider coming soon');

    // Future implementation:
    // const stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'));
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price_data: {
    //       currency: 'krw',
    //       product_data: {
    //         name: params.orderName,
    //       },
    //       unit_amount: params.amount,
    //     },
    //     quantity: 1,
    //   }],
    //   mode: 'payment',
    //   success_url: `${this.configService.get('FRONTEND_URL')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${this.configService.get('FRONTEND_URL')}/payment/cancel`,
    //   client_reference_id: params.orderId,
    //   customer_email: params.customerEmail,
    // });
    // return { orderId: params.orderId, amount: params.amount, checkoutUrl: session.url, provider: 'stripe' };
  }

  async confirm(params: {
    orderId: string;
    paymentKey: string;
    amount: number;
  }): Promise<PaymentConfirmResult> {
    throw new NotImplementedException('Stripe provider coming soon');
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookValidationResult> {
    // TODO: Verify Stripe signature
    // const stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'));
    // const endpointSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    // const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    throw new NotImplementedException('Stripe provider coming soon');
  }
}
