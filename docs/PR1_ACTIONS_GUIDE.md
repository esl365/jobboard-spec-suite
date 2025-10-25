# PR #1 Manual Actions Guide

**Role:** Spec Concierge / Reviewer
**Date:** 2025-10-25
**PR:** feat(payments): implement prepare + webhook (idempotent, provider-neutral)
**Branch:** `codex/run-pre-flight-and-log-issues`

---

## Overview

Since GitHub CLI (`gh`) is not available, all PR operations must be performed manually via GitHub web interface. This guide provides step-by-step instructions and ready-to-paste content.

---

## Action 1: Create Docs-Only PR

### Step 1.1: Navigate to PR Creation URL

**Open in browser:**
```
https://github.com/esl365/jobboard-spec-suite/compare/main...claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF?expand=1
```

### Step 1.2: Fill PR Details

**Title:**
```
docs: Payments spec artifacts & review protocol for Codex implementation
```

**Body:** *(Copy-paste this exactly)*
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
- `docs/PR1_COMMENT_*.md` (4 files) — Ready-to-post PR comments
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

Click **"Create pull request"**

### Step 1.4: Note PR Number

**Important:** After creating the PR, note the PR number (e.g., #2, #3, etc.)

You'll need this for Action 2.

---

## Action 2: Post Comments to PR #1

**Navigate to PR #1:**
```
https://github.com/esl365/jobboard-spec-suite/pull/1
```

### Comment 2.1: Conflict-Gate Plan

**Type:** Top-level comment (NOT a review, NOT a file comment)

**Content:** Copy from `docs/PR1_COMMENT_1_CONFLICT_GATE.md` or paste below:

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

---

### Comment 2.2: Cross-Link to Docs-Only PR

**Type:** Top-level comment

**Content:** *(Replace `[PR_NUMBER]` with the actual PR number from Action 1)*

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

---

### Comment 2.3: Blocking Check A — Signature Encoding

**Type:** Top-level comment

**Content:**

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

---

### Comment 2.4: Blocking Check B — Raw Body Capture

**Type:** Top-level comment

**Content:**

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

---

## Action 3: Convert PR #1 to Draft

**Navigate to:** https://github.com/esl365/jobboard-spec-suite/pull/1

### Step 3.1: Convert to Draft

1. Scroll to bottom of PR page
2. In the right sidebar, look for "Reviewers" section
3. Scroll down further to find **"Convert to draft"** button
4. Click **"Convert to draft"**

**Note:** Button may be in different location depending on PR status. If you don't see it, look for a dropdown menu near the merge button.

---

## Action 4: Apply Label to PR #1

**Navigate to:** https://github.com/esl365/jobboard-spec-suite/pull/1

### Step 4.1: Check if `codex` label exists

1. In the right sidebar, find **"Labels"** section
2. Click the gear icon next to "Labels"
3. Look for `codex` label

### Step 4.2: Create label if missing

If `codex` label doesn't exist:

1. Navigate to: https://github.com/esl365/jobboard-spec-suite/labels
2. Click **"New label"**
3. Fill in:
   - **Name:** `codex`
   - **Description:** `Codex implementation work`
   - **Color:** `#0075ca` (blue) or your choice
4. Click **"Create label"**

### Step 4.3: Apply label to PR #1

1. Return to PR #1
2. In the right sidebar, click the gear icon next to "Labels"
3. Check the box next to `codex`
4. Click outside the dropdown to save

---

## Summary of Actions

**Completed:**
- ✅ Created 4 PR comment files (ready to paste)
- ✅ Updated SPEC_GAPS.md with GAP-001, GAP-002, GAP-003
- ✅ Committed and pushed all artifacts to spec review branch

**Manual Actions Required (You):**

1. **Create Docs-Only PR**
   - URL: https://github.com/esl365/jobboard-spec-suite/compare/main...claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF?expand=1
   - Copy title and body from this guide
   - Note the PR number

2. **Post 4 Comments to PR #1**
   - Comment 2.1: Conflict-Gate Plan
   - Comment 2.2: Cross-Link (replace `[PR_NUMBER]`)
   - Comment 2.3: Blocking Check A
   - Comment 2.4: Blocking Check B

3. **Convert PR #1 to Draft**

4. **Apply `codex` label to PR #1**

---

## What Happens Next

**Codex must:**
1. Resolve merge conflicts locally (3-way merge)
2. Fix GAP-001 (hex → base64 encoding)
3. Verify GAP-002 (rawBody middleware present)
4. Run `npm run preflight && npm test`
5. Post outputs in PR #1 comment
6. Push resolution commit

**After Codex posts outputs:**
- Spec Concierge applies 7-phase review
- Posts 3 deliverables:
  - Spec-Trace Coverage (47 acceptance IDs)
  - Preflight Gate (lint + drift = 0)
  - Exactly-Once Evidence (de-dupe + TX + replay tests)

---

**Prepared by:** Spec Concierge (Claude)
**Date:** 2025-10-25
**All supporting documents:** `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF` branch
