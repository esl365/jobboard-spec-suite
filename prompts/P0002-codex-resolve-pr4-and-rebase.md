# P0002: Resolve PR #4 Conflicts and Rebase

**Created:** 2025-10-26
**Priority:** High
**Estimate:** 30 minutes
**Agent:** Codex

## Context

PR #4 "vendor redocly cli for offline preflight" shows merge conflicts. The PR adds offline OpenAPI linting capabilities to eliminate external dependencies during CI runs. The conflicts are due to changes in the main branch that modified the same files.

The PR branch is `codex/run-pre-flight-and-log-issues-8cw2da` and needs to be rebased onto the current main branch.

## Task

1. **Checkout the PR branch**:
   ```bash
   git fetch origin
   git checkout codex/run-pre-flight-and-log-issues-8cw2da
   ```

2. **Merge/rebase with main**:
   ```bash
   git fetch origin main
   git rebase origin/main
   # OR: git merge origin/main
   ```

3. **Resolve conflicts** in the 6 affected files:
   - Carefully review each conflict
   - Preserve the intent of both changes
   - Ensure OpenAPI lint integration remains functional
   - Keep the offline capability intact

4. **Run pre-flight checks**:
   ```bash
   npm run preflight
   ```
   - Verify all checks pass
   - If any check fails, fix the issue

5. **Run tests**:
   ```bash
   npm test
   ```
   - All tests must pass
   - If tests fail, fix before proceeding

6. **Check drift**:
   ```bash
   node scripts/spec-drift-check.mjs
   ```
   - Drift count must be 0
   - If drift > 0, **STOP** and log to `specs/SPEC_GAPS.md`

7. **Push the resolved branch**:
   ```bash
   git push --force-with-lease origin codex/run-pre-flight-and-log-issues-8cw2da
   ```

8. **Output verification**:
   - Paste the last ~20 lines of the preflight output
   - Paste the test summary
   - Report the drift count

## Success Criteria

- [ ] Branch `codex/run-pre-flight-and-log-issues-8cw2da` checked out
- [ ] All 6 conflict files resolved
- [ ] `npm run preflight` passes ✔
- [ ] `npm test` passes ✔
- [ ] `node scripts/spec-drift-check.mjs` shows drift = 0
- [ ] Branch pushed to remote
- [ ] Verification output provided (preflight, tests, drift)

## STOP Rules

**If any of these occur, STOP and update `specs/SPEC_GAPS.md`:**

1. **Drift > 0**: Spec drift detected → log context, impact, and proposal
2. **Failing tests**: Tests fail after resolution → log issue and required fix
3. **Preflight failure**: OpenAPI lint or other checks fail → log details
4. **Cannot resolve conflicts**: Unclear resolution strategy → document and request guidance

## Related

- PR: #4 (codex/run-pre-flight-and-log-issues-8cw2da)
- Main branch: latest
- Depends on: OpenAPI merge script, spec drift checker
- Follows up with: P0003 (7-phase review after green)

---

## DONE (YYYY-MM-DD)

_(To be filled after completion)_

**Summary:** [Brief description of resolution]

**Changes:**
- Resolved conflicts in: [list files]
- Adjustments made: [describe conflict resolutions]
- Final state: [preflight/tests/drift status]

**Evidence:**
- Commit: [commit hash]
- Branch: `codex/run-pre-flight-and-log-issues-8cw2da`
- PR: #4
- Verification outputs:
  - Preflight: [paste last 20 lines or status]
  - Tests: [summary]
  - Drift: [count]

**Notes:**
- [Any issues encountered]
- [Decisions made during conflict resolution]
- [Follow-up needed]
