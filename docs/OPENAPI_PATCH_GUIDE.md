# OPENAPI Patch Guide (payments snippet → main)

1) Edit `openapi/api-spec.payments.snippet.yaml` (paths/components only).
2) Run: `node scripts/openapi-merge-payments.mjs`
3) Validate merge:
   - Paths `/payments/prepare` and `/webhooks/payments/{provider}` exist.
   - Components schemas `Order`, `WebhookEvent`, `Error` merged (no override loss).
4) If conflicts → open `specs/SPEC_GAPS.md` with a minimal resolution proposal.
