# PR #1 - Complete Comment Posting Guide

**⚠️ IMPORTANT:** I cannot access GitHub's web UI. This guide provides all content ready for you to copy-paste manually.

**Target:** https://github.com/esl365/jobboard-spec-suite/pull/1

---

## 📋 Part 1: Post 11 Comments (In Order)

### Comment 1: Conflict-Gate Plan

**Source:** `docs/PR1_COMMENT_1_CONFLICT_GATE.md`

**Click:** "Add a comment" on PR #1

**Paste:**

[See content in docs/PR1_COMMENT_1_CONFLICT_GATE.md - 173 lines]

---

### Comment 2: Cross-Link to Docs PR

**Source:** `docs/PR1_COMMENT_2_CROSS_LINK.md`

**⚠️ ACTION REQUIRED FIRST:**

1. Create docs-only PR at:
   ```
   https://github.com/esl365/jobboard-spec-suite/compare/main...claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF?expand=1
   ```

2. Use title: `docs: Payments spec artifacts & review protocol for Codex implementation`

3. Use body from `docs/PR1_MANUAL_ACTIONS_CHECKLIST.md` Action 1 section

4. Note the PR number (e.g., #2)

**Then paste to PR #1:**

[See content in docs/PR1_COMMENT_2_CROSS_LINK.md - replace [PR_NUMBER] with actual number]

---

### Comment 3: Blocking Check A — Signature Encoding

**Source:** `docs/PR1_COMMENT_3_BLOCKING_A.md`

**Paste:**

[See content in docs/PR1_COMMENT_3_BLOCKING_A.md - 50 lines]

---

### Comment 4: Blocking Check B — Raw Body Capture

**Source:** `docs/PR1_COMMENT_4_BLOCKING_B.md`

**Paste:**

[See content in docs/PR1_COMMENT_4_BLOCKING_B.md - 60 lines]

---

### Comment 5: Evidence Request

**Source:** `docs/PR1_COMMENT_5_EVIDENCE_REQUEST.md`

**Paste:**

[See content in docs/PR1_COMMENT_5_EVIDENCE_REQUEST.md - 173 lines]

---

### Comment 6: Evidence Acknowledgment + Drift Request

**Source:** `docs/PR1_COMMENT_6_EVIDENCE_ACK.md`

**Paste:**

[See content in docs/PR1_COMMENT_6_EVIDENCE_ACK.md - 36 lines]

---

### Comment 7: Deliverable 1 — Spec-Trace Coverage

**Source:** `docs/PR1_COMMENT_7_DELIVERABLE_1.md`

**Paste:**

[See content in docs/PR1_COMMENT_7_DELIVERABLE_1.md - 113 lines]

---

### Comment 8: Deliverable 2 — Preflight Gate

**Source:** `docs/PR1_COMMENT_8_DELIVERABLE_2.md`

**Paste:**

[See content in docs/PR1_COMMENT_8_DELIVERABLE_2.md - 96 lines]

**⚠️ NOTE:** This shows drift as PENDING - will need editing after Codex confirms

---

### Comment 9: Deliverable 3 — Exactly-Once Evidence

**Source:** `docs/PR1_COMMENT_9_DELIVERABLE_3.md`

**Paste:**

[See content in docs/PR1_COMMENT_9_DELIVERABLE_3.md - 167 lines]

---

### Comment 10: SPEC_GAPS Verification

**Source:** `docs/PR1_COMMENT_10_GAPS_VERIFICATION.md`

**Paste:**

[See content in docs/PR1_COMMENT_10_GAPS_VERIFICATION.md - 226 lines]

---

### Comment 11: Final Verdict

**Source:** `docs/PR1_COMMENT_11_FINAL_VERDICT.md`

**Paste:**

[See content in docs/PR1_COMMENT_11_FINAL_VERDICT.md - 186 lines]

**⚠️ NOTE:** This shows "Provisional PASS" - will need editing after drift confirmation

---

## 📋 Part 2: After Codex Responds with Drift Confirmation

### If Codex confirms drift = 0:

**Edit Comment 8 (Deliverable 2 — Preflight Gate):**

Find the section:
```
**⏳ PENDING VERIFICATION:**
Codex referenced drift report but did not quote mismatch count.
```

Replace with:
```
**✅ VERIFIED:**
```
Drift check: 0 mismatches found
```

**Analysis:**
- ✅ PASS — Contract alignment verified
- ✅ No schema drift between OpenAPI and DDL
```

**Edit Comment 11 (Final Verdict):**

Find:
```
**Verdict:** ✅ **PASS (Provisional)**
```

Replace with:
```
**Verdict:** ✅ **APPROVE**

**Drift Confirmed:** 0 mismatches (contract alignment verified)
```

**Then add final handshake comment:**
```
NOTIFY-USER: 7-phase review posted on PR #1 — verdict: APPROVE (contingent on GAP-003 follow-up PR for Redocly vendoring).
```

---

### If drift > 0:

**Edit Comment 8:**

Add drift details and mark as FAIL.

**Edit Comment 11:**

Change verdict to:
```
**Verdict:** ❌ **REQUEST CHANGES**
```

**Create GAP-004:**

Add to `specs/SPEC_GAPS.md`:
```markdown
### GAP-004: OpenAPI ↔ DDL Drift Detected

**Context:** [Specify mismatched fields from drift report]
**Impact:** Contract violation (Spec-First principle)
**Minimal Proposal:**
- Option 1: Add temporary alias route in code
- Option 2: Tiny spec patch to align OpenAPI with DDL
```

**Then add final handshake comment:**
```
NOTIFY-USER: 7-phase review posted on PR #1 — verdict: BLOCK (drift > 0 detected, GAP-004 created).
```

---

## 📋 Part 3: GAP-003 Follow-Up Request

In both Comment 8 and Comment 10, reference GAP-003:

**Add to Comment 10 (SPEC_GAPS Verification) in GAP-003 section:**

```markdown
**Follow-Up PR Required:**

Please create a follow-up PR that vendors Redocly CLI:

1. Download and commit:
   ```bash
   mkdir -p tools/redocly-cli
   npm pack @redocly/cli --pack-destination tools/redocly-cli
   ```

2. Update `package.json`:
   ```json
   "devDependencies": {
     "@redocly/cli": "file:./tools/redocly-cli/redocly-cli-X.X.X.tgz"
   }
   ```

3. Update `scripts/openapi-lint.mjs` to prefer vendored binary

4. Wire CI to use vendored Redocly

**Timeline:** Target for next sprint or v1.1
```

---

## ✅ Checklist

**Comments to Post (11 total):**
- [ ] Comment 1: Conflict-Gate Plan
- [ ] Comment 2: Cross-Link (after creating docs PR)
- [ ] Comment 3: Blocking Check A
- [ ] Comment 4: Blocking Check B
- [ ] Comment 5: Evidence Request
- [ ] Comment 6: Evidence Acknowledgment
- [ ] Comment 7: Deliverable 1 (Spec-Trace Coverage)
- [ ] Comment 8: Deliverable 2 (Preflight Gate - PENDING)
- [ ] Comment 9: Deliverable 3 (Exactly-Once Evidence)
- [ ] Comment 10: SPEC_GAPS Verification
- [ ] Comment 11: Final Verdict (Provisional)

**After Codex Drift Confirmation:**
- [ ] Edit Comment 8 (update drift status)
- [ ] Edit Comment 11 (APPROVE or BLOCK)
- [ ] Post final handshake comment

**Docs PR:**
- [ ] Create docs-only PR
- [ ] Note PR number
- [ ] Update Comment 2 with PR number

---

## 📁 All Source Files Available

All comment content is in:
- `docs/PR1_COMMENT_1_CONFLICT_GATE.md` through `docs/PR1_COMMENT_11_FINAL_VERDICT.md`

Branch: `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF`

---

**Status:** All content prepared, awaiting manual posting to GitHub.
