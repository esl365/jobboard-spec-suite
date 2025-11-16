# Codex PR Review Comment Templates

**Usage:** When Codex opens `codex/payments-core-v1` Draft PR, post these structured comments sequentially after reviewing each phase.

---

## Phase 1 — Contract Conformance

### Checklist
- [ ] **POST /payments/prepare** — Request/response payloads match `openapi/api-spec.yaml`
- [ ] **POST /webhooks/payments/{provider}** — Request/response payloads match spec
- [ ] **Error shapes** — 400/401/403/409/500 responses use `ErrorResponse` schema
- [ ] **Path parameters** — `{provider}` validated against enum (mock, stripe, paypal)
- [ ] **Headers** — `Idempotency-Key` (prepare), `X-Signature` (webhook) present
- [ ] **Content-Type** — `application/json` enforced
- [ ] **No deprecated endpoints** — Confirm `/orders/prepare` is NOT used

### Findings
<!-- Fill after reviewing routes and OpenAPI spec -->

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED

**Action Required:**
<!-- If FAIL or BLOCKED: -->
<!-- - Add entry to specs/SPEC_GAPS.md (GAP-XXXX: <title>) -->
<!-- - Request spec patch OR code alias route to eliminate drift -->

---

## Phase 2 — Auth/RBAC

### Checklist
- [ ] **Prepare endpoint** — Requires JWT authentication + COMPANY role guard
- [ ] **Webhook endpoint** — Unauthenticated (signature-verified instead)
- [ ] **401 Unauthorized** — Returned when JWT missing/invalid on prepare
- [ ] **403 Forbidden** — Returned when role insufficient (non-COMPANY user)
- [ ] **400 Bad Request** — Returned when signature verification fails on webhook
- [ ] **Error schema alignment** — All auth errors use `ErrorResponse` schema

### Findings
<!-- Fill after reviewing auth middleware and guards -->
- Prepare auth middleware: `src/middleware/...`
- RBAC guard implementation: `src/guards/...`
- Webhook signature verification: `src/webhooks/...`

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED

**Action Required:**
<!-- If negative test coverage missing, request addition -->

---

## Phase 3 — DDL & ORM

### Checklist
- [ ] **ORM-only** — No raw SQL in handlers (use TypeORM/Prisma/similar)
- [ ] **Approved v1 deltas only** — Schema changes limited to:
  - Delta 1: `orders.provider_meta JSONB NULL`
  - Delta 2: `idempotency_keys.expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')`
  - Delta 3: `webhook_events.retention_until TIMESTAMPTZ NULL`
- [ ] **No partial refund schema** — Confirm Delta 4 (order_refunds table) NOT implemented (deferred to v1.1)
- [ ] **Backward compatible migrations** — ALTER TABLE with NULL columns or defaults
- [ ] **Idempotent migrations** — Include `IF NOT EXISTS` / `IF NOT NULL` guards

### Findings
<!-- Fill after reviewing db/migrations/ and src/repositories/ -->
- Migration files: `db/migrations/...`
- Repository pattern: `src/repositories/...`
- DDL drift check: `npm run preflight` → drift = 0

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED

**Action Required:**
<!-- If unapproved schema changes found, request rollback -->

---

## Phase 4 — Idempotency

### Checklist
- [ ] **Business key scope** — Idempotency-Key combined with:
  - `userId` (from JWT)
  - `method` (POST)
  - `path` (/payments/prepare)
  - `packageId` (from request body)
  - `amountCents` (from request body)
- [ ] **Collision detection** — Same key + different business data → **409 Conflict**
- [ ] **Replay success** — Same key + identical business data → **200 OK** (cached response)
- [ ] **Unique constraint** — Database enforces idempotency key uniqueness
- [ ] **Expiration** — Keys expire after 7 days (Delta 2: expires_at)
- [ ] **Negative tests** — Test suite includes:
  - `409_conflict_on_idempotency_collision.test.ts`
  - `200_replay_with_same_key_and_data.test.ts`

### Findings
<!-- Fill after reviewing idempotency middleware/service -->
- Idempotency implementation: `src/services/idempotency.service.ts:...`
- Business key extraction: `src/middleware/idempotency.middleware.ts:...`
- Negative test coverage: `tests/integration/idempotency/...`

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED

**Action Required:**
<!-- If business key scope too narrow (missing amountCents/packageId), request fix -->

---

## Phase 5 — Exactly-Once Webhook Settlement

### Checklist
- [ ] **Event de-duplication** — Unique constraint on `(provider, provider_event_id)` or similar
- [ ] **De-dupe BEFORE side effects** — Check occurs at start of transaction
- [ ] **Single transaction boundary** — Atomically updates:
  - `orders` (status: pending → completed/failed)
  - `wallet_ledger` (append credit entry)
  - `webhook_events` (insert event record)
- [ ] **Replay safety** — Duplicate event → **200 OK** with no duplicate ledger entries
- [ ] **No partial commits** — Transaction rollback on ANY failure
- [ ] **Tests present** — Verify:
  - Duplicate webhook yields single ledger entry
  - Retry after DB error does not double-credit

### Findings
<!-- Fill after reviewing webhook handler and transaction logic -->
- Webhook handler: `src/routes/webhooks.payments.ts:...`
- Transaction boundary: `src/services/payment.service.ts:...`
- Event de-dupe: `src/repositories/webhook-events.repository.ts:...`
- Exactly-once tests: `tests/integration/webhooks/exactly-once.test.ts`

**Critical Evidence Required:**
```typescript
// Example transaction pattern
await db.transaction(async (tx) => {
  // 1. De-dupe check
  const existing = await tx.webhookEvents.findUnique({ provider, provider_event_id });
  if (existing) return { status: 200, message: 'already processed' };

  // 2. Update order
  await tx.orders.update({ where: { orderId }, data: { status: 'completed' } });

  // 3. Append ledger
  await tx.walletLedger.create({ userId, amountCents, type: 'credit' });

  // 4. Record event
  await tx.webhookEvents.create({ provider, provider_event_id, ... });
});
```

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED

**Action Required:**
<!-- If de-dupe after side effects, or no transaction boundary, BLOCK PR -->

---

## Phase 6 — Signature Verification

### Checklist
- [ ] **Raw body verification** — HMAC computed over raw request body (NOT re-parsed JSON)
- [ ] **Algorithm** — HMAC-SHA256 with base64 encoding
- [ ] **Constant-time compare** — Uses `crypto.timingSafeEqual()` or equivalent
- [ ] **Timestamp tolerance** — Rejects events older than 5 minutes (replay protection)
- [ ] **Secret management** — Provider secrets loaded from env vars (MOCK_WEBHOOK_SECRET, STRIPE_WEBHOOK_SECRET)
- [ ] **Test vectors applied** — TV01-TV03 from `specs/Spec-Trace.yml`:
  - TV01: Valid signature → 200
  - TV02: Valid signature (alternate payload) → 200
  - TV03: Wrong secret → 400 INVALID_SIGNATURE
- [ ] **Tampered replay test** — Test suite includes signature mismatch scenario

### Findings
<!-- Fill after reviewing signature verification logic -->
- Signature verification: `src/webhooks/signature.service.ts:...`
- Raw body extraction: `src/middleware/raw-body.middleware.ts:...`
- Test vectors: `tests/integration/webhooks/signature-verification.test.ts`

**Reference Implementation:**
```typescript
import crypto from 'crypto';

function verifySignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}
```

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED

**Action Required:**
<!-- If timing attack vulnerability (=== compare), request fix -->

---

## Phase 7 — Tooling/Preflight

### Checklist
- [ ] **Redocly lint** — Zero errors (or offline fallback accepted temporarily)
- [ ] **OpenAPI↔DDL drift** — Drift check passes (0 mismatches)
- [ ] **Unit tests** — All pass (`npm test`)
- [ ] **Integration tests** — All pass (`npm run test:integration`)
- [ ] **Forbidden patterns scan** — No hardcoded secrets, no raw SQL in routes
- [ ] **Vendor Redocly (if offline)** — If Redocly CLI unavailable, accept fallback but require follow-up PR to vendor for CI

### Findings
<!-- Fill after running preflight -->
```bash
$ npm run preflight
# Paste last 20 lines here
```

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED

**Action Required:**
<!-- If Redocly unavailable, create follow-up ticket: "Vendor Redocly CLI for CI/DoD" -->

---

## Deliverable 1: Spec-Trace Coverage

**Acceptance Test Mapping**

### Prepare Endpoint (`/payments/prepare`)
- [ ] A1: Valid COMPANY user creates order → 201 Created
- [ ] A2: Response includes orderId, status=pending, expiresAt
- [ ] B1: Missing Idempotency-Key → 400 Bad Request
- [ ] B2: Invalid packageId → 404 Not Found
- [ ] B3: Insufficient wallet balance → 402 Payment Required
- [ ] B4: Invalid amountCents (negative) → 400 Bad Request
- [ ] B5: Invalid amountCents (zero) → 400 Bad Request
- [ ] B6: Invalid provider enum → 400 Bad Request
- [ ] B7: Missing required field (packageId) → 400 Bad Request
- [ ] B8: Malformed JSON → 400 Bad Request
- [ ] C1: Missing JWT → 401 Unauthorized
- [ ] C2: Invalid JWT → 401 Unauthorized
- [ ] C3: Non-COMPANY role → 403 Forbidden
- [ ] D1: Idempotency collision (same key, different data) → 409 Conflict
- [ ] D2: Idempotency replay (same key, same data) → 200 OK (cached)
- [ ] D3: Expired Idempotency-Key → 400 Bad Request

**Test File Mapping:**
- `tests/integration/payments/prepare-happy-path.test.ts` → A1, A2
- `tests/integration/payments/prepare-validation.test.ts` → B1-B8
- `tests/integration/payments/prepare-auth.test.ts` → C1-C3
- `tests/integration/payments/prepare-idempotency.test.ts` → D1-D3

---

### Webhook Endpoint (`/webhooks/payments/{provider}`)
- [ ] A1: Valid webhook (payment.completed) settles order → 200 OK
- [ ] A2: Valid webhook (payment.failed) marks order failed → 200 OK
- [ ] A3: Valid webhook updates wallet ledger (credit on success)
- [ ] A4: Response body includes processed=true
- [ ] B1: Missing X-Signature → 400 Bad Request
- [ ] B2: Invalid signature → 400 INVALID_SIGNATURE
- [ ] B3: Unknown provider → 404 Not Found
- [ ] B4: Missing eventUid → 400 Bad Request
- [ ] B5: Invalid event type → 400 Bad Request
- [ ] B6: Malformed JSON → 400 Bad Request
- [ ] C1: Signature verification with TV01 → 200 OK
- [ ] C2: Signature verification with TV02 → 200 OK
- [ ] C3: Signature verification with TV03 (wrong secret) → 400 INVALID_SIGNATURE
- [ ] D1: Duplicate event (same eventUid) → 200 OK, no duplicate ledger entry
- [ ] D2: Replay after timeout → 400 EXPIRED
- [ ] D3: Timestamp outside tolerance (>5 min) → 400 EXPIRED
- [ ] E1: Transaction rollback on ledger failure → no partial state
- [ ] E2: Transaction rollback on order update failure → no partial state

**Test File Mapping:**
- `tests/integration/webhooks/webhook-happy-path.test.ts` → A1-A4
- `tests/integration/webhooks/webhook-validation.test.ts` → B1-B6
- `tests/integration/webhooks/signature-verification.test.ts` → C1-C3
- `tests/integration/webhooks/exactly-once.test.ts` → D1-D3
- `tests/integration/webhooks/transaction-boundary.test.ts` → E1-E2

**Coverage Summary:** ⬜ 47/47 (100%) | ⬜ Partial | ⬜ Insufficient

---

## Deliverable 2: Preflight Gate

**Command:**
```bash
npm run preflight
```

**Output (last 20 lines):**
```
<!-- Paste output here after running preflight -->
```

**Lint Result:** ⬜ PASS (0 errors) | ⬜ FAIL (X errors) | ⬜ OFFLINE (vendored Redocly required)

**Drift Result:** ⬜ PASS (0 mismatches) | ⬜ FAIL (X mismatches)

**Gate Status:** ⬜ GREEN (merge eligible) | ⬜ AMBER (follow-up required) | ⬜ RED (blocked)

---

## Deliverable 3: Exactly-Once Evidence

**Test File:** `tests/integration/webhooks/exactly-once.test.ts`

**Test Cases:**
1. **Duplicate webhook yields single ledger entry**
   - Send webhook event with eventUid `evt_001`
   - Verify order updated, ledger credited
   - Replay webhook with same eventUid `evt_001`
   - Assert: Ledger contains only 1 entry (no duplicate credit)
   - Assert: Webhook returns 200 OK

2. **Retry after DB error does not double-credit**
   - Send webhook event with eventUid `evt_002`
   - Simulate transaction failure (mock DB error)
   - Retry webhook with same eventUid `evt_002`
   - Assert: Ledger contains only 1 entry (idempotent on retry)

**Evidence (test output):**
```
<!-- Paste test output showing exactly-once assertions passing -->
```

**Status:** ⬜ VERIFIED | ⬜ MISSING | ⬜ FAILED

---

## SPEC_GAPS Template (if needed)

**When to use:** Any ambiguity, contract drift, or missing spec detail discovered during review.

**Template:**
```markdown
### GAP-XXXX: <short title>

**Context:** <where/how discovered, with file+line refs>

**Impact:** <why this blocks Spec-First or CI/DoD>

**Minimal Proposal:** <smallest change to unblock, pref. docs first; or a narrowly-scoped code alias/migration>

**Status:** OPEN | RESOLVED

**Resolution:** <if RESOLVED, describe the fix>
```

**Example:**
```markdown
### GAP-0042: Idempotency key scope excludes amountCents

**Context:** Discovered in `src/services/idempotency.service.ts:45` — business key constructed from `userId + method + path + packageId` only, omitting `amountCents`.

**Impact:** Same Idempotency-Key with different amounts would not trigger 409 Conflict, violating exactly-once semantics (Part2 Section 4.1.3).

**Minimal Proposal:** Update business key to include `amountCents` and `provider`. Add negative test case for collision detection.

**Status:** OPEN

**Resolution:** TBD (Codex to address in next commit)
```

---

## Review Summary Template

**After completing all 7 phases, post this summary comment:**

---

### 🔍 Spec-First Review Summary

**PR:** `codex/payments-core-v1` (Draft)
**Reviewer:** Spec Concierge (Claude)
**Date:** YYYY-MM-DD

**Phase Results:**
| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Contract Conformance | ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED |
| 2 | Auth/RBAC | ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED |
| 3 | DDL & ORM | ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED |
| 4 | Idempotency | ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED |
| 5 | Exactly-Once Webhook | ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED |
| 6 | Signature Verification | ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED |
| 7 | Tooling/Preflight | ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED |

**Overall Verdict:** ⬜ APPROVE (merge ready) | ⬜ REQUEST CHANGES | ⬜ BLOCKED (spec gap)

**SPEC_GAPS Created:**
<!-- List GAP-XXXX entries added to specs/SPEC_GAPS.md -->
- GAP-XXXX: ...
- GAP-XXXX: ...

**Required Actions Before Merge:**
1. [ ] ...
2. [ ] ...

**Follow-Up PRs (non-blocking):**
- [ ] Vendor Redocly CLI for CI (if offline fallback used)
- [ ] Add performance tests for idempotency cache
- [ ] ...

**Acceptance Coverage:** ⬜ 47/47 (100%) | ⬜ Partial

**Drift Status:** ⬜ 0 mismatches | ⬜ X mismatches (requires spec patch)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

---

**Next Steps:**
- Codex addresses required actions
- Re-run preflight after fixes
- Spec Concierge re-reviews and approves
- Merge to main

---
