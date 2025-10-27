# Job Board Platform: Comprehensive Analysis & Development Roadmap

**Generated:** 2025-10-27
**Project:** 구인구직C Ver7.0 (Modernized Job Board API)
**Status:** Specification Complete, Implementation 5-10%

---

## Executive Summary

This job board platform is a **spec-first, API-driven modernization** of a legacy PHP system (Ver6.2). The project has:

- ✅ **Complete OpenAPI specification** (8 endpoints, 515 lines)
- ✅ **Full database schema** (MySQL 226 lines, PostgreSQL 391 lines)
- ✅ **Comprehensive business policies** (Korean specs)
- ✅ **Automated spec validation** (drift checking, linting)
- ❌ **5-10% implementation** (only health check fully working)

**Goal:** Build a production-ready, headless job board API with JWT auth, RBAC, payment integration, and multi-user workflows.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Final Requirements Definition](#2-final-requirements-definition)
3. [Gap Analysis: Spec vs Implementation](#3-gap-analysis-spec-vs-implementation)
4. [Technology Stack & Architecture](#4-technology-stack--architecture)
5. [Development Roadmap](#5-development-roadmap)
6. [Implementation Priority Matrix](#6-implementation-priority-matrix)
7. [Risk Assessment & Mitigation](#7-risk-assessment--mitigation)
8. [Success Metrics](#8-success-metrics)

---

## 1. Current State Analysis

### 1.1 Implementation Status

| Component | Status | Files | Completion |
|-----------|--------|-------|-----------|
| **Health Check** | ✅ Complete | `src/routes/health.ts` (41 lines) | 100% |
| **Authentication** | ❌ Placeholder | `src/routes/auth.ts` (1 line) | 0% |
| **Job Management** | ❌ Not Started | None | 0% |
| **Applications** | ❌ Not Started | None | 0% |
| **Payments** | ⚠️ Partial | `src/routes/orders*.ts` (stubs) | 5% |
| **Wallet System** | ❌ Placeholder | `src/routes/wallet.ts` (1 line) | 0% |
| **RBAC Middleware** | ❌ Not Started | None | 0% |
| **Database Layer** | ⚠️ In-Memory Stubs | `src/infra/memory/*.ts` | 10% |

**Overall:** ~5-10% complete

### 1.2 Specification Completeness

| Specification Type | Status | Location | Completeness |
|-------------------|--------|----------|-------------|
| **OpenAPI 3.0.3** | ✅ Complete | `openapi/api-spec.yaml` | 100% |
| **Database Schema (MySQL)** | ✅ Complete | `db/schema.sql` | 100% |
| **Database Schema (PostgreSQL)** | ⚠️ Diff Format | `db/schema.pg.sql` | 80% |
| **Business Policies** | ✅ Complete | `specs/policy.md` | 100% |
| **Architecture Rules** | ✅ Complete | `specs/Master_How_Spec.md` | 100% |
| **Feature Specs** | ✅ Complete | `specs/Feature_*.md` | 100% |

**Overall:** 95%+ complete (implementation ready)

### 1.3 Infrastructure Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Web Framework** | ❌ Missing | No Express/Fastify installed |
| **ORM** | ❌ Missing | No Prisma/TypeORM/etc |
| **Database Client** | ❌ Missing | No MySQL/PostgreSQL driver |
| **JWT Library** | ❌ Missing | No jsonwebtoken package |
| **Password Hashing** | ❌ Missing | No bcryptjs/argon2 |
| **Request Validation** | ❌ Missing | No Zod/Joi/etc |
| **Logging** | ❌ Missing | Only console.log |
| **Testing Framework** | ✅ Installed | Vitest 2.0.0 |
| **TypeScript** | ✅ Configured | TS 5.6.0 |

---

## 2. Final Requirements Definition

### 2.1 Core Features (MVP)

#### Feature 1: User Authentication & Authorization
**Priority:** P0 (Critical)

**Requirements:**
- User registration (PERSONAL, COMPANY, ADMIN types)
- Login with email/password → JWT tokens (access + refresh)
- JWT-based authentication middleware
- RBAC middleware (role/permission checking)
- Device-based refresh token rotation (max 5 devices)
- Rate limiting on login endpoint (prevent brute force)

**API Endpoints:**
- `POST /auth/register` (not in current spec - needs addition)
- `POST /auth/login`
- `POST /auth/refresh` (not in current spec - needs addition)
- `POST /auth/logout` (not in current spec - needs addition)

**Database Tables:**
- `users` (main)
- `roles`, `permissions`, `user_roles`, `role_permissions` (RBAC)
- `user_refresh_tokens` (device tracking - **needs schema addition**)

**Business Rules:**
- POL-A-001: JWT-only authentication
- POL-A-002: Max 5 devices per user
- POL-A-003: SNS users can set passwords
- POL-A-004: Dormant accounts after 1 year inactivity

---

#### Feature 2: Job Posting Management
**Priority:** P0 (Critical)

**Requirements:**
- COMPANY users create job postings
- Job lifecycle: DRAFT → PENDING_REVIEW → ACTIVE → EXPIRED/FILLED
- Admin approval workflow (optional: auto-approve for trusted companies)
- Automatic expiration based on `expiresAt` datetime
- Public job listing with filtering (keyword, location, employment type)
- Pagination support

**API Endpoints:**
- `POST /jobs` (create)
- `GET /jobs` (list with filters)
- `GET /jobs/{jobId}` (detail - **needs schema addition**)
- `PUT /jobs/{jobId}` (edit - **needs schema addition**)
- `DELETE /jobs/{jobId}` (soft delete - **needs schema addition**)

**Database Tables:**
- `job_postings` (core)
- `job_options` (paid promotion flags)
- `job_application_stages` (company-customizable workflows)

**Business Rules:**
- POL-B-001: Customizable application stages per company
- POL-B-002: Paid promotion flags (banner, hot job, premium)
- Only ACTIVE jobs visible to public
- Expired jobs filtered out unless admin

---

#### Feature 3: Job Application System
**Priority:** P0 (Critical)

**Requirements:**
- PERSONAL users apply to jobs with resume
- One active application per (jobId, userId)
- Application status tracking: ACTIVE → HIRED/REJECTED/WITHDRAWN
- Company-customizable workflow stages
- Resume snapshot at application time

**API Endpoints:**
- `POST /jobs/{jobId}/apply`
- `GET /applications` (user's own applications - **needs addition**)
- `PUT /applications/{appId}/withdraw` (**needs addition**)
- `GET /jobs/{jobId}/applications` (company view - **needs addition**)
- `PUT /applications/{appId}/stage` (company move stage - **needs addition**)

**Database Tables:**
- `applications` / `candidate_applications`
- `resumes`
- `job_application_stages` (per company)

**Business Rules:**
- Prevent duplicate applications
- Stage ownership validation (company must own stage)
- Resume read requires coupons (POL-B-003)

---

#### Feature 4: Payment & Wallet System
**Priority:** P1 (High)

**Requirements:**
- Idempotent order creation (`POST /payments/prepare`)
- Webhook-based payment settlement (Toss/Iamport)
- Exactly-once webhook processing (deduplication via eventUid)
- Append-only wallet ledger (credit/debit accounting)
- Product packages (premium listing bundles)
- Refund handling (reversing ledger entries)

**API Endpoints:**
- `POST /payments/prepare` (idempotent)
- `POST /webhooks/payments/{provider}` (webhook)
- `GET /orders` (user order history - **needs addition**)
- `GET /wallet/balance` (**needs addition**)

**Database Tables:**
- `orders`
- `product_packages`
- `wallet_ledger` / `point_transactions`
- `idempotency_keys`
- `webhook_events`

**Business Rules:**
- POL-C-001: Toss Payments / Iamport SDK only
- Exactly-once processing (no duplicate payments)
- No wallet effects until webhook confirms
- Refunds are reversing entries (never delete)

---

### 2.2 Advanced Features (Post-MVP)

#### Feature 5: Resume Management
**Priority:** P2 (Medium)

**Requirements:**
- Multiple resumes per PERSONAL user
- Structured resume data (education, experience, skills as JSON)
- Default resume selection
- Resume templates (optional)

**API Endpoints:**
- `POST /resumes` (**needs addition**)
- `GET /resumes` (**needs addition**)
- `PUT /resumes/{resumeId}` (**needs addition**)
- `DELETE /resumes/{resumeId}` (**needs addition**)

---

#### Feature 6: Admin Panel
**Priority:** P2 (Medium)

**Requirements:**
- Approve/reject pending job postings
- Manage users (status changes, role assignments)
- Override business rules (view expired jobs, etc.)
- Analytics dashboard (job views, application counts)

**API Endpoints:**
- `GET /admin/jobs/pending` (**needs addition**)
- `PUT /admin/jobs/{jobId}/approve` (**needs addition**)
- `PUT /admin/users/{userId}/status` (**needs addition**)

---

#### Feature 7: Notifications
**Priority:** P3 (Low)

**Requirements:**
- Email notifications (application received, job approved, etc.)
- In-app notifications (optional)
- Webhook/callback for external integrations

**API Endpoints:**
- `GET /notifications` (**needs addition**)
- `PUT /notifications/{notifId}/read` (**needs addition**)

---

### 2.3 Non-Functional Requirements

| Requirement | Target | Notes |
|------------|--------|-------|
| **Response Time** | < 200ms (P95) | For all API endpoints |
| **Availability** | 99.9% uptime | ~43min downtime/month |
| **Concurrency** | 1000 req/sec | Expected peak load |
| **Data Retention** | 7 years | Legal compliance |
| **Security** | OWASP Top 10 | No SQL injection, XSS, etc. |
| **Audit Trail** | 100% write ops | All mutations logged |

---

## 3. Gap Analysis: Spec vs Implementation

### 3.1 Missing Infrastructure

| Component | Status | Impact | Priority |
|-----------|--------|--------|----------|
| **Express.js / Fastify** | ❌ Not installed | Cannot run API server | P0 |
| **Prisma ORM** | ❌ Not installed | Cannot access database | P0 |
| **MySQL Client** | ❌ Not installed | Database connection | P0 |
| **jsonwebtoken** | ❌ Not installed | No authentication | P0 |
| **bcryptjs** | ❌ Not installed | Cannot hash passwords | P0 |
| **Zod** | ❌ Not installed | No request validation | P1 |
| **Winston Logger** | ❌ Not installed | No structured logging | P2 |

---

### 3.2 Missing Implementations

#### Authentication (0% complete)
- [ ] User registration endpoint
- [ ] Login endpoint with JWT issuance
- [ ] Refresh token rotation logic
- [ ] JWT validation middleware
- [ ] RBAC permission checking middleware
- [ ] Device tracking (user_refresh_tokens table)
- [ ] Password reset flow (forgot password)

#### Job Management (0% complete)
- [ ] Create job posting (COMPANY only)
- [ ] List jobs with filters (public)
- [ ] Job detail endpoint
- [ ] Edit job posting
- [ ] Delete/soft-delete job
- [ ] Auto-expiration cron job
- [ ] Admin approval workflow

#### Applications (0% complete)
- [ ] Apply to job endpoint
- [ ] List user applications
- [ ] Withdraw application
- [ ] Company view applications
- [ ] Move application stage
- [ ] Application status updates

#### Payments (5% complete)
- [x] Basic webhook handler structure (placeholder)
- [ ] Idempotent order creation
- [ ] Toss/Iamport SDK integration
- [ ] Signature verification (provider-specific)
- [ ] Webhook event deduplication
- [ ] Wallet ledger accounting
- [ ] Product package management
- [ ] Refund processing

---

### 3.3 Missing Database Components

| Component | Status | Notes |
|-----------|--------|-------|
| **ORM Models** | ❌ Missing | No Prisma schema or TypeORM entities |
| **Migrations System** | ⚠️ Partial | Only 1 migration file exists |
| **Seed Data** | ❌ Missing | No test/demo data |
| **Indexes** | ⚠️ Partial | Schema has indexes but not verified |
| **Database Connection Pool** | ❌ Missing | No connection setup code |

---

### 3.4 Missing Tests

| Type | Current | Target | Gap |
|------|---------|--------|-----|
| **Unit Tests** | 1 file (health only) | ~50 files | 49 files |
| **Integration Tests** | 0 | ~20 scenarios | 20 scenarios |
| **E2E Tests** | 0 | ~10 flows | 10 flows |
| **Load Tests** | 0 | 1 suite | 1 suite |

---

## 4. Technology Stack & Architecture

### 4.1 Recommended Stack

#### Backend Framework
**Choice:** **Express.js** (Node.js)

**Rationale:**
- Mature ecosystem
- TypeScript support
- Compatible with existing Vitest setup
- Large community for troubleshooting

**Alternative:** Fastify (if performance is critical)

---

#### ORM
**Choice:** **Prisma**

**Rationale:**
- Type-safe query builder
- Excellent TypeScript integration
- Auto-generated types from schema
- Migration system built-in
- Schema-first or introspection modes

**Alternative:** TypeORM (if more control needed)

---

#### Database
**Choice:** **MySQL 8.0** (primary)

**Rationale:**
- Schema already defined in `db/schema.sql`
- Production-ready
- Good performance for read-heavy workloads

**Note:** PostgreSQL schema exists but in diff format (needs conversion)

---

#### Authentication
**Libraries:**
- `jsonwebtoken` - JWT creation/verification
- `bcryptjs` - Password hashing
- `express-rate-limit` - Rate limiting

---

#### Validation
**Choice:** **Zod**

**Rationale:**
- Type-safe schema validation
- Runtime validation with TypeScript inference
- Integrates well with Express middleware

---

#### Payment Integration
**Choice:** **Toss Payments SDK** (primary)

**Rationale:**
- Korean market leader
- Good documentation
- Webhook-based settlement

**Alternative:** Iamport (as secondary option)

---

#### Logging
**Choice:** **Winston**

**Rationale:**
- Structured logging
- Multiple transports (file, console, cloud)
- Production-grade

---

### 4.2 Architectural Layers

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Web/Mobile)                  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────┐
│                   API LAYER (Express)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Middleware Stack:                                │  │
│  │  1. CORS                                          │  │
│  │  2. Body Parser (JSON)                            │  │
│  │  3. Rate Limiting                                 │  │
│  │  4. JWT Authentication (optional per route)       │  │
│  │  5. RBAC Authorization (optional per route)       │  │
│  │  6. Request Validation (Zod schemas)              │  │
│  │  7. Route Handlers                                │  │
│  │  8. Error Handler (global)                        │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  SERVICE LAYER                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Business Logic:                                  │  │
│  │  - AuthService (login, register, token refresh)  │  │
│  │  - JobService (CRUD, search, expiration)         │  │
│  │  - ApplicationService (apply, stage management)  │  │
│  │  - PaymentService (order, webhook processing)    │  │
│  │  - WalletService (ledger accounting)             │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 DATA ACCESS LAYER (Prisma ORM)          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Repositories:                                    │  │
│  │  - UserRepository                                 │  │
│  │  - JobRepository                                  │  │
│  │  - ApplicationRepository                          │  │
│  │  - OrderRepository                                │  │
│  │  - WalletLedgerRepository                         │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   DATABASE (MySQL 8.0)                  │
│  - users, roles, permissions, user_roles               │
│  - job_postings, job_options, applications             │
│  - orders, wallet_ledger, idempotency_keys             │
└─────────────────────────────────────────────────────────┘
```

---

### 4.3 Project Structure (Proposed)

```
jobboard-spec-suite/
├── src/
│   ├── server.ts                   # Main entry point
│   ├── app.ts                      # Express app configuration
│   │
│   ├── routes/                     # API route definitions
│   │   ├── index.ts                # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── jobs.routes.ts
│   │   ├── applications.routes.ts
│   │   ├── payments.routes.ts
│   │   └── health.routes.ts
│   │
│   ├── controllers/                # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── jobs.controller.ts
│   │   ├── applications.controller.ts
│   │   └── payments.controller.ts
│   │
│   ├── services/                   # Business logic
│   │   ├── auth.service.ts
│   │   ├── jobs.service.ts
│   │   ├── applications.service.ts
│   │   ├── payments.service.ts
│   │   └── wallet.service.ts
│   │
│   ├── repositories/               # Data access (Prisma)
│   │   ├── user.repository.ts
│   │   ├── job.repository.ts
│   │   ├── application.repository.ts
│   │   └── order.repository.ts
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── auth.middleware.ts      # JWT validation
│   │   ├── rbac.middleware.ts      # Permission checking
│   │   ├── validate.middleware.ts  # Request validation
│   │   └── error.middleware.ts     # Global error handler
│   │
│   ├── schemas/                    # Zod validation schemas
│   │   ├── auth.schema.ts
│   │   ├── job.schema.ts
│   │   ├── application.schema.ts
│   │   └── payment.schema.ts
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── express.d.ts            # Express augmentations
│   │   ├── auth.types.ts
│   │   └── payment.types.ts
│   │
│   ├── utils/                      # Utility functions
│   │   ├── logger.ts               # Winston logger
│   │   ├── jwt.ts                  # JWT helpers
│   │   └── errors.ts               # Custom error classes
│   │
│   ├── config/                     # Configuration
│   │   ├── database.ts             # Prisma client
│   │   ├── env.ts                  # Environment variables
│   │   └── payment.ts              # Payment provider config
│   │
│   └── adapters/                   # External integrations
│       ├── toss-payments.adapter.ts
│       └── iamport.adapter.ts
│
├── prisma/
│   ├── schema.prisma               # Prisma schema (from db/schema.sql)
│   ├── migrations/                 # Migration files
│   └── seed.ts                     # Seed data
│
├── tests/
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── e2e/                        # End-to-end tests
│
├── scripts/                        # Build/automation scripts
├── docs/                           # Documentation
└── package.json
```

---

## 5. Development Roadmap

### Phase 0: Foundation (Week 1-2)

**Goal:** Set up infrastructure and development environment

#### Tasks:
1. **Install Core Dependencies**
   - [ ] Express.js
   - [ ] Prisma ORM
   - [ ] MySQL client
   - [ ] TypeScript types

2. **Database Setup**
   - [ ] Convert `db/schema.sql` to Prisma schema
   - [ ] Initialize Prisma
   - [ ] Create initial migration
   - [ ] Set up local MySQL instance
   - [ ] Test database connection

3. **Project Structure**
   - [ ] Create folder structure (routes, controllers, services, etc.)
   - [ ] Set up main entry point (`src/server.ts`)
   - [ ] Configure Express app (`src/app.ts`)
   - [ ] Add environment variable management (.env)

4. **Core Middleware**
   - [ ] CORS configuration
   - [ ] Body parser
   - [ ] Error handling middleware
   - [ ] Request logging

**Deliverables:**
- Express server running on localhost
- Database connected via Prisma
- Health check endpoint working
- Basic error handling

**Estimated Time:** 2 weeks (1 developer)

---

### Phase 1: Authentication & Authorization (Week 3-5)

**Goal:** Implement user management and security

#### Tasks:
1. **User Registration**
   - [ ] POST /auth/register endpoint
   - [ ] Password hashing (bcryptjs)
   - [ ] Email uniqueness validation
   - [ ] User type enforcement (PERSONAL, COMPANY, ADMIN)

2. **Login & JWT**
   - [ ] POST /auth/login endpoint
   - [ ] JWT token generation (access + refresh)
   - [ ] Refresh token storage (user_refresh_tokens table)
   - [ ] Device tracking (max 5 devices)

3. **Middleware**
   - [ ] JWT authentication middleware
   - [ ] RBAC middleware (permission checking)
   - [ ] Rate limiting on /auth/login

4. **Token Refresh**
   - [ ] POST /auth/refresh endpoint
   - [ ] Token rotation logic
   - [ ] Device management

5. **Testing**
   - [ ] Unit tests for auth service
   - [ ] Integration tests for auth endpoints
   - [ ] Test RBAC middleware

**Deliverables:**
- Working authentication system
- JWT-based auth for all protected routes
- RBAC middleware
- 80%+ test coverage

**Estimated Time:** 3 weeks (1 developer)

---

### Phase 2: Job Management (Week 6-9)

**Goal:** Implement core job posting features

#### Tasks:
1. **Job Creation**
   - [ ] POST /jobs endpoint (COMPANY users only)
   - [ ] Request validation (Zod schemas)
   - [ ] Permission check (JOB_POSTING_CREATE)
   - [ ] Default status: PENDING_REVIEW

2. **Job Listing**
   - [ ] GET /jobs endpoint (public access)
   - [ ] Filtering (keyword, location, employment type)
   - [ ] Pagination
   - [ ] Only show ACTIVE, non-expired jobs

3. **Job Detail & Edit**
   - [ ] GET /jobs/{jobId}
   - [ ] PUT /jobs/{jobId} (owner or admin only)
   - [ ] DELETE /jobs/{jobId} (soft delete)

4. **Job Lifecycle**
   - [ ] Auto-expiration cron job (check expiresAt)
   - [ ] Admin approval endpoint (PUT /admin/jobs/{jobId}/approve)
   - [ ] Status transitions (DRAFT → PENDING → ACTIVE → EXPIRED)

5. **Job Options**
   - [ ] Paid promotion flags (is_premium_listing, is_main_banner, is_hot_job)
   - [ ] Expiration logic (options_expires_at)

6. **Testing**
   - [ ] Unit tests for job service
   - [ ] Integration tests for all endpoints
   - [ ] Test permission enforcement

**Deliverables:**
- Complete job posting system
- Search/filtering working
- Auto-expiration mechanism
- 80%+ test coverage

**Estimated Time:** 4 weeks (1 developer)

---

### Phase 3: Application System (Week 10-13)

**Goal:** Implement job application workflows

#### Tasks:
1. **Resume Management**
   - [ ] POST /resumes (create)
   - [ ] GET /resumes (list user's resumes)
   - [ ] PUT /resumes/{resumeId} (edit)
   - [ ] DELETE /resumes/{resumeId}
   - [ ] Resume snapshot logic

2. **Apply to Job**
   - [ ] POST /jobs/{jobId}/apply
   - [ ] Prevent duplicate applications
   - [ ] Resume ownership validation
   - [ ] Job must be ACTIVE

3. **Application Management**
   - [ ] GET /applications (user's applications)
   - [ ] PUT /applications/{appId}/withdraw (user action)
   - [ ] GET /jobs/{jobId}/applications (company view)
   - [ ] PUT /applications/{appId}/stage (company moves stage)

4. **Application Stages**
   - [ ] POST /stages (company creates custom stages)
   - [ ] GET /stages (company's stages)
   - [ ] PUT /stages/{stageId} (edit stage)
   - [ ] DELETE /stages/{stageId}

5. **Testing**
   - [ ] Unit tests for application service
   - [ ] Integration tests for workflows
   - [ ] Test duplicate prevention

**Deliverables:**
- Complete application system
- Resume management
- Company-customizable stages
- 80%+ test coverage

**Estimated Time:** 4 weeks (1 developer)

---

### Phase 4: Payment Integration (Week 14-18)

**Goal:** Implement payment and wallet system

#### Tasks:
1. **Product Packages**
   - [ ] GET /packages (list available packages)
   - [ ] Admin: CRUD for product packages

2. **Order Preparation**
   - [ ] POST /payments/prepare (idempotent)
   - [ ] Idempotency-Key handling
   - [ ] Order creation with status=PENDING

3. **Payment Provider Integration**
   - [ ] Toss Payments SDK integration
   - [ ] Generate payment request payload
   - [ ] Return PG-specific data to client

4. **Webhook Processing**
   - [ ] POST /webhooks/payments/{provider}
   - [ ] Signature verification (HMAC)
   - [ ] Event UID deduplication
   - [ ] State transitions (PENDING → COMPLETED/FAILED)
   - [ ] Wallet ledger accounting

5. **Wallet System**
   - [ ] GET /wallet/balance
   - [ ] Wallet ledger (append-only)
   - [ ] Credit/debit accounting
   - [ ] Refund handling (reversing entries)

6. **Job Promotion**
   - [ ] Apply purchased benefits to job_options
   - [ ] Set options_expires_at
   - [ ] Activate promotion flags

7. **Testing**
   - [ ] Unit tests for payment service
   - [ ] Integration tests for webhook processing
   - [ ] Test idempotency guarantees
   - [ ] Test exactly-once semantics

**Deliverables:**
- Working payment flow (Toss Payments)
- Webhook-based settlement
- Wallet system with ledger
- Job promotion activation
- 80%+ test coverage

**Estimated Time:** 5 weeks (1 developer)

---

### Phase 5: Admin Panel & Polish (Week 19-22)

**Goal:** Admin features and production readiness

#### Tasks:
1. **Admin Endpoints**
   - [ ] GET /admin/jobs/pending (jobs awaiting approval)
   - [ ] PUT /admin/jobs/{jobId}/approve
   - [ ] PUT /admin/users/{userId}/status (activate/suspend/delete)
   - [ ] GET /admin/analytics (dashboard data)

2. **Logging & Monitoring**
   - [ ] Winston logger integration
   - [ ] Request/response logging
   - [ ] Error tracking
   - [ ] Performance metrics

3. **Security Hardening**
   - [ ] Helmet.js (security headers)
   - [ ] Rate limiting (all endpoints)
   - [ ] CORS configuration
   - [ ] Input sanitization
   - [ ] SQL injection prevention (via ORM)

4. **Documentation**
   - [ ] Swagger UI (from OpenAPI spec)
   - [ ] API usage examples
   - [ ] Deployment guide
   - [ ] Environment variable documentation

5. **Testing**
   - [ ] E2E test suite (full user journeys)
   - [ ] Load testing (Artillery or K6)
   - [ ] Security testing (OWASP)

**Deliverables:**
- Admin panel endpoints
- Production-ready logging
- Security hardened
- Complete documentation
- E2E test suite

**Estimated Time:** 4 weeks (1 developer)

---

### Phase 6: Deployment & Launch (Week 23-24)

**Goal:** Production deployment

#### Tasks:
1. **Containerization**
   - [ ] Dockerfile for Node.js app
   - [ ] Docker Compose for local dev (app + MySQL)

2. **CI/CD Pipeline**
   - [ ] GitHub Actions: build, test, deploy
   - [ ] Automated migrations on deploy

3. **Production Deployment**
   - [ ] Cloud hosting setup (AWS/GCP/Azure)
   - [ ] Database provisioning (RDS/Cloud SQL)
   - [ ] Environment variable management
   - [ ] SSL certificates
   - [ ] Domain setup

4. **Monitoring**
   - [ ] APM (Application Performance Monitoring)
   - [ ] Error tracking (Sentry)
   - [ ] Uptime monitoring

5. **Launch Preparation**
   - [ ] Load testing (verify 1000 req/sec)
   - [ ] Disaster recovery plan
   - [ ] Backup strategy

**Deliverables:**
- Production deployment
- Monitoring dashboards
- Disaster recovery plan
- Launch-ready system

**Estimated Time:** 2 weeks (1 developer)

---

## 6. Implementation Priority Matrix

### P0: Critical (Must Have for MVP)
| Feature | Estimated Effort | Dependencies |
|---------|-----------------|--------------|
| Express + Prisma setup | 2 weeks | None |
| Authentication (JWT) | 3 weeks | Express setup |
| Job CRUD | 4 weeks | Authentication |
| Job Application | 4 weeks | Job CRUD |

**Total MVP Effort:** ~13 weeks (3 months)

---

### P1: High (Important Post-MVP)
| Feature | Estimated Effort | Dependencies |
|---------|-----------------|--------------|
| Payment Integration | 5 weeks | Authentication |
| Wallet System | Included in Payment | Payment Integration |
| RBAC Middleware | Included in Auth | Authentication |
| Admin Approval Workflow | 1 week | Job CRUD |

**Total P1 Effort:** ~6 weeks (1.5 months)

---

### P2: Medium (Nice to Have)
| Feature | Estimated Effort | Dependencies |
|---------|-----------------|--------------|
| Resume Management | 2 weeks | Authentication |
| Admin Panel | 4 weeks | All core features |
| Notifications | 3 weeks | All core features |

**Total P2 Effort:** ~9 weeks (2.25 months)

---

### P3: Low (Future Enhancements)
| Feature | Estimated Effort | Dependencies |
|---------|-----------------|--------------|
| Advanced Analytics | 4 weeks | All features |
| SNS Login Integration | 2 weeks | Authentication |
| Email Service | 2 weeks | Core features |

**Total P3 Effort:** ~8 weeks (2 months)

---

## 7. Risk Assessment & Mitigation

### 7.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Database Schema Misalignment** | Medium | High | Run drift checks on every commit |
| **Payment Webhook Failures** | Low | Critical | Implement retry logic + manual reconciliation |
| **JWT Token Compromise** | Low | High | Short-lived access tokens + refresh rotation |
| **Concurrent Payment Processing** | Medium | High | Use database transactions + idempotency keys |
| **Performance Bottleneck** | Medium | Medium | Add caching (Redis), optimize queries |

---

### 7.2 Schedule Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Underestimated Complexity** | High | High | Add 20% buffer to estimates |
| **Dependency Delays** | Medium | Medium | Identify critical path early |
| **Scope Creep** | High | High | Strict feature freeze after Phase 3 |

---

### 7.3 Quality Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Insufficient Testing** | Medium | High | Enforce 80% coverage minimum |
| **Security Vulnerabilities** | Medium | Critical | OWASP checklist + security audit |
| **Poor Documentation** | High | Medium | Documentation as part of DoD |

---

## 8. Success Metrics

### 8.1 Development Metrics

| Metric | Target | Current | Gap |
|--------|--------|---------|-----|
| **Test Coverage** | 80%+ | ~5% (1 file) | 75% |
| **OpenAPI Compliance** | 100% | 100% | 0% |
| **Code Implementation** | 100% | 5-10% | 90-95% |
| **Drift Count** | 0 | 0 (spec-only) | N/A |

---

### 8.2 Production Metrics (Post-Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time (P95)** | < 200ms | APM dashboard |
| **Uptime** | 99.9% | Uptime monitor |
| **Error Rate** | < 0.1% | Error tracking |
| **Concurrent Users** | 1000+ | Load testing |
| **Database Query Time (P95)** | < 50ms | APM dashboard |

---

### 8.3 Business Metrics (Post-Launch)

| Metric | Target (3 months) | Measurement |
|--------|-------------------|-------------|
| **Registered Users** | 1000+ | Database count |
| **Active Job Postings** | 500+ | Database count |
| **Applications Submitted** | 2000+ | Database count |
| **Payment Conversions** | 10%+ | Orders / Users ratio |

---

## 9. Conclusion

### Current Status
- **Specifications:** 95%+ complete, production-ready
- **Implementation:** 5-10% complete, mostly placeholders
- **Infrastructure:** Missing core dependencies (Express, Prisma, JWT libs)

### Required Effort
- **MVP (P0):** 13 weeks (3 months) for 1 developer
- **Full System (P0+P1):** 19 weeks (4.75 months)
- **All Features (P0+P1+P2):** 28 weeks (7 months)

### Recommended Approach
1. **Start with Phase 0 (Foundation):** Set up Express + Prisma immediately
2. **Parallel Development:** Authentication + Job Management can overlap
3. **Iterative Releases:** Deploy MVP (Auth + Jobs + Applications) first
4. **Post-MVP:** Add Payments, Admin Panel, Polish

### Next Immediate Steps
1. Install Express.js, Prisma, and core dependencies
2. Convert `db/schema.sql` to Prisma schema
3. Set up local MySQL database
4. Create main entry point (`src/server.ts`)
5. Implement authentication system (highest priority)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-27
**Generated By:** Claude Code (Comprehensive Analysis Agent)
