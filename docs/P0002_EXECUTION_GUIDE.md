# P0002 Execution Guide — Manual Posting to PR #1

**Prompt:** `prompts/P0002-claude-7phase-review-and-approval.md`

**Pre-conditions Met:**
- ✅ Drift = 0 confirmed (from Codex evidence)
- ✅ Tests: 54/54 passing
- ✅ All STOP rules pass
- ✅ GAP-001, GAP-002 resolved

---

## ⚠️ I Cannot Post to GitHub Directly

I **cannot** create PRs or post comments because:
- No GitHub web UI access
- No `gh` CLI available

**You must manually copy-paste** the 6 comments below to PR #1.

---

## 📋 Comments to Post to PR #1

**Go to:** `https://github.com/esl365/jobboard-spec-suite/pull/1`

**Post these 6 comments in order:**

---

### Comment 1: Evidence Acknowledgment

Copy entire contents of: **`docs/PR1_COMMENT_6_EVIDENCE_ACK.md`**

---

### Comment 2: Deliverable 1 — Spec-Trace Coverage

Copy entire contents of: **`docs/PR1_COMMENT_7_DELIVERABLE_1.md`**

**Confirms:**
- ✅ 98% coverage (53/54 acceptance criteria)
- ✅ Only 1 minor non-critical gap

---

### Comment 3: Deliverable 2 — Preflight Gate ✅

Copy entire contents of: **`docs/PR1_COMMENT_8_DELIVERABLE_2.md`**

**Must include:**
- ✅ "drift mismatches: 0" (literal line)
- ✅ "OpenAPI↔DDL drift = 0 (confirmed)"
- ✅ Gate status: 🟢 GREEN

**Verification:** This file was updated with drift=0 confirmation in commit `894fcf4`

---

### Comment 4: Deliverable 3 — Exactly-Once Evidence

Copy entire contents of: **`docs/PR1_COMMENT_9_DELIVERABLE_3.md`**

**Verifies:**
- ✅ Unique constraint: `(provider, provider_event_id)`
- ✅ De-dupe check BEFORE side effects
- ✅ Single transaction boundary
- ✅ Replay test proves no duplicate credits

---

### Comment 5: SPEC_GAPS Verification

Copy entire contents of: **`docs/PR1_COMMENT_10_GAPS_VERIFICATION.md`**

**Status:**
- ✅ GAP-001 (base64): RESOLVED (with Codex's file:line pointers)
- ✅ GAP-002 (rawBody): RESOLVED (with Codex's file:line pointers)
- ⏳ GAP-003 (Redocly): OPEN (non-blocking, follow-up required)

---

### Comment 6: Final Verdict — APPROVE ✅

Copy entire contents of: **`docs/PR1_COMMENT_11_FINAL_VERDICT.md`**

**Verdict:** ✅ **APPROVE**

**Key sections:**
- All 7 phases PASS
- Drift = 0 confirmed
- Ready to merge with GAP-003 follow-up

**Verification:** This file was updated with APPROVE verdict in commit `894fcf4`

---

### Comment 7: Handshake

**Post this final comment:**

```markdown
NOTIFY-USER: 7-phase review complete — APPROVE posted on PR #1; remaining follow-up is GAP-003 (vendor Redocly CLI).

**Summary:**
- ✅ All 7 phases PASS
- ✅ Drift = 0 confirmed (OpenAPI ↔ DDL aligned)
- ✅ Tests: 54/54 passing
- ✅ SPEC_GAPS GAP-001, GAP-002: RESOLVED
- ⏳ SPEC_GAP GAP-003 (Redocly): OPEN (non-blocking, follow-up required)

**Merge Status:** 🟢 READY TO MERGE

**Follow-Up Required:**
- Create GitHub issue: "Vendor @redocly/cli for CI/DoD compliance"
- Target GAP-003 for next sprint or v1.1

---

**Spec Concierge (Claude)**
```

---

## ✅ Alternative: Single Comment (Short Route)

**If you prefer one concise comment instead of 6 separate ones:**

Copy entire contents of: **`docs/PR1_APPROVAL_SUMMARY.md`**

This single comment includes:
- All 7 phases PASS
- Drift = 0 (literal line: "drift mismatches: 0")
- Critical verifications summary
- SPEC_GAPS status
- Final verdict: APPROVE

Then add the handshake comment (Comment 7 above).

---

## 📊 STOP Rules Verification

**All STOP rules verified as PASS:**

✅ **No contract drift**
- OpenAPI ↔ DDL drift = 0
- No unapproved DDL beyond v1 deltas

✅ **HMAC over raw bytes**
- `digest('base64')` confirmed (GAP-001 resolved)
- `req.rawBody` captured before parsing (GAP-002 resolved)
- Constant-time comparison via `crypto.timingSafeEqual()`

✅ **De-dupe before effects**
- Unique constraint on `(provider, provider_event_id)`
- Check happens BEFORE order update / wallet credit
- Single transaction boundary verified

**Verdict:** ✅ **APPROVE** (no STOP rules violated)

---

## 🎯 P0002 Completion Checklist

**After posting all comments, update `prompts/P0002-claude-7phase-review-and-approval.md`:**

```markdown
DONE (filled by claude)
- evidence ack comment: [link to PR #1 comment]
- deliverable 1 comment: [link to PR #1 comment]
- deliverable 2 comment: [link to PR #1 comment]
- deliverable 3 comment: [link to PR #1 comment]
- gaps verification comment: [link to PR #1 comment]
- final verdict comment: [link to PR #1 comment]
- handshake comment: [link to PR #1 comment]
- final verdict: APPROVE
- drift status: 0 confirmed
```

---

## 📁 File Locations

All prepared comment files in branch: `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF`

**Comment files (long route):**
- `docs/PR1_COMMENT_6_EVIDENCE_ACK.md`
- `docs/PR1_COMMENT_7_DELIVERABLE_1.md`
- `docs/PR1_COMMENT_8_DELIVERABLE_2.md` ✅ (updated with drift=0)
- `docs/PR1_COMMENT_9_DELIVERABLE_3.md`
- `docs/PR1_COMMENT_10_GAPS_VERIFICATION.md`
- `docs/PR1_COMMENT_11_FINAL_VERDICT.md` ✅ (updated with APPROVE)

**Alternative (short route):**
- `docs/PR1_APPROVAL_SUMMARY.md` (single comment)

---

## 🚀 Summary

**Verdict:** ✅ **APPROVE**

**All 7 Phases:**
1. ✅ Contract Conformance
2. ✅ Auth/RBAC
3. ✅ DDL & ORM (drift = 0)
4. ✅ Idempotency
5. ✅ Exactly-Once Semantics
6. ✅ Signature Verification
7. ✅ Tooling/Preflight (drift = 0, tests green)

**Blockers:** None

**Follow-up:** GAP-003 (Redocly vendoring — non-blocking)

---

**All content prepared. Ready for manual posting to PR #1.**
