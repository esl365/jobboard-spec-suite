# P0003: 7-Phase Review of PR #4

**Created:** 2025-10-26
**Priority:** High
**Estimate:** 45 minutes
**Agent:** Claude
**Depends on:** P0002 (must be completed first)

## Context

After P0002 resolves conflicts and rebases PR #4, this prompt directs Claude to perform a comprehensive 7-phase review of the PR. The PR adds offline OpenAPI linting capabilities to eliminate external dependencies during CI runs.

PR #4 must have:
- ✅ All conflicts resolved
- ✅ CI passing (green)
- ✅ Preflight checks passing
- ✅ Tests passing
- ✅ Drift = 0

## Task

Perform a systematic 7-phase review of PR #4 (`codex/run-pre-flight-and-log-issues-8cw2da`) and post your findings as a PR comment.

### Phase 1: Scope & Intent Verification

**Check:**
- Does the PR do exactly what it claims? (vendor redocly CLI for offline linting)
- Are there any scope creep or unrelated changes?
- Is the implementation aligned with the PR description?

**Output:** `✅ PASS` or `⚠️ CONCERN: [details]`

---

### Phase 2: File-by-File Diff Analysis

**Check:**
- Review each changed file
- Identify additions, deletions, modifications
- Flag any unexpected or suspicious changes
- Verify file permissions if changed

**Output:**
- File count: [number]
- Additions: [+lines]
- Deletions: [-lines]
- Key changes: [list]
- Concerns: [if any]

---

### Phase 3: Integration Points

**Check:**
- How does this PR integrate with existing code?
- Are there new dependencies? (package.json)
- Are CI workflows modified correctly?
- Are scripts updated appropriately?
- Does it conflict with existing patterns or conventions?

**Output:**
- Integration summary
- Dependencies added/removed
- CI workflow changes
- Potential conflicts: [if any]

---

### Phase 4: Testing & Coverage

**Check:**
- Are there tests for the new functionality?
- Do existing tests still pass?
- Is the test coverage adequate?
- Are there edge cases not covered?

**Output:**
- Test files added/modified: [list]
- Coverage assessment: [adequate/needs improvement]
- Missing tests: [if any]

---

### Phase 5: Documentation & Comments

**Check:**
- Is the code adequately documented?
- Are complex sections explained?
- Is README or docs/ updated if needed?
- Are comments clear and helpful?

**Output:**
- Documentation status: [adequate/needs improvement]
- Missing docs: [if any]
- Suggestions: [if any]

---

### Phase 6: Spec Compliance & DoD

**Check against Definition of Done:**
- [ ] OpenAPI lint passes ✔
- [ ] DB dry-run passes (if applicable) ✔
- [ ] Tests pass (unit/integration/contract/scenario) ✔
- [ ] Forbidden-pattern scan passes ✔
- [ ] Drift = 0 ✔
- [ ] No unresolved conflicts
- [ ] CI green

**Output:**
- DoD checklist with status for each item
- Any DoD violations: [if any]

---

### Phase 7: Security & Best Practices

**Check:**
- Are there any security concerns?
- Are secrets/credentials handled properly?
- Are there hardcoded values that should be configurable?
- Does it follow project conventions?
- Are there performance implications?

**Output:**
- Security assessment: [clear/concerns]
- Best practices compliance: [good/needs improvement]
- Recommendations: [if any]

---

### Final Verdict

**After all 7 phases, provide:**

1. **Overall Assessment**: APPROVE / REQUEST CHANGES / COMMENT
2. **Summary**: 2-3 sentence overall summary
3. **Critical Issues**: [list any blockers]
4. **Minor Issues**: [list non-blocking concerns]
5. **Recommendations**: [suggestions for improvement]

---

## Deliverables

Post your review as a **comment on PR #4** with the following structure:

```markdown
# 7-Phase Review of PR #4

## Phase 1: Scope & Intent
[findings]

## Phase 2: File-by-File Diff
[findings]

## Phase 3: Integration Points
[findings]

## Phase 4: Testing & Coverage
[findings]

## Phase 5: Documentation
[findings]

## Phase 6: Spec Compliance & DoD
[checklist with status]

## Phase 7: Security & Best Practices
[findings]

---

## Final Verdict: [APPROVE/REQUEST CHANGES/COMMENT]

**Summary:** [overall assessment]

**Critical Issues:** [if any]

**Minor Issues:** [if any]

**Recommendations:** [if any]

---

Reviewed by: Claude Code (Prompt P0003)
Date: [YYYY-MM-DD]
Commit: [hash reviewed]
```

## Success Criteria

- [ ] All 7 phases completed
- [ ] Review posted as PR comment
- [ ] Final verdict clearly stated (APPROVE/REQUEST CHANGES/COMMENT)
- [ ] If drift > 0 or DoD not met → verdict is REQUEST CHANGES
- [ ] Comment includes commit hash reviewed
- [ ] Links to specific line numbers for issues (if any)

## STOP Rules

**If any of these occur, STOP and update `specs/SPEC_GAPS.md`:**

1. **PR #4 not ready**: Conflicts unresolved, CI failing, or P0002 not completed
2. **Cannot access PR**: Branch or PR not found
3. **Major security concerns**: Critical issues found that need immediate attention

## Related

- PR: #4 (codex/run-pre-flight-and-log-issues-8cw2da)
- Previous: P0002 (conflict resolution)
- Review framework: 7-phase systematic review
- DoD reference: prompts/spec-runner.prompt.md

---

## DONE (YYYY-MM-DD)

_(To be filled after completion)_

**Summary:** [Brief description of review outcome]

**Changes:**
- Review posted: [PR comment link with anchor]
- Phases completed: 7/7
- Final verdict: [APPROVE/REQUEST CHANGES/COMMENT]

**Evidence:**
- PR: #4
- Review comment: [URL with #issuecomment-xxxxx anchor]
- Commit reviewed: [hash]
- Verdict: [APPROVE/REQUEST CHANGES/COMMENT]

**Notes:**
- [Key findings]
- [Critical issues (if any)]
- [Follow-up actions needed]
