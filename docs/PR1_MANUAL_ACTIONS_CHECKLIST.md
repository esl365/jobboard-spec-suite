# PR #1 Manual Actions Checklist

**Date:** 2025-10-25
**Role:** Spec Concierge / Reviewer
**PR #1:** https://github.com/esl365/jobboard-spec-suite/pull/1

---

## ✅ Action 1: Create Docs-Only PR

### Step 1.1: Open PR Creation Page

**URL to open in browser:**
```
https://github.com/esl365/jobboard-spec-suite/compare/main...claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF?expand=1
```

### Step 1.2: Fill PR Form

**Title:**
```
docs: Payments spec artifacts & review protocol for Codex implementation
```

**Body:** (Copy-paste exactly as shown)
```markdown
## Summary
Spec artifacts and review protocol for the payments vertical slice (prepare + webhook endpoints). These documents support Codex's implementation review per the spec concierge role.

## Key Artifacts
- **DDL Delta Proposals**: `provider_meta`, `expires_at`, `retention_until` (Approved for v1); **Partial refunds** (Decision pending → target v1.1)
- **Review Protocol**: 7-phase checklist with contract, idempotency, exactly-once, signature verification steps
- **Test Specs**: acceptance cases for prepare + webhook (mapped)
- **Spec Trace**: signature test vectors (TV01–TV03) + mappings to runnable tests
- **SPEC_GAPS**: OpenAPI duplicates resolved; Section D/E gaps documented; GAP-001, GAP-002, GAP-003 added from PR #1 conflict review

## Usage
When Codex opens their implementation PR:
1) Apply `docs/PR_REVIEW_PROTOCOL.md` (7-phase).
2) Validate against `tests/acceptance/`.
3) Reference `docs/llm-input-pack/DDL_Deltas_Proposals.md` (implement approved deltas only).
4) Run `npm run preflight` and attach outputs (lint + drift).

## Decision Note
Partial refunds are **deferred from v1** (target v1.1) to limit churn and keep drift at 0.

## Files Changed (13 files, +4,779/-733 lines)

### Added
- `docs/PR_REVIEW_PROTOCOL.md` (627 lines) — 7-phase systematic review framework
- `docs/PR_REVIEW_CHECKLIST_PAYMENTS.md` (470 lines) — Executive summary with 27 acceptance criteria
- `docs/CODEX_PR_REVIEW_COMMENTS.md` (425 lines) — Phase-by-phase comment templates
- `docs/SPEC_CONCIERGE_QUICK_REF.md` (277 lines) — Quick reference (workflow, STOP rules, DoD)
- `docs/PR1_CONFLICT_GATE_PLAN.md` (353 lines) — Canonical conflict resolutions for PR #1
- `docs/PR1_COMMENT_*.md` (7 files) — Ready-to-post PR comments
- `docs/llm-input-pack/DDL_Deltas_Proposals.md` (346 lines) — 4 DDL deltas with migration SQL
- `tests/acceptance/payments-prepare.test.md` (491 lines) — 23 test cases for prepare endpoint
- `tests/acceptance/payments-webhook.test.md` (624 lines) — 31 test cases for webhook endpoint

### Modified
- `specs/Spec-Trace.yml` (+860 lines) — Signature verification test vectors (TV01-TV03), runnable test mappings
- `specs/SPEC_GAPS.md` (+90 lines) — GAP-001, GAP-002, GAP-003 from PR #1 conflict review

### Deleted
- `CODEX_PR_REVIEW_FINDINGS.md` (-732 lines) — Consolidated into PR_REVIEW_PROTOCOL.md

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Step 1.3: Create PR

Click **"Create pull request"** button.

### Step 1.4: Note the PR Number

**⚠️ CRITICAL:** After the PR is created, note the PR number (e.g., #2, #3, etc.).

**Write it here:** Docs PR # ________

You'll need this number for Action 2, Comment 2.2.

---

## ✅ Action 2: Post 4 Comments to PR #1

**Navigate to:** https://github.com/esl365/jobboard-spec-suite/pull/1

Post these comments **in order** as **top-level comments** (NOT reviews, NOT file comments).

---

### Comment 2.1: Conflict-Gate Plan

**Click:** "Add a comment" at the bottom of the PR conversation

**Paste this content:**

```markdown
# Conflict-Gate Plan (Spec-First)

**PR Status:** Merge conflicts detected — resolution required before review

**Conflicted Files:** 6 files require canonical resolution
- `package.json`
- `scripts/openapi-lint.mjs`
- `src/infra/memory/payments.repos.ts`
- `src/payments/adapters/mock.ts`
- `src/payments/registry.ts`
- `src/routes/webhooks.payments.ts`

---

## Canonical Resolutions

### 1. `package.json`

**Resolution:** Use consolidated `preflight.mjs` from main + keep Codex's real test commands

```json
{
  "scripts": {
    "preflight": "node scripts/preflight.mjs",
    "test": "node --loader ./scripts/ts-esm-loader.mjs --test tests/payments.prepare.test.ts && node --loader ./scripts/ts-esm-loader.mjs --test tests/payments.webhooks.test.ts"
  },
  "devDependencies": {
    "@redocly/cli": "file:./tools/redocly/redocly-cli-2.8.0.tgz",
    "yaml": "^2.6.0"
  }
}
```

**Rationale:** Consolidated preflight is cleaner; Codex tests are functional (main's stub is not)

**Gate:** If `tools/redocly/redocly-cli-2.8.0.tgz` missing → SPEC_GAPS GAP-003 (non-blocking)

---

### 2. `scripts/openapi-lint.mjs`

**Resolution:** Accept main's comprehensive YAML-based linting

**Rationale:** Main's implementation is more robust (YAML parsing, better error reporting)

**Required:** Offline fallback acceptable for v1, but create follow-up PR to vendor Redocly for DoD

---

### 3. `src/infra/memory/payments.repos.ts`

**Resolution:** Accept Codex (HEAD) implementation entirely

**Verify:**
- Interface matches DB repository contract
- No raw SQL leakage
- In-memory impl is ONLY for unit tests

---

### 4. `src/payments/adapters/mock.ts` ⚠️ **REQUIRES FIX**

**Resolution:** Accept Codex implementation with **critical encoding fix**

**❌ BLOCKING ISSUE:** Signature encoding mismatch

**Current (line 19):**
```typescript
return crypto.createHmac("sha256", secret).update(raw).digest("hex");
```

**Required (SPEC_GAPS GAP-001):**
```typescript
return crypto.createHmac("sha256", secret).update(raw).digest("base64");
```

**Also fix line 25:**
```typescript
// Change from:
const signatureBuffer = Buffer.from(signature, "hex");
const expectedBuffer = Buffer.from(expected, "hex");

// To:
const signatureBuffer = Buffer.from(signature, "base64");
const expectedBuffer = Buffer.from(expected, "base64");
```

**Why:** `specs/Spec-Trace.yml` test vectors (TV01-TV03) specify **base64 encoding**. Current hex encoding breaks contract conformance.

**Action:** Fix before merge (blocking)

---

### 5. `src/payments/registry.ts`

**Resolution:** Accept Codex (HEAD) implementation entirely

**Verify:** Registry only registers `mock` provider (no "iamport" in default)

**Gate:** If "iamport" or any non-mock provider in default registry → BLOCK merge

---

### 6. `src/routes/webhooks.payments.ts` ⚠️ **REQUIRES VERIFICATION**

**Resolution:** Accept Codex (HEAD) implementation with verification

**✅ Verified:**
- HMAC verification over rawBody
- Constant-time compare via adapter
- Timestamp tolerance ±300s
- Event de-dupe BEFORE effects
- Single transaction boundary
- Replay returns 200 without duplicate credits

**⚠️ Issue (SPEC_GAPS GAP-002):** rawBody fallback

**Line 43:**
```typescript
const rawBody = typeof request.rawBody === "string" ? request.rawBody : stableStringify(request.body ?? {});
```

**Risk:** Re-stringifying body may not match original wire format (timing attack vulnerability)

**Required:** Verify middleware captures `request.rawBody` BEFORE JSON parsing

**Action:** If middleware proven present in integration tests → non-blocking; otherwise add middleware

---

## Resolution Process

**DO:**
1. ✅ Resolve conflicts **locally** (3-way merge) — preserves type signatures
2. ✅ After resolution, run:
   ```bash
   npm run preflight
   npm test
   ```
3. ✅ Post outputs (last ~20 lines) in PR comment
4. ✅ Ping @spec-concierge when resolution pushed

**DON'T:**
1. ❌ Use GitHub web editor (loses type safety)
2. ❌ Skip preflight/test verification
3. ❌ Introduce new dependencies without SPEC_GAPS gate

---

## SPEC_GAPS Created

**GAP-001:** Signature encoding drift (hex vs. base64) — **BLOCKING**
**GAP-002:** rawBody fallback may re-stringify — **REQUIRES VERIFICATION**
**GAP-003:** Redocly CLI not vendored — **NON-BLOCKING** (follow-up PR required for DoD)

See `specs/SPEC_GAPS.md` for full details.

---

## Next Actions

1. **Codex:** Resolve conflicts locally per canonical resolutions above
2. **Codex:** Fix GAP-001 (hex → base64) in `src/payments/adapters/mock.ts`
3. **Codex:** Verify GAP-002 (middleware provides `request.rawBody`)
4. **Codex:** Run `npm run preflight && npm test`, paste outputs
5. **Codex:** Push resolution
6. **Spec Concierge:** Apply 7-phase review once conflicts resolved and preflight green

---

**Reviewed by:** Spec Concierge (Claude)
**Full resolution plan:** `docs/PR1_CONFLICT_GATE_PLAN.md`
```

**Click:** "Comment" to post

---

### Comment 2.2: Cross-Link to Docs PR

**⚠️ IMPORTANT:** Replace `[PR_NUMBER]` with the actual docs PR number from Action 1.

**Paste this content:**

```markdown
## Reference: Spec Artifacts & Review Protocol

**Docs-only PR:** See spec artifacts and 7-phase review protocol at:

**https://github.com/esl365/jobboard-spec-suite/pull/[PR_NUMBER]**

*(Branch: `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF` → `main`)*

This PR includes:
- `docs/llm-input-pack/DDL_Deltas_Proposals.md` — Approved v1 deltas (provider_meta, expires_at, retention_until)
- `docs/PR_REVIEW_PROTOCOL.md` — 7-phase review framework
- `docs/CODEX_PR_REVIEW_COMMENTS.md` — Phase-by-phase checklists
- `specs/Spec-Trace.yml` — Test vectors TV01-TV03 for signature verification
- `specs/SPEC_GAPS.md` — Updated with GAP-001, GAP-002, GAP-003
- `tests/acceptance/` — 47 acceptance test cases (prepare + webhook)

**Action Required:**
1. Resolve conflicts per Conflict-Gate Plan above
2. Fix GAP-001 (hex → base64 encoding)
3. Verify GAP-002 (rawBody middleware)
4. Re-run `npm run preflight && npm test`
5. Post outputs (last ~20 lines)

Once conflicts resolved and gates green, Spec Concierge will apply 7-phase review.

---

**Spec Concierge (Claude)**
```

**Click:** "Comment" to post

---

### Comment 2.3: Blocking Check A — Signature Encoding

**Paste this content:**

```markdown
## ❌ Blocking Check A — Signature Encoding (GAP-001)

**Reference:** `specs/SPEC_GAPS.md` GAP-001

**Required:**
- HMAC-SHA256 over **RAW body** (not re-parsed JSON)
- `digest('base64')` encoding (NOT `digest('hex')`)
- Header name aligned with `specs/Spec-Trace.yml` test vectors TV01–TV03
- Constant-time comparison via `crypto.timingSafeEqual()`

**Current Issue:**
- `src/payments/adapters/mock.ts:19` uses `digest("hex")`
- `src/payments/adapters/mock.ts:25` uses `Buffer.from(signature, "hex")`
- **Breaks contract:** Test vectors TV01-TV03 expect base64-encoded signatures

**Required Fix:**
```typescript
// Line 19: Change digest encoding
signPayload(payload, secret = this.webhookSecret) {
  const raw = typeof payload === "string" ? payload : stableStringify(payload);
  return crypto.createHmac("sha256", secret).update(raw).digest("base64"); // ← base64
}

// Line 25: Update Buffer.from encoding
verifySignature({ rawBody, signature, secret = this.webhookSecret }) {
  if (!signature) return false;
  const expected = this.signPayload(rawBody, secret);
  const signatureBuffer = Buffer.from(signature, "base64"); // ← base64
  const expectedBuffer = Buffer.from(expected, "base64"); // ← base64
  if (signatureBuffer.length !== expectedBuffer.length) return false;
  try {
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
```

**Evidence Required:**
- [ ] Link to fixed code in `src/payments/adapters/mock.ts`
- [ ] Test case exercising TV01 (valid signature) → 200 OK
- [ ] Test case exercising TV02 (alternate valid signature) → 200 OK
- [ ] Test case exercising TV03 (wrong secret) → 400 INVALID_SIGNATURE

**Status:** 🔴 **BLOCKING** — Must fix before merge

---

**Spec Concierge (Claude)**
```

**Click:** "Comment" to post

---

### Comment 2.4: Blocking Check B — Raw Body Capture

**Paste this content:**

```markdown
## ⚠️ Blocking Check B — Raw Body Capture (GAP-002)

**Reference:** `specs/SPEC_GAPS.md` GAP-002

**Required:**
- Middleware captures `request.rawBody` **BEFORE** JSON body-parser runs
- NO stringify fallback in signature verification path
- Webhook handler throws error if `request.rawBody` is missing

**Current Issue:**
- `src/routes/webhooks.payments.ts:43` has fallback: `stableStringify(request.body ?? {})`
- **Risk:** Re-stringified body may not match original wire format (whitespace, key order)
- **Vulnerability:** Timing attack — attacker crafts JSON that passes re-stringify but fails original signature

**Required Fix:**
```typescript
// src/routes/webhooks.payments.ts:43
// Remove fallback — require rawBody from middleware
const rawBody = request.rawBody;
if (!rawBody) {
  throw badRequest("RAW_BODY_REQUIRED", "Raw body middleware not configured");
}
```

**Middleware Required:**
```typescript
// Example: Express/Fastify middleware to capture raw body
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
});

// OR use body-parser with verify option:
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
```

**Evidence Required:**
- [ ] Link to middleware that captures `request.rawBody` (server setup or test fixture)
- [ ] Test case: signature verification succeeds with valid rawBody
- [ ] Test case: signature verification **fails** if rawBody is absent (throws RAW_BODY_REQUIRED)
- [ ] Test case: signature verification **fails** if body is re-parsed/re-stringified

**Status:** 🟡 **OPEN** — Requires verification

**Action:**
- If middleware proven present in integration tests → **non-blocking**
- If middleware missing or no test coverage → **BLOCKING**

---

**Spec Concierge (Claude)**
```

**Click:** "Comment" to post

---

## ✅ Action 3: Convert PR #1 to Draft

**On the same PR #1 page:**

1. Scroll to the bottom of the page
2. Look for the **"Convert to draft"** button (usually near the merge button or in the sidebar)
3. Click **"Convert to draft"**

**Note:** If you don't see the button, look for a dropdown menu (⋯) near the merge button.

---

## ✅ Action 4: Apply `codex` Label to PR #1

**On the same PR #1 page:**

### Option A: Label Already Exists

1. In the right sidebar, find **"Labels"**
2. Click the gear icon (⚙️) next to "Labels"
3. Check the box next to **`codex`**
4. Click outside the dropdown to save

### Option B: Create Label First

If `codex` label doesn't exist:

1. Navigate to: https://github.com/esl365/jobboard-spec-suite/labels
2. Click **"New label"** button
3. Fill in:
   - **Name:** `codex`
   - **Description:** `Codex implementation work`
   - **Color:** `#0075ca` (blue) or your choice
4. Click **"Create label"**
5. Return to PR #1 and follow Option A steps

---

## ⏸️ Action 5: Wait for Codex Response

**Do NOT proceed until Codex:**
1. ✅ Resolves merge conflicts locally
2. ✅ Fixes GAP-001 (hex → base64)
3. ✅ Verifies GAP-002 (rawBody middleware)
4. ✅ Runs `npm run preflight && npm test`
5. ✅ Posts a comment with outputs
6. ✅ Pushes resolution commit

---

## 📋 Action 6: Request Evidence (After Codex Posts)

**When Codex posts their conflict resolution comment:**

**Post this follow-up comment to PR #1:**

```markdown
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
- [ ] `src/payments/types.ts` (or similar) — Shared header constant definition
- [ ] `src/routes/webhooks.payments.ts` — Handler reading signature from shared constant

---

### 2.2: Raw-Body Capture (Before JSON Parse)

**Required:**
- ✅ Middleware captures `request.rawBody` **BEFORE** JSON body-parser runs
- ✅ NO `stableStringify(request.body)` fallback in webhook handler verifier path
- ✅ Handler throws error if `request.rawBody` is missing

**Code pointers needed:**
- [ ] Server bootstrap/middleware file — Raw body capture middleware
- [ ] `src/routes/webhooks.payments.ts` — Handler line that reads `request.rawBody` (NO fallback)

---

### 2.3: Unique Constraint (Provider + Event UID)

**Required:**
- ✅ Schema defines unique constraint on `(provider, provider_event_id)` or similar
- ✅ Migration adds this constraint

**Code pointers needed:**
- [ ] `db/schema.pg.sql` — Table definition with unique constraint
- [ ] `db/migrations/*_payments_deltas.sql` — Migration adding unique constraint

---

### 2.4: Exactly-Once Transaction Boundary

**Required:**
- ✅ Event de-dupe check occurs **BEFORE** any side effects (inside transaction)
- ✅ Order state transition + wallet ledger append happen in **SAME transaction**
- ✅ Replay of duplicate event returns 200 with no duplicate ledger entries

**Code pointers needed:**
- [ ] Service/handler file — Transaction wrapper
- [ ] Line where de-dupe check happens
- [ ] Lines where order state updated
- [ ] Lines where wallet ledger appended
- [ ] Early return on duplicate event

---

### 2.5: Acceptance Test Mapping (Spec-Trace Runnables)

**Required:**
- ✅ Test cases cover replay scenarios
- ✅ Signature verification tests
- ✅ Timestamp tolerance tests

**Code pointers needed:**
- [ ] Test file exercising replay/duplicate events
- [ ] Test file exercising signature verification
- [ ] Test file exercising timestamp tolerance

---

## Part 3: SPEC_GAPS Status Confirmation

Based on your code pointers, I'll update SPEC_GAPS statuses:

- **GAP-001 (hex→base64):** Will mark **RESOLVED** if `digest('base64')` confirmed and tests pass
- **GAP-002 (rawBody):** Will mark **RESOLVED** if middleware captures raw bytes before JSON parse
- **GAP-003 (Redocly):** Remains **OPEN** — requires follow-up PR

---

## Next Steps

**After you provide:**
1. Preflight/test output tails (last ~20 lines each)
2. Code pointers (file paths + line numbers) for items 2.1-2.5

**I will:**
1. Run 7-phase review
2. Post 3 deliverables:
   - **Spec-Trace Coverage** (54 acceptance IDs mapped)
   - **Preflight Gate** (lint + drift = 0 confirmation)
   - **Exactly-Once Evidence** (de-dupe + TX + replay assertions)
3. Update SPEC_GAPS status in PR
4. Provide APPROVE / REQUEST CHANGES / BLOCK verdict

---

**Spec Concierge (Claude)**
```

---

## 📊 Completion Checklist

Mark each action as you complete it:

- [ ] **Action 1:** Created docs-only PR (noted PR number: ________)
- [ ] **Action 2.1:** Posted Conflict-Gate Plan comment to PR #1
- [ ] **Action 2.2:** Posted Cross-Link comment to PR #1 (with docs PR number)
- [ ] **Action 2.3:** Posted Blocking Check A comment to PR #1
- [ ] **Action 2.4:** Posted Blocking Check B comment to PR #1
- [ ] **Action 3:** Converted PR #1 to Draft
- [ ] **Action 4:** Applied `codex` label to PR #1
- [ ] **Action 5:** Waiting for Codex response...
- [ ] **Action 6:** (After Codex posts) Posted evidence request comment

---

## 🚨 STOP Rules (Automatic Enforcement)

If at any point during review:

- ❌ **Contract drift detected** (OpenAPI path/method differs from implementation)
- ❌ **Unapproved DDL changes** (beyond Delta 1-3)
- ❌ **OpenAPI ↔ DDL drift > 0**

**I will:**
1. **STOP** immediately
2. Create new **SPEC_GAP** entry with:
   - Context (file:line where drift detected)
   - Impact (why it blocks Spec-First)
   - Minimal Proposal (temporary alias route OR tiny spec patch)
3. **BLOCK** merge until drift = 0

**GAP-003 (Redocly) stays OPEN** as non-blocking follow-up requirement for DoD.

---

## 📁 Reference Documents

All supporting files are in: `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF`

**Comment Source Files:**
- `docs/PR1_COMMENT_1_CONFLICT_GATE.md` (173 lines)
- `docs/PR1_COMMENT_2_CROSS_LINK.md` (34 lines)
- `docs/PR1_COMMENT_3_BLOCKING_A.md` (57 lines)
- `docs/PR1_COMMENT_4_BLOCKING_B.md` (79 lines)
- `docs/PR1_COMMENT_5_EVIDENCE_REQUEST.md` (143 lines)

**Review Templates:**
- `docs/PR1_DELIVERABLE_TEMPLATES.md` (713 lines)
- `docs/CODEX_PR_REVIEW_COMMENTS.md` (425 lines)
- `docs/PR_REVIEW_PROTOCOL.md` (627 lines)

**SPEC_GAPS:**
- `specs/SPEC_GAPS.md` (GAP-001, GAP-002, GAP-003 defined)

---

**Prepared by:** Spec Concierge (Claude)
**Language:** All comments in English
**Ready:** All content copy-paste ready for GitHub web UI
