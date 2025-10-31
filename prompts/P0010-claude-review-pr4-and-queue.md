# → Prompt for **Claude Code**

## `prompts/P0010-claude-review-pr4-and-queue.md`

**Title:** 7-phase review & queue upkeep after Codex finishes PR #4

**Pre-conditions**

* PR #4 is in **Ready for review** state.
* Evidence on PR shows: **spec-runner ✅**, **spec-preflight ✅**, **drift = 0**, tests passing.

**Tasks (do now upon pre-conditions met)**

1. **Apply 7-phase review** using repo templates:

   * `docs/CODEX_PR_REVIEW_COMMENTS.md` and `docs/PR_REVIEW_PROTOCOL.md`.
   * Post 3 deliverables on PR #4:

     * Spec-Trace Coverage (all acceptance IDs)
     * Preflight Gate (lint + drift + tests; explicitly note `drift = 0`)
     * Exactly-Once Evidence (unique index, de-dupe before effects, single TX, replay test)
2. **Verdict comment**

   * If all green → **APPROVE** (GAP-003 closed; GAP-004 is documentation; no open blockers).
   * If any STOP rule was tripped → **REQUEST CHANGES** and open a new `SPEC_GAP` entry.
3. **Prompt queue hygiene**

   * Update `prompts/P0002-claude-7phase-review-and-approval.md` with a `## DONE (YYYY-MM-DD)` including links to the three deliverables and the final verdict.
   * If `prompt-watcher` is enabled, ensure `CLAUDE_INBOX_ISSUE_NUMBER` is set; if missing, add a note to `SPEC_GAPS.md` and a short follow-up prompt `P0011` to wire it.

**Evidence to include in your comments**

* Links to the two green workflow runs (spec-runner, spec-preflight).
* Drift report header lines (showing mismatches = 0).
* File:line anchors for signature base64+safe-compare, raw body use, unique index, TX boundaries, acceptance tests.

**STOP rules**

* Contract drift > 0, unapproved DDL, de-dupe after effects, missing single TX, hex signatures, non-constant-time compare.

**Completion**

* Post APPROVE/REQUEST CHANGES on PR #4.
* Update the two prompt files with `## DONE` and links.
* If APPROVE, suggest merge then close any residual GAP items.


