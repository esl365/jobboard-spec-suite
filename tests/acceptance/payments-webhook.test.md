# Acceptance Tests: POST /webhooks/payments/{provider}

## Test Suite: Payments Webhook Endpoint (Exactly-Once Semantics)

### Purpose
Verify that payment provider webhooks are processed with exactly-once guarantees, proper signature verification, and correct state transitions.

---

## A) Happy Path Tests

### A1: First successful payment completion
**Given:**
- Order exists: orderId="ord_123", status=PENDING, totalAmountCents=50000, providerPaymentId=null
- Webhook event from provider "mock":
  ```json
  {
    "eventUid": "evt_unique_001",
    "provider": "mock",
    "type": "payment.completed",
    "occurredAt": "2025-10-25T10:30:00Z",
    "data": {
      "orderReference": "ord_123",
      "providerPaymentId": "pay_mock_xyz789",
      "amountCents": 50000
    },
    "signature": "valid_signature_hash"
  }
  ```
- Signature validates correctly

**When:**
- POST /webhooks/payments/mock

**Then:**
- Status: 200
- Response:
  ```json
  {
    "ok": true
  }
  ```
- **Single transaction** updates:
  1. orders: status=PENDING → COMPLETED, providerPaymentId="pay_mock_xyz789"
  2. wallet_ledger: new CREDIT entry (userId=<from order>, amountCents=50000, reasonType="PAYMENT_COMPLETED", orderId="ord_123")
  3. webhook_events: new row with eventUid="evt_unique_001", payload stored
- Job options / entitlements applied (if packageId exists)

**Invariant:**
- All updates in **single atomic transaction**
- wallet_ledger is append-only (no updates)

**Trace:**
- OpenAPI: POST /webhooks/payments/{provider} (200 response)
- Part2: Section 4.2 (webhook settle flow)
- Part1: Section 6.2 (orders), Section 6.3 (wallet_ledger)
- DDL: orders, wallet_ledger, webhook_events

---

### A2: Idempotent replay (duplicate webhook)
**Given:**
- Event A1 already processed (eventUid="evt_unique_001" exists in webhook_events)
- Provider replays **exact same webhook**

**When:**
- POST /webhooks/payments/mock (second time)

**Then:**
- Status: 200 (not 400)
- Response: `{ "ok": true }`
- **No DB changes** (idempotent):
  - orders: unchanged
  - wallet_ledger: no new rows
  - webhook_events: UNIQUE constraint prevents insert; handler detects and returns success

**Invariant:**
- Replays are safe no-ops
- Provider can retry without double-crediting

**Trace:**
- Part2: Section 4.2 (replays are no-ops)
- Part1: Section 6.2 (webhook events UID enforced)
- DDL: webhook_events (event_uid UNIQUE)

---

### A3: Payment failed event
**Given:**
- Order exists: orderId="ord_failed", status=PENDING
- Webhook event:
  ```json
  {
    "eventUid": "evt_fail_001",
    "provider": "mock",
    "type": "payment.failed",
    "occurredAt": "2025-10-25T11:00:00Z",
    "data": {
      "orderReference": "ord_failed",
      "reason": "insufficient_funds"
    },
    "signature": "valid_sig"
  }
  ```

**When:**
- POST /webhooks/payments/mock

**Then:**
- Status: 200
- Response: `{ "ok": true }`
- Updates:
  1. orders: status=PENDING → FAILED
  2. **No wallet_ledger entry** (failed payment = no credits)
  3. webhook_events: stored

**Trace:**
- Part1: Section 6.2 (status: FAILED)
- Part2: Section 4.2 (state transitions)

---

### A4: Payment refunded event (compensation)
**Given:**
- Order exists: orderId="ord_refund", status=COMPLETED, totalAmountCents=30000
- Wallet ledger has CREDIT entry for 30000
- Webhook event:
  ```json
  {
    "eventUid": "evt_refund_001",
    "provider": "mock",
    "type": "payment.refunded",
    "occurredAt": "2025-10-25T12:00:00Z",
    "data": {
      "orderReference": "ord_refund",
      "refundAmountCents": 30000
    },
    "signature": "valid_sig"
  }
  ```

**When:**
- POST /webhooks/payments/mock

**Then:**
- Status: 200
- Response: `{ "ok": true }`
- Updates:
  1. orders: status=COMPLETED → REFUNDED
  2. wallet_ledger: new **DEBIT** entry (reversing credits: -30000, reasonType="REFUND")
  3. webhook_events: stored

**Invariant:**
- Ledger is append-only; refunds are reversing entries, not in-place edits

**Trace:**
- Part1: Section 6.3 (wallet ledger corrections)
- Part2: Section 4.2 (compensations)

---

## B) Negative Path Tests

### B1: Invalid signature
**Given:**
- Valid webhook payload but **signature does not match**

**When:**
- POST /webhooks/payments/mock

**Then:**
- Status: 400
- Error:
  ```json
  {
    "code": "INVALID_SIGNATURE",
    "message": "Webhook signature verification failed"
  }
  ```
- **No DB changes** (handler rejects early)

**Trace:**
- Part2: Section 4.2 (signature verification)
- SPEC_GAPS: legacy had no signature checks (risk addressed)

---

### B2: Missing signature field
**Given:**
- Webhook payload with `signature: null` or missing

**When:**
- POST /webhooks/payments/mock

**Then:**
- Status: 400
- Error:
  ```json
  {
    "code": "MISSING_SIGNATURE",
    "message": "Webhook signature is required"
  }
  ```

**Trace:**
- OpenAPI: signature field in WebhookEvent schema
- Part2: Section 4.2 (security: signature verification)

---

### B3: Unknown event type
**Given:**
- Webhook with `type: "payment.unknown_event"`

**When:**
- POST /webhooks/payments/mock

**Then:**
- Status: 400
- Error:
  ```json
  {
    "code": "UNKNOWN_EVENT_TYPE",
    "message": "Event type not supported"
  }
  ```

**Trace:**
- OpenAPI: type enum [payment.completed, payment.failed, payment.refunded]

---

### B4: Order not found
**Given:**
- Webhook references orderReference="ord_nonexistent"
- Order does not exist in DB

**When:**
- POST /webhooks/payments/mock

**Then:**
- Status: 400
- Error:
  ```json
  {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found for webhook event"
  }
  ```

**Trace:**
- Part2: Section 4.2 (load order by providerPaymentId)
- Implementation: must handle missing orders gracefully

---

### B5: Invalid state transition (already completed)
**Given:**
- Order exists: status=COMPLETED
- Webhook event: type="payment.completed" (tries to complete again)

**When:**
- POST /webhooks/payments/mock

**Then:**
- **Option 1 (strict):** Status 400, error "Invalid state transition"
- **Option 2 (lenient):** Status 200, idempotent no-op

**Decision needed:**
- Check SPEC_GAPS for state machine rules
- Recommend: 200 + no-op (safe replay behavior)

**Trace:**
- Part1: Section 6.2 (state machine)
- Part2: Section 4.2 (state transitions)

---

### B6: Provider mismatch
**Given:**
- URL path: /webhooks/payments/mock
- Webhook body: `"provider": "iamport"`

**When:**
- POST /webhooks/payments/mock

**Then:**
- Status: 400
- Error:
  ```json
  {
    "code": "PROVIDER_MISMATCH",
    "message": "Provider in URL does not match webhook payload"
  }
  ```

**Trace:**
- OpenAPI: path parameter {provider}
- Security: prevent cross-provider attacks

---

## C) Security Tests

### C1: Public endpoint (no auth required)
**Given:**
- Request with **no Authorization header**

**When:**
- POST /webhooks/payments/mock

**Then:**
- Status: 200 or 400 (depending on payload/signature)
- **Does NOT return 401** (webhooks are public + signature-protected)

**Trace:**
- Part2: Section 4.2 (security: [] + signature verification)
- OpenAPI: no security scheme on webhook endpoint

---

### C2: Replay attack prevention
**Given:**
- Old valid webhook event captured by attacker
- Event already processed (eventUid exists)

**When:**
- Attacker replays old webhook

**Then:**
- Status: 200 (idempotent)
- **No double-credit** (eventUid uniqueness prevents re-execution)

**Trace:**
- DDL: webhook_events (event_uid UNIQUE)
- Part2: Section 4.2 (idempotency via event UID)

---

### C3: Timing attack on signature (constant-time comparison)
**Given:**
- Implementation must use constant-time string comparison for signatures

**When:**
- Measure response times for various invalid signatures

**Then:**
- Response times do not leak signature validity info
- Use crypto-safe comparison (e.g., `timingSafeEqual`)

**Trace:**
- Security best practice
- SPEC_GAPS: legacy had NO signature checks

---

## D) Edge Cases & Concurrency

### D1: Concurrent webhook delivery (same eventUid)
**Given:**
- Provider sends duplicate webhook simultaneously (network retry)
- 2 requests arrive with same eventUid

**When:**
- Both processed in parallel

**Then:**
- Exactly 1 processes successfully
- Other fails on UNIQUE constraint or serializable transaction
- Both return 200 (safe)

**Trace:**
- DDL: UNIQUE constraint on event_uid
- Transaction isolation level

---

### D2: Partial refund
**Given:**
- Order: totalAmountCents=100000, status=COMPLETED
- Refund event: refundAmountCents=30000 (partial)

**When:**
- POST /webhooks/payments/mock

**Then:**
- Status: 200
- Updates:
  1. orders: status=REFUNDED (or new status PARTIALLY_REFUNDED?)
  2. wallet_ledger: DEBIT entry for -30000

**Decision needed:**
- SPEC_GAPS: Does status enum support PARTIALLY_REFUNDED?
- Current enum: [PENDING, COMPLETED, FAILED, REFUNDED]
- Recommend: Add PARTIALLY_REFUNDED or track in separate field

**Trace:**
- Part1: Section 6.2 (status enum)
- Gap: partial refund handling **TBD**

---

### D3: Missing optional fields in webhook data
**Given:**
- Webhook data has minimal fields:
  ```json
  {
    "eventUid": "evt_min_001",
    "provider": "mock",
    "type": "payment.completed",
    "occurredAt": "2025-10-25T10:00:00Z",
    "data": {
      "orderReference": "ord_123"
    },
    "signature": "valid"
  }
  ```
- Missing: providerPaymentId, amountCents

**When:**
- POST /webhooks/payments/mock

**Then:**
- Behavior depends on provider contract
- Recommend: 400 if required fields missing

**Trace:**
- OpenAPI: data is object with additionalProperties
- Provider-specific schema needed

---

## E) Transaction Boundaries

### E1: Atomic order + ledger update
**Test:**
- Simulate DB failure after order update but before ledger insert

**Expected:**
- **Full rollback** (transaction boundary enforced)
- Order status remains PENDING
- No ledger entry created

**Trace:**
- Part1: Section 7 (single-transaction side-effects)
- Part2: Section 4.2 (single transaction requirement)

---

### E2: Idempotency key insert races
**Test:**
- Two concurrent webhooks with different eventUids for same order

**Expected:**
- First completes transaction
- Second sees status=COMPLETED and either:
  - (A) Returns 200 as no-op, or
  - (B) Returns 400 for invalid state

**Trace:**
- Transaction isolation and state machine enforcement

---

## F) Golden Samples

### F1: Successful completion webhook
```bash
curl -X POST https://api.example.com/webhooks/payments/mock \
  -H "Content-Type: application/json" \
  -d '{
    "eventUid": "evt_golden_001",
    "provider": "mock",
    "type": "payment.completed",
    "occurredAt": "2025-10-25T14:00:00Z",
    "data": {
      "orderReference": "ord_golden_1",
      "providerPaymentId": "pay_golden_xyz",
      "amountCents": 200000
    },
    "signature": "hmac_sha256_signature_here"
  }'
```

**Expected:**
```json
{
  "ok": true
}
```

**DB changes:**
- orders: ord_golden_1 → status=COMPLETED, providerPaymentId=pay_golden_xyz
- wallet_ledger: +200000 CREDIT
- webhook_events: evt_golden_001 stored

---

### F2: Refund webhook
```bash
curl -X POST https://api.example.com/webhooks/payments/iamport \
  -H "Content-Type: application/json" \
  -d '{
    "eventUid": "evt_refund_golden",
    "provider": "iamport",
    "type": "payment.refunded",
    "occurredAt": "2025-10-25T15:00:00Z",
    "data": {
      "orderReference": "ord_refund_golden",
      "refundAmountCents": 150000
    },
    "signature": "valid_iamport_sig"
  }'
```

**Expected:**
```json
{
  "ok": true
}
```

**DB changes:**
- orders: status=COMPLETED → REFUNDED
- wallet_ledger: -150000 DEBIT (reversing entry)

---

## G) Contract Adherence Checklist

- [ ] Webhook signature verified before processing
- [ ] eventUid uniqueness enforced (dedupe)
- [ ] Replay returns 200 with no side-effects
- [ ] State transitions follow spec: PENDING → COMPLETED | FAILED | REFUNDED
- [ ] wallet_ledger entries only on COMPLETED
- [ ] Refunds create reversing DEBIT entries
- [ ] Single transaction boundary for order + ledger + webhook_events
- [ ] No in-place edits of wallet_ledger (append-only)
- [ ] Provider parameter in URL matches payload
- [ ] Response always includes `{ "ok": true }` on success
- [ ] 400 on bad signature/payload, not 500
- [ ] Job options/entitlements applied on COMPLETED

---

## H) Provider-Specific Adapters

### H1: Mock provider signature
**Algorithm:**
- HMAC-SHA256(secret="mock_secret", payload=JSON body)

**Test:**
```javascript
const crypto = require('crypto');
const secret = 'mock_secret';
const payload = JSON.stringify(webhookBody);
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
```

---

### H2: Iamport provider signature
**Algorithm:**
- Per Iamport docs (varies by provider)
- Example: SHA256(merchant_key + payload fields)

**Trace:**
- specs/Feature_Payment_How_Spec.md (adapter requirements)

---

## I) Observability & Audit

### I1: Structured logging requirements
**On every webhook:**
- Log entry with:
  - correlationId (generated)
  - provider
  - eventUid
  - signatureValid (bool)
  - orderReference
  - stateTransition (e.g., "PENDING→COMPLETED")
  - processingTimeMs

**Trace:**
- Part2: Section 6 (audit logs)

---

### I2: Metrics to track
- `webhook.received` (counter by provider, type)
- `webhook.signature_failed` (counter)
- `webhook.duplicate` (counter)
- `webhook.processing_time` (histogram)

---

## J) SPEC_GAPS Coverage

**Tests address legacy vulnerabilities:**

| Legacy Gap | Test Coverage |
|------------|---------------|
| Inicis NOTI no signature | B1 (invalid signature), C1 (signature required) |
| IP-only auth (spoofable) | C1 (signature-based auth) |
| Session-based amount check | A1 (DB-backed order lookup) |
| No replay protection | A2 (eventUid dedupe) |
| AllTheGate no HMAC | B1 (signature enforcement) |

**Trace:**
- SPEC_GAPS.md: Section B (Legacy PG callback gaps)

---

## Summary
- **Total test cases:** 31
- **Coverage:** happy path (4), negative (6), security (3), edge (3), transaction (2), golden (2), contract (12), provider (2), observability (2), gaps (5)
- **Critical invariants tested:**
  - Exactly-once processing (eventUid uniqueness)
  - Signature verification mandatory
  - Single transaction boundary
  - Append-only ledger
  - Idempotent replays
  - State machine enforcement
