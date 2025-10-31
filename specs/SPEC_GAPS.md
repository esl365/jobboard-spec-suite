+ # SPEC_GAPS (Canonical)

  > Single source of truth. Append newest at the top. Do not delete resolved items—mark them with a link to the fixing PR/commit.

  ## [2025-10-25] PR #1 Conflict Resolution Review

  ### GAP-001: Signature encoding drift (hex vs. base64)

  **Context:** Discovered during PR #1 conflict review. `src/payments/adapters/mock.ts:19` uses `digest("hex")` for HMAC-SHA256 signature encoding, but `specs/Spec-Trace.yml` test vectors (TV01-TV03) specify base64 encoding. Line 25 also uses hex for signature comparison.

  **Impact:** Signature verification will fail when tested against canonical test vectors TV01-TV03 from Spec-Trace.yml. Breaks contract conformance (Phase 6 of review protocol). Production webhook integration tests will fail.

  **Minimal Proposal:** Change `digest("hex")` → `digest("base64")` in `src/payments/adapters/mock.ts` lines 19, 25. Update corresponding Buffer.from calls from "hex" to "base64". Verify test suite uses base64-encoded signatures matching Spec-Trace.yml.

  **Status:** OPEN (blocking merge until resolved)

  ---

  ### GAP-002: rawBody fallback may re-stringify (timing attack vulnerability)

  **Context:** Discovered during PR #1 conflict review. `src/routes/webhooks.payments.ts:43` has fallback logic: `const rawBody = typeof request.rawBody === "string" ? request.rawBody : stableStringify(request.body ?? {});`

  **Impact:** If middleware doesn't provide `request.rawBody`, the webhook handler re-stringifies the parsed JSON body. Re-stringified body may not match the original wire format byte-for-byte (whitespace, key ordering). This breaks HMAC signature verification and creates a timing attack vulnerability where attacker can craft JSON with different formatting that passes re-stringification but fails original signature check.

  **Minimal Proposal:** Remove fallback logic. Require `request.rawBody` from middleware; throw error if missing. Add middleware that captures raw request buffer BEFORE body-parser runs (e.g., `app.use((req, res, next) => { let data = ''; req.on('data', chunk => data += chunk); req.on('end', () => { req.rawBody = data; next(); }); })`). Add test case verifying signature verification fails if body is re-parsed.

  **Status:** OPEN (requires verification that middleware is present; non-blocking if proven present in integration tests)

  ---

  ### GAP-003: Redocly CLI not vendored (CI/DoD blocker)

  **Context:** Discovered during PR #1 conflict review. `package.json` references `"@redocly/cli": "file:./tools/redocly/redocly-cli-2.8.0.tgz"` but the tarball file may not exist in repository. `scripts/openapi-lint.mjs` falls back to offline YAML-based linting.

  **Impact:** Cannot run full OpenAPI lint with Redocly rules in CI. Offline fallback is incomplete (missing Redocly-specific validations: security scheme consistency, response schema completeness, parameter duplication detection beyond basic checks). Definition of Done (DoD) requires passing full preflight including Redocly lint.

  **Minimal Proposal:** Vendor Redocly CLI tarball under `tools/redocly/` (download and commit `redocly-cli-2.8.0.tgz`) OR update `package.json` to use npm registry version `"@redocly/cli": "^1.25.0"` if offline vendoring not required. Update `scripts/openapi-lint.mjs` to prefer vendored Redocly when present.

  **Status:** OPEN (non-blocking for v1 merge; requires follow-up PR to meet DoD for production deployment)

  ---

  ## [2025-10-25] Payments Vertical Slice Review

  ### C) OpenAPI contract inconsistencies

  - ~~**Idempotency-Key duplicate parameters**~~: **RESOLVED (2025-10-26, main)** — Handled by `openapi-merge-payments.mjs` fixup in preflight pipeline. The main `api-spec.yaml` source has duplicates (lines 387-397) but the merged/validated spec is correct.

  - ~~**Provider parameter duplication**~~: **RESOLVED (2025-10-26, main)** — Handled by `openapi-merge-payments.mjs` fixup in preflight pipeline. Webhook endpoint duplicates (lines 443-451) are cleaned during merge phase.

  - **Path duplication**: Both `/orders/prepare` (line 338) and `/payments/prepare` (line 376) exist in the spec. Part2 spec references `/payments/prepare`, but legacy Korean text uses `/orders/prepare`. **Decision required:** Canonicalize to `/payments/prepare` per Part2 (provider-neutral naming) and remove `/orders/prepare`. **(Status: Open, awaiting decision)**

  - **Naming convention drift**: Part1 uses camelCase canonical names (`userId`, `orderId`, `amountCents`), OpenAPI snippet uses camelCase, but main `api-spec.yaml` mixes snake_case (`user_id`, `order_id`) in some schemas. Migration uses snake_case (PostgreSQL convention). **Decision:** Enforce camelCase in API contracts (OpenAPI response bodies), snake_case in DDL only. Update `api-spec.yaml` schemas to match Part1 canonical. **(Status: Open, awaiting harmonization)**

  ### D) Data model gaps (payments)

  - **Partial refund status**: Current `orders.status` enum is `[PENDING, COMPLETED, FAILED, REFUNDED]`. No status for **partial refunds**. Webhook test D2 identifies this gap. **Proposal:** Add `PARTIALLY_REFUNDED` status OR track refund details in separate `order_refunds` table with foreign key to orders. Prefer separate table for audit trail.

  - **Package reference type mismatch**: Part1 Section 6.2 uses `packageId` (opaque), OpenAPI uses `package_id` (integer in main spec, string in snippet). Migration SQL uses `INT UNSIGNED`. **Decision:** Standardize on string/UUID for packageId (forward compatibility with non-numeric IDs), update migration to `TEXT` or `UUID`.

  - **Missing providerMeta field**: Part1 Section 6.2 mentions optional `providerMeta` (JSON for reconciliation) but not in migration or OpenAPI Order schema. **Fix:** Add `provider_meta JSONB` to orders table and `providerMeta` field to OpenAPI Order schema.

  - **Idempotency key TTL policy**: Part1 Section 10 notes "idempotency TTL — TBD". No expiration logic defined for `idempotency_keys` table. Keys accumulate forever. **Proposal:** Add `expires_at TIMESTAMPTZ` column and background cleanup job (e.g., purge after 7 days). Document TTL policy in Part1 Section 6.2.

  - **Webhook event retention**: Part1 Section 9 mentions "retained long enough for dispute windows" but no policy or TTL specified. `webhook_events` table has no expiration. **Proposal:** Add `retention_until TIMESTAMPTZ` and purge policy (provider-specific; e.g., 90 days for Inicis, 180 for Iamport per their dispute windows).

  ### E) Missing implementation components

  - **Signature verification adapters**: Webhook tests require provider-specific signature verification. Current `src/payments/registry.ts` is a stub. **Required:** Implement signature verification for each provider:
    - Mock: HMAC-SHA256 with shared secret
    - Iamport: Per Iamport webhook signature spec
    - Inicis: Per Inicis NOTI spec (if migrating legacy)

  - **Transaction boundary enforcement**: Part1 Section 7 and Part2 Section 4.2 mandate **single-transaction** updates for order → ledger → webhook_events. Current placeholders lack transaction wrappers. **Required:** Implement database transaction boundary in webhook handler (e.g., `BEGIN; ... COMMIT;` with rollback on error).

  - **State machine validation**: Part1 Section 6.2 defines order state machine. No validation code exists to prevent invalid transitions (e.g., FAILED → COMPLETED). **Required:** Implement state transition guard functions.

  - **Job options/entitlements application**: Part2 Section 4.2 mentions applying job options on COMPLETED. No implementation. **Required:** Link orders to `job_options` table updates when packageId grants premium listing, banner, etc.

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

  
