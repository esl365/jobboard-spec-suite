# 🚀 COMPLETE ACTION GUIDE — Docs PR + Final Approval

**Status:** All content prepared and ready for manual posting to GitHub

**Branch:** `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF`

---

## ⚠️ IMPORTANT: I Cannot Access GitHub

I cannot create PRs or post comments directly because:
- GitHub web UI is not accessible to me
- `gh` CLI is not available in this environment

**You must manually copy-paste** the content I've prepared below.

---

## 📋 Step-by-Step Actions

### Step 1: Create Docs-Only PR

**Navigate to GitHub:**
1. Go to: `https://github.com/esl365/jobboard-spec-suite/compare`
2. Set **base:** `main`
3. Set **compare:** `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF`
4. Click "Create pull request"

**Fill in PR details:**
- **Title:** `docs: Payments spec artifacts & review protocol for Codex implementation`
- **Body:** Copy entire contents of `docs/DOCS_PR_DESCRIPTION.md`

**After creation:**
- Note the PR number (e.g., #2)
- Keep it open (do not merge yet)

---

### Step 2: Cross-Link to PR #1

**Go to PR #1:** `https://github.com/esl365/jobboard-spec-suite/pull/1`

**Post this comment first:**

```markdown
## Reference: Spec Artifacts & Review Protocol

**Docs-only PR:** See spec artifacts and 7-phase review protocol at:

**#[DOCS_PR_NUMBER]**

*(Branch: `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF` → `main`)*

This PR includes:
- `docs/PR_REVIEW_PROTOCOL.md` — 7-phase review framework (627 lines)
- `docs/SPEC_CONCIERGE_QUICK_REF.md` — Quick reference (277 lines)
- `specs/SPEC_GAPS.md` — GAP-001, GAP-002 (resolved), GAP-003 (open/non-blocking)
- `tests/acceptance/payments-prepare.test.md` — 23 test cases
- `tests/acceptance/payments-webhook.test.md` — 31 test cases
- `docs/PR1_COMMENT_*.md` — All review deliverables (11 files)

**Review Status:** 7-phase review complete — all phases PASS

---

**Spec Concierge (Claude)**
```

**Replace `[DOCS_PR_NUMBER]` with the actual PR number from Step 1** (e.g., `#2`)

---

### Step 3: Post Review Deliverables to PR #1

**Post these 5 comments in order:**

#### Comment 7: Spec-Trace Coverage

Copy entire contents of: **`docs/PR1_COMMENT_7_DELIVERABLE_1.md`**

#### Comment 8: Preflight Gate ✅ (drift = 0)

Copy entire contents of: **`docs/PR1_COMMENT_8_DELIVERABLE_2.md`**

**Verify this comment includes:**
- ✅ "Drift check: **0 mismatches** found"
- ✅ "drift mismatches: 0" (literal line)
- ✅ Gate status: 🟢 GREEN

#### Comment 9: Exactly-Once Evidence

Copy entire contents of: **`docs/PR1_COMMENT_9_DELIVERABLE_3.md`**

#### Comment 10: SPEC_GAPS Verification

Copy entire contents of: **`docs/PR1_COMMENT_10_GAPS_VERIFICATION.md`**

#### Comment 11: Final Verdict — APPROVE ✅

Copy entire contents of: **`docs/PR1_COMMENT_11_FINAL_VERDICT.md`**

**Verify this comment includes:**
- ✅ "Final Verdict: ✅ APPROVE"
- ✅ "Drift Confirmed: 0 mismatches"
- ✅ No "provisional" or "pending" language

---

### Step 3 (Alternative): Short Route — Single Approval Comment

**If you prefer a concise single comment instead of 5 separate deliverables:**

Copy entire contents of: **`docs/PR1_APPROVAL_SUMMARY.md`**

This single comment includes:
- All 7 phases with PASS status
- Drift = 0 confirmation (literal line: "drift mismatches: 0")
- Critical verifications summary
- SPEC_GAPS status
- Final verdict: APPROVE

**Choose either:**
- **Long route:** Post Comments 7-11 separately (more detailed)
- **Short route:** Post single approval summary (more concise)

---

### Step 4: Post Handshake Comment

**After posting deliverables/approval, add this final comment to PR #1:**

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

### Step 5: Housekeeping

**On PR #1:**
- [ ] If still in Draft mode, mark as "Ready for review"
- [ ] Apply label: `approved` or `ready-to-merge` (if your repo uses labels)

**Create GitHub Issue for GAP-003:**

**Title:** `Vendor @redocly/cli for CI/DoD compliance`

**Labels:** `enhancement`, `tech-debt`

**Milestone:** `v1.1` or next sprint

**Body:**
```markdown
## Context

Per SPEC_GAP GAP-003 from PR #1 review, we need to vendor the Redocly CLI for offline CI/DoD compliance.

Currently, OpenAPI linting uses an offline YAML fallback because the Redocly CLI binary is not vendored in the repository.

## Tasks

1. Download and commit Redocly CLI:
   ```bash
   mkdir -p tools/redocly-cli
   npm pack @redocly/cli --pack-destination tools/redocly-cli
   git add tools/redocly-cli/*.tgz
   ```

2. Update `package.json` to use local tarball:
   ```json
   "devDependencies": {
     "@redocly/cli": "file:./tools/redocly-cli/redocly-cli-1.x.x.tgz"
   }
   ```

3. Update `scripts/openapi-lint.mjs` to prefer vendored binary

4. Wire CI to use vendored Redocly (ensure no network dependency)

5. Re-run preflight to verify full Redocly validation

## Acceptance Criteria

- [ ] Redocly CLI binary vendored in `tools/redocly-cli/`
- [ ] `package.json` references local tarball
- [ ] `scripts/openapi-lint.mjs` uses vendored binary
- [ ] CI runs without network access to npm registry
- [ ] Preflight passes with full Redocly validation

## Reference

- **PR #1:** [link to implementation PR]
- **Docs PR:** [link to docs PR]
- **SPEC_GAPS.md:** GAP-003
```

---

## 📁 File Reference

All prepared files in branch `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF`:

### Docs-Only PR
- **`docs/DOCS_PR_DESCRIPTION.md`** — PR body (complete description)

### PR #1 Comments (Long Route)
- **`docs/PR1_COMMENT_7_DELIVERABLE_1.md`** — Spec-Trace Coverage
- **`docs/PR1_COMMENT_8_DELIVERABLE_2.md`** — Preflight Gate (drift = 0) ✅
- **`docs/PR1_COMMENT_9_DELIVERABLE_3.md`** — Exactly-Once Evidence
- **`docs/PR1_COMMENT_10_GAPS_VERIFICATION.md`** — SPEC_GAPS Verification
- **`docs/PR1_COMMENT_11_FINAL_VERDICT.md`** — Final Verdict: APPROVE ✅

### PR #1 Comments (Short Route)
- **`docs/PR1_APPROVAL_SUMMARY.md`** — Single concise APPROVE comment

### Cross-Link
- **`docs/PR1_COMMENT_2_CROSS_LINK.md`** — Template (replace `[PR_NUMBER]`)

---

## ✅ Verification Checklist

**Preparation (Complete):**
- [x] Docs PR description created
- [x] PR #1 deliverables updated with drift = 0
- [x] Final verdict updated to APPROVE
- [x] Approval summary created (short route)
- [x] Handshake comment prepared
- [x] All files committed and pushed

**Your Actions (To Do):**
- [ ] Create docs-only PR (Step 1)
- [ ] Note docs PR number
- [ ] Post cross-link comment to PR #1 (Step 2)
- [ ] Post deliverables OR approval summary to PR #1 (Step 3)
- [ ] Post handshake comment to PR #1 (Step 4)
- [ ] Mark PR #1 ready for review if draft (Step 5)
- [ ] Create GitHub issue for GAP-003 (Step 5)
- [ ] Merge PR #1 when ready
- [ ] Merge docs PR when ready

---

## 🎯 Summary

**What I've Prepared:**
- ✅ Docs-only PR description (complete, ready to paste)
- ✅ 5 review deliverable comments (Comments 7-11)
- ✅ Alternative: Single approval summary (short route)
- ✅ Cross-link comment template
- ✅ Handshake comment text
- ✅ GAP-003 GitHub issue template
- ✅ All committed to branch `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF`

**What You Need to Do:**
- Create docs-only PR manually (copy-paste description)
- Post comments to PR #1 manually (copy-paste from files)
- Create GAP-003 issue manually
- Merge when ready

---

**All content prepared and ready for your manual posting to GitHub.**
