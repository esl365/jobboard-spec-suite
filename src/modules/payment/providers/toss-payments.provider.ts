import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  PaymentInitiateResult,
  PaymentConfirmResult,
  WebhookValidationResult,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class TossPaymentsProvider implements IPaymentProvider {
  private readonly logger = new Logger(TossPaymentsProvider.name);
  readonly name = 'toss';
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.tosspayments.com/v1';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('TOSS_SECRET_KEY', '');
  }

  async initiate(params: {
    orderId: string;
    amount: number;
    orderName: string;
    customerEmail: string;
  }): Promise<PaymentInitiateResult> {
    const { orderId, amount, orderName } = params;

    // Toss doesn't need pre-call, just return checkout URL
    const checkoutUrl = `${this.configService.get('FRONTEND_URL')}/payment/checkout?orderId=${orderId}&amount=${amount}`;

    return {
      orderId,
      amount,
      checkoutUrl,
      provider: this.name,
    };
  }

  async confirm(params: {
    orderId: string;
    paymentKey: string;
    amount: number;
  }): Promise<PaymentConfirmResult> {
    const { orderId, paymentKey, amount } = params;

    const url = `${this.baseUrl}/payments/confirm`;
    const authHeader = Buffer.from(`${this.secretKey}:`).toString('base64');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('Toss payment confirmation failed', errorData);
        throw new Error(
          `Toss payment confirmation failed: ${errorData.message || response.statusText}`,
        );
      }

      const data: any = await response.json();

      return {
        orderId: data.orderId,
        transactionId: data.paymentKey,
        status: data.status === 'DONE' ? 'COMPLETED' : 'FAILED',
        amount: data.totalAmount,
        paidAt: new Date(data.approvedAt),
        raw: data,
      };
    } catch (error) {
      this.logger.error('Toss payment confirmation failed', error);
      throw error;
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookValidationResult> {
    // Toss webhook validation logic
    // For now, simple validation
    if (!payload || !payload.orderId) {
      return { isValid: false };
    }

    return {
      isValid: true,
      eventId: payload.orderId,
      data: payload,
    };
  }
}
