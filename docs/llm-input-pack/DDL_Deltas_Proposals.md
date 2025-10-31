# DDL Delta Proposals — Payments Data Model Enhancements

> **Purpose**: Precise SQL patches to address SPEC_GAPS categories D (data model gaps). These proposals are **not yet approved** — they document the minimal schema changes needed to support the functional specs (Part1, Part2) and acceptance tests.

**Status**: PROPOSAL (awaiting approval before applying)

**References**:
- SPEC_GAPS.md → Section D (Data model gaps)
- Part1 Section 6.2 (Orders, Idempotency, Webhook events)
- Part1 Section 6.3 (Wallet ledger)
- migrations/20251025_0001_payments.sql

---

## Delta 1: orders.provider_meta (Reconciliation Metadata)

**Gap**: Part1 Section 6.2 mentions optional `providerMeta` (JSON for reconciliation) but column does not exist in DDL.

**Impact**: Cannot store provider-specific data (e.g., Iamport `imp_uid`, Inicis `P_TID`) for debugging or dispute resolution.

**Proposal**: Add nullable JSONB column to `orders` table.

### SQL Patch

```sql
-- Migration: 20251026_0002_add_provider_meta.sql
ALTER TABLE orders
  ADD COLUMN provider_meta JSONB DEFAULT NULL;

COMMENT ON COLUMN orders.provider_meta IS
  'Provider-specific metadata for reconciliation (e.g., {"imp_uid": "...", "raw_response": {...}})';

-- Optional: Add GIN index for JSON queries if needed
-- CREATE INDEX idx_orders_provider_meta ON orders USING GIN (provider_meta);
```

### Usage Example

When webhook handler receives Iamport callback:
```javascript
await db.query(`
  UPDATE orders
  SET status = 'COMPLETED',
      provider_payment_id = $1,
      provider_meta = $2,
      updated_at = now()
  WHERE order_id = $3
`, [
  webhookData.imp_uid,
  {
    imp_uid: webhookData.imp_uid,
    merchant_uid: webhookData.merchant_uid,
    paid_at: webhookData.paid_at,
    receipt_url: webhookData.receipt_url
  },
  orderId
]);
```

**Risk**: None (nullable, backward compatible)

---

## Delta 2: idempotency_keys.expires_at (TTL Policy)

**Gap**: Part1 Section 10 notes "idempotency TTL — TBD". Keys accumulate forever without cleanup policy.

**Impact**: Table bloat over time; unbounded storage growth.

**Proposal**: Add `expires_at` column with default 7-day TTL. Document policy in Part1.

### SQL Patch

```sql
-- Migration: 20251026_0003_add_idempotency_ttl.sql
ALTER TABLE idempotency_keys
  ADD COLUMN expires_at TIMESTAMPTZ NOT NULL
    DEFAULT (now() + INTERVAL '7 days');

COMMENT ON COLUMN idempotency_keys.expires_at IS
  'Expiration time for idempotency key. Keys older than this can be purged. Default: 7 days from creation.';

-- Index for efficient purge queries
CREATE INDEX idx_idempotency_keys_expires_at
  ON idempotency_keys(expires_at);
```

### Cleanup Job (Cron or Background Worker)

```sql
-- Delete expired idempotency keys (run daily)
DELETE FROM idempotency_keys
WHERE expires_at < now() - INTERVAL '1 day'; -- grace period
```

**Policy Document** (add to Part1 Section 6.2):
```markdown
#### Idempotency Key TTL Policy

- **Retention period**: 7 days (default)
- **Rationale**: Clients should not retry requests after 7 days; if they do, they will get a fresh order instead of the cached response.
- **Cleanup**: Automated daily purge of keys with `expires_at < now() - 1 day` (grace period).
- **Configuration**: TTL can be adjusted per deployment via environment variable `IDEMPOTENCY_TTL_DAYS`.
```

**Risk**: Very low
- Existing rows get default expires_at = now() + 7 days on migration
- Clients retrying >7 days later will create new orders (acceptable behavior)

---

## Delta 3: webhook_events.retention_until (Dispute Window Policy)

**Gap**: Part1 Section 9 mentions webhook events should be "retained long enough for dispute windows" but no TTL or policy defined.

**Impact**: Unbounded growth; cannot purge old events safely.

**Proposal**: Add `retention_until` column with provider-specific TTL (90-180 days).

### SQL Patch

```sql
-- Migration: 20251026_0004_add_webhook_retention.sql
ALTER TABLE webhook_events
  ADD COLUMN retention_until TIMESTAMPTZ NOT NULL
    DEFAULT (now() + INTERVAL '180 days');

COMMENT ON COLUMN webhook_events.retention_until IS
  'Retention policy end date (provider-specific dispute window). Inicis: 90d, Iamport: 180d, default: 180d.';

-- Index for efficient purge queries
CREATE INDEX idx_webhook_events_retention_until
  ON webhook_events(retention_until);
```

### Provider-Specific TTL Configuration

When inserting webhook event, calculate `retention_until` based on provider:

```javascript
const PROVIDER_DISPUTE_WINDOWS = {
  'inicis': 90,  // days
  'iamport': 180,
  'toss': 180,
  'mock': 30
};

const retentionDays = PROVIDER_DISPUTE_WINDOWS[provider] || 180;
const retentionUntil = new Date();
retentionUntil.setDate(retentionUntil.getDate() + retentionDays);

await db.query(`
  INSERT INTO webhook_events (event_uid, provider, payload, signature, retention_until)
  VALUES ($1, $2, $3, $4, $5)
`, [eventUid, provider, payload, signature, retentionUntil]);
```

### Cleanup Job

```sql
-- Delete webhook events past retention period (run weekly)
DELETE FROM webhook_events
WHERE retention_until < now();
```

**Policy Document** (add to Part1 Section 6.2):
```markdown
#### Webhook Event Retention Policy

- **Retention period**: Provider-specific
  - Inicis: 90 days (per Inicis dispute window policy)
  - Iamport/Toss: 180 days (per standard dispute window)
  - Mock/test: 30 days
  - Default: 180 days

- **Rationale**: Payment disputes can occur up to 180 days after transaction. Events must be retained for audit/reconciliation during this window.

- **Cleanup**: Automated weekly purge of events with `retention_until < now()`.

- **Configuration**: Override per deployment via `WEBHOOK_RETENTION_DAYS_{PROVIDER}` environment variables.
```

**Risk**: Very low
- Existing rows get default retention_until = now() + 180 days
- 180-day default is conservative (covers longest dispute windows)

---

## Delta 4: Partial Refund Support (PROPOSAL — DECISION REQUIRED)

**Gap**: Current `orders.status` enum is `[PENDING, COMPLETED, FAILED, REFUNDED]`. No support for partial refunds.

**Impact**: Cannot distinguish between full and partial refunds; wallet_ledger can track partial DEBIT entries but order status is ambiguous.

**Two Options**:

### Option A: Add PARTIALLY_REFUNDED Status

**Pros**: Simple; one field change
**Cons**: Loses refund history (can only see current state)

```sql
-- Migration: 20251026_0005a_add_partial_refund_status.sql
ALTER TABLE orders
  DROP CONSTRAINT orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('PENDING','COMPLETED','FAILED','REFUNDED','PARTIALLY_REFUNDED'));
```

**State machine update**:
```
COMPLETED → PARTIALLY_REFUNDED (webhook: payment.refunded, partial amount)
PARTIALLY_REFUNDED → REFUNDED (webhook: payment.refunded, remaining amount)
COMPLETED → REFUNDED (webhook: payment.refunded, full amount)
```

### Option B: Create order_refunds Table (RECOMMENDED)

**Pros**: Full audit trail; supports multiple partial refunds; maintains COMPLETED status until fully refunded
**Cons**: Additional table; more complex queries

```sql
-- Migration: 20251026_0005b_add_order_refunds_table.sql
CREATE TABLE order_refunds (
  refund_id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(order_id),
  refund_amount_cents INTEGER NOT NULL CHECK (refund_amount_cents > 0),
  provider_refund_id TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  INDEX idx_order_refunds_order_id (order_id)
);

COMMENT ON TABLE order_refunds IS
  'Audit log of all refund transactions. Supports multiple partial refunds per order.';
```

**Business logic**:
```javascript
// On webhook refund event
const totalRefunded = await db.query(`
  SELECT COALESCE(SUM(refund_amount_cents), 0) as total
  FROM order_refunds WHERE order_id = $1
`, [orderId]);

const order = await getOrder(orderId);
const refundedSoFar = totalRefunded.rows[0].total + refundAmountCents;

const newStatus = (refundedSoFar >= order.total_amount_cents)
  ? 'REFUNDED'
  : 'COMPLETED'; // keep COMPLETED for partial

await db.query(`
  INSERT INTO order_refunds (order_id, refund_amount_cents, provider_refund_id, reason)
  VALUES ($1, $2, $3, $4)
`, [orderId, refundAmountCents, providerRefundId, reason]);

await db.query(`
  UPDATE orders SET status = $1, updated_at = now()
  WHERE order_id = $2
`, [newStatus, orderId]);
```

**State machine** (unchanged):
```
COMPLETED → COMPLETED (partial refunds tracked in order_refunds)
COMPLETED → REFUNDED (when sum(order_refunds) >= total_amount_cents)
```

### Recommendation

**Choose Option B** (order_refunds table):
- Better audit trail
- Supports complex refund scenarios (e.g., 3x partial refunds)
- Orders remain COMPLETED until fully refunded (clearer semantics)
- Aligns with append-only ledger philosophy (wallet_ledger)

**Decision needed**: Approve Option A or B in SPEC_GAPS.md before implementing.

---

## Summary Table

| Delta | Gap ID | File | Priority | Risk | Approval Status |
|-------|--------|------|----------|------|-----------------|
| 1. orders.provider_meta | D.3 | orders | MEDIUM | NONE | PROPOSED |
| 2. idempotency_keys.expires_at | D.4 | idempotency_keys | LOW | LOW | PROPOSED |
| 3. webhook_events.retention_until | D.5 | webhook_events | LOW | LOW | PROPOSED |
| 4. Partial refund support | D.1 | orders/order_refunds | MEDIUM | MEDIUM | **DECISION REQUIRED** (Option A vs B) |

---

## Migration Order (if approved)

```bash
# Run these migrations in sequence
psql -f migrations/20251026_0002_add_provider_meta.sql
psql -f migrations/20251026_0003_add_idempotency_ttl.sql
psql -f migrations/20251026_0004_add_webhook_retention.sql

# After decision on Delta 4:
psql -f migrations/20251026_0005a_add_partial_refund_status.sql  # OR
psql -f migrations/20251026_0005b_add_order_refunds_table.sql
```

---

## Rollback Procedures

All deltas are **additive** (no data loss):

```sql
-- Rollback Delta 1
ALTER TABLE orders DROP COLUMN provider_meta;

-- Rollback Delta 2
DROP INDEX idx_idempotency_keys_expires_at;
ALTER TABLE idempotency_keys DROP COLUMN expires_at;

-- Rollback Delta 3
DROP INDEX idx_webhook_events_retention_until;
ALTER TABLE webhook_events DROP COLUMN retention_until;

-- Rollback Delta 4a
ALTER TABLE orders DROP CONSTRAINT orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('PENDING','COMPLETED','FAILED','REFUNDED'));

-- Rollback Delta 4b
DROP TABLE order_refunds;
```

---

## Next Actions

1. Review proposals in team/spec meeting
2. Decide on partial refund approach (Option A vs B)
3. Update Part1_Functional_Data_Spec.md with policy additions
4. Approve deltas in SPEC_GAPS.md (mark as "Approved for implementation")
5. Codex creates migration files matching these schemas
6. Test migrations on staging DB before production

**End of Proposals**
