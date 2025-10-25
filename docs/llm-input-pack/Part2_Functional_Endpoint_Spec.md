# Functional Endpoint Spec — Core Flows (EN Canonical, expression-free)

> Purpose: Define **WHAT each endpoint does** (preconditions, invariants, side-effects, security, idempotency), decoupled from UI or provider details. Pairs with Part 1 (data) and the OpenAPI contract.

---

## 0) Scope & Version
- API base: `/v1`
- Covered flows: **Auth**, **Jobs**, **Applications**, **Payments (prepare/webhook)**.
- Canonical language: **English**. Expression-free.

---

## 1) Auth

### 1.1 POST /auth/login
**Purpose**: exchange valid credentials for access/refresh tokens.  
**Security**: `security: []` (public).  
**Preconditions**
- `email` exists and password hash matches.
- User `status != DORMANT/DELETED`.

**Request (logical)**
- `email` (string, normalized)
- `password` (opaque; never logged)

**Responses**
- 200: `{ accessToken(JWT), refreshToken(JWT), userId, userType }`
- 401: invalid credentials or blocked
- 423: account locked (rate-limit policy)

**Side-effects**
- Issue **rotating** refresh token and store `(userId, deviceFingerprint, rt_hash, ua, ip)`.
- Enforce device cap (max 5) by revoking oldest device.

**Invariants**
- Only latest refresh token per device is valid.

---

## 2) Jobs

### 2.1 GET /jobs
**Purpose**: list job postings with filters, paging, ordering.  
**Security**: inherits root policy (JWT). *(If anonymous browse is desired, set `security: []` in OpenAPI and here.)*  
**Preconditions**
- None (beyond auth, if enforced).

**Request (logical)**
- `q` (search string, optional)
- `page`, `pageSize` (bounds checked)
- Filters (optional): `locationId`, `employmentType`, `status ∈ {ACTIVE}`

**Responses**
- 200: `items: JobSummary[]`, `total`, `page`, `pageSize`
- 400: invalid filters

**Invariants**
- Do not return `DRAFT`, `PENDING_REVIEW`, `DELETED`.
- Results constrained by `expiresAt >= now()` unless explicitly overridden by admin.

### 2.2 POST /jobs
**Purpose**: create a new job posting (company user).  
**Security**: `required_permission = JOB_POSTING_CREATE` (company only).  
**Preconditions**
- Caller `userType == COMPANY`.
- Company profile is complete (billing/contact).

**Request (logical)**
- `title`, `description`, optional classification fields (see Part 1)
- Optional paid option flags are **ignored at creation**; they are driven by wallet effects.

**Responses**
- 201: `{ jobId, status: "PENDING_REVIEW" | "ACTIVE"(if auto-approve) }`
- 400: invalid payload
- 403: insufficient permission

**Side-effects**
- Create `job_postings`(status=`PENDING_REVIEW` by default).
- Append audit log.

**State**
- `DRAFT → PENDING_REVIEW → ACTIVE` (publish control per policy).

---

## 3) Applications

### 3.1 POST /jobs/{jobId}/apply
**Purpose**: submit an application to a posting (jobseeker).  
**Security**: `required_permission = APPLICATION_CREATE` (personal only).  
**Preconditions**
- Caller `userType == PERSONAL`.
- Posting exists and `status == ACTIVE`.
- `(jobId, jobseekerUserId)` is not already active.

**Request (logical)**
- `resumeId` (owned by caller)
- Optional `coverLetter` (text/URL), `answers` (JSON)

**Responses**
- 201: `{ applicationId, currentStageId }`
- 400: invalid resume/ownership
- 409: duplicate active application

**Side-effects**
- Insert `applications` with `status=ACTIVE`.
- Initialize `currentStageId` to company default.

**Invariants**
- Snapshot rules for resume content defined at API/How-Spec layer.

---

## 4) Payments (Provider-neutral)

### 4.1 POST /payments/prepare
**Purpose**: create/ensure an order for a package or custom charge.  
**Security**: `required_permission = ORDER_CREATE` (company).  
**Idempotency**: **required** `Idempotency-Key` header.  
**Preconditions**
- Caller `userType == COMPANY`.
- `amountCents >= 0` and product reference (if any) is active.

**Request (logical)**
- `userId` (implicit from token), `amountCents`, `provider` (label), optional `packageId`

**Responses**
- 200: `Order` (ensured; idempotent)
- 409: idempotency collision with **different business keys**
- 400: invalid amount/product

**Side-effects**
- Upsert `orders(PENDING)` unique by `(provider, providerPaymentId)` if available later.
- Persist idempotency record scoped to `(key + user + method + path + product)`.

**Invariants**
- No wallet effects at prepare time.

### 4.2 POST /webhooks/payments/{provider}
**Purpose**: receive payment events and settle exactly-once.  
**Security**: `security: []` (public) + **signature verification** (provider-specific).  
**Idempotency**: provider event UID enforced in `webhook_events(event_uid UNIQUE)`.

**Preconditions**
- Signature valid (adapter).
- Event schema matches known type.

**Responses**
- 200: `{ ok: true }` (replay-safe)
- 400: bad signature/payload

**Side-effects (single transaction)**
1. Load order by `providerPaymentId`.
2. Apply state transition: `PENDING → COMPLETED | FAILED | REFUNDED`.
3. On COMPLETED: write `wallet_ledger` (credits) and update job options/entitlements.
4. Store webhook event payload & signature.

**Invariants**
- Replays are no-ops after first successful settle.
- Compensations (refunds) create reversing ledger entries.

---

## 5) Errors & Rate Limits (functional intent)
- Standard error envelope `{ code, message }`.
- Rate limit policy applies to login and payment prepare; too many failures → temporary block.
- No provider-specific messages surface to clients.

---

## 6) Tracing & Audit (functional intent)
- Each write endpoint emits structured logs with correlation IDs.
- Webhook processing logs include: signature check result, idempotency decision, transition result.

---

## 7) Known Gaps (feed SPEC_GAPS)
- Public vs authenticated access for `/jobs` **TBD**; default = authenticated.
- Exact payment provider fields returned at `prepare` **TBD** (keep provider-neutral surface).
- Resume snapshot policy **TBD** (copy vs reference semantics).
