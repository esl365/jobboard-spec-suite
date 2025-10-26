# P0004 — Claude: Review CI (vendored Redocly), close GAP-003, final APPROVE

Role: Spec Concierge / Reviewer

Pre-req
- Codex completed vendoring and wired preflight to prefer the vendored CLI.
- Evidence indicates:
  - Lint: `mode=vendored` (or equivalent explicit log)
  - Drift header: `drift mismatches: 0`
  - Tests: GREEN
  - GAP-003 marked closed in specs/SPEC_GAPS.md with commit references.

Tasks
1) Verify on PR #1 (and/or CI run):
   - `.github/workflows/*` uses Node >= 20 and runs: `npm ci`, `npm run preflight`, `npm test`.
   - `scripts/openapi-lint.mjs` precedence: vendored → global → offline (explicit mode logging).
   - Vendored artifact present (e.g., `tools/redocly-cli/redocly` or tarball).
   - CI/preflight logs show `mode=vendored` and drift header `mismatches: 0`.

2) Post the 3 deliverables on PR #1 (use existing templates under `docs/` or a single summary):
   - **CI Preflight Gate**: paste a short log snippet showing `mode=vendored`, `mismatches: 0`, tests pass.
   - **SPEC_GAPS Update**: confirm GAP-003 = RESOLVED (list commit SHAs / workflow SHA).
   - **Final Verdict**: ✅ APPROVE (if all gates pass). Else REQUEST CHANGES with exact evidence deltas.

3) Merge plan (note for maintainers in the comment):
   - Merge PR #1 (code) first.
   - Merge PR #2 (docs-only) next (spec concierge artifacts).
   - After merge, re-run preflight on `main` for a zero-drift confirmation.

STOP rules
- If CI not green, lint mode ≠ vendored, drift > 0, or vendored asset missing:
  - Post REQUEST CHANGES and (re)open GAP entry with Context/Impact/Minimal Proposal.

Done (to fill)
- Links to posted comments
- Final verdict line
- `NOTIFY-USER:` final line
