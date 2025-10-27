export interface PaymentInitiateResult {
  orderId: string;
  amount: number;
  checkoutUrl: string;
  provider: string;
  providerOrderId?: string;
}

export interface PaymentConfirmResult {
  orderId: string;
  transactionId: string;
  status: 'COMPLETED' | 'FAILED';
  amount: number;
  paidAt: Date;
  raw?: any; // Provider-specific data
}

export interface WebhookValidationResult {
  isValid: boolean;
  eventId?: string;
  data?: any;
}

export interface IPaymentProvider {
  /**
   * Provider name (e.g., 'toss', 'stripe')
   */
  readonly name: string;

  /**
   * Initiate a payment and get checkout URL
   */
  initiate(params: {
    orderId: string;
    amount: number;
    orderName: string;
    customerEmail: string;
  }): Promise<PaymentInitiateResult>;

  /**
   * Confirm payment after user completes checkout
   */
  confirm(params: {
    orderId: string;
    paymentKey: string;
    amount: number;
  }): Promise<PaymentConfirmResult>;

  /**
   * Validate and parse webhook from provider
   */
  handleWebhook(payload: any, signature?: string): Promise<WebhookValidationResult>;
}
