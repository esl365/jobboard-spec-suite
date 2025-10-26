# P0002 (claude) — 7-phase review on PR #1 and post deliverables

Pre-conditions
- Codex posted evidence in PR #1 (tails + pointers) and conflicts are resolved
- Drift report confirms: `drift mismatches: 0`
- Tests passing: 54/54

Tasks
1) **Post Evidence Acknowledgment**
   - Copy entire contents of: `docs/PR1_COMMENT_6_EVIDENCE_ACK.md`
   - Post as top-level comment to PR #1

2) **Post Deliverable 1: Spec-Trace Coverage**
   - Copy entire contents of: `docs/PR1_COMMENT_7_DELIVERABLE_1.md`
   - Post as top-level comment to PR #1
   - Confirms: 98% coverage (53/54 acceptance criteria)

3) **Post Deliverable 2: Preflight Gate**
   - Copy entire contents of: `docs/PR1_COMMENT_8_DELIVERABLE_2.md`
   - Post as top-level comment to PR #1
   - **Must include:** "drift mismatches: 0" (literal line)
   - **Must include:** OpenAPI↔DDL drift = 0 (confirmed)

4) **Post Deliverable 3: Exactly-Once Evidence**
   - Copy entire contents of: `docs/PR1_COMMENT_9_DELIVERABLE_3.md`
   - Post as top-level comment to PR #1
   - Verifies:
     - Unique constraint: `(provider, provider_event_id)`
     - De-dupe check BEFORE side effects
     - Single transaction boundary
     - Replay test proves no duplicate credits

5) **Post SPEC_GAPS Verification**
   - Copy entire contents of: `docs/PR1_COMMENT_10_GAPS_VERIFICATION.md`
   - Post as top-level comment to PR #1
   - Status:
     - GAP-001 (base64): ✅ RESOLVED
     - GAP-002 (rawBody): ✅ RESOLVED
     - GAP-003 (Redocly): ⏳ OPEN (non-blocking)

6) **Post Final Verdict**
   - If drift = 0 AND all STOP rules pass:
     - Copy entire contents of: `docs/PR1_COMMENT_11_FINAL_VERDICT.md`
     - Post as top-level comment to PR #1
     - **Verdict:** ✅ APPROVE
     - **Note:** GAP-003 follow-up required (vendor Redocly CLI)

   - If drift > 0 OR any STOP rule violated:
     - Create `SPEC_GAPS` entry GAP-004 with exact pointers
     - **Verdict:** ❌ REQUEST CHANGES / BLOCK
     - Do NOT post APPROVE

7) **Post Handshake**
   - Add final comment to PR #1:
     ```markdown
     NOTIFY-USER: 7-phase review complete — APPROVE posted on PR #1; remaining follow-up is GAP-003 (vendor Redocly CLI).
     ```

Output
- PR #1 comments posted (6 blocks):
  1. Evidence Acknowledgment
  2. Spec-Trace Coverage (98%)
  3. Preflight Gate (drift = 0)
  4. Exactly-Once Evidence
  5. SPEC_GAPS Verification
  6. Final Verdict (APPROVE or BLOCK)
- Handshake comment
- Final verdict: APPROVE (if drift = 0) OR REQUEST CHANGES/BLOCK

STOP Rules (must enforce)
- Contract drift or unapproved DDL beyond v1 deltas → **BLOCK**
- HMAC over anything but raw bytes, or non-constant compare → **BLOCK**
- De-dupe after effects or missing single TX boundary → **BLOCK**

DONE (to be filled by claude)
- evidence ack comment:
- deliverable 1 comment:
- deliverable 2 comment:
- deliverable 3 comment:
- gaps verification comment:
- final verdict comment:
- handshake comment:
- final verdict: [APPROVE or BLOCK]
- drift status: [0 confirmed]

---

## DONE (2025-10-26)

**Status:** ✅ All content prepared and ready for manual posting

**Branch:** `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF` (commit: `87e82e2`)

**Constraint:** Claude Code cannot post comments to GitHub PR #1 directly (no web UI or `gh` CLI access)

**Prepared Files (Ready to Copy-Paste):**

1. ✅ `docs/PR1_COMMENT_6_EVIDENCE_ACK.md` — Evidence Acknowledgment
2. ✅ `docs/PR1_COMMENT_7_DELIVERABLE_1.md` — Spec-Trace Coverage (98%)
3. ✅ `docs/PR1_COMMENT_8_DELIVERABLE_2.md` — Preflight Gate (drift = 0 confirmed)
4. ✅ `docs/PR1_COMMENT_9_DELIVERABLE_3.md` — Exactly-Once Evidence
5. ✅ `docs/PR1_COMMENT_10_GAPS_VERIFICATION.md` — SPEC_GAPS Verification
6. ✅ `docs/PR1_COMMENT_11_FINAL_VERDICT.md` — Final Verdict: APPROVE

**Alternative (Single Comment):**
- ✅ `docs/PR1_APPROVAL_SUMMARY.md` — Concise APPROVE comment (all-in-one)

**Execution Guide:**
- ✅ `docs/P0002_EXECUTION_GUIDE.md` — Complete manual posting instructions

**7-Phase Review Results:**
- Phase 1 (Contract Conformance): ✅ PASS
- Phase 2 (Auth/RBAC): ✅ PASS
- Phase 3 (DDL & ORM): ✅ PASS (drift = 0)
- Phase 4 (Idempotency): ✅ PASS
- Phase 5 (Exactly-Once Semantics): ✅ PASS
- Phase 6 (Signature Verification): ✅ PASS
- Phase 7 (Tooling/Preflight): ✅ PASS (drift = 0, tests 54/54)

**STOP Rules:** ✅ All verified (no violations)

**SPEC_GAPS:**
- GAP-001 (base64): ✅ RESOLVED
- GAP-002 (rawBody): ✅ RESOLVED
- GAP-003 (Redocly): ⏳ OPEN (non-blocking)

**Final Verdict:** ✅ **APPROVE**
**Drift Status:** 0 mismatches (confirmed)

**Required Manual Action:**
User must copy-paste prepared content to PR #1:
- Option A: Post 6 separate comments (PR1_COMMENT_6 through PR1_COMMENT_11)
- Option B: Post single summary (PR1_APPROVAL_SUMMARY.md)
- Then post handshake comment

**Reference:** See `docs/P0002_EXECUTION_GUIDE.md` for step-by-step instructions
