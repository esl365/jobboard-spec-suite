# SPEC_GAPS (Canonical)

> Single source of truth. Append newest at the top. Do not delete resolved items—mark them with a link to the fixing PR/commit.

## [GAP-001][2025-10-28] Mock adapter signature digest format
- **Context**: Conflict resolution revealed the mock adapter was emitting hex-encoded HMAC signatures while Spec Trace requires base64 for provider parity.
- **Impact**: Webhook verification using the shared adapter header would fail against canonical test vectors and real integrations.
- **Proposal**: Switch to base64-encoded `sha256` digests for both signing and verification and share the header constant across adapter + handler.
- **Status**: RESOLVED in codex/payments-core-v1 (commit TBD) by updating `src/payments/adapters/mock.ts` to emit/verify base64 signatures and aligning tests.

## [GAP-002][2025-10-28] Raw webhook payload not enforced for signature checks
- **Context**: Previous webhook handler fell back to JSON stringification when `request.rawBody` was unavailable, violating the spec requirement to hash the exact raw payload.
- **Impact**: Attackers could replay tampered payloads that stringify identically, breaking signature guarantees and causing drift from acceptance vectors.
- **Proposal**: Require the raw body to be captured upstream; reject webhook deliveries if the raw payload is missing and document the server wiring assumption.
- **Status**: RESOLVED in codex/payments-core-v1 (commit TBD) via `src/routes/webhooks.payments.ts` enforcing raw-body presence and removing stringify fallbacks, covered by tests.

## [GAP-003][2025-10-28] Redocly CLI not vendored for offline linting
- **Context**: Preflight relies on `scripts/openapi-lint.mjs` because the Redocly CLI package cannot be downloaded in the offline workspace.
- **Impact**: Offline fallback covers basic checks only; CI parity is at risk until the official CLI is bundled with the repo.
- **Proposal**: Vendor `@redocly/cli` under `tools/redocly-cli/` with a wrapper script so preflight can execute the official linter without network access.
- **Status**: OPEN — plan remains to vendor the CLI in a follow-up tooling PR.

## [2025-10-28] Webhook signature tolerance assumed
- **Context**: Acceptance docs for the payments webhook do not specify the maximum allowed timestamp skew for HMAC verification.
- **Impact**: Without a bound, webhook deliveries could replay old signed payloads; tests require a deterministic tolerance to ensure the handler rejects stale events.
- **Proposal**: Adopt ±300 seconds as the interim limit and update the official payments spec to publish the tolerance so adapters can align.

## [2025-10-27] Remote review branch unavailable
- **Context**: Requested branch `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF` not reachable in offline workspace.
- **Impact**: Acceptance mappings (54 cases), Spec Trace, and review checklist from Claude cannot be synced locally; tests derived from those docs are approximated from mainline spec only.
- **Proposal**: Request artifact bundle via alternate channel or attach archive to repo so Spec Runner can sync without network access.

## [2025-10-27] Payments Delta 4 decision pending
- **Context**: Claude's DDL delta list calls out partial-refund support (Delta 4) but is out of scope for this vertical slice.
- **Impact**: Refund ledger wiring and schema changes are deferred; ensure reviewers know this remains open.
- **Proposal**: Gate Delta 4 behind follow-up PR once refund requirements are clarified; track acceptance expectations before implementation.

## [2025-10-26] Consolidated from prior notes

### A) General reverse-engineering gaps

- The site exposes **100+ PHP scripts** directly under the document root; each was inventoried as a routable endpoint, but active/deprecated status is not fully verified yet. Further linkage checks required.
- **Authorization helpers** (e.g., `happy_member_secure()`) rely on configuration not fully inspected; verify **role-based access** for Top-10 flows (resume/job visibility) against deployment settings before refactor.
- **Payments delegate** to vendor modules under `pg_module/`, but **callback flow + external endpoints** weren’t analyzed in that pass; requires deeper review of PG vendor directories.

### B) Legacy PG callback gaps

- **Inicis NOTI** relies on a hard-coded IP range and returns `OK` without verifying payload integrity → spoofable. **Require HMAC** (hash of body with shared secret) and persist expected hash per order.
- **Inicis standard return** uses PHP session data (`$_SESSION['INI_PRICE']`) for amount validation; S2S callbacks may arrive after session expiry. Move expected amount to **durable storage** keyed by order and compare against canonical totals.
- **AllTheGate (PC/mobile)** has **no signature check** and compares `rAmt` to session state; vulnerable to tampering. Introduce **server-generated nonce/HMAC** in new adapter and persist gross amount for deterministic verification.

------

### Next actions (operational)

1. Open issues per gap cluster (A/B) with acceptance criteria; link fixes to this file.
2. Add provider-neutral **webhook signature + idempotency** acceptance tests to the payments suite (exactly-once).
3. When resolved, annotate each item here with the fixing PR/commit hash.
