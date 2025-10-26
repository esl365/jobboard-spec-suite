# Prompt Queue (Spec-First workflow)

Purpose
- A lightweight, repo-native queue of actionable prompts for Codex (Builder) and Claude Code (Spec Concierge).
- Each item is a single markdown file placed here. Naming = `P####-<actor>-<slug>.md`.

Actors
- codex  : implements code + tests + scripts
- claude : prepares/updates specs, reviews Codex PRs per 7-phase protocol

Lifecycle
1) New prompt added → actor executes it.
2) Actor appends a short DONE footer to the same file and references the commit/PRs.
3) If a gap/ambiguity is found, STOP and add to `specs/SPEC_GAPS.md` first, then continue.

Definition of Done (reminder)
- Preflight green (Redocly lint or offline fallback) + OpenAPI↔DDL drift = 0
- Unit/Integration tests pass
- Idempotency & exactly-once scenarios pass
- Forbidden-patterns scan clean
- Lessons learned updated
