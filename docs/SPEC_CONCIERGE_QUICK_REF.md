# Spec Concierge Quick Reference

**Role:** Spec-First Reviewer/Tester for payments vertical slice (prepare + webhook)

---

## Workflow

### Step 1: When Codex Opens Draft PR

1. **Fetch the branch:**
   ```bash
   git fetch origin codex/payments-core-v1
   git checkout codex/payments-core-v1
   ```

2. **Verify file structure:**
   ```bash
   find src -name "*.ts" | grep -E "(prepare|webhook)"
   find tests -name "*.test.ts" | grep -E "(payment|webhook)"
   ```

3. **Run preflight:**
   ```bash
   npm run preflight > /tmp/preflight.log 2>&1
   tail -20 /tmp/preflight.log
   ```

4. **Run tests:**
   ```bash
   npm test -- --coverage
   npm run test:integration
   ```

---

### Step 2: Apply 7-Phase Review

**Use:** `docs/CODEX_PR_REVIEW_COMMENTS.md` as template source.

**For each phase:**
1. Read phase checklist
2. Review relevant code sections
3. Fill in findings
4. Mark status: PASS / FAIL / BLOCKED
5. Post comment to Codex PR

**Critical files to review:**

| Phase | Files to Check |
|-------|----------------|
| 1. Contract | `src/routes/payments.*.ts`, `openapi/api-spec.yaml` |
| 2. Auth/RBAC | `src/middleware/auth.*.ts`, `src/guards/*.ts` |
| 3. DDL/ORM | `db/migrations/*.sql`, `src/repositories/*.ts` |
| 4. Idempotency | `src/services/idempotency.*.ts`, `src/middleware/idempotency.*.ts` |
| 5. Exactly-Once | `src/routes/webhooks.*.ts`, `src/services/payment.*.ts` |
| 6. Signature | `src/webhooks/signature.*.ts`, `src/middleware/raw-body.*.ts` |
| 7. Tooling | `package.json`, `scripts/preflight.mjs`, CI config |

---

### Step 3: Post Deliverables

**Deliverable 1: Spec-Trace Coverage**
- Map Codex tests to 47 acceptance IDs (23 prepare + 24 webhook)
- Use template from `CODEX_PR_REVIEW_COMMENTS.md → Deliverable 1`
- Check off each test ID found

**Deliverable 2: Preflight Gate**
- Paste last 20 lines of `npm run preflight`
- Mark lint/drift status
- Overall gate: GREEN / AMBER / RED

**Deliverable 3: Exactly-Once Evidence**
- Point to test file: `tests/integration/webhooks/exactly-once.test.ts`
- Paste test output showing single ledger entry assertions
- Status: VERIFIED / MISSING / FAILED

---

### Step 4: Handle Failures

**If any phase = FAIL or BLOCKED:**

1. **Add SPEC_GAP entry:**
   ```bash
   # Edit specs/SPEC_GAPS.md
   # Add new GAP-XXXX using template
   ```

2. **Template:**
   ```markdown
   ### GAP-XXXX: <short title>
   **Context:** <file:line, what's wrong>
   **Impact:** <why it blocks Spec-First>
   **Minimal Proposal:** <smallest fix>
   **Status:** OPEN
   ```

3. **Do NOT suggest code fixes** until SPEC_GAP is documented.

4. **Request Codex address** the gap (spec patch OR code alias).

---

## STOP Rules

**STOP and create SPEC_GAP if:**
- ❌ Contract drift detected (endpoint/schema mismatch with OpenAPI)
- ❌ Unapproved DDL changes (anything beyond Delta 1-3)
- ❌ Business key scope too narrow (missing amountCents/packageId)
- ❌ De-dupe check AFTER side effects (violates exactly-once)
- ❌ Signature verification uses `===` (timing attack vulnerability)
- ❌ Transaction boundary missing (partial state possible)
- ❌ Raw SQL in handlers (violates ORM-only policy)
- ❌ Hardcoded secrets found
- ❌ Acceptance test coverage <100% (47/47 required)

**STOP and request clarification if:**
- ❓ Ambiguous error handling (should return 400 or 422?)
- ❓ Unclear transaction scope (multiple DBs? distributed TX?)
- ❓ Missing spec detail (webhook retry backoff policy?)

---

## Approval Criteria (DoD)

**All must be GREEN to approve:**

- [x] All 7 phases = PASS
- [x] Acceptance coverage = 47/47 (100%)
- [x] Preflight gate = GREEN (0 lint errors, 0 drift)
- [x] All tests pass (unit + integration)
- [x] No SPEC_GAPS marked OPEN
- [x] Exactly-once evidence verified
- [x] Signature test vectors TV01-TV03 applied
- [x] DDL changes limited to approved v1 deltas (1-3 only)
- [x] No partial refund schema (deferred to v1.1)

**Conditional APPROVE (with follow-up):**
- ⚠️ Redocly offline fallback used → Create follow-up: "Vendor Redocly CLI"
- ⚠️ Minor coverage gaps (46/47) → Create follow-up: "Add missing test X"

**BLOCK if:**
- 🚫 Any phase = BLOCKED
- 🚫 Contract drift >0 and no spec patch proposed
- 🚫 Exactly-once semantics violated
- 🚫 Signature verification has timing attack vulnerability
- 🚫 Unapproved schema changes present

---

## Key Commands

```bash
# Sync and review
git fetch origin codex/payments-core-v1
git checkout codex/payments-core-v1
git diff main --stat

# Preflight
npm run preflight

# Tests
npm test
npm run test:integration

# Contract check
node scripts/spec-drift-check.mjs

# Coverage
npm test -- --coverage

# Signature verification reference
grep -r "timingSafeEqual" src/
grep -r "createHmac" src/

# Transaction boundary check
grep -r "transaction" src/ | grep -E "(begin|commit|rollback)"
```

---

## Test Vector Reference

**From:** `specs/Spec-Trace.yml → signature_verification.test_vectors`

**TV01:** Valid mock webhook
- **Secret:** `mock_webhook_secret_key_for_testing`
- **Raw body:** `{"eventUid":"evt_test_001","provider":"mock","type":"payment.completed",...}`
- **Expected signature:** `Fp8vH3fK2ZzJ6rR5tY7wA9bC1dE2gH4iJ5kL6mN7oP8=`
- **Expected result:** 200 OK

**TV02:** Valid mock webhook (alternate payload)
- **Expected signature:** `Q1r2S3t4U5v6W7x8Y9z0A1b2C3d4E5f6G7h8I9j0K1l=`
- **Expected result:** 200 OK

**TV03:** Invalid signature (wrong secret)
- **Secret:** `wrong_secret_key`
- **Expected result:** 400 INVALID_SIGNATURE

**Verify Codex tests include all 3 vectors.**

---

## DDL Delta Reference (v1 Approved)

**Delta 1:** `orders.provider_meta`
```sql
ALTER TABLE orders ADD COLUMN provider_meta JSONB NULL;
COMMENT ON COLUMN orders.provider_meta IS 'Provider-specific reconciliation metadata';
```

**Delta 2:** `idempotency_keys.expires_at`
```sql
ALTER TABLE idempotency_keys
  ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days');
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);
```

**Delta 3:** `webhook_events.retention_until`
```sql
ALTER TABLE webhook_events ADD COLUMN retention_until TIMESTAMPTZ NULL;
COMMENT ON COLUMN webhook_events.retention_until IS 'Provider-specific retention policy (90-180 days)';
```

**Delta 4:** Partial refunds → **DEFERRED to v1.1** (do NOT implement in this PR)

---

## Language Policy

- ✅ **English only** in code, contracts, PR comments
- ✅ Korean allowed in short explanatory notes (if needed)
- ✅ All identifiers: camelCase/PascalCase (English)
- ✅ All error messages: English
- ✅ All test descriptions: English

---

## Contact & Escalation

**If you encounter:**
- Fundamental spec ambiguity → Add to SPEC_GAPS, escalate to spec author
- CI/tooling blocker → Document in Phase 7, propose offline fallback
- Timeline pressure → Do NOT skip phases; mark incomplete phases as BLOCKED

**Priority:** Spec-First integrity > speed. Better to BLOCK and resolve gaps than to merge drift.

---

## Checklist Summary (for quick status)

**Phase Completion:**
- [ ] Phase 1: Contract Conformance
- [ ] Phase 2: Auth/RBAC
- [ ] Phase 3: DDL & ORM
- [ ] Phase 4: Idempotency
- [ ] Phase 5: Exactly-Once Webhook
- [ ] Phase 6: Signature Verification
- [ ] Phase 7: Tooling/Preflight

**Deliverables Posted:**
- [ ] Spec-Trace Coverage (47 acceptance IDs)
- [ ] Preflight Gate (lint + drift output)
- [ ] Exactly-Once Evidence (test output)

**Final Status:**
- [ ] All phases PASS
- [ ] All deliverables posted
- [ ] No OPEN SPEC_GAPS
- [ ] Verdict posted (APPROVE / REQUEST CHANGES / BLOCKED)

---

**Last updated:** 2025-10-25
**Role:** Spec Concierge for payments vertical slice (v1)
