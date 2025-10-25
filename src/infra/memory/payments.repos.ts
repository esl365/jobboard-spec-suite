import crypto from "node:crypto";
import { PaymentsRepository, PaymentsRepositoryTransaction } from "../payments.repository.ts";
import { stableStringify } from "../../utils/stableStringify.ts";

function hashBusinessData(business) {
  return crypto.createHash("sha256").update(stableStringify(business)).digest("hex");
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

class InMemoryTransaction extends PaymentsRepositoryTransaction {
  constructor(state) {
    super();
    this.state = state;
  }

  findIdempotencyRecord(key, userId, method, path) {
    return (
      this.state.idempotencyKeys.find(
        entry => entry.key === key && entry.userId === userId && entry.method === method && entry.path === path,
      ) || null
    );
  }

  saveIdempotencyRecord(record) {
    const hash = record.businessHash || hashBusinessData(record.businessData);
    const existingIndex = this.state.idempotencyKeys.findIndex(
      entry => entry.key === record.key && entry.userId === record.userId && entry.method === record.method && entry.path === record.path,
    );
    const entry = {
      key: record.key,
      userId: record.userId,
      method: record.method,
      path: record.path,
      businessHash: hash,
      businessData: clone(record.businessData),
      orderId: record.orderId,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    };
    if (existingIndex >= 0) {
      this.state.idempotencyKeys[existingIndex] = entry;
    } else {
      this.state.idempotencyKeys.push(entry);
    }
    return entry;
  }

  findOrderById(orderId) {
    return this.state.orders.find(order => order.orderId === orderId) || null;
  }

  findOrderByProviderReference(provider, providerPaymentId) {
    return (
      this.state.orders.find(order => order.provider === provider && order.providerPaymentId === providerPaymentId) || null
    );
  }

  insertOrder(order) {
    this.state.orders.push(clone(order));
    return clone(order);
  }

  updateOrder(orderId, patch) {
    const idx = this.state.orders.findIndex(o => o.orderId === orderId);
    if (idx < 0) return null;
    const next = { ...this.state.orders[idx], ...patch };
    this.state.orders[idx] = clone(next);
    return clone(next);
  }

  insertWalletLedger(entry) {
    this.state.walletLedger.push(clone(entry));
  }

  findWebhookEvent(eventUid) {
    return this.state.webhookEvents.find(event => event.eventUid === eventUid) || null;
  }

  insertWebhookEvent(event) {
    const existing = this.state.webhookEvents.find(e => e.eventUid === event.eventUid);
    if (existing) {
      throw new Error("Duplicate webhook event");
    }
    this.state.webhookEvents.push(clone(event));
    return clone(event);
  }

  getProductPackage(packageId) {
    if (!packageId) return null;
    return this.state.productPackages.find(pkg => pkg.packageId === packageId) || null;
  }
}

export class InMemoryPaymentsRepository extends PaymentsRepository {
  constructor(initialState = {}) {
    super();
    this.state = {
      orders: [],
      idempotencyKeys: [],
      webhookEvents: [],
      walletLedger: [],
      productPackages: [],
      ...clone(initialState),
    };
  }

  async runInTransaction(fn) {
    const working = new InMemoryTransaction(clone(this.state));
    const result = await fn(working);
    this.state = clone(working.state);
    return result;
  }

  snapshot() {
    return clone(this.state);
  }
}

export function createInMemoryRepository(initialState) {
  return new InMemoryPaymentsRepository(initialState);
}
