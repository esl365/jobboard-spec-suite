# Prompt Queue Automation (Claude Inbox)

## Overview

The **Claude Inbox** is a centralized issue that tracks all open Claude prompts that need to be processed. This system allows for systematic handling of LLM-assisted tasks with full traceability and automation.

## How It Works

### 1. Claude Inbox Issue Structure

The Claude Inbox is a GitHub issue (typically pinned) that contains:

- **Open Claude prompts**: A numbered list of prompt files to be processed
- **Completed prompts**: Archive of finished prompts with links to results
- **Status**: Current state and next actions

### 2. Prompt File Naming Convention

Prompt files follow the pattern: `prompts/P{number}-claude-{description}.md`

**Example:**
- `prompts/P0001-claude-api-endpoint-design.md`
- `prompts/P0002-claude-payment-integration.md`
- `prompts/P0003-claude-db-migration-review.md`

### 3. Processing Workflow

#### Step 1: Find the Next Prompt

1. Check the Claude Inbox issue for the "Open Claude prompts" section
2. Identify the **lowest numbered** prompt (e.g., P0001)
3. Read the prompt file: `prompts/P{number}-claude-{description}.md`

#### Step 2: Execute the Prompt

1. Follow the instructions in the prompt file
2. Create a new branch if needed: `claude/prompt-{number}-{description}`
3. Make the required changes
4. Run tests and validations
5. Commit and push changes
6. Create a PR if specified

#### Step 3: Mark as Done

After completing the prompt, update the prompt file by adding a `## DONE` section:

```markdown
## DONE (YYYY-MM-DD)

**Summary:** Brief description of what was accomplished

**Changes:**
- List of key changes made
- Files modified
- Features added/fixed

**Evidence:**
- PR: #{PR_NUMBER} or {PR_URL}
- Commit: {commit_hash}
- Related issues: #{issue_number}

**Notes:**
- Any additional context
- Lessons learned
- Follow-up tasks if any
```

### 4. Automation & Updates

The Claude Inbox issue is automatically updated through:

1. **GitHub Actions**: Scans for completed prompts (with `## DONE` sections)
2. **Issue Bot**: Updates the inbox list, moving completed items to the archive
3. **Notifications**: Alerts team members of progress

## Subscribing to Claude Inbox

### For Claude Code Users

To subscribe Claude Code to process prompts from the Inbox:

1. **Check the Inbox**: Read the Claude Inbox issue for open prompts
2. **Create a branch**: `claude/prompt-{number}-{description}`
3. **Run the prompt**: Process according to instructions
4. **Mark complete**: Add `## DONE` section to the prompt file
5. **Push & PR**: Commit, push, and create PR with evidence link

### Automation Setup

To enable automatic inbox updates:

1. **Workflow file**: `.github/workflows/prompt-queue-update.yml`
   - Runs on push to prompts/ directory
   - Scans for `## DONE` sections
   - Updates Claude Inbox issue via GitHub API

2. **Script**: `scripts/update-prompt-queue.js`
   - Parses prompt files
   - Identifies completed prompts
   - Generates updated inbox content

## Best Practices

### Prompt File Structure

Each prompt file should contain:

```markdown
# P{number}: {Title}

**Created:** YYYY-MM-DD
**Priority:** High/Medium/Low
**Estimate:** {time estimate}

## Context

Why this prompt is needed, background information.

## Task

Specific instructions for Claude to follow:
1. Step 1
2. Step 2
3. Step 3

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests pass
- [ ] Documentation updated

## Related

- Issue: #{number}
- Previous work: {links}
- Dependencies: {list}

---

## DONE (YYYY-MM-DD)

(This section is added after completion)
```

### Priority Guidelines

- **Process lowest numbered prompts first** (FIFO queue)
- High priority prompts may be marked with `[URGENT]` prefix
- Blocked prompts should be marked with `[BLOCKED]` and reason

### Review Checklist

Before marking a prompt as done:

- [ ] All task steps completed
- [ ] Tests pass (unit, integration, E2E as applicable)
- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] PR created and linked
- [ ] `## DONE` section added with full evidence
- [ ] Pushed to appropriate branch

## Troubleshooting

### Prompt File Not Found

- Check the prompts/ directory
- Verify the filename matches the pattern
- Ensure you're on the correct branch

### Cannot Update Inbox Issue

- Check GitHub permissions
- Verify issue number is correct
- Check if automation workflow is enabled

### Merge Conflicts in Prompts

- Prompts should be append-only
- Each prompt file is independent
- If conflict occurs, prefer the version with more completion info

## Example End-to-End Flow

1. **Monday morning**: Check Claude Inbox issue #42
2. **Find next prompt**: P0005-claude-implement-search-api.md
3. **Create branch**: `claude/prompt-0005-search-api`
4. **Read prompt file**: Review context, tasks, and success criteria
5. **Implement**: Write code, tests, documentation
6. **Verify**: Run tests, lint, check CI
7. **Update prompt file**: Add `## DONE (2025-10-26)` section
8. **Commit**: `git commit -m "feat: implement search API (P0005)"`
9. **Push**: `git push -u origin claude/prompt-0005-search-api`
10. **Create PR**: Link PR in the DONE section
11. **Automation**: GitHub Actions updates Claude Inbox issue
12. **Next**: Move to P0006

## Integration with Spec Runner

The Claude Inbox system integrates with the existing Spec Runner workflow:

- Prompts follow the same DoD (Definition of Done) as spec-driven tasks
- Pre-flight checks apply to prompt-driven changes
- Merge & drift checks run automatically
- All spec files take precedence over prompt instructions

## Future Enhancements

- [ ] Auto-assign next prompt to available Claude agent
- [ ] Priority-based queue sorting
- [ ] Prompt dependencies and blocking tracking
- [ ] Analytics dashboard for prompt completion velocity
- [ ] Template generator for new prompts
