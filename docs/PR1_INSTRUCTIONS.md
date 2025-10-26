# PR #1 Spec Review Instructions

## Immediate Actions Required

Since the GitHub CLI (`gh`) is not available in this environment, you'll need to perform these actions manually via the GitHub web interface.

---

## 1. Post Conflict-Gate Plan Comment

**Action:** Copy the contents of `docs/PR1_COMMENT_1_CONFLICT_GATE.md` and post as a comment on PR #1

**Comment location:** Post as a **top-level comment** (not a review, not a file comment)

**Full details available in:** `docs/PR1_CONFLICT_GATE_PLAN.md` (reference document with more details)

---

## 2. Convert PR to Draft

**Why:** PR has merge conflicts and requires resolution before review can proceed

**Action via GitHub UI:**
1. Navigate to PR #1
2. In the right sidebar, click the gear icon next to "Reviewers"
3. Scroll down and find "Convert to draft"
4. Click "Convert to draft"

**Note:** Title prefix "[DRAFT]" is optional (depends on repo guidelines)

---

## 3. Apply Label

**Action:** Add label `codex` to PR #1

**If label doesn't exist:**
1. Go to repository Settings → Labels
2. Create new label: `codex` (color: your choice, e.g., #0075ca)
3. Return to PR #1 and apply the label

---

## 4. SPEC_GAPS Updated

**Location:** `specs/SPEC_GAPS.md` — 3 new entries added:
- **GAP-001:** Signature encoding drift (hex vs. base64) — **BLOCKING**
- **GAP-002:** rawBody fallback may re-stringify — **REQUIRES VERIFICATION**
- **GAP-003:** Redocly CLI not vendored — **NON-BLOCKING**

These gaps reference `src/payments/adapters/mock.ts`, `src/routes/webhooks.payments.ts`, and `package.json`.

---

## 5. Wait for Codex Response

**Codex must:**
1. Resolve merge conflicts locally (3-way merge)
2. Apply canonical resolutions from conflict-gate plan
3. Fix GAP-001 (hex → base64 encoding in mock.ts)
4. Verify GAP-002 (middleware provides request.rawBody)
5. Run `npm run preflight && npm test`
6. Post outputs in PR comment
7. Push resolution commit

---

## 6. After Conflict Resolution — 7-Phase Review

Once Codex posts preflight/test outputs showing green, the Spec Concierge will apply the 7-phase review using templates from:

- `docs/CODEX_PR_REVIEW_COMMENTS.md` (phase-by-phase checklists)
- `docs/SPEC_CONCIERGE_QUICK_REF.md` (workflow & STOP rules)
- `docs/PR_REVIEW_PROTOCOL.md` (detailed 7-phase framework)

**Review phases:**
1. Contract Conformance
2. Auth/RBAC
3. DDL & ORM
4. Idempotency
5. Exactly-Once Webhook Settlement
6. Signature Verification
7. Tooling/Preflight

**Deliverables to post:**
- Spec-Trace Coverage (47 acceptance IDs)
- Preflight Gate (lint + drift output)
- Exactly-Once Evidence (test assertions)

---

## Summary

**Immediate:** Post conflict-gate comment, convert to draft, apply `codex` label
**Blocking:** Codex must resolve conflicts and fix GAP-001 (hex → base64)
**Next:** Spec Concierge applies 7-phase review after resolution

**All supporting documents committed to:** `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF` branch
