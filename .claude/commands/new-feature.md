# /new-feature - Automated Feature Implementation Workflow

You are Claude Code, and the user has requested a new feature. Your task is to handle the **entire workflow** from Issue creation to PR submission, minimizing user intervention.

## Workflow Overview

```
User Request → Issue Creation → Spec Generation/Writing → Implementation → PR Creation → User Approval
     ↓              ↓                    ↓                      ↓              ↓
  (1 minute)    (you handle)         (you handle)          (you handle)   (you handle)
```

## Step-by-Step Process

### 1. Gather Requirements (Interactive)

Ask the user for:
- **Feature name**: Short, descriptive title (e.g., "Payment Integration", "User Dashboard")
- **Feature description**: What should this feature do? (2-3 sentences minimum)
- **Priority**: P0 (critical), P1 (high), P2 (medium), P3 (low) - default to P2 if not specified
- **Estimated complexity**: Small (1-2 days), Medium (3-5 days), Large (1+ week) - default to Medium if not specified

### 2. Create GitHub Issue

Use the `gh` CLI to create a well-structured issue:

```bash
gh issue create \
  --title "[Feature] {feature-name}" \
  --body "$(cat <<'EOF'
## Description
{user's description}

## Acceptance Criteria
- [ ] {criterion 1 - you infer from description}
- [ ] {criterion 2}
- [ ] {criterion 3}

## Technical Scope
- **Priority**: {P0/P1/P2/P3}
- **Complexity**: {Small/Medium/Large}
- **Estimated Time**: {X days}

## Implementation Plan
{Brief plan - will be refined during spec phase}

## Related Documentation
- [ ] OpenAPI spec updates needed
- [ ] Database schema changes needed
- [ ] Policy/business logic changes needed

---
*Created via Claude Code `/new-feature` automation*
EOF
)"
```

**Capture the issue number** from the output (e.g., `Created issue #42`)

### 3. Wait for Gemini Spec Generation (If Enabled)

Check if `GEMINI_API_KEY` is configured:

```bash
# This will trigger .github/workflows/gemini-spec-manager.yml automatically
# Check workflow status:
gh run list --workflow=gemini-spec-manager.yml --limit 1
```

**If Gemini is enabled:**
- Wait 2-3 minutes for the workflow to complete
- Check for PR created by `github-actions[bot]` with specs
- Review and merge the spec PR if acceptable
- Use the generated specs for implementation

**If Gemini is NOT enabled (or workflow fails):**
- Proceed to manual spec writing (Step 4)

### 4. Write Specifications (Manual Fallback)

If Gemini didn't generate specs, create them yourself:

#### OpenAPI Specification (`openapi/api-spec.yaml`)
- Define new endpoints for this feature
- Include request/response schemas
- Add authentication requirements
- Document error responses

#### Database Schema (`database/migrations/`)
- Create migration file: `YYYYMMDD_HHMMSS_{feature_name}.sql`
- Define new tables or alter existing ones
- Add indexes for performance
- Include comments for clarity

#### Business Logic Documentation (`docs/policies/`)
- Create `{feature-name}-policy.md`
- Define validation rules
- Specify authorization requirements
- Document business constraints

### 5. Create Implementation Branch

```bash
git checkout -b claude/feature-{feature-name}-{issue-number}
```

### 6. Implement the Feature

Follow the spec-first approach:
1. **Database layer**: Run migrations, verify schema
2. **API layer**: Implement endpoints per OpenAPI spec
3. **Business logic**: Add services, validation, authorization
4. **Tests**: Unit tests, integration tests, API tests
5. **Documentation**: Update README if needed

**Key Principles:**
- 100% spec compliance (no deviation without updating spec first)
- Test coverage: aim for 80%+ on new code
- Follow existing code patterns and style
- Coordinate with Codex if UI components needed (create separate prompt)

### 7. Run Quality Checks

Before creating PR:

```bash
# Run tests
npm test

# Run linter
npm run lint

# Check OpenAPI spec validity
npm run openapi:lint

# Run spec-drift check
node scripts/spec-drift-check.mjs
```

Fix any failures before proceeding.

### 8. Commit Changes

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: implement {feature-name}

- Add OpenAPI endpoints for {feature}
- Create database migration for {tables}
- Implement business logic per spec
- Add comprehensive test coverage

Closes #{issue-number}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 9. Push and Create PR

```bash
# Push to remote
git push -u origin claude/feature-{feature-name}-{issue-number}

# Create PR
gh pr create \
  --title "feat: implement {feature-name}" \
  --body "$(cat <<'EOF'
## Summary
Implements {feature-name} as requested in #{issue-number}.

### Changes
- ✅ OpenAPI spec: {list endpoints}
- ✅ Database: {list tables/migrations}
- ✅ Business logic: {list services}
- ✅ Tests: {test coverage}%

### Spec Compliance
- [x] OpenAPI spec updated and validated
- [x] Database migrations created
- [x] All tests passing
- [x] No spec drift detected

### Review Checklist
See [7-Phase Review Framework](docs/4LLM_HYBRID_SUMMARY.md#chatgpt-review)

### Closes
Closes #{issue-number}

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" \
  --base main
```

### 10. Notify User for Approval

Present the PR URL to the user with a summary:

```markdown
✅ Feature implementation complete!

**GitHub Issue**: #{issue-number}
**Pull Request**: {PR URL}
**Branch**: claude/feature-{feature-name}-{issue-number}

**What was implemented:**
- {bullet point summary}

**Next Steps:**
1. Review the PR (or wait for ChatGPT automated review if enabled)
2. Approve and merge when ready
3. (Optional) Deploy to staging for testing

**Total time saved**: ~{X} hours (vs. manual implementation)
```

## Error Handling

### If `gh` CLI fails:
- Check authentication: `gh auth status`
- Provide user with manual Issue/PR creation instructions

### If tests fail:
- Fix the failures before creating PR
- Do NOT create a PR with failing tests

### If spec drift detected:
- Update specs first, then re-implement
- Never bypass spec compliance

### If Codex coordination needed (UI components):
- Create a separate prompt in `prompts/P{next-number}-codex-ui-{feature}.md`
- Reference it in the PR description
- Add to Claude Inbox issue for Codex to process

## Success Criteria

- [x] GitHub Issue created with detailed description
- [x] Specifications written (OpenAPI, DB, policies) or generated by Gemini
- [x] Feature implemented with 100% spec compliance
- [x] All tests passing
- [x] PR created and linked to issue
- [x] User notified with clear next steps
- [x] Total user time < 5 minutes (just providing initial requirements + final approval)

## Example Usage

**User says:**
> "Add a feature that allows employers to save job candidates to a shortlist"

**You respond:**
> I'll handle the complete workflow for you. Let me gather a few details:
>
> 1. **Feature name**: Would "Candidate Shortlist" work?
> 2. **Description**: Employers can save candidates to a private shortlist, view them later, add notes, and export to CSV. Is this correct?
> 3. **Priority**: Should this be P2 (medium priority)?
> 4. **Complexity**: Seems like Medium (3-5 days). Confirm?

Then proceed through all 10 steps automatically, keeping the user informed at key milestones.

---

**Remember**: The goal is to reduce user involvement to ~5 minutes (initial request + final PR approval). You handle everything else!
