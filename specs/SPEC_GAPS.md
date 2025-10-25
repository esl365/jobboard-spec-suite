+ # SPEC_GAPS (Canonical)

  > Single source of truth. Append newest at the top. Do not delete resolved items—mark them with a link to the fixing PR/commit.

  ## [2025-10-25] Payments Vertical Slice Review

  ### C) OpenAPI contract inconsistencies

  - **Idempotency-Key duplicate parameters**: The main `api-spec.yaml` defines the `Idempotency-Key` header parameter **three times** (lines 387-397) for the same endpoint `/payments/prepare`. This is invalid OpenAPI syntax and will fail validation. **Fix:** Remove duplicate parameter definitions, keep single declaration.

  - **Path duplication**: Both `/orders/prepare` (line 338) and `/payments/prepare` (line 376) exist in the spec. Part2 spec references `/payments/prepare`, but legacy Korean text uses `/orders/prepare`. **Decision required:** Canonicalize to `/payments/prepare` per Part2 (provider-neutral naming) and remove `/orders/prepare`.

  - **Provider parameter duplication**: Webhook endpoint `/webhooks/payments/{provider}` has the `provider` path parameter defined **three times** (lines 443-451). **Fix:** Single parameter declaration.

  - **Naming convention drift**: Part1 uses camelCase canonical names (`userId`, `orderId`, `amountCents`), OpenAPI snippet uses camelCase, but main `api-spec.yaml` mixes snake_case (`user_id`, `order_id`) in some schemas. Migration uses snake_case (PostgreSQL convention). **Decision:** Enforce camelCase in API contracts (OpenAPI response bodies), snake_case in DDL only. Update `api-spec.yaml` schemas to match Part1 canonical.

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

  
