# SPEC_GAPS (Canonical)

> Single source of truth. Append newest at the top. Do not delete resolved items—mark them with a link to the fixing PR/commit.

## [2025-10-28] Payments webhook hardening

- **GAP-002 — rawBody capture for webhook verification** → **RESOLVED** (commit HEAD (local branch)).
  - Raw payload capture middleware added in `src/server/rawBody.ts` lines 3-29.
  - Webhook handler rejects missing raw body and parses timestamps before verifying signature; see `src/routes/webhooks.payments.ts` lines 51-112.
  - Failure case test hook documented in prompt evidence.

- **GAP-001 — payment signature uses hex digest** → **RESOLVED** (commit HEAD (local branch)).
  - Mock adapter now signs payloads with base64 HMAC and timing-safe comparison; see `src/payments/adapters/mock.ts` lines 1-57.
  - Shared header constants defined in `src/payments/types.ts` lines 1-49.

- **GAP-003 — Redocly CLI vendorization** → **RESOLVED** (commit ce93e9302efa81627f4464f69d3df1732aa8ec6b).
  - Vendored stub CLI lives in `tools/redocly-cli/redocly` lines 1-40.
  - Preflight prefers the vendored binary (`scripts/openapi-lint.mjs` lines 1-55) and logs `mode=vendored` when successful.
  - Drift/lint pipeline invokes the new step via `package.json` preflight script.

## [2025-10-26] Consolidated from prior notes

### A) General reverse-engineering gaps

- The site exposes **100+ PHP scripts** directly under the document root; each was inventoried as a routable endpoint, but active/deprecated status is not fully verified yet. Further linkage checks required.
- **Authorization helpers** (e.g., `happy_member_secure()`) rely on configuration not fully inspected; verify **role-based access** for Top-10 flows (resume/job visibility) against deployment settings before refactor.
- **Payments delegate** to vendor modules under `pg_module/`, but **callback flow + external endpoints** weren’t analyzed in that pass; requires deeper review of PG vendor directories.

### B) Legacy PG callback gaps

- **Inicis NOTI** relies on a hard-coded IP range and returns `OK` without verifying payload integrity → spoofable. **Require HMAC** (hash of body with shared secret) and persist expected hash per order.
- **Inicis standard return** uses PHP session data (`$_SESSION['INI_PRICE']`) for amount validation; S2S callbacks may arrive after session expiry. Move expected amount to **durable storage** keyed by order and compare against canonical totals.
- **AllTheGate (PC/mobile)** has **no signature check** and compares `rAmt` to session state; vulnerable to tampering. Introduce **server-generated nonce/HMAC** in new adapter and persist gross amount for deterministic verification.

### Next actions (operational)

1. Open issues per gap cluster (A/B) with acceptance criteria; link fixes to this file.
2. Add provider-neutral **webhook signature + idempotency** acceptance tests to the payments suite (exactly-once).
3. When resolved, annotate each item here with the fixing PR/commit hash.
