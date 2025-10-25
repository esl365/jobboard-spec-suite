# Functional Data Spec — Core Domain (EN Canonical, expression‑free)

> Purpose: Provide LLMs a **clean, expression‑free** functional description of data required for a modern job portal with provider‑neutral payments. This document avoids legacy text/UI/phrasing. It uses **canonical names** and explains **semantics, states, and constraints** only.

---

## 0) Scope & Authority

* Scope: **Users/Auth**, **Jobs (postings)**, **Resumes**, **Applications & Stages**, **Paid Options**, **Orders & Wallet Ledger**, **Observability entities**.
* Canonical language: **English**.
* This spec is the **WHAT**; implementation details live in API/How specs. When legacy artifacts exist, they are mapped via `Legacy→Canonical` entries for traceability only.

---

## 1) Canonical Entity Map (trace only)

* `job_postings`  ⇐ legacy: JOB_GUIN
* `candidate_applications` / `candidate_application_logs`  ⇐ legacy: JOB_COM_GUIN_PER / *_LOG
* `job_posting_views` / `job_posting_promotions` / `job_posting_metrics`  ⇐ legacy: *_VIEW_LOG / *_JUMP / *_STATS
* `candidate_posting_views`  ⇐ legacy: JOB_PER_GUIN_VIEW
* `wallet_ledger`  ⇐ legacy: POINT_LEDGER (aka point_jangboo) *(Mapping exists only to locate equivalent business meaning; do ****not**** reuse legacy identifiers in code.)*

---

## 2) Users & Auth (summary)

### 2.1 Users

**Purpose**: represent a person or a company account.

* **Identity**: `userId` (opaque), `email` (unique), `userType` ∈ {`PERSONAL`,`COMPANY`,`ADMIN`}.
* **Security metadata**: password hash, status flags (e.g., `ACTIVE`, `DORMANT`), created/updated timestamps.
* **Company profile (for COMPANY)**: company name, registration no. (opaque string), contact phone, billing info (separate PCI scope; store tokens only).
* **Person profile (for PERSONAL)**: name, phone, optional profile fields.

### 2.2 Auth tokens (refresh rotation policy reference)

* **Not modeled here**; see Auth spec. Data needed by payments/applications is the `userId` and `userType` only.

---

## 3) Jobs (Postings)

### 3.1 Job Posting (`job_postings`)

**Purpose**: a vacancy created by a company user.

* **Identity**: `jobId` (opaque).
* **Owner**: `companyUserId` (FK → Users of type COMPANY).
* **Content**: `title` (plain text), `description` (HTML or structured JSON), optional classification (`location*`, `jobType*`) kept as integers or normalized tables (TBD per data lineage).
* **Compensation**: `employmentType` ∈ {`FULL_TIME`,`PART_TIME`,`CONTRACT`}, optional `salaryMin/Max` (numeric), optional `salaryType` ∈ {`HOURLY`,`MONTHLY`,`YEARLY`}.
* **Lifecycle**: `status` ∈ {`DRAFT`,`PENDING_REVIEW`,`ACTIVE`,`EXPIRED`,`FILLED`,`DELETED`}, `expiresAt` (UTC), `createdAt`, `updatedAt`.

#### State machine (posting)

```
DRAFT → PENDING_REVIEW → ACTIVE → EXPIRED
ACTIVE → FILLED (manual) | DELETED (admin)
```

**Invariant**: `expiresAt` ≥ `createdAt`.

### 3.2 Paid Options (`job_options`)

**Purpose**: per‑posting promotion flags that may toggle via purchase.

* Flags: `isPremiumListing`, `isMainBanner`, `isHotJob` (boolean), `optionsExpiresAt` (UTC end date for paid visibility).
* **Rule**: surfaces are shown only when flag is `true` **and** not expired.

### 3.3 Observability around postings

* **Views/metrics**: append‑only event or roll‑up tables that record listing views, jumps, or promotions. Minimal fields: `id`, `jobId`, `actorUserId` (nullable/anonymous allowed), device/ip (hashed), `occurredAt`.

---

## 4) Resumes

### 4.1 Resume (`resumes`)

**Purpose**: a structured profile document authored by a PERSONAL user.

* **Identity**: `resumeId`.
* **Owner**: `jobseekerUserId`.
* **Content**: `title` (text), structured JSON blobs for `educationHistory`, `workExperience`, `skills` (schema open; validated in API).
* **Flags**: `isDefault`.
* **Timestamps**: `createdAt`, `updatedAt`.

---

## 5) Applications & Stages

### 5.1 Application Stages (`application_stages`)

**Purpose**: per‑company customizable workflow steps.

* **Identity**: `stageId`, `companyUserId` (owner), `stageName` (display), `stageOrder` (integer ordering), `isDefaultStage`.

### 5.2 Application (`applications`)

**Purpose**: a jobseeker’s submission to a job posting.

* **Identity**: `applicationId`.
* **Links**: `jobId` (posting), `jobseekerUserId` (PERSONAL), `resumeId` (snapshot pointer), `currentStageId` (FK to stages).
* **Status**: `status` ∈ {`ACTIVE`,`WITHDRAWN_BY_USER`,`HIRED`,`REJECTED_BY_COMPANY`}.
* **Uniqueness rule**: (jobId, jobseekerUserId) must be unique (one active submission per posting).
* **Timestamps**: `appliedAt`, `updatedAt`.

#### State machine (application)

```
ACTIVE —(stage transitions)→ ACTIVE
ACTIVE → HIRED | REJECTED_BY_COMPANY | WITHDRAWN_BY_USER
```

**Invariant**: `currentStageId` must belong to the same `companyUserId` that owns `jobId`.

---

## 6) Payments & Wallet

### 6.1 Product Packages (`product_packages`)

**Purpose**: purchasable bundles granting promotion or credits.

* **Identity**: `packageId`.
* **Fields**: `packageName`, `price`, `benefits` (JSON: e.g., counts of premium listings, resume reads, duration days), `isActive`.

### 6.2 Orders (`orders`)

**Purpose**: record purchase intent and settlement status.

* **Identity**: `orderId`.
* **Owner**: `userId` (COMPANY), optional `packageId` (FK → product packages).
* **Economic**: `totalAmount` (decimal money), `paymentMethod` (label), **provider‑neutral hooks**: `provider` (label), `providerPaymentId` (string), optional `providerMeta` (JSON for reconciliation).
* **Status**: `status` ∈ {`PENDING`,`COMPLETED`,`FAILED`,`REFUNDED`} with `createdAt`,`updatedAt`.
* **Idempotency** (client‑initiated): separate key store keyed by `Idempotency‑Key` and scope (`method+path+business keys`).
* **Webhook events**: immutable log of incoming provider events for de‑duplication and audit.

### 6.3 Wallet Ledger (`wallet_ledger`)

**Purpose**: append‑only accounting of credits/debits (e.g., charges, refunds, consumptions such as resume reads or option activations).

* **Identity**: `ledgerId`.
* **Fields**: `userId`, `orderId` (nullable FK), `direction` ∈ {`CREDIT`,`DEBIT`}, `amountCents` (integer), `reasonType` (label), `createdAt`.
* **Invariant**: inserts only; no in‑place edits. Corrections are new reversing entries.

---

## 7) Cross‑entity Invariants

* A `job_posting` **belongs** to a `COMPANY` user; deletes cascade to options and dependent aggregates where safe.
* An `application` references a `resume` owned by the same `jobseekerUserId`.
* `orders → wallet_ledger` transitions are **single‑transaction** side‑effects for success/refund.
* Paid option flags derive from wallet effects and expire via `optionsExpiresAt`.

---

## 8) Minimal Index & Uniqueness Expectations (functional)

* Users: unique `email`.
* Job postings: index `status`, `expiresAt` for queries.
* Applications: unique `(jobId, jobseekerUserId)`; index `currentStageId`.
* Orders: unique `(provider, providerPaymentId)`; index by `userId` and `createdAt`.
* Wallet ledger: index `(userId, createdAt)`.

---

## 9) Data Retention & Compliance (functional intent)

* Logs/metrics and webhook events are retained long enough for dispute windows (provider‑specific; set via policy). Personal data fields must be portable/erasable per jurisdiction.

---

## 10) Known Gaps to Resolve (feed SPEC_GAPS)

* Exact normalization of location/classification taxonomies (IDs vs reference tables) — **TBD**.
* Monetary types: adopt integer cents consistently; avoid string money.
* Provider‑specific webhook signatures and idempotency TTL — set in policy and adapter specs.

---

## 11) LLM Usage Notes

* Treat all identifiers here as **canonical**. Do **not** import legacy naming or strings.
* When generating code or migrations, enforce state machines and invariants exactly as stated.
* Prefer strict validation at the API boundary; DB constraints backstop the same rules.
