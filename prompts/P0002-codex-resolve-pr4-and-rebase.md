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

## DONE (2025-10-27)

**Summary:** Successfully resolved all 7 merge conflicts and rebased PR #4 branch onto main. All preflight checks, tests, and drift checks passed. Branch push blocked due to permission restrictions on codex/ prefix branches.

**Changes:**
- Resolved conflicts in: 7 files
  1. `package.json` - Merged comprehensive preflight script with new vitest/typescript dependencies
  2. `package-lock.json` - Regenerated after package.json resolution
  3. `scripts/openapi-lint.mjs` - Used PR #4's vendored redocly-cli version (both added)
  4. `src/infra/memory/payments.repos.ts` - Used complete implementation from PR #4
  5. `src/payments/adapters/mock.ts` - Used complete HMAC signature implementation from PR #4
  6. `src/payments/registry.ts` - Used complete PaymentProviderAdapter implementation from PR #4
  7. `src/routes/webhooks.payments.ts` - Used complete webhook handler with signature verification from PR #4
- Adjustments made:
  - Preserved main's vitest testing infrastructure
  - Kept PR #4's comprehensive preflight pipeline (merge → lint → drift)
  - Merged dependencies: main's TypeScript/Vitest + PR #4's redocly vendoring
- Final state: ALL GREEN ✅
  - Preflight: PASSED
  - Tests: 7/7 PASSED
  - Drift: 0

**Evidence:**
- Commits:
  - e6bea57 (docs(prompts): record completion details for P0003)
  - 06ad7b3 (ci: trigger spec-runner)
- Local branch: `codex/run-pre-flight-and-log-issues-8cw2da` (rebase completed)
- PR: #4
- Verification outputs:
  - Preflight:
    ```
    [merge] openapi/api-spec.payments.snippet.yaml already applied; skipping
    [redocly-cli] lint passed for openapi/api-spec.yaml
    [openapi-lint] mode=vendored status=passed
    [drift] report -> reports/spec-openapi-ddl-drift.md
    [drift] mismatches=0
    ```
  - Tests:
    ```
    ✓ tests/routes/health.test.ts (7 tests) 7ms
    Test Files  1 passed (1)
    Tests  7 passed (7)
    ```
  - Drift: 0

**Notes:**
- Push to `codex/run-pre-flight-and-log-issues-8cw2da` blocked with HTTP 403 error
- Reason: Repository permissions restrict push to `claude/*` branches with session ID suffix
- The `codex/` prefix branch cannot be pushed by Claude Code
- Branch diverged after rebase: 28 commits ahead, 2 behind remote
- **Follow-up needed:** Codex or repository admin must push the resolved branch manually, or changes can be applied via new claude/ branch PR
- All conflict resolutions prioritized PR #4's complete implementations over main's placeholders
- The vendored redocly-cli integration from PR #4 is now functional
