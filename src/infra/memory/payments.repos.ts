import {
  OrderIdempotencyLookup,
  PaymentOrder,
  PaymentRepositoryTransaction,
  PaymentsRepository,
  RecordedWebhookEvent,
  WalletLedgerEntry
} from "../../payments/types.js";

class MemoryTransaction implements PaymentRepositoryTransaction {
  constructor(private readonly store: InMemoryPaymentsRepository) {}

  async saveOrder(order: PaymentOrder): Promise<void> {
    this.store.orders.set(order.orderId, { ...order });
  }

  async saveIdempotencyKey(idempotencyKey: string, lookup: OrderIdempotencyLookup): Promise<void> {
    this.store.idempotencyKeys.set(idempotencyKey, { ...lookup });
  }

  async saveWebhookEvent(event: RecordedWebhookEvent): Promise<boolean> {
    const key = this.store.eventKey(event.provider, event.eventUid);
    if (this.store.webhookEvents.has(key)) {
      return false;
    }
    this.store.webhookEvents.set(key, { ...event });
    return true;
  }

  async appendWalletLedger(entry: WalletLedgerEntry): Promise<void> {
    this.store.walletLedger.push({ ...entry });
  }

  async getOrderById(orderId: string): Promise<PaymentOrder | undefined> {
    const order = this.store.orders.get(orderId);
    return order ? { ...order } : undefined;
  }

  async getIdempotencyKey(idempotencyKey: string): Promise<OrderIdempotencyLookup | undefined> {
    const lookup = this.store.idempotencyKeys.get(idempotencyKey);
    return lookup ? { ...lookup } : undefined;
  }

  async getWebhookEvent(provider: string, eventUid: string): Promise<RecordedWebhookEvent | undefined> {
    const stored = this.store.webhookEvents.get(this.store.eventKey(provider, eventUid));
    return stored ? { ...stored } : undefined;
  }
}

export class InMemoryPaymentsRepository implements PaymentsRepository {
  readonly orders = new Map<string, PaymentOrder>();
  readonly idempotencyKeys = new Map<string, OrderIdempotencyLookup>();
  readonly webhookEvents = new Map<string, RecordedWebhookEvent>();
  readonly walletLedger: WalletLedgerEntry[] = [];

  async withTransaction<T>(callback: (tx: PaymentRepositoryTransaction) => Promise<T>): Promise<T> {
    const tx = new MemoryTransaction(this);
    return callback(tx);
  }

  eventKey(provider: string, eventUid: string): string {
    return `${provider}:${eventUid}`;
  }
}
