## Preflight/Test Tails + Pointers

**Status:** Conflict resolution summary received. Now requesting verifiable evidence before 7-phase review.

---

## Part 1: Command Outputs (last ~20 lines)

Please run and paste the **last ~20 lines** of:

### 1.1: Preflight Output
```bash
npm run preflight
```

**Looking for:**
- `[lint] OK` or similar success message
- `drift: 0` or `0 mismatches` (OpenAPI ↔ DDL alignment)

---

### 1.2: Test Output
```bash
npm test
```

**Looking for:**
- All test suites passing
- No skipped or failing tests
- Coverage summary (if available)

---

## Part 2: Code Pointers (file paths + line anchors)

Please provide **specific file paths and line numbers** for each item below. Use format: `path/to/file.ts:123-145` or link to GitHub blob view.

### 2.1: Base64 Signature Digest + Single Header Constant

**Required:**
- ✅ Signature uses `digest('base64')` (NOT `digest('hex')`)
- ✅ **Single** header constant (e.g., `X-Signature`) used consistently in adapter AND handler
- ✅ Constant-time comparison via `crypto.timingSafeEqual()`

**Code pointers needed:**
- [ ] `src/payments/adapters/mock.ts` — `signPayload()` method using `digest('base64')`
- [ ] `src/payments/adapters/mock.ts` — `verifySignature()` method using `timingSafeEqual()`
- [ ] `src/payments/types.ts` (or similar) — Shared header constant definition (e.g., `export const SIGNATURE_HEADER = "X-Signature"`)
- [ ] `src/routes/webhooks.payments.ts` — Handler reading signature from shared constant

**Example:**
```
src/payments/adapters/mock.ts:19 — digest('base64')
src/payments/adapters/mock.ts:29 — crypto.timingSafeEqual()
src/payments/types.ts:12 — export const SIGNATURE_HEADER = "X-Signature"
src/routes/webhooks.payments.ts:44 — readHeader(request.headers, SIGNATURE_HEADER)
```

---

### 2.2: Raw-Body Capture (Before JSON Parse)

**Required:**
- ✅ Middleware captures `request.rawBody` **BEFORE** JSON body-parser runs
- ✅ NO `stableStringify(request.body)` fallback in webhook handler verifier path
- ✅ Handler throws error if `request.rawBody` is missing

**Code pointers needed:**
- [ ] Server bootstrap/middleware file — Raw body capture middleware (e.g., `server.ts`, `app.ts`, or test fixture)
- [ ] `src/routes/webhooks.payments.ts` — Handler line that reads `request.rawBody` (NO fallback)

**Example:**
```
tests/fixtures/test-server.ts:23-28 — Raw body middleware (captures before JSON parse)
src/routes/webhooks.payments.ts:43 — const rawBody = request.rawBody; (no fallback)
src/routes/webhooks.payments.ts:44 — if (!rawBody) throw badRequest(...)
```

---

### 2.3: Unique Constraint (Provider + Event UID)

**Required:**
- ✅ Schema defines unique constraint on `(provider, provider_event_id)` or similar
- ✅ Migration adds this constraint with `CREATE UNIQUE INDEX` or table-level `UNIQUE`

**Code pointers needed:**
- [ ] `db/schema.pg.sql` — Table definition with unique constraint
- [ ] `db/migrations/*_payments_deltas.sql` — Migration adding unique constraint

**Example:**
```
db/schema.pg.sql:89 — UNIQUE (provider, provider_event_id)
db/migrations/002_payments_deltas.sql:15 — CREATE UNIQUE INDEX idx_webhook_events_provider_event ON webhook_events(provider, provider_event_id)
```

---

### 2.4: Exactly-Once Transaction Boundary

**Required:**
- ✅ Event de-dupe check occurs **BEFORE** any side effects (inside transaction)
- ✅ Order state transition + wallet ledger append happen in **SAME transaction**
- ✅ Replay of duplicate event returns 200 with no duplicate ledger entries

**Code pointers needed:**
- [ ] Service/handler file — Transaction wrapper (e.g., `paymentsRepo.runInTransaction()`)
- [ ] Line where de-dupe check happens (e.g., `await tx.findWebhookEvent(eventUid)`)
- [ ] Lines where order state updated (e.g., `await tx.updateOrder(...)`)
- [ ] Lines where wallet ledger appended (e.g., `await tx.insertWalletLedger(...)`)
- [ ] Early return on duplicate event (e.g., `if (existingEvent) return { status: 200, ... }`)

**Example:**
```
src/routes/webhooks.payments.ts:69 — paymentsRepo.runInTransaction(async tx => {
src/routes/webhooks.payments.ts:70 — const existingEvent = await tx.findWebhookEvent(event.eventUid);
src/routes/webhooks.payments.ts:71-89 — if (existingEvent) return { status: 200, replay: true };
src/routes/webhooks.payments.ts:115 — await tx.updateOrder(order.orderId, { status });
src/routes/webhooks.payments.ts:123 — await tx.insertWalletLedger({ ... });
```

---

### 2.5: Acceptance Test Mapping (Spec-Trace Runnables)

**Required:**
- ✅ Test cases cover replay scenarios (duplicate event → 200 OK, no duplicate effects)
- ✅ Signature verification tests (TV01-TV03 or local equivalents)
- ✅ Timestamp tolerance tests (±300s window)

**Code pointers needed:**
- [ ] Test file exercising replay/duplicate events
- [ ] Test file exercising signature verification (valid + invalid)
- [ ] Test file exercising timestamp tolerance

**Example:**
```
tests/payments.webhooks.test.ts:123-145 — Replay test (duplicate eventUid → 200, single ledger entry)
tests/payments.webhooks.test.ts:67-89 — Signature verification (valid hex → 200)
tests/payments.webhooks.test.ts:91-105 — Timestamp skew (>300s → 400)
```

---

## Part 3: SPEC_GAPS Status Confirmation

Based on your code pointers, I'll update SPEC_GAPS statuses:

- **GAP-001 (hex→base64):** Will mark **RESOLVED** if `digest('base64')` confirmed and tests pass
- **GAP-002 (rawBody):** Will mark **RESOLVED** if middleware captures raw bytes before JSON parse and no stringify fallback
- **GAP-003 (Redocly):** Remains **OPEN** — requires follow-up PR to vendor `@redocly/cli` under `tools/` and wire CI

---

## Next Steps

**After you provide:**
1. Preflight/test output tails (last ~20 lines each)
2. Code pointers (file paths + line numbers) for items 2.1-2.5

**I will:**
1. Run 7-phase review using `docs/CODEX_PR_REVIEW_COMMENTS.md` templates
2. Post 3 deliverables:
   - **Spec-Trace Coverage** (47 acceptance IDs mapped)
   - **Preflight Gate** (lint + drift = 0 confirmation)
   - **Exactly-Once Evidence** (de-dupe + TX + replay assertions)
3. Update SPEC_GAPS status in PR
4. Provide APPROVE / REQUEST CHANGES / BLOCK verdict

---

**Spec Concierge (Claude)**
