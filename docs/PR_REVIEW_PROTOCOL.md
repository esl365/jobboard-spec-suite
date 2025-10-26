# PR Review Protocol — Spec Concierge for Codex

**Role**: Spec Concierge & Reviewer/Tester
**Reviewer**: Claude (AI Assistant)
**Target**: Codex Draft PRs for payments vertical slice

---

## Overview

This document defines the review protocol for when Codex opens a Draft PR implementing the payments endpoints (prepare + webhook). The Spec Concierge will review against the canonical specs (Part1, Part2) and acceptance tests.

---

## Review Triggers

**When to Review**:
- Codex opens a Draft PR with implementation commits
- Codex requests spec review via PR comment
- Codex updates implementation after initial feedback

**Branch Context**:
- **Spec branch**: `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF`
- **Codex branch**: TBD (will be named by Codex)

---

## Review Checklist (Acceptance Criteria)

### 1. Contract Adherence

#### OpenAPI Compliance
- [ ] Response schemas match OpenAPI exactly (camelCase field names)
- [ ] All required fields present (orderId, userId, status, totalAmountCents, etc.)
- [ ] Timestamps are ISO8601 format
- [ ] Status codes match spec (200/400/401/403/409)
- [ ] Error responses use canonical Error schema

**Reference**: `openapi/api-spec.payments.snippet.yaml`

**How to check**:
```bash
# Run OpenAPI validation against implementation
npm run openapi:validate
# Or manually compare handler responses to schema definitions
```

#### Handler Signatures
- [ ] `POST /payments/prepare` handler exists at `src/routes/orders.prepare.ts`
- [ ] `POST /webhooks/payments/{provider}` handler exists at `src/routes/webhooks.payments.ts`
- [ ] Handlers export correct function names (prepareOrderHandler, webhookPaymentsHandler)

**Reference**: `specs/Spec-Trace.yml` → implementation.handlers

---

### 2. Exactly-Once Semantics

#### Idempotency (Prepare Endpoint)
- [ ] Idempotency-Key header validated (minLength 8)
- [ ] Lookup existing order by idempotency key
- [ ] Return existing order on replay (200, not 201)
- [ ] Detect collision: same key + different params → 409
- [ ] Insert idempotency_keys row atomically with orders row

**Tests**: `payments-prepare.test.md#A2` (replay), `#B3` (collision), `#D1` (concurrency)

**How to verify**:
```javascript
// Check for idempotency lookup code
const existing = await db.query(`
  SELECT * FROM idempotency_keys WHERE idem_key = $1 ...
`);
if (existing.rows.length > 0) {
  return existingOrder; // idempotent replay
}
```

#### Webhook Dedupe (Webhook Endpoint)
- [ ] eventUid uniqueness enforced (webhook_events UNIQUE constraint)
- [ ] Replay returns 200 with no side-effects
- [ ] No double-crediting (wallet_ledger INSERT only on first event)

**Tests**: `payments-webhook.test.md#A2` (replay), `#C2` (replay attack), `#D1` (concurrency)

**How to verify**:
```javascript
// Check for eventUid dedupe before processing
const existing = await db.query(`
  SELECT 1 FROM webhook_events WHERE event_uid = $1
`, [eventUid]);
if (existing.rows.length > 0) {
  return { ok: true }; // idempotent no-op
}
```

---

### 3. Transaction Boundaries

#### Single Transaction Requirement
- [ ] Webhook handler wraps all DB operations in single transaction
- [ ] Order UPDATE, wallet_ledger INSERT, webhook_events INSERT are atomic
- [ ] Rollback on any failure (no partial updates)

**Tests**: `payments-webhook.test.md#E1` (rollback scenario)

**Required pattern**:
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');

  // 1. Update order status
  await client.query(`UPDATE orders SET status = $1 ...`);

  // 2. Insert wallet_ledger (CREDIT or DEBIT)
  await client.query(`INSERT INTO wallet_ledger ...`);

  // 3. Insert webhook_events
  await client.query(`INSERT INTO webhook_events ...`);

  // 4. Apply entitlements if applicable
  // ...

  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

**Red flags**:
- ❌ Multiple separate `await db.query()` calls without transaction
- ❌ No error handling / ROLLBACK
- ❌ Wallet insert in separate function call without transaction context

---

### 4. Negative Paths & Validation

#### Prepare Endpoint Validation
- [ ] Missing Idempotency-Key → 400 `MISSING_IDEMPOTENCY_KEY`
- [ ] Short Idempotency-Key (< 8 chars) → 400 `INVALID_IDEMPOTENCY_KEY`
- [ ] Negative amountCents → 400 `INVALID_AMOUNT`
- [ ] Missing required fields (userId, amountCents, provider) → 400
- [ ] Unknown provider → 400 `INVALID_PROVIDER`
- [ ] Inactive packageId → 400 `INACTIVE_PRODUCT`

**Tests**: `payments-prepare.test.md#B1-B8`

#### Webhook Endpoint Validation
- [ ] Missing signature → 400 `MISSING_SIGNATURE`
- [ ] Invalid signature → 400 `INVALID_SIGNATURE`
- [ ] Unknown event type → 400 `UNKNOWN_EVENT_TYPE`
- [ ] Order not found → 400 `ORDER_NOT_FOUND`
- [ ] Provider mismatch (URL vs payload) → 400 `PROVIDER_MISMATCH`

**Tests**: `payments-webhook.test.md#B1-B6`

---

### 5. Security Policy

#### Authentication & Authorization (Prepare)
- [ ] JWT middleware enforces authentication (401 if missing)
- [ ] User type check: COMPANY only (403 for PERSONAL)
- [ ] userId from token matches request body (403 if mismatch)

**Tests**: `payments-prepare.test.md#C1-C3`

**Check for**:
```javascript
// JWT extraction and validation
const user = extractUserFromJWT(req.headers.authorization);
if (!user) throw { code: 'UNAUTHORIZED', status: 401 };

// Type check
if (user.userType !== 'COMPANY') {
  throw { code: 'FORBIDDEN', status: 403, message: 'Only COMPANY users...' };
}

// User match
if (user.userId !== req.body.userId) {
  throw { code: 'USER_MISMATCH', status: 403 };
}
```

#### Signature Verification (Webhook)
- [ ] Public endpoint (no JWT required)
- [ ] Signature verification using provider adapter
- [ ] Constant-time comparison (crypto.timingSafeEqual)
- [ ] Uses test vectors TV01-TV03 for mock provider

**Tests**: `payments-webhook.test.md#B1` (invalid sig), `#C1` (public), `#C3` (timing attack)

**Check implementation against**:
```javascript
// Reference: specs/Spec-Trace.yml → signature_verification
const crypto = require('crypto');

function verifySignature(rawBody, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  // CRITICAL: constant-time comparison
  if (!crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  )) {
    throw new Error('INVALID_SIGNATURE');
  }
}
```

**Test vectors** (from Spec-Trace.yml):
- TV01: Valid payment.completed, expected signature: `Fp8vH3fK2ZzJ6rR5tY7wA9bC1dE2gH4iJ5kL6mN7oP8=`
- TV03: Wrong secret should fail

---

### 6. State Machine Enforcement

#### Order Status Transitions
- [ ] PENDING → COMPLETED (on payment.completed webhook)
- [ ] PENDING → FAILED (on payment.failed webhook)
- [ ] COMPLETED → REFUNDED (on payment.refunded webhook)
- [ ] Invalid transitions rejected or no-op

**Reference**: `specs/Spec-Trace.yml` → state_machines.payment_order_status

**Tests**: `payments-webhook.test.md#A1` (COMPLETED), `#A3` (FAILED), `#A4` (REFUNDED), `#B5` (invalid transition)

**Check for state validation**:
```javascript
function validateTransition(currentStatus, newStatus) {
  const validTransitions = {
    PENDING: ['COMPLETED', 'FAILED', 'REFUNDED'],
    COMPLETED: ['REFUNDED'],
    FAILED: [],
    REFUNDED: []
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    // Either reject (400) or no-op (200) - decision TBD in SPEC_GAPS
    throw new Error('INVALID_STATE_TRANSITION');
  }
}
```

---

### 7. Wallet Ledger Semantics

#### Append-Only Invariant
- [ ] No UPDATE or DELETE on wallet_ledger
- [ ] Only INSERT operations
- [ ] Corrections are reversing entries (DEBIT with negative semantics)

**Reference**: `Part1 Section 6.3`

**Tests**: `payments-webhook.test.md#A1` (CREDIT), `#A4` (DEBIT for refund)

#### Correct Entry Types
- [ ] CREDIT on payment.completed (positive amountCents)
- [ ] DEBIT on payment.refunded (refund amount as positive, direction=DEBIT)
- [ ] reasonType populated (`PAYMENT_COMPLETED`, `REFUND`, etc.)
- [ ] orderId foreign key set

**Check for**:
```javascript
// On COMPLETED
await client.query(`
  INSERT INTO wallet_ledger (user_id, order_id, direction, amount_cents, reason_type)
  VALUES ($1, $2, 'CREDIT', $3, 'PAYMENT_COMPLETED')
`, [userId, orderId, amountCents]);

// On REFUNDED
await client.query(`
  INSERT INTO wallet_ledger (user_id, order_id, direction, amount_cents, reason_type)
  VALUES ($1, $2, 'DEBIT', $3, 'REFUND')
`, [userId, orderId, refundAmountCents]);
```

---

### 8. Test Coverage

#### Unit Tests
- [ ] Tests exist in mapped files (see Spec-Trace.yml → runnable_tests)
- [ ] Signature verification has dedicated test file (`signature-verification.test.js`)
- [ ] State machine has dedicated test file (`state-machine.test.js`)
- [ ] Transaction boundary test exists (`transaction-boundary.test.js`)

**Expected structure**:
```
tests/payments/
  unit/
    prepare-handler.test.js          (test IDs: A1,A2,B1-B8)
    idempotency-service.test.js      (test IDs: A2,B3,D1)
    webhook-handler.test.js          (test IDs: A1-A4,B1-B6)
    signature-verification.test.js   (test IDs: B1,B2,C3)
    state-machine.test.js            (test IDs: A1,A3,A4,B5)
    transaction-boundary.test.js     (test IDs: E1,E2)
  integration/
    prepare-endpoint.test.js         (test IDs: A1,A2,C1-C3,D1)
    webhook-endpoint.test.js         (test IDs: A1-A4,B1,C1-C2,D1,E1)
  e2e/
    prepare-flow.test.js             (test IDs: A1,A2,D1-D3)
    payment-flow-complete.test.js    (test IDs: A1,A2,D1)
```

#### Test Execution
- [ ] All tests pass (`npm test` or `jest`)
- [ ] No skipped/pending tests without documented reason
- [ ] Test coverage > 80% for handlers

**Run**:
```bash
npm test -- --coverage
# Or
jest --coverage
```

---

## Review Process

### Step 1: Initial Triage (5 minutes)

When Codex opens PR:
1. Check commit message references spec/tests
2. Verify files match expected structure (src/routes/, src/payments/)
3. Quick scan for obvious blockers (missing files, syntax errors)

**Output**: Go/No-Go for detailed review

---

### Step 2: Automated Checks (10 minutes)

Run preflight checks:
```bash
# 1. OpenAPI validation
npm run openapi:lint

# 2. Tests
npm test

# 3. TypeScript/ESLint (if applicable)
npm run lint

# 4. Check git diff scope
git diff main...HEAD --name-only
```

**Output**: List of automated failures (if any)

---

### Step 3: Contract Review (20 minutes)

**Focus**: Does implementation match OpenAPI + Part2 spec?

For each endpoint:
1. Compare handler response structure to OpenAPI schema
2. Check status codes (200/400/401/403/409)
3. Verify field names (camelCase canonical)
4. Check error response format

**Use**: `docs/PR_REVIEW_CHECKLIST_PAYMENTS.md` → Section I (Acceptance Criteria)

**Output**: List of contract violations (file:line)

---

### Step 4: Semantics Review (30 minutes)

**Focus**: Exactly-once, transactions, state machine

#### 4a. Idempotency
- Search code for `idempotency_keys` table queries
- Verify lookup-before-insert pattern
- Test replay scenario manually or via integration test

#### 4b. Transactions
- Search for `BEGIN` / `COMMIT` / `ROLLBACK`
- Verify all webhook DB writes are wrapped
- Check error handling paths

#### 4c. State machine
- Find state transition code
- Compare to `specs/Spec-Trace.yml` → state_machines
- Check for validation before UPDATE

**Output**: List of semantic violations with suggested fixes

---

### Step 5: Security Review (15 minutes)

**Focus**: Auth, signature verification, timing attacks

#### 5a. Prepare endpoint
- JWT extraction code
- User type check (COMPANY only)
- userId match validation

#### 5b. Webhook endpoint
- Signature verification implementation
- Check for `crypto.timingSafeEqual` usage
- Verify test vectors TV01-TV03 are used

**Output**: List of security issues (CRITICAL/HIGH/MEDIUM/LOW)

---

### Step 6: Test Coverage Review (20 minutes)

**Focus**: Do tests exist and pass?

1. Check test file structure matches `Spec-Trace.yml`
2. Run tests: `npm test`
3. Review coverage report
4. Spot-check 3-5 critical tests (A1, A2, B1, E1)

**Output**: Coverage gaps (missing test IDs)

---

### Step 7: Generate Review Comment (10 minutes)

**Format**:
```markdown
## Spec Concierge Review

**Status**: ⚠️ CHANGES REQUESTED | ✅ APPROVED

### Acceptance Criteria (Pass/Fail by ID)

#### POST /payments/prepare
- ✅ A1: First-time order creation
- ✅ A2: Idempotent replay
- ❌ B3: Idempotency collision detection (missing validation)
- ✅ C1: Unauthenticated request (401)
- ...

#### POST /webhooks/payments/{provider}
- ✅ A1: First successful payment completion
- ❌ B1: Invalid signature (not using constant-time comparison)
- ✅ E1: Transaction boundary (BEGIN/COMMIT found)
- ...

**Total**: 45/54 passing (83%)

---

### SPEC_GAPS Updates

No new gaps identified. Existing gaps remain:
- D.1: Partial refund status (Option B recommended, not yet implemented)
- E.4: Job options application (not implemented)

---

### Minimal Patch Suggestions

#### Issue 1: Missing constant-time signature comparison
**File**: `src/routes/webhooks.payments.ts:42`
**Current**:
\```javascript
if (signature !== expectedSignature) {
  throw new Error('INVALID_SIGNATURE');
}
\```

**Suggested**:
\```javascript
if (!crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
)) {
  throw new Error('INVALID_SIGNATURE');
}
\```

**Reference**: `specs/Spec-Trace.yml` → signature_verification.implementation_reference

---

#### Issue 2: Idempotency collision not detected
**File**: `src/routes/orders.prepare.ts:67`
**Missing**: Check if existing key has different business parameters

**Suggested**:
\```javascript
const existing = await db.query(`
  SELECT * FROM idempotency_keys
  WHERE idem_key = $1 AND user_id = $2
`, [idemKey, userId]);

if (existing.rows.length > 0) {
  // Load associated order
  const existingOrder = await loadOrderByIdempotencyKey(idemKey, userId);

  // Check for collision: same key, different params
  if (existingOrder.totalAmountCents !== amountCents ||
      existingOrder.provider !== provider) {
    return res.status(409).json({
      code: 'IDEMPOTENCY_COLLISION',
      message: 'Key already used with different parameters'
    });
  }

  // Idempotent replay
  return res.json(existingOrder);
}
\```

**Reference**: `tests/acceptance/payments-prepare.test.md#B3`

---

### Next Steps

1. Apply patches for Issues 1-2 above
2. Add missing test coverage (test IDs: B3, B5, D2)
3. Run full test suite: `npm test`
4. Re-request review

---

**Reviewed by**: Spec Concierge (Claude)
**Date**: 2025-10-26
**Branch**: claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF
```

---

## Review Frequency

- **Initial review**: Within 24 hours of PR opening
- **Follow-up reviews**: Within 12 hours of Codex updates
- **Final approval**: After all acceptance criteria pass

---

## Approval Criteria

**Minimum to approve**:
- [ ] All CRITICAL test cases pass (A1, A2, B1, E1)
- [ ] No HIGH security issues
- [ ] Transaction boundaries verified
- [ ] Signature verification uses constant-time comparison
- [ ] At least 80% of acceptance tests passing

**Nice to have** (can be follow-up):
- Job options/entitlements implementation
- Partial refund support
- 100% test coverage

---

## Escalation Path

**If blockers found**:
1. Document in PR comment with patch suggestions
2. Add SPEC_GAPS entry if ambiguity discovered
3. Request clarification from Codex or team
4. Update Spec-Trace.yml if new test cases needed

**If fundamental design issue**:
1. STOP review immediately
2. Create SPEC_GAPS entry with **BLOCKER** priority
3. Propose alternatives in DDL_Deltas_Proposals.md style
4. Request team decision before proceeding

---

## Tools & References

**Documents**:
- `specs/Spec-Trace.yml` (test mappings, signature contract)
- `tests/acceptance/payments-*.test.md` (test definitions)
- `docs/llm-input-pack/Part1_Functional_Data_Spec.md` (data semantics)
- `docs/llm-input-pack/Part2_Functional_Endpoint_Spec.md` (endpoint specs)
- `docs/llm-input-pack/DDL_Deltas_Proposals.md` (schema patches)
- `specs/SPEC_GAPS.md` (known gaps)

**Commands**:
```bash
# Validation
npm run openapi:lint
npm test
npm run lint

# Coverage
jest --coverage

# Diff review
git diff main...HEAD --stat
git diff main...HEAD -- src/routes/

# Test specific file
jest tests/payments/unit/signature-verification.test.js
```

---

## Review Metrics (Track)

For each review, record:
- Time spent (minutes)
- Test pass rate (X/54)
- Critical issues found (count)
- Patch suggestions provided (count)
- Review round number (1st, 2nd, etc.)

**Goal**: Approve within 3 review rounds max.

---

**End of Protocol**
