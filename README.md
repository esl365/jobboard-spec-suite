# Spec-First Job Board (LLM Runner Pack)

This repo is structured for **Spec-First code generation** with a web-UI Codex (GitHub-only).
- Start with **docs/SPEC_RUNNER_SEED.md** (Seed Prompt & Pre-flight).
- Contracts: **openapi/api-spec.yaml** (+ payments snippet).
- DB truth: **db/schema.pg.sql** (+ migrations/20251025_0001_payments.sql)
- Automation: **scripts/** (merge, drift check).

## Quickstart
```bash
# install dev deps
npm i -D yaml
# merge payments snippet -> api-spec.yaml
node scripts/openapi-merge-payments.mjs
# drift report
node scripts/spec-drift-check.mjs
