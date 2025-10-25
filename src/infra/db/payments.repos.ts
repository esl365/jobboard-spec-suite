import { PaymentsRepository, PaymentsRepositoryTransaction } from "../payments.repository.ts";

class PgPaymentsTransaction extends PaymentsRepositoryTransaction {
  constructor(client) {
    super();
    this.client = client;
  }

  async findIdempotencyRecord(key, userId, method, path) {
    const sql = `SELECT idem_key AS "key", user_id AS "userId", method, path, business_hash AS "businessHash", order_id AS "orderId", expires_at AS "expiresAt"
      FROM idempotency_keys WHERE idem_key = $1 AND user_id = $2 AND method = $3 AND path = $4`;
    const res = await this.client.query(sql, [key, userId, method, path]);
    return res.rows[0] || null;
  }

  async saveIdempotencyRecord(record) {
    const sql = `INSERT INTO idempotency_keys (idem_key, user_id, method, path, business_hash, order_id, expires_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (idem_key, user_id, method, path)
      DO UPDATE SET business_hash = EXCLUDED.business_hash, order_id = EXCLUDED.order_id, expires_at = EXCLUDED.expires_at`;
    await this.client.query(sql, [
      record.key,
      record.userId,
      record.method,
      record.path,
      record.businessHash,
      record.orderId,
      record.expiresAt,
    ]);
  }

  async findOrderById(orderId) {
    const res = await this.client.query(
      `SELECT order_id AS "orderId", user_id AS "userId", total_amount_cents AS "totalAmountCents", provider, provider_payment_id AS "providerPaymentId", status, provider_meta AS "providerMeta", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM orders WHERE order_id = $1`,
      [orderId],
    );
    return res.rows[0] || null;
  }

  async findOrderByProviderReference(provider, providerPaymentId) {
    const res = await this.client.query(
      `SELECT order_id AS "orderId", user_id AS "userId", total_amount_cents AS "totalAmountCents", provider, provider_payment_id AS "providerPaymentId", status, provider_meta AS "providerMeta", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM orders WHERE provider = $1 AND provider_payment_id = $2`,
      [provider, providerPaymentId],
    );
    return res.rows[0] || null;
  }

  async insertOrder(order) {
    const sql = `INSERT INTO orders (order_id, user_id, total_amount_cents, provider, provider_payment_id, status, created_at, updated_at, provider_meta)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING order_id AS "orderId", user_id AS "userId", total_amount_cents AS "totalAmountCents", provider, provider_payment_id AS "providerPaymentId", status, provider_meta AS "providerMeta", created_at AS "createdAt", updated_at AS "updatedAt"`;
    const res = await this.client.query(sql, [
      order.orderId,
      order.userId,
      order.totalAmountCents,
      order.provider,
      order.providerPaymentId,
      order.status,
      order.createdAt,
      order.updatedAt,
      order.providerMeta,
    ]);
    return res.rows[0];
  }

  async updateOrder(orderId, patch) {
    const sql = `UPDATE orders SET status = $2, provider_payment_id = COALESCE($3, provider_payment_id), updated_at = $4, provider_meta = COALESCE($5, provider_meta)
      WHERE order_id = $1
      RETURNING order_id AS "orderId", user_id AS "userId", total_amount_cents AS "totalAmountCents", provider, provider_payment_id AS "providerPaymentId", status, provider_meta AS "providerMeta", created_at AS "createdAt", updated_at AS "updatedAt"`;
    const res = await this.client.query(sql, [
      orderId,
      patch.status,
      patch.providerPaymentId || null,
      patch.updatedAt,
      patch.providerMeta || null,
    ]);
    return res.rows[0] || null;
  }

  async insertWalletLedger(entry) {
    const sql = `INSERT INTO wallet_ledger (user_id, order_id, direction, amount_cents, reason_type, created_at)
      VALUES ($1,$2,$3,$4,$5,$6)`;
    await this.client.query(sql, [
      entry.userId,
      entry.orderId,
      entry.direction,
      entry.amountCents,
      entry.reasonType,
      entry.createdAt,
    ]);
  }

  async findWebhookEvent(provider, eventUid) {
    const sql = `SELECT event_id AS "eventId", event_uid AS "eventUid", provider, payload_fingerprint AS "payloadFingerprint"`
      FROM webhook_events WHERE provider = $1 AND event_uid = $2`;
    const res = await this.client.query(sql, [provider, eventUid]);
    return res.rows[0] || null;
  }

  async insertWebhookEvent(event) {
    const sql = `INSERT INTO webhook_events (event_uid, provider, received_at, payload, signature, payload_fingerprint, retention_until)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`;
    await this.client.query(sql, [
      event.eventUid,
      event.provider,
      event.receivedAt,
      event.payload,
      event.signature,
      event.payloadFingerprint,
      event.retentionUntil,
    ]);
  }

  async getProductPackage(packageId) {
    if (!packageId) return null;
    const sql = `SELECT package_id AS "packageId", amount_cents AS "amountCents", currency, active
      FROM product_packages WHERE package_id = $1`;
    const res = await this.client.query(sql, [packageId]);
    return res.rows[0] || null;
  }
}

export class PgPaymentsRepository extends PaymentsRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async runInTransaction(fn) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const tx = new PgPaymentsTransaction(client);
      const result = await fn(tx);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {}
      throw err;
    } finally {
      client.release();
    }
  }
}
