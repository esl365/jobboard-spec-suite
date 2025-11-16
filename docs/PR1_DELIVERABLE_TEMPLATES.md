# PR #1 Review Deliverables (Templates)

**Usage:** After Codex provides preflight/test tails + code pointers, fill these templates and post to PR #1.

---

## Deliverable 1: Spec-Trace Coverage

**Title:** 📋 Spec-Trace Coverage Report

**Content:**

```markdown
## 📋 Spec-Trace Coverage Report

**Source:** `tests/acceptance/payments-prepare.test.md` (23 cases) + `tests/acceptance/payments-webhook.test.md` (31 cases)

**Total Acceptance Criteria:** 54 cases (prepare: 23, webhook: 31)

---

### Prepare Endpoint (`/payments/prepare`) — 23 Cases

#### Happy Path (A-series)
- [ ] **A1:** Valid COMPANY user creates order → 201 Created
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **A2:** Response includes orderId, status=pending, expiresAt
  - Test file: `tests/payments.prepare.test.ts:___`

#### Negative Cases (B-series)
- [ ] **B1:** Missing Idempotency-Key → 400 Bad Request
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **B2:** Invalid packageId → 404 Not Found
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **B3:** Insufficient wallet balance → 402 Payment Required
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **B4:** Invalid amountCents (negative) → 400 Bad Request
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **B5:** Invalid amountCents (zero) → 400 Bad Request
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **B6:** Invalid provider enum → 400 Bad Request
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **B7:** Missing required field (packageId) → 400 Bad Request
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **B8:** Malformed JSON → 400 Bad Request
  - Test file: `tests/payments.prepare.test.ts:___`

#### Security (C-series)
- [ ] **C1:** Missing JWT → 401 Unauthorized
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **C2:** Invalid JWT → 401 Unauthorized
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **C3:** Non-COMPANY role → 403 Forbidden
  - Test file: `tests/payments.prepare.test.ts:___`

#### Edge Cases (D-series)
- [ ] **D1:** Idempotency collision (same key, different data) → 409 Conflict
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **D2:** Idempotency replay (same key, same data) → 200 OK (cached)
  - Test file: `tests/payments.prepare.test.ts:___`
- [ ] **D3:** Expired Idempotency-Key → 400 Bad Request
  - Test file: `tests/payments.prepare.test.ts:___`

[... continue for remaining prepare cases ...]

---

### Webhook Endpoint (`/webhooks/payments/{provider}`) — 31 Cases

#### Happy Path (A-series)
- [ ] **A1:** Valid webhook (payment.completed) settles order → 200 OK
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **A2:** Valid webhook (payment.failed) marks order failed → 200 OK
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **A3:** Valid webhook updates wallet ledger (credit on success)
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **A4:** Response body includes processed=true
  - Test file: `tests/payments.webhooks.test.ts:___`

#### Negative Cases (B-series)
- [ ] **B1:** Missing X-Signature → 400 Bad Request
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **B2:** Invalid signature → 400 INVALID_SIGNATURE
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **B3:** Unknown provider → 404 Not Found
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **B4:** Missing eventUid → 400 Bad Request
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **B5:** Invalid event type → 400 Bad Request
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **B6:** Malformed JSON → 400 Bad Request
  - Test file: `tests/payments.webhooks.test.ts:___`

#### Security (C-series)
- [ ] **C1:** Signature verification with TV01 (or local equivalent) → 200 OK
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **C2:** Signature verification with TV02 (alternate payload) → 200 OK
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **C3:** Signature verification with TV03 (wrong secret) → 400 INVALID_SIGNATURE
  - Test file: `tests/payments.webhooks.test.ts:___`

#### Edge Cases (D-series)
- [ ] **D1:** Duplicate event (same eventUid) → 200 OK, no duplicate ledger entry
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **D2:** Replay after timeout → 400 EXPIRED (or 200 if within tolerance)
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **D3:** Timestamp outside tolerance (>300s) → 400 TIMESTAMP_SKEW
  - Test file: `tests/payments.webhooks.test.ts:___`

#### Transaction Boundaries (E-series)
- [ ] **E1:** Transaction rollback on ledger failure → no partial state
  - Test file: `tests/payments.webhooks.test.ts:___`
- [ ] **E2:** Transaction rollback on order update failure → no partial state
  - Test file: `tests/payments.webhooks.test.ts:___`

[... continue for remaining webhook cases ...]

---

## Coverage Summary

**Prepare Endpoint:**
- ✅ Covered: __/23 (___%)
- ❌ Missing: [List missing test IDs]

**Webhook Endpoint:**
- ✅ Covered: __/31 (___%)
- ❌ Missing: [List missing test IDs]

**Overall:**
- ✅ Total Covered: __/54 (___%)
- ⚠️ **DoD Requirement:** 100% coverage (54/54)

**Verdict:**
- [ ] ✅ **PASS** — All 54 acceptance criteria covered
- [ ] ❌ **FAIL** — Missing test coverage (list gaps)

---

**Spec Concierge (Claude)**
```

---

## Deliverable 2: Preflight Gate

**Title:** 🚦 Preflight Gate Report

**Content:**

```markdown
## 🚦 Preflight Gate Report

**Command:**
```bash
npm run preflight
```

**Output (last ~20 lines):**
```
[Paste Codex's output here]
```

**Analysis:**

### Lint Status
- **Redocly CLI:** [✅ Used / ⚠️ Fallback to offline / ❌ Not available]
- **Errors:** [0 / X errors found]
- **Warnings:** [0 / X warnings found]
- **Result:** [✅ PASS / ❌ FAIL]

### OpenAPI ↔ DDL Drift
- **Drift:** [✅ 0 mismatches / ❌ X mismatches]
- **Details:** [List any drift if non-zero]
- **Result:** [✅ PASS / ❌ FAIL]

### Test Status
**Command:**
```bash
npm test
```

**Output (last ~20 lines):**
```
[Paste Codex's output here]
```

**Analysis:**
- **Test suites:** [X passed, X total]
- **Tests:** [X passed, X total]
- **Coverage:** [X% statements, X% branches, X% functions, X% lines]
- **Result:** [✅ PASS / ❌ FAIL]

---

## Gate Summary

| Check | Required | Actual | Status |
|-------|----------|--------|--------|
| OpenAPI lint | 0 errors | ___ | [✅ / ❌] |
| DDL drift | 0 mismatches | ___ | [✅ / ❌] |
| Test suites | All pass | ___ | [✅ / ❌] |
| Coverage | >80% (recommended) | ___% | [✅ / ⚠️ / ❌] |

**Overall Gate Status:**
- [ ] 🟢 **GREEN** — All checks pass, drift=0, merge eligible
- [ ] 🟡 **AMBER** — Minor issues, follow-up required (specify)
- [ ] 🔴 **RED** — Critical failures, merge blocked

**Blockers (if RED):**
- [List specific blockers]

**Follow-ups (if AMBER):**
- [List non-blocking follow-ups]

---

**Spec Concierge (Claude)**
```

---

## Deliverable 3: Exactly-Once Evidence

**Title:** 🔒 Exactly-Once Semantics Evidence

**Content:**

```markdown
## 🔒 Exactly-Once Semantics Evidence

**Requirement:** Webhook handler must guarantee exactly-once processing:
1. Event de-dupe check **BEFORE** any side effects
2. Order state transition + wallet ledger append in **SAME transaction**
3. Replay of duplicate event returns 200 with **no duplicate credits**

---

### Evidence 1: Unique Constraint (De-dupe Prevention)

**Schema Definition:**
- **File:** `db/schema.pg.sql:___`
- **Constraint:** `UNIQUE (provider, provider_event_id)` or similar

**Migration:**
- **File:** `db/migrations/___payments_deltas.sql:___`
- **Index/Constraint:** `CREATE UNIQUE INDEX idx_webhook_events_provider_event ON webhook_events(provider, provider_event_id)`

**Verdict:**
- [ ] ✅ **VERIFIED** — Unique constraint prevents duplicate event insertion
- [ ] ❌ **MISSING** — No unique constraint found

---

### Evidence 2: Transaction Boundary (Atomicity)

**Transaction Wrapper:**
- **File:** `src/routes/webhooks.payments.ts:___`
- **Code:** `paymentsRepo.runInTransaction(async tx => { ... })`

**De-dupe Check (BEFORE effects):**
- **File:** `src/routes/webhooks.payments.ts:___`
- **Code:** `const existingEvent = await tx.findWebhookEvent(event.eventUid);`

**Early Return (Replay Safety):**
- **File:** `src/routes/webhooks.payments.ts:___`
- **Code:** `if (existingEvent) return { status: 200, body: { ok: true, replay: true } };`

**Event Insertion:**
- **File:** `src/routes/webhooks.payments.ts:___`
- **Code:** `await tx.insertWebhookEvent({ eventUid, provider, ... });`

**Order State Update:**
- **File:** `src/routes/webhooks.payments.ts:___`
- **Code:** `await tx.updateOrder(order.orderId, { status });`

**Wallet Ledger Append:**
- **File:** `src/routes/webhooks.payments.ts:___`
- **Code:** `await tx.insertWalletLedger({ userId, orderId, direction: "CREDIT", amountCents, ... });`

**Transaction Scope:**
```typescript
// Pseudo-code representation
return paymentsRepo.runInTransaction(async tx => {
  // 1. De-dupe check FIRST
  const existingEvent = await tx.findWebhookEvent(event.eventUid);
  if (existingEvent) return { status: 200, replay: true };

  // 2. Insert event (de-dupe marker)
  await tx.insertWebhookEvent({ eventUid, provider, ... });

  // 3. Update order state
  await tx.updateOrder(order.orderId, { status });

  // 4. Append wallet ledger
  if (event.type === "payment.completed") {
    await tx.insertWalletLedger({ userId, amountCents, direction: "CREDIT", ... });
  }

  // All-or-nothing: commit on success, rollback on error
});
```

**Verdict:**
- [ ] ✅ **VERIFIED** — Single transaction wraps event insert + order update + ledger append
- [ ] ❌ **MISSING** — No transaction boundary or partial operations possible

---

### Evidence 3: Replay Test (No Duplicate Effects)

**Test File:**
- **Path:** `tests/payments.webhooks.test.ts:___`

**Test Case:**
```typescript
// Pseudo-code test assertion
test("Duplicate webhook yields single ledger entry", async () => {
  // Send webhook event with eventUid "evt_001"
  const response1 = await POST("/webhooks/payments/mock", {
    body: { eventUid: "evt_001", type: "payment.completed", ... },
    headers: { "X-Signature": validSignature }
  });
  expect(response1.status).toBe(200);

  // Verify order updated and ledger credited
  const ledgerEntries1 = await db.walletLedger.findByOrderId(orderId);
  expect(ledgerEntries1).toHaveLength(1);
  expect(ledgerEntries1[0].direction).toBe("CREDIT");

  // Replay same webhook (duplicate eventUid)
  const response2 = await POST("/webhooks/payments/mock", {
    body: { eventUid: "evt_001", type: "payment.completed", ... },
    headers: { "X-Signature": validSignature }
  });
  expect(response2.status).toBe(200);
  expect(response2.body.replay).toBe(true);

  // Assert: Ledger still contains only 1 entry (NO duplicate credit)
  const ledgerEntries2 = await db.walletLedger.findByOrderId(orderId);
  expect(ledgerEntries2).toHaveLength(1); // ← CRITICAL ASSERTION
});
```

**Assertion Pointers:**
- **File:** `tests/payments.webhooks.test.ts:___`
- **Assertion:** `expect(ledgerEntries).toHaveLength(1)` after replay

**Verdict:**
- [ ] ✅ **VERIFIED** — Test asserts single ledger entry after duplicate webhook
- [ ] ❌ **MISSING** — No replay test or assertion for duplicate prevention

---

### Evidence 4: Transaction Rollback Test

**Test File:**
- **Path:** `tests/payments.webhooks.test.ts:___` (or integration test)

**Test Case:**
```typescript
// Pseudo-code test assertion
test("Transaction rollback on ledger failure prevents partial state", async () => {
  // Mock ledger insert to fail
  jest.spyOn(tx, 'insertWalletLedger').mockRejectedValue(new Error("DB error"));

  // Send valid webhook
  const response = await POST("/webhooks/payments/mock", {
    body: { eventUid: "evt_002", type: "payment.completed", ... },
    headers: { "X-Signature": validSignature }
  });

  // Expect 500 error (transaction rolled back)
  expect(response.status).toBe(500);

  // Assert: Order state NOT updated (rollback prevented partial commit)
  const order = await db.orders.findById(orderId);
  expect(order.status).toBe("PENDING"); // ← Still pending, NOT "COMPLETED"

  // Assert: Webhook event NOT inserted (rollback prevented partial commit)
  const event = await db.webhookEvents.findByEventUid("evt_002");
  expect(event).toBeNull(); // ← Event not persisted
});
```

**Verdict:**
- [ ] ✅ **VERIFIED** — Test asserts no partial state on transaction rollback
- [ ] ⚠️ **PARTIAL** — Transaction boundary exists but no rollback test
- [ ] ❌ **MISSING** — No transaction boundary or rollback protection

---

## Exactly-Once Summary

| Requirement | Evidence | Status |
|-------------|----------|--------|
| Unique constraint (de-dupe) | Schema + migration | [✅ / ❌] |
| De-dupe check BEFORE effects | Handler code | [✅ / ❌] |
| Single transaction boundary | Handler code | [✅ / ❌] |
| Replay returns 200 (no-op) | Handler code + test | [✅ / ❌] |
| No duplicate ledger entries | Test assertion | [✅ / ❌] |
| Transaction rollback safety | Test assertion | [✅ / ⚠️ / ❌] |

**Overall Verdict:**
- [ ] ✅ **PASS** — All exactly-once requirements verified
- [ ] ⚠️ **PARTIAL** — Some evidence present, gaps noted
- [ ] ❌ **FAIL** — Critical gaps in exactly-once semantics

**Gaps (if PARTIAL or FAIL):**
- [List specific gaps]

---

**Spec Concierge (Claude)**
```

---

## SPEC_GAPS Status Update Template

**Title:** 📝 SPEC_GAPS Status Update

**Content:**

```markdown
## 📝 SPEC_GAPS Status Update

Based on code pointers and preflight/test outputs:

---

### GAP-001: Signature encoding drift (hex vs. base64)

**Original Issue:** `src/payments/adapters/mock.ts:19` used `digest("hex")` instead of `digest("base64")`

**Resolution Evidence:**
- [ ] Code pointer: `src/payments/adapters/mock.ts:___` shows `digest('base64')`
- [ ] Code pointer: `src/payments/adapters/mock.ts:___` shows `Buffer.from(signature, 'base64')`
- [ ] Test output: Signature verification tests pass
- [ ] Single header constant: `src/payments/types.ts:___` exports shared const

**Status:**
- [ ] ✅ **RESOLVED** — Fixed in [commit hash or PR]
- [ ] ❌ **OPEN** — Still using hex encoding or missing tests

**Updated:** [Date]

---

### GAP-002: rawBody fallback may re-stringify (timing attack vulnerability)

**Original Issue:** `src/routes/webhooks.payments.ts:43` had fallback to `stableStringify(request.body)`

**Resolution Evidence:**
- [ ] Code pointer: `src/routes/webhooks.payments.ts:___` shows `request.rawBody` without fallback
- [ ] Code pointer: `src/routes/webhooks.payments.ts:___` shows error thrown if rawBody missing
- [ ] Code pointer: Middleware captures raw body before JSON parse (file:line)
- [ ] Test output: Signature verification tests pass

**Status:**
- [ ] ✅ **RESOLVED** — Fixed in [commit hash or PR]
- [ ] ❌ **OPEN** — Fallback still present or no middleware verification

**Updated:** [Date]

---

### GAP-003: Redocly CLI not vendored (CI/DoD blocker)

**Original Issue:** `package.json` references missing `tools/redocly/redocly-cli-2.8.0.tgz`

**Current State:**
- Offline fallback linter acceptable for v1 merge
- Follow-up PR required to vendor Redocly for production DoD

**Follow-Up Plan Required:**
- [ ] Create GitHub issue: "Vendor @redocly/cli for CI/DoD"
- [ ] Acceptance criteria:
  - Download and commit `tools/redocly/redocly-cli-2.8.0.tgz`
  - Update `package.json` to reference local tarball
  - Wire CI to use vendored Redocly (`.github/workflows/spec-runner.yml`)
  - Remove offline fallback from `scripts/openapi-lint.mjs`

**Status:**
- ✅ **OPEN** (non-blocking for v1 merge)
- ⏳ Follow-up PR tracking: [Issue #___ / PR #___]

**Updated:** [Date]

---

## Summary

- **GAP-001:** [✅ RESOLVED / ❌ OPEN]
- **GAP-002:** [✅ RESOLVED / ❌ OPEN]
- **GAP-003:** ✅ OPEN (non-blocking, follow-up tracked)

**Merge Blockers:**
- [List any gaps that remain OPEN and block merge]

---

**Spec Concierge (Claude)**
```

---

## Usage Instructions

**After Codex provides evidence:**

1. **Fill Deliverable 1 (Spec-Trace Coverage):**
   - Check off each acceptance ID
   - Fill in test file paths and line numbers
   - Calculate coverage percentage
   - List any missing tests

2. **Fill Deliverable 2 (Preflight Gate):**
   - Paste preflight output (last ~20 lines)
   - Paste test output (last ~20 lines)
   - Analyze lint/drift/test results
   - Determine gate status (GREEN/AMBER/RED)

3. **Fill Deliverable 3 (Exactly-Once Evidence):**
   - Fill in all code pointers from Codex's response
   - Verify transaction boundary
   - Verify replay test assertions
   - Determine overall verdict

4. **Fill SPEC_GAPS Status Update:**
   - Check GAP-001 resolution evidence
   - Check GAP-002 resolution evidence
   - Confirm GAP-003 follow-up plan
   - Update statuses (RESOLVED/OPEN)

5. **Post all 4 deliverables** to PR #1 as separate comments

---

**Prepared by:** Spec Concierge (Claude)
**Date:** 2025-10-25
