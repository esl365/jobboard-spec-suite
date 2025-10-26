export type PaymentStatus = "PENDING" | "SETTLED";

export interface PaymentOrder {
  orderId: string;
  userId: string;
  totalAmountCents: number;
  status: PaymentStatus;
  idempotencyKey: string;
  businessHash: string;
  provider: string;
  providerPaymentId?: string;
  providerMeta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecordedWebhookEvent {
  provider: string;
  eventUid: string;
  fingerprint: string;
  receivedAt: Date;
}

export interface WalletLedgerEntry {
  entryId: string;
  orderId: string;
  amountCents: number;
  createdAt: Date;
}

export interface OrderIdempotencyLookup {
  orderId: string;
  businessHash: string;
}

export interface PaymentRepositoryTransaction {
  saveOrder(order: PaymentOrder): Promise<void>;
  saveIdempotencyKey(idempotencyKey: string, lookup: OrderIdempotencyLookup): Promise<void>;
  saveWebhookEvent(event: RecordedWebhookEvent): Promise<boolean>;
  appendWalletLedger(entry: WalletLedgerEntry): Promise<void>;
  getOrderById(orderId: string): Promise<PaymentOrder | undefined>;
  getIdempotencyKey(idempotencyKey: string): Promise<OrderIdempotencyLookup | undefined>;
  getWebhookEvent(provider: string, eventUid: string): Promise<RecordedWebhookEvent | undefined>;
}

export interface PaymentsRepository {
  withTransaction<T>(callback: (tx: PaymentRepositoryTransaction) => Promise<T>): Promise<T>;
}

export interface WebhookSettlementInput {
  provider: string;
  eventUid: string;
  orderId: string;
  providerPaymentId: string;
  amountCents: number;
  fingerprint: string;
}

export const SIGNATURE_HEADER = "x-payments-signature";
export const SIGNATURE_TIMESTAMP_HEADER = "x-payments-signature-timestamp";
