# Prompts Queue

This directory contains a **repo-native prompt queue** for coordinating work between Codex (implementation agent) and Claude Code (Spec Concierge/Reviewer).

## How It Works

1. **Prompt files** are created with format `P####-{agent}-{description}.md`
   - `P0001-codex-resolve-pr1-and-post-evidence.md` - Tasks for Codex
   - `P0002-claude-7phase-review-and-approval.md` - Tasks for Claude Code

2. **Agents poll this directory** and execute their assigned prompts in order

3. **Each prompt includes:**
   - Pre-conditions (what must be true before starting)
   - Tasks (numbered steps to execute)
   - Output (what artifacts/comments to produce)
   - DONE section (agent fills in links/results when complete)

4. **Workflow:**
   - Maintainer creates prompt files
   - Agents detect new prompts
   - Execute tasks autonomously
   - Update DONE section when complete
   - Comment on related PRs to signal completion

## Current Queue

- **P0001** (codex): Resolve PR #1 conflicts and post evidence
- **P0002** (claude): Execute 7-phase review and post deliverables to PR #1

## Naming Convention

- `P####` - Sequential prompt ID (P0001, P0002, ...)
- `{agent}` - Target agent: `codex`, `claude`, `maintainer`
- `{description}` - Brief task summary (kebab-case)

## Status Tracking

Agents update the `DONE` section at the end of each prompt file with:
- Links to posted comments/commits
- Final verdict or completion status
- Any blockers or follow-up items

## Example Prompt Structure

```markdown
# P0001 (codex) — Task description

Pre-conditions
- List required state before starting

Tasks
1) Step one
2) Step two
3) Step three

Output
- Expected artifacts
- Where to post comments

DONE (to be filled by agent)
- links:
- status:
```

---

**This queue system enables async coordination between agents without requiring real-time communication.**
