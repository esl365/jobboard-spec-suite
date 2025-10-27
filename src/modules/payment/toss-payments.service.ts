import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TossPaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPaymentConfirmResponse {
  version: string;
  paymentKey: string;
  type: string;
  orderId: string;
  orderName: string;
  mId: string;
  currency: string;
  method: string;
  totalAmount: number;
  balanceAmount: number;
  status: string;
  requestedAt: string;
  approvedAt: string;
  useEscrow: boolean;
  lastTransactionKey: string | null;
  suppliedAmount: number;
  vat: number;
  cultureExpense: boolean;
  taxFreeAmount: number;
  taxExemptionAmount: number;
  cancels: any | null;
  isPartialCancelable: boolean;
  card: any | null;
  virtualAccount: any | null;
  secret: string | null;
  mobilePhone: any | null;
  giftCertificate: any | null;
  transfer: any | null;
  receipt: {
    url: string;
  };
  checkout: {
    url: string;
  };
  easyPay: any | null;
  country: string;
  failure: any | null;
  cashReceipt: any | null;
  cashReceipts: any | null;
  discount: any | null;
}

@Injectable()
export class TossPaymentsService {
  private readonly logger = new Logger(TossPaymentsService.name);
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('TOSS_SECRET_KEY', '');
    this.baseUrl = 'https://api.tosspayments.com/v1';
  }

  /**
   * Confirm a payment with Toss Payments
   */
  async confirmPayment(
    confirmRequest: TossPaymentConfirmRequest,
  ): Promise<TossPaymentConfirmResponse> {
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
          paymentKey: confirmRequest.paymentKey,
          orderId: confirmRequest.orderId,
          amount: confirmRequest.amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('Toss payment confirmation failed', errorData);
        throw new Error(
          `Toss payment confirmation failed: ${errorData.message || response.statusText}`,
        );
      }

      const data: TossPaymentConfirmResponse = await response.json();
      this.logger.log(
        `Payment confirmed successfully: ${confirmRequest.orderId}`,
      );

      return data;
    } catch (error) {
      this.logger.error('Error confirming payment', error);
      throw error;
    }
  }

  /**
   * Get payment details from Toss Payments
   */
  async getPayment(paymentKey: string): Promise<TossPaymentConfirmResponse> {
    const url = `${this.baseUrl}/payments/${paymentKey}`;
    const authHeader = Buffer.from(`${this.secretKey}:`).toString('base64');

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('Failed to get payment details', errorData);
        throw new Error(
          `Failed to get payment: ${errorData.message || response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Error getting payment details', error);
      throw error;
    }
  }

  /**
   * Cancel a payment (full or partial)
   */
  async cancelPayment(
    paymentKey: string,
    cancelReason: string,
    cancelAmount?: number,
  ): Promise<any> {
    const url = `${this.baseUrl}/payments/${paymentKey}/cancel`;
    const authHeader = Buffer.from(`${this.secretKey}:`).toString('base64');

    const body: any = {
      cancelReason,
    };

    if (cancelAmount) {
      body.cancelAmount = cancelAmount;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('Payment cancellation failed', errorData);
        throw new Error(
          `Payment cancellation failed: ${errorData.message || response.statusText}`,
        );
      }

      const data = await response.json();
      this.logger.log(`Payment cancelled: ${paymentKey}`);

      return data;
    } catch (error) {
      this.logger.error('Error cancelling payment', error);
      throw error;
    }
  }
}
