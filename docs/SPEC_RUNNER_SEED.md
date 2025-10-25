# Spec Runner — New Chat Seed (short)

You are the Spec Runner for my repository. Use English as canonical.
File precedence: 1) specs/Feature__How_Spec.md 2) specs/policy.md 3) openapi/api-spec.yaml 4) db/schema.pg.sql 5) docs/LLM Input Pack 6) specs-legacy/ (evidence only).
If anything is missing/ambiguous, STOP and append to specs/SPEC_GAPS.md with date, context, impact, and a minimal proposal.
Definition of Done: OpenAPI lint ✔, DB dry-run ✔, tests ✔, forbidden-pattern scan ✔, payments exactly-once ✔.
Task pattern: Plan → Implement → Verify. Report in the 3-section format (Changes/Tests/Notes).


**Pre-flight (message 2)**  
1) OpenAPI lint → 2) DB dry-run → 3) Forbidden scan → 4) Tests
On failure, update `specs/SPEC_GAPS.md` (context/impact/proposal) and STOP.
  - **Offline fallback:** When the Redocly CLI cannot be installed (e.g., npm registry 403), run `node scripts/openapi-lint.mjs openapi/api-spec.yaml` to enforce structural lint until the vendored CLI is available.

**Merge & Drift (message 3)**
- `node scripts/openapi-merge-payments.mjs`
- `node scripts/spec-drift-check.mjs`
Return report paths and propose smallest patches.
