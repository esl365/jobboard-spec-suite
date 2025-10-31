# → Prompt for **Codex**

## `prompts/P0009-codex-finish-pr4-conflicts-and-ci.md`

**Title:** Finish PR #4 (vendor Redocly CLI), resolve conflicts, and prove CI is green

**Context**

* Repo: `esl365/jobboard-spec-suite`
* Open PR: **#4 – chore(ci): vendor redocly cli for offline preflight**
* Head branch: `codex/run-pre-flight-and-log-issues-8cw2da`
* Base branch: `main`
* Recent changes: GAP-003 closed by vendored Redocly; GAP-004 logged (offline workspace w/o origin remote). New workflows:

  * `.github/workflows/spec-preflight.yml`
  * `.github/workflows/pr-conflict-notify.yml`
  * `.github/workflows/prompt-watcher.yml`

**Objectives**

1. Rebase/merge `main` → `codex/run-pre-flight-and-log-issues-8cw2da` and **resolve conflicts** canonically.
2. Ensure **CI passes** on the head branch: `spec-runner` and `spec-preflight` both green.
3. Flip PR #4 to **Ready for review**, post evidence, and update the prompt queue (DONE).

**Canonical conflict resolutions (apply exactly)**

* `src/payments/adapters/mock.ts`

  * HMAC digest must be **`base64`**, not hex.
  * Compare via `crypto.timingSafeEqual`.
* `src/routes/webhooks.payments.ts`

  * **Use captured `request.rawBody`** only; **no** stringify fallback on the verifier path.
  * Enforce ±300s timestamp tolerance.
  * De-dupe **before** effects; single TX for state change + ledger append; replay → 200/no duplicate effects.
* `src/payments/registry.ts`

  * Keep **mock provider only** by default.
* `src/infra/memory/payments.repos.ts`

  * Keep current interface/transactions aligned with DB repo; no raw SQL in handlers.
* `package.json` & `scripts/openapi-lint.mjs`

  * Keep **vendored Redocly** preference (tools/redocly-cli/redocly), then global, then offline fallback.
  * `npm run preflight` should run: openapi lint → drift check → summary line with **mismatch count**.

**What to push**

* Conflict-resolution commits on `codex/run-pre-flight-and-log-issues-8cw2da`.
* No unrelated churn.

**Evidence to post on PR #4 (top-level comments)**

1. **Preflight tail (last ~20 lines)** showing lint pass + **`drift: 0`**.
2. **Test tail (last ~20 lines)** –  all suites pass.
3. **Drift report header** – first 10 lines of `reports/spec-openapi-ddl-drift.md` proving *mismatches = 0*.
4. **Links** to the two latest workflow runs (spec-runner, spec-preflight) on the head branch.
5. **Code pointers** (file:line) for:

   * base64 signature + safe compare
   * raw-body middleware path (no stringify)
   * unique `(provider, event_uid)` constraint (schema + migration)
   * de-dupe → TX → order update → ledger append
   * acceptance tests mapping (replay/sig/timestamp/idempotency)

**STOP rules (block and report in PR if any fail)**

* OpenAPI↔DDL **drift > 0**
* Any tests failing
* Signature digest **not** base64 or non-constant-time compare
* rawBody fallback present
* De-dupe after side effects or missing single transaction

**Completion**

* Flip PR #4 to **Ready for review**.
* Comment with all evidence above.
* Append a `## DONE (YYYY-MM-DD)` section to `prompts/P0003-codex-vendor-redocly-cli.md` and this prompt (`P0009`) with links to runs/commits.
