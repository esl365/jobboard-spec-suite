# P0005 — Codex: Merge PRs, re-check main, and tag v1 for payments-core

Role: Builder / Integrator

Pre-req
- P0004 APPROVE posted on PR #1.
- GAP-001/002/003 all RESOLVED.

Tasks
1) Post-merge verification (maintainer or user will click the buttons; you prepare content & checks):
   - After PR #1 (code) and PR #2 (docs) are merged, fetch `main` locally.
   - Run: `npm ci && npm run preflight && npm test`.
   - Confirm drift header: `mismatches: 0`.

2) Versioning & changelog:
   - Create/append `CHANGELOG.md` entry: `v1.0.0-payments-core` (prepare + webhook, idempotency, exactly-once, signature/base64, raw-body, vendored Redocly, CI).
   - Propose git tag: `v1.0.0-payments-core`.

3) Housekeeping:
   - Ensure `specs/Spec-Trace.yml` runnables align (no stale IDs).
   - Ensure `specs/LessonsLearned.md` includes vendoring note (already added; verify).
   - Open an issue for “Partial refunds (Delta 4) decision & scope for v1.1”.

Evidence to post (on repo or issue)
- Preflight/Test tails from `main`.
- Drift header line (“drift mismatches: 0”).
- CHANGELOG snippet + proposed tag.
- Link to “Partial refunds v1.1” issue.

STOP
- If drift > 0 on `main`, STOP and open SPEC_GAP (Context/Impact/Minimal Proposal).

Done
- Tails pasted
- CHANGELOG & tag proposal posted
- `NOTIFY-USER:` final line
