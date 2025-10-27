# Spec-First Job Board (LLM Runner Pack)

This repo is structured for **Spec-First code generation** with a web-UI Codex (GitHub-only).
- Start with **docs/SPEC_RUNNER_SEED.md** (Seed Prompt & Pre-flight).
- Contracts: **openapi/api-spec.yaml** (+ payments snippet).
- DB truth: **db/schema.pg.sql** (+ migrations/20251025_0001_payments.sql)
- Automation: **scripts/** (merge, drift check).

## 🚀 Quick Start

**For rapid testing:**
```bash
# Start backend + database
docker-compose up -d

# Start frontend (separate terminal)
cd frontend && npm run dev

# Open: http://localhost:3001
```

See **[QUICKSTART.md](./QUICKSTART.md)** for detailed quick start guide.

## 📚 Documentation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[QUICKSTART.md](./QUICKSTART.md)** | Fast setup & testing | Want to run the app quickly |
| **[HANDOVER.md](./HANDOVER.md)** | Session handover & full context | Starting new session or need complete context |
| **[STATUS.md](./STATUS.md)** | Current project status | Want to know what's done and what's next |
| **[NEW_SESSION_PROMPT.md](./NEW_SESSION_PROMPT.md)** | Prompt for new Claude session | Starting fresh Claude Code session |
| **[DEPLOY.md](./DEPLOY.md)** | Production deployment guide | Ready to deploy |

## Original Spec-First Workflow

```bash
# install dev deps
npm i -D yaml
# merge payments snippet -> api-spec.yaml
node scripts/openapi-merge-payments.mjs
# drift report
node scripts/spec-drift-check.mjs
