# Claude Inbox: Open Prompts

> **Purpose**: Central queue for Claude/Codex prompt-based tasks. Process prompts in ascending order (P0001, P0002, ...). When done, add a `## DONE (YYYY-MM-DD)` section to the prompt file with summary, changes, evidence, and notes.

---

## 📋 Open Prompts (ascending)

Process these in order (lowest number first):

- **P0002**: `prompts/P0002-codex-resolve-pr4-and-rebase.md` — Resolve PR #4 conflicts and rebase
- **P0003**: `prompts/P0003-claude-7phase-review-pr4.md` — 7-phase review of PR #4

---

## ✅ Recently Completed

- **P0001**: Prompt Queue Example (Template) — Completed 2025-10-26
  - Summary: Created Prompt Queue automation documentation and example template
  - Evidence: Commit `f28aae8`, Branch `claude/prompt-queue-subscribe-011CUVZKrycpBAkGkQ9BHdST`
  - Files: docs/PROMPT_QUEUE_AUTOMATION.md, prompts/P0001-claude-prompt-queue-example.md

---

## 🔄 How This Issue Is Updated

This issue is **automatically updated** by the GitHub workflow `.github/workflows/prompt-queue-update.yml`:

1. When a prompt file in `prompts/P*.md` is modified and pushed
2. The workflow runs `scripts/scan-completed-prompts.mjs`
3. If a prompt has a `## DONE` section, it's detected as completed
4. The workflow updates this issue via `scripts/update-inbox-issue.mjs`
5. Completed prompts are moved from "Open Prompts" to "Recently Completed"

**Manual updates** are also fine — edit this issue directly to add/remove prompts.

---

## ⚙️ Setup Instructions (one-time)

To enable automation, set the repository variable:

**Path**: Settings → Secrets and variables → Actions → Variables → New variable

```
Name: CLAUDE_INBOX_ISSUE_NUMBER
Value: <this issue number>
```

**Example**: If this issue is #5, set `CLAUDE_INBOX_ISSUE_NUMBER=5`

---

## 📚 Resources

- **Full Guide**: `docs/PROMPT_QUEUE_AUTOMATION.md`
- **Template**: `prompts/P0001-claude-prompt-queue-example.md`
- **Spec Runner Integration**: `prompts/spec-runner.prompt.md` (Section 7)
- **Scanner**: `scripts/scan-completed-prompts.mjs`
- **Updater**: `scripts/update-inbox-issue.mjs`

---

## 📝 Creating New Prompts

Use this format: `prompts/P{number}-{agent}-{description}.md`

**Example**: `prompts/P0004-claude-implement-search-api.md`

**Required sections**:
- Context
- Task
- Success Criteria
- Related
- _(Added after completion)_ DONE (YYYY-MM-DD)

See P0001 for a complete template.

---

## 🎯 Best Practices

- **Process lowest numbered prompt first** (FIFO queue)
- **One prompt at a time** to avoid conflicts
- **Always add DONE section** with full evidence (commit hash, PR link)
- **Push to branch** named `claude/prompt-{number}-{description}`
- **Test before marking done** (run preflight, tests)
- **Keep prompts focused** — break large tasks into multiple prompts

---

## 🔍 Quick Status Check

To see completed prompts locally:
```bash
node scripts/scan-completed-prompts.mjs
```

To verify automation is working, check the Actions tab after pushing a completed prompt.
