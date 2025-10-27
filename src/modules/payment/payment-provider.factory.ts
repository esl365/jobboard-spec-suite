import { Injectable } from '@nestjs/common';
import { IPaymentProvider } from './interfaces/payment-provider.interface';
import { TossPaymentsProvider } from './providers/toss-payments.provider';
import { StripeProvider } from './providers/stripe.provider';

export type PaymentProviderType = 'toss' | 'stripe';

@Injectable()
export class PaymentProviderFactory {
  private providers: Map<PaymentProviderType, IPaymentProvider>;

  constructor(
    private tossProvider: TossPaymentsProvider,
    private stripeProvider: StripeProvider,
  ) {
    this.providers = new Map<PaymentProviderType, IPaymentProvider>();
    this.providers.set('toss', tossProvider);
    this.providers.set('stripe', stripeProvider);
  }

  getProvider(type: PaymentProviderType): IPaymentProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Payment provider '${type}' not found`);
    }
    return provider;
  }

  getDefaultProvider(): IPaymentProvider {
    // For Korea, default to Toss
    return this.getProvider('toss');
  }
}
