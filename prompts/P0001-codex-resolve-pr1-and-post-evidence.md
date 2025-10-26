# P0001 (codex) — Resolve PR #1 conflicts and post evidence

Pre-conditions
- PR #1 exists from `codex/run-pre-flight-and-log-issues` → `main`
- Conflicts may exist in: package.json, openapi-lint.mjs, *.repos.ts, mock.ts, registry.ts, webhooks.payments.ts
- Canonical resolutions documented in `docs/PR1_COMMENT_1_CONFLICT_GATE.md` (branch: `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF`)

Tasks
1) **Resolve conflicts** using GitHub PR UI merge commands:
   - Follow exact merge strategy from PR UI
   - Apply resolutions per Conflict-Gate Plan:
     - ✅ Keep your signature verification (base64, not hex)
     - ✅ Keep your rawBody middleware
     - ✅ Merge both route registries (mock + real providers)
   - Commit conflict resolution

2) **Run preflight and tests:**
   ```bash
   npm run preflight && npm test
   ```

3) **Post evidence to PR #1** as top-level comments:

   **Comment A: Preflight Output**
   ```markdown
   ## Preflight Output

   ```bash
   $ npm run preflight
   [paste last ~20 lines]
   ```

   **Key line:**
   ```
   drift mismatches: 0
   ```
   ```

   **Comment B: Test Output**
   ```markdown
   ## Test Output

   ```bash
   $ npm test
   [paste last ~20 lines showing all tests passing]
   ```

   **Summary:**
   - ✅ 23 tests (prepare endpoint)
   - ✅ 31 tests (webhook endpoint)
   - ✅ 54/54 total
   ```

   **Comment C: Code Pointers**
   ```markdown
   ## Code Pointers for SPEC_GAPS Verification

   **GAP-001 (base64 signature):**
   - File: `src/payments/adapters/mock.ts:LINE`
   - Evidence: `digest('base64')` confirmed

   **GAP-002 (rawBody middleware):**
   - File: `src/middleware/capture-raw-body.ts:LINE`
   - Evidence: `req.rawBody = buf.toString('utf8')` confirmed
   ```

4) **Ping Spec Concierge:**
   - Add comment to PR #1: `@Spec-Concierge ready for 7-phase review. Evidence posted above.`

Output
- PR #1 conflicts resolved
- 3 top-level comments posted to PR #1:
  - Preflight output (with drift = 0)
  - Test output (54/54 passing)
  - Code pointers (GAP-001, GAP-002)
- Ping comment for Claude Code

DONE (to be filled by codex)
- conflict resolution commit:
- preflight comment:
- test comment:
- code pointers comment:
- ping comment:
- drift status: [0 or >0]
---
## DONE (2025-10-26)

- Conflicts resolved; merged `main` → `codex/run-pre-flight-and-log-issues`.
- GAP-001 (hex→base64) ✅ RESOLVED.
- GAP-002 (rawBody capture) ✅ RESOLVED.
- Preflight/Test ✅ GREEN; drift header shows `mismatches: 0`.
- Evidence & code pointers posted on PR #1.
