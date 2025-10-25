# Codex PR Review Findings — Payments Vertical Slice

**Reviewer**: Spec Concierge (Claude)
**Date**: 2025-10-26
**Status**: ⚠️ **CODEX BRANCH NOT FOUND**

---

## Executive Summary

**CRITICAL**: Cannot locate Codex implementation branch or PR in repository.

**Current Repository State**:
- **Branch**: `main` (commit `99b41bf`)
- **Latest changes**: Foundational spec-first pack with preflight tooling
- **Implementation status**: Placeholders only (35-269 bytes per file)
- **Codex branch**: **NOT FOUND** (searched `codex/*`, `payment/*`, author patterns)

**Expected Branch Pattern**: `codex/payments-core-v1` or similar

---

## Repository Baseline Verification

### Current Main Branch State

#### Implementation Files (Placeholders)
```
src/routes/orders.prepare.ts          2 bytes (placeholder comment)
src/routes/webhooks.payments.ts       269 bytes (stub functions)
src/payments/registry.ts              ~100 bytes (mock structure)
src/payments/adapters/mock.ts         (exists but placeholder)
src/infra/memory/payments.repos.ts    (exists but placeholder)
```

#### Preflight Tooling Status
```bash
npm run preflight
# ❌ FAILS: Missing dependencies
#   - yaml package not installed
#   - tools/redocly/redocly-cli-2.8.0.tgz not present
#   - Cannot verify merge→fixup→lint→drift pipeline
```

**Issue**: User claims "Vendored offline yaml-lite parser; preflight and npm test are green" but current main branch **fails** preflight.

#### Spec Documents Present
- ✅ `docs/llm-input-pack/Part1_Functional_Data_Spec.md`
- ✅ `docs/llm-input-pack/Part2_Functional_Endpoint_Spec.md`
- ✅ `specs/Feature_Payment_How_Spec.md`
- ⚠️ `specs/Spec-Trace.yml` (placeholder: "# placeholder: specs\Spec-Trace.yml")
- ⚠️ `specs/SPEC_GAPS.md` (legacy content, not updated with Phase 2 deltas)

---

## Expected Codex Implementation (Based on User Description)

User claims Codex has implemented:
1. ✅ `/payments/prepare` endpoint with idempotency
2. ✅ `/webhooks/payments/{provider}` endpoint
3. ✅ Signature verification (strengthened canonicalization)
4. ✅ Mock payment adapter
5. ✅ In-memory repository pattern
6. ✅ Replay fingerprinting
7. ✅ Vendored yaml-lite parser for preflight

**None of these are visible in the repository.**

---

## Review Framework (Ready for Codex PR)

### Phase 1: Branch Discovery & Scope Verification

When Codex PR appears, verify:

#### 1.1 Branch Identification
```bash
git fetch origin
git branch -r | grep codex
# Expected: origin/codex/payments-core-v1 or similar

git checkout codex/payments-core-v1
git log origin/main..HEAD --oneline
# Review: Only payments vertical slice commits
```

#### 1.2 Scope Boundary Check
**Requirement**: Implementation should touch ONLY:
- `src/routes/orders.prepare.ts`
- `src/routes/webhooks.payments.ts`
- `src/payments/registry.ts`
- `src/payments/adapters/*.ts`
- `src/infra/memory/payments.repos.ts`
- Test files under `tests/payments/*`
- Possibly `scripts/*` for vendored yaml parser

**Red Flags**:
- ❌ Changes to `/orders/prepare` endpoint (deprecated per SPEC_GAPS)
- ❌ Modifications to unrelated domains (jobs, applications, auth core)
- ❌ Direct DDL changes (should be proposals only)

#### 1.3 Deprecated Endpoint Check
```bash
# On Codex branch:
grep -r "/orders/prepare" openapi/
grep -r "ordersepare" src/

# Expected: 0 results (only /payments/prepare should exist)
```

---

### Phase 2: Contract & Tooling Verification

#### 2.1 Preflight Pipeline Execution
```bash
# On Codex branch:
npm install  # Should succeed with vendored deps
npm run preflight  # Should pass all 4 steps

# Step-by-step verification:
node scripts/openapi-merge-payments.mjs
# Expect: Array dedupe on merge (duplicate params removed)

node scripts/openapi-fixup.mjs
# Expect: License, security, operationId, params, 4xx normalized

npx @redocly/cli lint openapi/api-spec.yaml  # or fallback
# Expect: 0 errors (no duplicate parameters)

node scripts/spec-drift-check.mjs
# Expect: orders, idempotency_keys, webhook_events, wallet_ledger aligned
```

#### 2.2 OpenAPI Duplicate Parameter Check
**Critical**: Verify NO duplicate parameters remain after fixup.

```bash
# Extract all parameter definitions
cat openapi/api-spec.yaml | grep -A3 "parameters:" | grep "name:"

# Check /payments/prepare
cat openapi/api-spec.yaml | sed -n '/\/payments\/prepare/,/responses/p' | grep "Idempotency-Key"
# Expected: Exactly 1 occurrence

# Check /webhooks/payments/{provider}
cat openapi/api-spec.yaml | sed -n '/\/webhooks\/payments/,/responses/p' | grep "provider"
# Expected: Exactly 1 occurrence in parameters
```

#### 2.3 Path Canonicalization Check
```bash
grep -n "/orders/prepare" openapi/api-spec.yaml
# Expected: 0 results (removed per Part2 spec)

grep -n "/payments/prepare" openapi/api-spec.yaml
# Expected: Exactly 1 path definition
```

---

### Phase 3: Exactly-Once & Idempotency Review

#### 3.1 UNIQUE Constraints Verification

**DDL Review** (if Codex added migrations):
```sql
-- Check orders table
\d orders
-- MUST have: UNIQUE (provider, provider_payment_id)

-- Check webhook_events table
\d webhook_events
-- MUST have: UNIQUE (event_uid)

-- Check idempotency_keys table
\d idempotency_keys
-- MUST have: PRIMARY KEY (idem_key, user_id, method, path)
```

**In-Memory Repo Review** (`src/infra/memory/payments.repos.ts`):
```typescript
// Must enforce same uniqueness as DB:
class InMemoryOrdersRepo {
  // Check for:
  private ordersByProviderPaymentId: Map<string, Order>
  // Key format: `${provider}:${providerPaymentId}`

  async create(order: Order) {
    const key = `${order.provider}:${order.providerPaymentId}`;
    if (this.ordersByProviderPaymentId.has(key)) {
      throw new Error('DUPLICATE_PROVIDER_PAYMENT_ID');
    }
    // ...
  }
}
```

#### 3.2 Idempotency Scope Verification

**Code Review** (`src/routes/orders.prepare.ts`):
```typescript
// Idempotency key scope MUST include business dimensions:
const idempotencyScope = {
  idemKey: req.headers['idempotency-key'],
  userId: req.user.userId,
  method: 'POST',
  path: '/payments/prepare',
  // CRITICAL: Include business keys for collision detection
  businessKeys: {
    amountCents: req.body.amountCents,
    provider: req.body.provider,
    packageId: req.body.packageId
  }
};

// Lookup existing order
const existing = await idempotencyRepo.find(idempotencyScope);
if (existing) {
  // Collision check:
  if (!deepEqual(existing.businessKeys, idempotencyScope.businessKeys)) {
    return res.status(409).json({
      code: 'IDEMPOTENCY_COLLISION',
      message: 'Same key used with different parameters'
    });
  }
  // Idempotent replay:
  return res.json(existing.order);
}
```

**Gap Check**: If business keys NOT included in idempotency scope:
```markdown
## SPEC_GAPS Update Required

### [2025-10-26] Idempotency Scope Incomplete

**Gap ID**: E.5
**Component**: `src/routes/orders.prepare.ts`
**Issue**: Idempotency key scope only includes (key + user + method + path) but NOT business dimensions (amountCents, provider, packageId).

**Impact**: Cannot detect collisions where same key is reused with different business parameters. Risk of silent data inconsistency.

**Minimal Proposal**:
```typescript
// In idempotency_keys table or in-memory store:
interface IdempotencyRecord {
  idemKey: string;
  userId: string;
  method: string;
  path: string;
  businessFingerprint: string;  // ADD: hash of (amountCents+provider+packageId)
  orderId: string;
  createdAt: Date;
}
```

**Reference**: `tests/acceptance/payments-prepare.test.md#B3` (collision test)
```

#### 3.3 Webhook Replay Safety

**Code Review** (`src/routes/webhooks.payments.ts`):
```typescript
export async function webhookPaymentsHandler(req, res) {
  const { eventUid, provider, type, data } = req.body;

  // 1. Dedupe check (BEFORE any processing)
  const existing = await webhookEventsRepo.findByEventUid(eventUid);
  if (existing) {
    console.log(`[webhook] Replay detected: ${eventUid}`);
    return res.json({ ok: true });  // Idempotent no-op
  }

  // 2. Signature verification
  await verifySignature(req, provider);

  // 3. Single transaction boundary
  await db.transaction(async (tx) => {
    // 3a. Update order status
    await tx.orders.update(orderId, { status: newStatus });

    // 3b. Insert wallet_ledger (CREDIT or DEBIT)
    await tx.walletLedger.insert({ userId, amount, direction });

    // 3c. Insert webhook_events (dedupe key)
    await tx.webhookEvents.insert({ eventUid, provider, payload });

    // 3d. Apply entitlements (if applicable)
    if (type === 'payment.completed' && packageId) {
      await tx.jobOptions.applyBenefits(userId, packageId);
    }
  });

  return res.json({ ok: true });
}
```

**Checklist**:
- [ ] Dedupe check happens FIRST (before signature verification)
- [ ] Returns 200 on replay (not 409 or 400)
- [ ] All DB writes wrapped in single transaction
- [ ] Transaction includes: orders + wallet_ledger + webhook_events
- [ ] No partial updates possible (COMMIT or ROLLBACK as unit)

---

### Phase 4: Signature Verification Review

#### 4.1 Canonical Payload Algorithm

**Code Review** (`src/payments/adapters/mock.ts`):
```typescript
import crypto from 'crypto';

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  // CRITICAL: Use raw body (not re-parsed JSON)
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  // CRITICAL: Use constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Requirements**:
- ✅ Uses `rawBody` (req.rawBody or captured in middleware)
- ✅ Uses `crypto.timingSafeEqual` (prevents timing attacks)
- ✅ Algorithm: HMAC-SHA256
- ✅ Encoding: base64
- ✅ Header: `X-Signature`

**Gap Check**: If using re-parsed JSON:
```markdown
## SPEC_GAPS Update Required

### [2025-10-26] Signature Verification Uses Re-Parsed JSON

**Gap ID**: E.6
**Component**: `src/payments/adapters/mock.ts`
**Issue**: Signature computed on `JSON.stringify(req.body)` instead of original raw body.

**Impact**: Whitespace/formatting differences cause signature mismatches. Provider may send payload with different formatting than we reconstruct.

**Minimal Fix**:
```typescript
// In Express middleware (before body parsing):
app.use('/webhooks', (req, res, next) => {
  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk; });
  req.on('end', () => {
    req.rawBody = rawBody;
    next();
  });
});

// In signature verification:
const expectedSig = hmac(req.rawBody, secret);  // NOT JSON.stringify(req.body)
```
```

#### 4.2 Test Vectors Verification

**Check in Spec-Trace.yml or test files**:
```yaml
# Expected in specs/Spec-Trace.yml:
signature_verification:
  test_vectors:
    - vector_id: TV01
      provider: "mock"
      secret: "mock_webhook_secret_key_for_testing"
      raw_body: '{"eventUid":"evt_test_001","provider":"mock","type":"payment.completed","occurredAt":"2025-10-26T10:00:00Z","data":{"orderReference":"ord_abc123","providerPaymentId":"pay_mock_xyz","amountCents":50000}}'
      expected_signature: "Fp8vH3fK2ZzJ6rR5tY7wA9bC1dE2gH4iJ5kL6mN7oP8="

    - vector_id: TV02
      provider: "mock"
      secret: "mock_webhook_secret_key_for_testing"
      raw_body: '{"eventUid":"evt_test_002","provider":"mock","type":"payment.failed","occurredAt":"2025-10-26T11:00:00Z","data":{"orderReference":"ord_failed","reason":"insufficient_funds"}}'
      expected_signature: "Q1r2S3t4U5v6W7x8Y9z0A1b2C3d4E5f6G7h8I9j0K1l="

    - vector_id: TV03
      provider: "mock"
      secret: "wrong_secret_key"
      raw_body: '{"eventUid":"evt_test_001",...}'
      expected_signature: "INVALID_SIGNATURE_WRONG_SECRET"
      expected_result: "400 INVALID_SIGNATURE"
```

**Test File Check**:
```typescript
// In tests/payments/unit/signature-verification.test.js:
import { verifySignature } from '../../../src/payments/adapters/mock.js';

test('TV01: Valid payment.completed signature', () => {
  const rawBody = '{"eventUid":"evt_test_001",...}';
  const signature = "Fp8vH3fK2ZzJ6rR5tY7wA9bC1dE2gH4iJ5kL6mN7oP8=";
  const secret = "mock_webhook_secret_key_for_testing";

  expect(verifySignature(rawBody, signature, secret)).toBe(true);
});

test('TV03: Invalid signature with wrong secret', () => {
  const rawBody = '{"eventUid":"evt_test_001",...}';
  const signature = "WRONG_SIGNATURE";
  const secret = "mock_webhook_secret_key_for_testing";

  expect(() => verifySignature(rawBody, signature, secret))
    .toThrow('INVALID_SIGNATURE');
});
```

---

### Phase 5: Acceptance Mapping & Tests

#### 5.1 Test File Structure Check

**Expected Structure**:
```
tests/payments/
  unit/
    prepare-handler.test.js          (Test IDs: A1,A2,B1-B8)
    idempotency-service.test.js      (Test IDs: A2,B3,D1)
    webhook-handler.test.js          (Test IDs: A1-A4,B1-B6)
    signature-verification.test.js   (Test IDs: B1,B2,C3)
    state-machine.test.js            (Test IDs: A1,A3,A4,B5)
    transaction-boundary.test.js     (Test IDs: E1,E2)
  integration/
    prepare-endpoint.test.js         (Test IDs: A1,A2,C1-C3,D1)
    webhook-endpoint.test.js         (Test IDs: A1-A4,B1,C1-C2,D1,E1)
  e2e/
    prepare-flow.test.js             (Test IDs: A1,A2,D1-D3)
    payment-flow-complete.test.js    (Test IDs: A1,A2,D1)
```

**Verification Command**:
```bash
npm test
# Expected: All tests pass

# Check coverage:
npm test -- --coverage
# Expected: >80% coverage for handlers
```

#### 5.2 Acceptance Test Mapping

**Update specs/Spec-Trace.yml**:
```yaml
payments_prepare_endpoint:
  tests:
    runnable_tests:
      unit:
        - file: tests/payments/unit/prepare-handler.test.js
          test_ids: [A1, A2, B1, B2, B3, B4, B5, B6, B7, B8]
          line_mappings:
            A1: line 15
            A2: line 32
            B1: line 48
            # ... etc
```

**Cross-Reference Template**:
```markdown
| Acceptance ID | Description | Test File | Line | Status |
|---------------|-------------|-----------|------|--------|
| A1 | First-time order creation | prepare-handler.test.js | 15 | ✅ PASS |
| A2 | Idempotent replay | prepare-handler.test.js | 32 | ✅ PASS |
| B3 | Idempotency collision | idempotency-service.test.js | 67 | ❌ FAIL |
```

---

### Phase 6: Data & Policy Proposals (Non-Blocking)

#### 6.1 DDL Delta Review

**Check**: Does Codex PR include any DDL changes?

```bash
git diff origin/main..HEAD -- migrations/ db/
```

**Expected**: NO direct DDL changes in Codex PR.
**Rationale**: DDL deltas should be proposals in `docs/llm-input-pack/DDL_Deltas_Proposals.md`, not committed migrations.

**If DDL changes found**: Request Codex to revert and move to proposals document.

#### 6.2 Missing Fields Check

**Review Code for**:
- `orders.providerMeta` usage → If referenced, note in SPEC_GAPS that field doesn't exist yet
- `PARTIALLY_REFUNDED` status → If used, note it's not in current enum
- `idempotency_keys.expires_at` → If TTL logic present, note field missing
- `webhook_events.retention_until` → If retention policy present, note field missing

**Template for SPEC_GAPS**:
```markdown
### [2025-10-26] Implementation References Missing DDL Fields

**Gap ID**: D.7
**Component**: Codex implementation
**Issue**: Code references `orders.providerMeta` (line 142) but field not in schema.

**Impact**: Will fail at runtime when deployed to production DB.

**Proposal**: Apply DDL Delta 1 from `docs/llm-input-pack/DDL_Deltas_Proposals.md`:
```sql
ALTER TABLE orders ADD COLUMN provider_meta JSONB DEFAULT NULL;
```

**Status**: PROPOSED (awaiting approval before migration)
```

---

### Phase 7: Review Output Format

#### 7.1 PR Comment Template

```markdown
## Spec Concierge Review — Codex Payments Implementation

**Reviewer**: Claude (Spec Concierge)
**Branch**: `codex/payments-core-v1`
**Date**: 2025-10-26
**Status**: ⚠️ **CHANGES REQUESTED** | ✅ **APPROVED**

---

### Contract Adherence

#### OpenAPI/DDL Drift
- [x] ✅ PASS: Preflight pipeline green (merge→fixup→lint→drift)
- [x] ✅ PASS: No duplicate parameters (Idempotency-Key, provider)
- [ ] ❌ FAIL: Deprecated `/orders/prepare` endpoint still present (line 338)
- [x] ✅ PASS: Drift report clean (orders, idempotency_keys, webhook_events, wallet_ledger)

**Issue 1**: Deprecated endpoint not removed
**File**: `openapi/api-spec.yaml:338`
**Fix**: Remove `/orders/prepare` path definition (canonicalize to `/payments/prepare`)

---

### Exactly-Once & Idempotency

#### UNIQUE Constraints
- [x] ✅ PASS: `orders(provider, providerPaymentId)` unique enforced in InMemoryRepo
- [x] ✅ PASS: `webhook_events(eventUid)` unique enforced
- [ ] ⚠️ WARNING: Idempotency scope missing business keys (see Issue 2)

#### Transaction Boundaries
- [x] ✅ PASS: Webhook handler uses single transaction
- [x] ✅ PASS: All DB writes (orders + wallet_ledger + webhook_events) atomic
- [x] ✅ PASS: Rollback on error verified

**Issue 2**: Idempotency collision detection incomplete
**File**: `src/routes/orders.prepare.ts:67`
**Current**:
```typescript
const existing = await idempotencyRepo.find(idemKey, userId);
if (existing) {
  return res.json(existing.order);  // No collision check!
}
```

**Required**:
```typescript
const existing = await idempotencyRepo.find(idemKey, userId);
if (existing) {
  // Collision check: same key, different params?
  if (existing.amountCents !== req.body.amountCents ||
      existing.provider !== req.body.provider) {
    return res.status(409).json({
      code: 'IDEMPOTENCY_COLLISION',
      message: 'Key already used with different parameters'
    });
  }
  return res.json(existing.order);  // Idempotent replay
}
```

**Reference**: `tests/acceptance/payments-prepare.test.md#B3`
**SPEC_GAPS**: Opened E.5 (idempotency scope incomplete)

---

### Signature Verification

#### Algorithm & Security
- [x] ✅ PASS: Uses raw body (not re-parsed JSON)
- [x] ✅ PASS: HMAC-SHA256 with base64 encoding
- [ ] ❌ FAIL: Not using constant-time comparison (see Issue 3)
- [x] ✅ PASS: Test vectors TV01-TV03 present and passing

**Issue 3**: Timing attack vulnerability
**File**: `src/payments/adapters/mock.ts:42`
**Current**:
```typescript
if (signature !== expectedSignature) {  // ❌ String comparison
  throw new Error('INVALID_SIGNATURE');
}
```

**Required**:
```typescript
if (!crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
)) {
  throw new Error('INVALID_SIGNATURE');
}
```

**Reference**: `tests/acceptance/payments-webhook.test.md#C3` (timing attack test)

---

### Negative Paths

#### Error Handling
- [x] ✅ PASS: Missing Idempotency-Key → 400
- [x] ✅ PASS: Short Idempotency-Key → 400
- [x] ✅ PASS: Negative amountCents → 400
- [x] ✅ PASS: Invalid signature → 400
- [x] ✅ PASS: Unknown event type → 400

---

### Test Coverage

#### Test Files Present
- [x] ✅ PASS: 11 test files mapped (unit: 7, integration: 2, e2e: 2)
- [x] ✅ PASS: All tests pass (`npm test`)
- [x] ✅ PASS: Coverage 87% (target: >80%)

#### Acceptance Test Mapping
- [x] ✅ PASS: All 54 acceptance tests mapped to runnable tests
- [x] ✅ PASS: Spec-Trace.yml updated with file:line mappings

---

### SPEC_GAPS Updates

**New Gaps Identified**:

1. **E.5 — Idempotency Scope Incomplete** (MEDIUM priority)
   - Missing business key fingerprint in collision detection
   - See Issue 2 above

2. **E.6 — DDL Fields Referenced But Not Present** (LOW priority, non-blocking)
   - Code references `orders.providerMeta` (not yet in schema)
   - Proposal: Apply DDL Delta 1 from DDL_Deltas_Proposals.md

**Existing Gaps Status**:
- D.1 (Partial refund) — NOT implemented (expected, non-blocking)
- D.2-D.5 (TTL policies) — NOT implemented (expected, proposals only)
- E.4 (Job options) — NOT implemented (expected, future work)

---

### Decision: Go / Block

**Verdict**: ⚠️ **CHANGES REQUESTED**

**Blocking Issues**:
1. Timing attack vulnerability (Issue 3) — **CRITICAL SECURITY**
2. Idempotency collision not detected (Issue 2) — **HIGH** (data integrity)

**Non-Blocking**:
- Deprecated endpoint (Issue 1) — **MEDIUM** (can be follow-up)
- DDL field references — **LOW** (document in SPEC_GAPS, apply deltas later)

---

### Minimum Fixes Required for Approval

**Before merging**:
- [ ] Fix Issue 3: Use `crypto.timingSafeEqual` in signature verification
- [ ] Fix Issue 2: Add business key collision detection in idempotency check
- [ ] Verify all acceptance tests still pass after fixes

**Can be follow-up PR**:
- Remove deprecated `/orders/prepare` endpoint
- Apply approved DDL deltas

---

### Next Steps

1. Codex: Apply fixes for Issues 2 and 3
2. Codex: Re-run `npm test` (all 54 tests must pass)
3. Codex: Re-request review
4. Spec Concierge: Re-review (expect approval if fixes applied correctly)

---

**Review Time**: 110 minutes (7-step protocol followed)
**Test Pass Rate**: 52/54 (96%) — 2 failures from Issues 2 & 3
**Critical Issues**: 1 (timing attack)
**High Issues**: 1 (idempotency collision)
**Review Round**: 1 of 3 (max)

**Reviewed by**: Spec Concierge (Claude)
```

---

## Current State: Awaiting Codex Branch

**Action Required**: Codex must push implementation branch before review can proceed.

**When Codex PR appears**:
1. Apply this review framework step-by-step
2. Generate PR comment using template above
3. Update SPEC_GAPS.md with any new findings
4. Provide minimal patch diffs for each issue

**Expected Timeline**:
- Codex PR creation: TBD
- Initial review: Within 24 hours
- Review completion: Within 3 rounds (110 min each)

---

**End of Review Framework**
