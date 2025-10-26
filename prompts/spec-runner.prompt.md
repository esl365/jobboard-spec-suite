# Spec Runner — New Chat Seed (Copy‑Paste Kit)

> Use this file to **continue the project in a fresh chat** while keeping all rules, scope, and DoD intact. Canonical language is **EN**. Keep this doc close and copy blocks as instructed.

---

## 1) First message to paste in the new chat (Seed Prompt)
```
You are the Spec Runner for my repository. Use English as canonical.
File precedence: 1) specs/Feature_*_How_Spec.md 2) specs/policy.md 3) openapi/api-spec.yaml 4) db/schema.pg.sql 5) docs/LLM Input Pack (Parts 1/2/3A/3B) 6) specs-legacy/* (evidence only).
If anything is missing/ambiguous, STOP and append to specs/SPEC_GAPS.md with date, context, impact, and a minimal proposal.
Definition of Done: OpenAPI lint ✔, DB dry-run ✔, tests (unit/integration/contract/scenario) ✔, forbidden-pattern scan ✔, payments exactly-once (idempotency + signature + dedup + single-transaction) ✔.
Task pattern: Plan → Implement → Verify. Report in the 3-section format (Changes/Tests/Notes).
```

> Tip: If the model supports **system** messages, place the same text there too.

---

## 2) Minimal file set to upload in the new chat
- **Prompts & governance**: `prompts/spec-runner.prompt.md`, `specs/SPEC_GAPS.md`, `specs/LessonsLearned.md`
- **OpenAPI**: `openapi/api-spec.yaml`, `openapi/api-spec.payments.snippet.yaml`
- **DB/DDL**: `db/schema.pg.sql`, `migrations/20251025_0001_payments.sql`
- **Scripts**: `scripts/scan-forbidden.js`, `scripts/scan-forbidden.allowlist.json`, `scripts/openapi-merge-payments.mjs`, `scripts/spec-drift-check.mjs`
- **Source (skeletons)**:
  - routes: `src/routes/auth.ts`, `src/routes/orders.prepare.ts`, `src/routes/orders.ts`, `src/routes/wallet.ts`, `src/routes/webhooks.payments.ts`
  - payments: `src/payments/registry.ts`, `src/payments/adapters/mock.ts`, `src/payments/adapters/iamport.ts`
  - infra: `src/infra/memory/payments.repos.ts`
- **Tests**: `tests/payments/**`
- **Project**: `package.json`, `.github/workflows/spec-runner.yml`
- **Legacy evidence (optional)**: `schema.core.pg.sql`, `Endpoints_Top10.md`, `PG_Callback_Map.md`

---

## 3) One‑shot packer (local) — create a zip to upload
Create `scripts/pack-llm-context.sh` with the content below, then run `bash scripts/pack-llm-context.sh`.

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT=${1:-$(pwd)}
OUT=${2:-llm-context.zip}

have() { command -v "$1" >/dev/null 2>&1; }

files=(
  "prompts/spec-runner.prompt.md"
  "specs/SPEC_GAPS.md" "specs/LessonsLearned.md"
  "openapi/api-spec.yaml" "openapi/api-spec.payments.snippet.yaml"
  "db/schema.pg.sql" "migrations/20251025_0001_payments.sql"
  "scripts/scan-forbidden.js" "scripts/scan-forbidden.allowlist.json"
  "scripts/openapi-merge-payments.mjs" "scripts/spec-drift-check.mjs"
  "src/routes/auth.ts" "src/routes/orders.prepare.ts" "src/routes/orders.ts" "src/routes/wallet.ts" "src/routes/webhooks.payments.ts"
  "src/payments/registry.ts" "src/payments/adapters/mock.ts" "src/payments/adapters/iamport.ts"
  "src/infra/memory/payments.repos.ts"
  "tests/payments"
  "package.json" ".github/workflows/spec-runner.yml"
)

missing=()
for f in "${files[@]}"; do [ -e "$ROOT/$f" ] || missing+=("$f"); done
if [ ${#missing[@]} -gt 0 ]; then
  echo "[WARN] Missing files:"; printf ' - %s\n' "${missing[@]}"; fi

if have zip; then
  (cd "$ROOT" && zip -r "$OUT" "${files[@]}" >/dev/null)
  echo "[OK] Created $OUT"
elif have tar; then
  (cd "$ROOT" && tar -czf "${OUT%.zip}.tar.gz" "${files[@]}")
  echo "[OK] Created ${OUT%.zip}.tar.gz"
else
  echo "[ERR] Need 'zip' or 'tar' installed"; exit 1
fi
```

**Windows (PowerShell)** quick alternative:
```powershell
$Files = @(
  'prompts/spec-runner.prompt.md', 'specs/SPEC_GAPS.md', 'specs/LessonsLearned.md',
  'openapi/api-spec.yaml', 'openapi/api-spec.payments.snippet.yaml',
  'db/schema.pg.sql', 'migrations/20251025_0001_payments.sql',
  'scripts/scan-forbidden.js', 'scripts/scan-forbidden.allowlist.json',
  'scripts/openapi-merge-payments.mjs', 'scripts/spec-drift-check.mjs',
  'src/routes/auth.ts', 'src/routes/orders.prepare.ts', 'src/routes/orders.ts', 'src/routes/wallet.ts', 'src/routes/webhooks.payments.ts',
  'src/payments/registry.ts', 'src/payments/adapters/mock.ts', 'src/payments/adapters/iamport.ts',
  'src/infra/memory/payments.repos.ts', 'tests/payments', 'package.json', '.github/workflows/spec-runner.yml'
)
Compress-Archive -Path $Files -DestinationPath llm-context.zip -Force
```

---

## 4) Second message to paste (Pre‑flight command)
```
Run pre-flight:
1) OpenAPI lint (Redocly) on openapi/api-spec.yaml
2) DB dry-run on db/schema.pg.sql (Postgres 15)
3) Forbidden pattern scan (scripts/scan-forbidden.js)
4) Tests: unit → integration → payments suite
If anything fails, STOP and append to specs/SPEC_GAPS.md with context and a minimal fix proposal.
```

## 5) Third message (Merge & Drift)
```
Execute:
- node scripts/openapi-merge-payments.mjs
- node scripts/spec-drift-check.mjs
Return the reports (paths) and summarize any conflicts or drift, then propose the smallest spec/DDL patches to resolve them.
```

## 6) Claude/Codex targeting (ready-made prompts)
- **Adapter add‑on (Toss/Stripe skeleton):**
```
Using src/payments/registry.ts and adapters/mock.ts as contracts, create src/payments/adapters/toss.ts (skeleton) with HMAC verify and webhook normalizer. Add unit tests mirroring tests/payments/unit/adapter.mock.test.ts.
```
- **PG repos (Postgres) implementation:**
```
Implement Postgres repos for orders/idempotency/webhook_events/ledger following migrations/20251025_0001_payments.sql. Keep transactions in a single unit. Provide Vitest integration tests replacing in-memory repos.
```

## 7) Claude Inbox — Prompt Queue automation
For systematic prompt processing, use the **Claude Inbox** workflow:

**Subscribe to Claude Inbox:**
1. Check the Claude Inbox issue for the "Open Claude prompts" list
2. Process the **lowest numbered** prompt first: `prompts/P{number}-claude-{description}.md`
3. Execute the prompt according to instructions
4. Mark complete by adding a `## DONE (YYYY-MM-DD)` section with summary, changes, evidence (PR/commit links), and notes

**Example workflow:**
```
# Check inbox, find P0005-claude-implement-search.md
# Create branch: claude/prompt-0005-search
# Implement per prompt instructions
# Add to prompt file:
## DONE (2025-10-26)
Summary: Implemented search API with filters
Changes: Added GET /search endpoint, tests, OpenAPI spec
Evidence: PR #42, commit abc123f
Notes: Integrated with existing pagination system
```

**Key points:**
- Each prompt file is standalone with Context, Task, Success Criteria, Related sections
- Always process lowest numbered prompt (FIFO queue)
- The `## DONE` section provides full traceability
- Automation scans for completed prompts and updates the Inbox issue

See `docs/PROMPT_QUEUE_AUTOMATION.md` for the complete guide.

---

## 8) What to do if context diverges in the new chat
- Ask the model to **quote** its assumptions and compare against this repo.
- Instruct it to open or update `specs/SPEC_GAPS.md` first, then propose patches.

---

### Tiny checklist (print and stick)
- [ ] Paste Seed Prompt (Section 1)
- [ ] Upload `llm-context.zip` (Section 3)
- [ ] Run Pre‑flight (Section 4)
- [ ] Run Merge & Drift (Section 5)
- [ ] Log gaps/lessons as we go

