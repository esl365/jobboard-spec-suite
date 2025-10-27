# Phase 0: Foundation & Infrastructure - Execution Plan V2

**Timeline**: Months 1-3 (12 weeks)
**Philosophy**: 오래 걸리더라도 단단하고, 혁신적인 시스템
**Approach**: Spec Coding 철학 100% 준수 + Codex Round 1 피드백 반영

**Version**: 2.0
**Previous Version**: V1 (8 weeks, microservices-first) - Rejected by Codex
**Status**: Ready for Codex Round 2 Review

---

## 🔄 Major Changes from V1

| Aspect | V1 (Rejected) | V2 (Revised) |
|--------|---------------|--------------|
| **Architecture** | 4 Microservices | **Modular Monolith** (NestJS) |
| **Auth** | Go + GORM | **NestJS + Passport + Prisma** |
| **API** | GraphQL + REST | **REST-only** (OpenAPI-First) |
| **Timeline** | 8 weeks | **12 weeks** (with buffer) |
| **Infrastructure** | Full K8s Week 6 | **Staged**: Docker→K8s→Prod |
| **Database** | K8s StatefulSet | **AWS RDS** (managed) |
| **Observability** | 4 tools (heavy) | **Essential** (Prometheus+CloudWatch+OTel) |
| **Languages** | Go+TS+Python | **TypeScript primary** (NestJS) |

**Codex Verdict**: V1 was "aggressive" and "unrealistic for 1 engineer"
**V2 Goal**: Achievable, solid foundation, innovation-ready

---

## 1. Executive Summary

### 1.1 Objectives

Phase 0는 **Modular Monolith** 기반으로 견고한 기초를 구축합니다:

1. **NestJS Modular Monolith** 구현
2. **REST API** (OpenAPI-First, 100% spec compliant)
3. **Core Modules**: Auth, Jobs, Applications, Payments
4. **Infrastructure as Code** (Terraform)
5. **CI/CD Automation** (GitHub Actions)
6. **Essential Observability** (Prometheus + OpenTelemetry)
7. **Production-Ready** (AWS EKS deployment)

### 1.2 Success Criteria

Phase 0 종료 시:
- ✅ NestJS monolith with 4 core modules operational
- ✅ REST API 100% OpenAPI spec compliant
- ✅ Auth (JWT + RBAC) fully implemented
- ✅ Jobs + Applications CRUD functional
- ✅ 80%+ test coverage (unit + integration + e2e)
- ✅ `docker-compose up` runs entire stack locally
- ✅ CI/CD auto-deploys to AWS EKS staging
- ✅ Prometheus metrics + CloudWatch logs operational
- ✅ Terraform manages all infrastructure
- ✅ 100% Spec Coding compliance

### 1.3 Why Modular Monolith?

**Codex 지적**:
> "With a single engineer and no pre-existing platform, the surface area of four services multiplies operational overhead before feature scope is validated."

**장점**:
- ✅ Single codebase = easier to develop, test, deploy
- ✅ No distributed system complexity (yet)
- ✅ Clear module boundaries = easy to extract later
- ✅ Faster iteration during Phase 0-1
- ✅ Still 100% Spec Coding compliant

**When to split**:
- Phase 2+: when traffic/team size justifies
- Extract modules to microservices incrementally
- Already designed with clean boundaries

---

## 2. Architecture

### 2.1 Modular Monolith Structure

```
jobboard-api (NestJS Application)
│
├── src/
│   ├── main.ts                    # Bootstrap
│   ├── app.module.ts              # Root module
│   │
│   ├── modules/
│   │   ├── auth/                  # AuthModule
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── guards/            # JWT, RBAC guards
│   │   │   ├── strategies/        # Passport strategies
│   │   │   └── dto/               # Login, Register DTOs
│   │   │
│   │   ├── jobs/                  # JobModule
│   │   │   ├── job.module.ts
│   │   │   ├── job.service.ts
│   │   │   ├── job.controller.ts
│   │   │   ├── entities/          # Job, JobOption entities
│   │   │   └── dto/               # CreateJobDto, etc.
│   │   │
│   │   ├── applications/          # ApplicationModule
│   │   │   ├── application.module.ts
│   │   │   ├── application.service.ts
│   │   │   ├── application.controller.ts
│   │   │   └── ...
│   │   │
│   │   ├── payments/              # PaymentModule
│   │   │   ├── payment.module.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── payment.controller.ts
│   │   │   └── integrations/      # Toss, Iamport
│   │   │
│   │   ├── users/                 # UserModule
│   │   ├── resumes/               # ResumeModule (Phase 1)
│   │   └── admin/                 # AdminModule (Phase 1)
│   │
│   ├── common/
│   │   ├── guards/                # Shared guards
│   │   ├── interceptors/          # Logging, Transform
│   │   ├── filters/               # Exception filters
│   │   ├── decorators/            # @Roles(), @CurrentUser()
│   │   └── utils/
│   │
│   ├── config/                    # Configuration
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── app.config.ts
│   │
│   └── prisma/                    # Prisma client
│       ├── schema.prisma
│       └── migrations/
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── infrastructure/
│   ├── docker/
│   │   └── docker-compose.yml
│   └── terraform/
│       ├── vpc.tf
│       ├── eks.tf
│       ├── rds.tf
│       └── elasticache.tf
│
└── .github/
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

### 2.2 Module Boundaries

**Strict Rules**:
1. ✅ Modules communicate via **interfaces** (dependency injection)
2. ✅ No direct database access across modules
3. ✅ Each module = independent **domain**
4. ✅ Shared code in `common/`

**Example**:
```typescript
// JobModule depends on AuthModule
@Module({
  imports: [AuthModule], // Import, not direct access
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}

// JobController uses AuthGuard
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobController {
  @Post()
  @Roles('recruiter', 'admin')
  createJob(@CurrentUser() user: User, @Body() dto: CreateJobDto) {
    return this.jobService.create(user, dto);
  }
}
```

**Future Extraction**:
When ready to split into microservices:
1. Extract `AuthModule` → `auth-service` (standalone NestJS app)
2. Replace with HTTP/gRPC client
3. Minimal code changes (clean boundaries)

---

## 3. Technology Stack

### 3.1 Primary Stack (TypeScript-First)

**Codex 권장**:
> "Use NestJS (or the chosen monolith framework) for consistency and faster delivery."

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Framework** | NestJS 10+ | TypeScript-native, DI, modular, production-grade |
| **Language** | TypeScript 5+ | Type safety, better DX, ecosystem |
| **ORM** | Prisma 5+ | Type-safe, auto-generated client, migrations |
| **Validation** | class-validator + class-transformer | Declarative DTO validation |
| **Auth** | Passport.js + JWT | Industry standard, NestJS integration |
| **Testing** | Jest + Supertest | Built-in NestJS support |
| **API Docs** | @nestjs/swagger | Auto-generate OpenAPI from decorators |

### 3.2 Infrastructure

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Database** | AWS RDS PostgreSQL 15 | Managed, HA, automated backups |
| **Cache** | AWS ElastiCache Redis 7 | Managed, low-latency |
| **Container** | Docker + Docker Compose | Local dev + production parity |
| **Orchestration** | AWS EKS (Kubernetes 1.28) | Managed K8s, scalable |
| **IaC** | Terraform | Infrastructure as Code, GitOps |
| **CI/CD** | GitHub Actions | Native GitHub integration |

### 3.3 Observability

**Codex 권장**:
> "For Phase 0, implement basic metrics (Prometheus + Grafana) and structured logging via a managed service."

| Component | Technology | Phase |
|-----------|-----------|-------|
| **Metrics** | Prometheus + Grafana | Phase 0 ✅ |
| **Logging** | AWS CloudWatch Logs | Phase 0 ✅ |
| **Instrumentation** | OpenTelemetry SDK | Phase 0 ✅ (future-proof) |
| **Tracing** | Jaeger | Phase 1 (deferred) |
| **Log Aggregation** | Loki or ELK | Phase 1 (deferred) |

**Why OpenTelemetry now?**
- Instrument code once
- Swap backends later (Jaeger, Zipkin, etc.)
- Industry standard, vendor-neutral

---

## 4. Spec Coding Compliance

Phase 0는 기존 Spec Coding 철학을 **100% 준수**합니다.

### 4.1 [규칙: API-First]

**OpenAPI-First Development**:
1. ✅ `openapi/api-spec.yaml` = source of truth
2. ✅ NestJS swagger decorators → auto-generate spec
3. ✅ CI validates: generated spec === manual spec
4. ✅ Request/response validation middleware

**Implementation**:
```typescript
// Auto-generate OpenAPI from NestJS decorators
@ApiTags('jobs')
@Controller('api/v1/jobs')
export class JobController {
  @Post()
  @ApiOperation({ summary: 'Create job posting' })
  @ApiResponse({ status: 201, type: JobResponseDto })
  @ApiBearerAuth()
  createJob(@Body() dto: CreateJobDto): Promise<JobResponseDto> {
    return this.jobService.create(dto);
  }
}
```

**CI Validation**:
```yaml
# .github/workflows/openapi-validation.yml
- name: Generate OpenAPI spec
  run: npm run generate:openapi

- name: Validate against source spec
  run: |
    spectral lint openapi/generated.yaml
    npm run openapi:diff
```

### 4.2 [규칙: Stateless]

**JWT-only, no sessions**:
- ✅ JWT stored in HTTP-only cookie or Authorization header
- ✅ No server-side session files
- ✅ Stateless authentication

**Implementation**:
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): User {
    return { id: payload.sub, email: payload.email, roleId: payload.roleId };
  }
}
```

### 4.3 [규칙: RBAC]

**Role-Based Access Control**:
- ✅ `db/schema.sql` roles/permissions 테이블 사용
- ✅ `@Roles()` decorator
- ✅ RolesGuard enforcement

**Implementation**:
```typescript
// RBAC Decorator
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// RolesGuard
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some(role => user.role === role);
  }
}

// Usage
@Post('jobs')
@Roles('recruiter', 'admin')
@UseGuards(JwtAuthGuard, RolesGuard)
createJob() { ... }
```

### 4.4 [규칙: DDL 준수]

**`db/schema.sql` 100% 준수**:
- ✅ Prisma schema는 `schema.sql`에서 생성
- ✅ No schema changes without updating `schema.sql` first
- ✅ CI에서 schema drift detection

**Process**:
1. Modify `db/schema.sql`
2. Generate Prisma schema: `prisma db pull`
3. Create migration: `prisma migrate dev`
4. CI validates: no drift

### 4.5 [규칙: ORM 사용]

**Prisma only, no raw SQL**:
- ✅ All database queries via Prisma client
- ✅ Type-safe queries
- ✅ ESLint rule: ban raw SQL imports

**Implementation**:
```typescript
// Good ✅
async findJobsByRecruiter(recruiterId: string): Promise<Job[]> {
  return this.prisma.job.findMany({
    where: { createdBy: recruiterId },
    include: { jobOptions: true },
  });
}

// Bad ❌ (will fail ESLint)
await this.prisma.$queryRaw`SELECT * FROM jobs WHERE created_by = ${recruiterId}`;
```

### 4.6 [규칙: OpenAPI 준수]

**`openapi/api-spec.yaml` 100% 준수**:
- ✅ All endpoints match spec
- ✅ Request/response schemas validated
- ✅ Status codes match spec

**Validation Middleware**:
```typescript
import { OpenApiValidator } from 'express-openapi-validator';

app.use(
  OpenApiValidator.middleware({
    apiSpec: './openapi/api-spec.yaml',
    validateRequests: true,
    validateResponses: true,
  })
);
```

---

## 5. Week-by-Week Execution Plan (12 Weeks)

### 📅 Weeks 1-4: Modular Monolith Foundation

#### Week 1: Project Setup & Infrastructure Foundation

**Tasks**:
- [ ] 1.1: NestJS project initialization
  - `nest new jobboard-api`
  - TypeScript configuration
  - ESLint + Prettier setup
- [ ] 1.2: Prisma setup
  - Initialize Prisma
  - Import `db/schema.sql` → Prisma schema
  - Configure PostgreSQL connection
- [ ] 1.3: Docker Compose for local development
  - PostgreSQL container
  - Redis container
  - Application container (hot reload)
- [ ] 1.4: Environment configuration
  - `.env.example` template
  - ConfigModule setup (NestJS)
  - Secrets management strategy
- [ ] 1.5: Git hooks & pre-commit checks
  - Husky + lint-staged
  - Commit message format (conventional commits)
- [ ] 1.6: Project documentation
  - README.md (setup instructions)
  - CONTRIBUTING.md
  - Architecture Decision Record (ADR) #001: "Modular Monolith Choice"

**Deliverables**:
- ✅ NestJS app runs locally
- ✅ `docker-compose up` starts PostgreSQL + Redis
- ✅ Prisma schema generated from DDL
- ✅ ADR #001 documented

**Codex Review**: No (foundational setup)

---

#### Week 2: Auth Module (Part 1 - Core)

**Tasks**:
- [ ] 2.1: AuthModule scaffolding
  - Module, Controller, Service structure
  - DTOs: LoginDto, RegisterDto
- [ ] 2.2: User entity (Prisma)
  - Map to `users` table in schema.sql
  - Password hashing (bcrypt)
- [ ] 2.3: JWT strategy implementation
  - Passport.js integration
  - JwtAuthGuard
- [ ] 2.4: POST /api/v1/auth/login endpoint
  - Email/password validation
  - JWT token generation
  - Error handling (401 Unauthorized)
- [ ] 2.5: POST /api/v1/auth/register endpoint
  - User creation
  - Password hashing
  - Email uniqueness validation
- [ ] 2.6: Unit tests (AuthService)
  - Login logic
  - Register logic
  - Password hashing

**Deliverables**:
- ✅ Login/Register endpoints functional
- ✅ JWT tokens generated
- ✅ Unit tests pass

**Codex Review**: Yes (Round 1/3) ⭐
- Focus: JWT implementation, password security, error handling

---

#### Week 3: Auth Module (Part 2 - RBAC)

**Tasks**:
- [ ] 3.1: Roles & Permissions entities
  - Map to `roles`, `permissions` tables
  - User-role relationship
- [ ] 3.2: RolesGuard implementation
  - `@Roles()` decorator
  - Role validation logic
- [ ] 3.3: RBAC integration tests
  - Test all role combinations (guest, jobseeker, recruiter, admin)
  - Verify access control
- [ ] 3.4: Device management (POL-A-002)
  - Track logged-in devices
  - Enforce max 5 devices
  - Redis for device session storage
- [ ] 3.5: Token refresh endpoint
  - POST /api/v1/auth/refresh
  - Refresh token rotation
- [ ] 3.6: Logout endpoint
  - POST /api/v1/auth/logout
  - Token blacklist (Redis)

**Deliverables**:
- ✅ RBAC fully functional
- ✅ Device limit enforced
- ✅ Refresh/logout working

**Codex Review**: Yes (Round 2/3) ⭐
- Focus: RBAC implementation, Redis integration, device tracking

---

#### Week 4: Job Module

**Tasks**:
- [ ] 4.1: JobModule scaffolding
  - Job, JobOption entities (Prisma)
- [ ] 4.2: GET /api/v1/jobs (list jobs)
  - Pagination (page, limit)
  - Filtering (location, category)
  - Sorting (latest, salary)
- [ ] 4.3: GET /api/v1/jobs/:jobId (get job details)
  - Include job options (premium, main banner)
- [ ] 4.4: POST /api/v1/jobs (create job)
  - RBAC: recruiter/admin only
  - Validation (title, description, salary range)
- [ ] 4.5: PUT /api/v1/jobs/:jobId (update job)
  - Owner validation
  - RBAC enforcement
- [ ] 4.6: DELETE /api/v1/jobs/:jobId (delete job)
  - Soft delete (status = 'closed')
- [ ] 4.7: Job search optimization
  - Database indexes
  - Query performance testing

**Deliverables**:
- ✅ Jobs CRUD complete
- ✅ RBAC enforced
- ✅ E2E tests pass

**Codex Review**: Yes (Round 1/3) ⭐
- Focus: API design, RBAC integration, performance

**Checkpoint 1** (End of Week 4):
- ✅ Auth + Jobs modules operational
- ✅ JWT + RBAC working
- ✅ Test coverage ≥ 70%
- **Go/No-Go**: Can we build Applications module on this foundation?

---

### 📅 Weeks 5-8: Application Module & CI/CD

#### Week 5: Application Module

**Tasks**:
- [ ] 5.1: ApplicationModule scaffolding
  - Application, ApplicationStage entities
- [ ] 5.2: POST /api/v1/jobs/:jobId/apply
  - RBAC: jobseeker only
  - Application creation
  - Resume upload (S3 or local storage)
- [ ] 5.3: GET /api/v1/applications (my applications)
  - Jobseeker view: own applications
  - Recruiter view: applications for their jobs
- [ ] 5.4: Application stage workflow
  - Stage transitions (applied → screening → interview → offer)
  - RBAC: only recruiter can update stages
- [ ] 5.5: Application notifications (basic)
  - Email notifications (future: use queue)
  - Status change alerts
- [ ] 5.6: Integration tests
  - Full application workflow
  - RBAC enforcement

**Deliverables**:
- ✅ Application system functional
- ✅ Stage workflow working
- ✅ E2E tests pass

**Codex Review**: Yes (Round 1/3) ⭐

---

#### Week 6: Payment Module (Basic)

**Tasks**:
- [ ] 6.1: PaymentModule scaffolding
  - Order, WalletLedger entities
- [ ] 6.2: POST /api/v1/payments/prepare
  - Create order
  - Toss Payments integration (client-side)
- [ ] 6.3: POST /api/v1/webhooks/payments/toss
  - Payment confirmation webhook
  - Order status update
  - Wallet ledger entry
- [ ] 6.4: Iamport integration (secondary)
  - POST /api/v1/webhooks/payments/iamport
- [ ] 6.5: Payment verification
  - Amount validation
  - Signature verification (webhook security)
- [ ] 6.6: Unit tests
  - Payment flow
  - Webhook handling

**Deliverables**:
- ✅ Payment preparation working
- ✅ Webhook handling secure
- ✅ Wallet ledger accurate

**Codex Review**: Yes (Round 1/3) ⭐
- Focus: Security (webhook signature), transaction integrity

---

#### Week 7: Docker & CI/CD

**Tasks**:
- [ ] 7.1: Production Dockerfile
  - Multi-stage build (build + runtime)
  - Alpine base image (< 100MB)
- [ ] 7.2: Docker Compose production setup
  - App + PostgreSQL + Redis
  - Health checks
  - Restart policies
- [ ] 7.3: GitHub Actions CI pipeline
  - Lint (ESLint)
  - Type check (tsc)
  - Unit tests
  - Integration tests
  - E2E tests
- [ ] 7.4: GitHub Actions build pipeline
  - Docker build
  - Push to GHCR (GitHub Container Registry)
  - Semantic versioning (git tags)
- [ ] 7.5: Test coverage enforcement
  - Fail if coverage < 80%
  - Coverage report in PR comments
- [ ] 7.6: OpenAPI spec validation (CI)
  - Generate spec from NestJS
  - Compare with `openapi/api-spec.yaml`
  - Spectral lint

**Deliverables**:
- ✅ Docker image < 100MB
- ✅ CI pipeline green
- ✅ Auto-versioning working

**Codex Review**: Yes (Round 1/3) ⭐
- Focus: CI/CD reliability, Docker optimization

---

#### Week 8: Testing & Documentation

**Tasks**:
- [ ] 8.1: E2E test suite expansion
  - Full user journeys (register → apply → hire)
  - RBAC scenarios (all role combinations)
- [ ] 8.2: Contract tests
  - Module interface tests
  - Ensure clean boundaries
- [ ] 8.3: Performance tests
  - Load testing (k6 or Artillery)
  - Target: < 200ms p95 latency
- [ ] 8.4: API documentation
  - Swagger UI (auto-generated)
  - Postman collection
- [ ] 8.5: Developer documentation
  - Local development guide
  - Module development guide
  - Testing guide
- [ ] 8.6: Security audit (basic)
  - OWASP Top 10 check
  - Dependency vulnerabilities (npm audit)

**Deliverables**:
- ✅ Test coverage ≥ 80%
- ✅ API docs published
- ✅ No critical vulnerabilities

**Checkpoint 2** (End of Week 8):
- ✅ Core modules complete (Auth, Jobs, Applications, Payments)
- ✅ CI/CD operational
- ✅ Test coverage ≥ 80%
- **Go/No-Go**: Ready for infrastructure deployment?

---

### 📅 Weeks 9-12: Infrastructure & Production Readiness

#### Week 9: Terraform & AWS Foundation

**Tasks**:
- [ ] 9.1: Terraform setup
  - AWS provider configuration
  - State backend (S3 + DynamoDB)
- [ ] 9.2: VPC & Networking
  - VPC with public/private subnets
  - NAT gateway
  - Security groups
- [ ] 9.3: AWS RDS PostgreSQL
  - Multi-AZ deployment
  - Automated backups (7-day retention)
  - Parameter group (optimized settings)
- [ ] 9.4: AWS ElastiCache Redis
  - Cluster mode
  - Automatic failover
- [ ] 9.5: Secrets management
  - AWS Secrets Manager
  - JWT secret, database credentials
- [ ] 9.6: Terraform apply (dev environment)

**Deliverables**:
- ✅ Terraform provisions infrastructure
- ✅ RDS + ElastiCache operational
- ✅ Secrets stored securely

**Codex Review**: Yes (Round 1/3) ⭐
- Focus: Infrastructure security, HA configuration

---

#### Week 10: Kubernetes Deployment

**Tasks**:
- [ ] 10.1: AWS EKS cluster (Terraform)
  - Managed node groups
  - Auto-scaling configuration
- [ ] 10.2: Kubernetes manifests
  - Deployment (jobboard-api)
  - Service (ClusterIP)
  - ConfigMap (env vars)
  - Secret (sensitive data)
- [ ] 10.3: Ingress setup
  - NGINX Ingress Controller
  - TLS certificate (AWS Certificate Manager)
  - Domain routing
- [ ] 10.4: Database migrations
  - Kubernetes Job for Prisma migrations
  - Run before deployment
- [ ] 10.5: Deploy to EKS (staging)
  - `kubectl apply -f manifests/`
  - Verify health checks
- [ ] 10.6: Smoke tests
  - Test all endpoints in staging

**Deliverables**:
- ✅ App running on EKS
- ✅ HTTPS enabled
- ✅ Staging environment operational

**Codex Review**: Yes (Round 2/3) ⭐

---

#### Week 11: Observability & Monitoring

**Tasks**:
- [ ] 11.1: OpenTelemetry instrumentation
  - NestJS interceptor
  - Metrics: HTTP requests, latency, errors
  - Traces: request flow (for future Jaeger)
- [ ] 11.2: Prometheus setup
  - Deploy Prometheus (Kubernetes)
  - Scrape metrics from /metrics endpoint
  - Alerting rules
- [ ] 11.3: Grafana setup
  - Deploy Grafana (Kubernetes)
  - Dashboards: system health, API latency, error rate
  - Connect to Prometheus
- [ ] 11.4: CloudWatch Logs integration
  - NestJS logger → CloudWatch
  - Structured logging (JSON format)
  - Log groups per environment
- [ ] 11.5: Alerts configuration
  - PagerDuty or Slack integration
  - Critical alerts: API down, high error rate
- [ ] 11.6: Runbook creation
  - Incident response procedures

**Deliverables**:
- ✅ Prometheus + Grafana operational
- ✅ CloudWatch logs flowing
- ✅ Alerts configured

**Codex Review**: No (observability setup is standard)

---

#### Week 12: Production Hardening & Launch Prep

**Tasks**:
- [ ] 12.1: Horizontal Pod Autoscaler (HPA)
  - Scale based on CPU (50-80% threshold)
  - Min 2 pods, max 10 pods
- [ ] 12.2: Resource limits & requests
  - Memory: request 256Mi, limit 512Mi
  - CPU: request 100m, limit 500m
- [ ] 12.3: Security hardening
  - Network policies (isolate namespaces)
  - Pod security policies
  - Non-root containers
- [ ] 12.4: Backup & disaster recovery
  - RDS automated backups enabled
  - Snapshot testing (restore procedure)
- [ ] 12.5: Performance optimization
  - Database query optimization
  - Redis caching strategy
  - Connection pooling tuning
- [ ] 12.6: Production deployment
  - Deploy to production EKS
  - Smoke tests
  - Performance tests (load test)
- [ ] 12.7: Phase 0 review & retrospective
  - Document lessons learned
  - Update ADRs
  - Phase 1 handoff preparation

**Deliverables**:
- ✅ Production environment live
- ✅ HPA scaling tested
- ✅ Security hardened
- ✅ Backup/restore validated

**Codex Review**: Yes (Final Round 3/3) ⭐
- Focus: Production readiness, performance, security

**Checkpoint 3** (End of Week 12):
- ✅ Production deployment successful
- ✅ All success criteria met
- ✅ Monitoring operational
- ✅ 100% Spec Coding compliance
- **Go/No-Go**: Ready for Phase 1 (Smart Matching Engine)?

---

## 6. Codex Collaboration Strategy

### 6.1 3-Round Review Process

**Critical Components** (3 rounds each):
1. **Auth Module** (Week 2-3)
2. **Job Module** (Week 4)
3. **Application Module** (Week 5)
4. **Payment Module** (Week 6)
5. **CI/CD Pipeline** (Week 7)
6. **Terraform Infrastructure** (Week 9)
7. **Kubernetes Deployment** (Week 10)
8. **Production Hardening** (Week 12)

**Process**:
```
Round 1: Initial Implementation
  ↓ Claude Code implements
  ↓ User sends Codex Review Prompt to Codex
  ↓ Codex provides feedback
  ↓
Round 2: Incorporate Feedback
  ↓ Claude Code revises based on feedback
  ↓ User sends updated code to Codex
  ↓ Codex reviews revisions
  ↓
Round 3: Final Approval
  ↓ Claude Code finalizes
  ↓ User requests final approval from Codex
  ↓ Codex approves → Proceed
```

### 6.2 Review Prompt Template

Every Codex review includes:

```markdown
## Context
[What this code does]

## Files to Review
- file1.ts
- file2.ts

## Key Decisions
1. Decision A
2. Decision B

## Spec Coding Compliance
- [규칙: API-First] ✅/❌
- [규칙: Stateless] ✅/❌
- [규칙: RBAC] ✅/❌
- [규칙: DDL 준수] ✅/❌
- [규칙: ORM 사용] ✅/❌

## Questions for Codex
1. Is X approach sound?
2. Any security concerns with Y?

## Round
[Round 1/2/3 of 3]
```

### 6.3 Weekly Progress Reports

Every Friday, Claude Code generates:

```markdown
# Week N Progress Report

## Completed Tasks
- Task A ✅
- Task B ✅

## In Progress
- Task C 🚧 (80% done)

## Blockers
- None / [List blockers]

## Next Week Plan
- Task D
- Task E

## Metrics
- Test coverage: X%
- CI build status: ✅/❌
- Codex reviews: N/M completed

## Risks
- [Any new risks identified]
```

---

## 7. Risk Management

### 7.1 Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| **Schedule overload** | Low | High | Extended to 12 weeks, buffer built in | Claude Code |
| **JWT secret leak** | Medium | Critical | AWS Secrets Manager, rotation policy | Claude Code |
| **Schema drift** | Medium | Medium | CI schema validation, Prisma diff | Claude Code |
| **Testing debt** | Low | High | 80% coverage enforced in CI | Claude Code |
| **Terraform errors** | Medium | High | Dry-run before apply, staging first | Claude Code |
| **Database migration failure** | Low | Critical | Backup before migration, rollback script | Claude Code |
| **Performance degradation** | Medium | Medium | Load testing in Week 8, HPA in Week 12 | Claude Code |
| **Security vulnerabilities** | Medium | Critical | npm audit in CI, OWASP Top 10 check | Claude Code |

### 7.2 Contingency Plans

**Plan A**: Timeline slips
- Use buffer weeks (built into 12-week plan)
- De-scope non-critical features (e.g., payment module → Phase 1)

**Plan B**: Infrastructure complexity too high
- Delay Kubernetes to Phase 1
- Use Docker Compose + AWS ECS for Phase 0

**Plan C**: Test coverage goal not met
- Focus on critical path (auth, RBAC, payments)
- Accept 70% coverage, improve in Phase 1

---

## 8. Success Metrics

### 8.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Test Coverage** | ≥ 80% | Jest coverage report |
| **API Latency** | < 200ms (p95) | Prometheus metrics |
| **Build Time** | < 5 minutes | GitHub Actions |
| **Docker Image Size** | < 100MB | Docker image ls |
| **Uptime** | > 99% | Prometheus uptime |
| **Deployment Time** | < 10 minutes | CI/CD metrics |

### 8.2 Qualitative Metrics

- ✅ Spec Coding 100% compliance (automated checks)
- ✅ Codex approves all critical components
- ✅ Clean module boundaries (contract tests pass)
- ✅ Documentation complete and up-to-date
- ✅ Zero critical security vulnerabilities
- ✅ Developer satisfaction (smooth local dev)

---

## 9. Architecture Decision Records (ADRs)

Phase 0에서 작성할 ADR:

1. **ADR-001**: Modular Monolith vs Microservices
   - Decision: Modular Monolith for Phase 0
   - Rationale: Codex feedback, single engineer, simpler ops
   - Consequences: Easy to split later, faster iteration now

2. **ADR-002**: NestJS vs Other Frameworks
   - Decision: NestJS
   - Rationale: TypeScript-native, DI, modular, production-grade
   - Consequences: Learning curve, but better long-term

3. **ADR-003**: REST-only vs GraphQL
   - Decision: REST-only for Phase 0
   - Rationale: OpenAPI spec complete, simpler maintenance
   - Consequences: Add GraphQL in Phase 2 if needed

4. **ADR-004**: Managed DB (RDS) vs Self-hosted
   - Decision: AWS RDS
   - Rationale: Codex recommendation, reduce ops burden
   - Consequences: Cost vs time trade-off (acceptable)

5. **ADR-005**: Essential Observability vs Full Stack
   - Decision: Prometheus + CloudWatch + OTel only
   - Rationale: Defer Jaeger/Loki to Phase 1
   - Consequences: Less visibility, but faster delivery

---

## 10. Phase 1 Handoff Preparation

### 10.1 Phase 1 Preview: Smart Matching Engine

**Timeline**: Months 4-6 (Phase 1)

**Prerequisites from Phase 0**:
- ✅ Solid monolith foundation
- ✅ Auth + Jobs + Applications functional
- ✅ CI/CD pipeline operational
- ✅ Production infrastructure ready

**Phase 1 Objectives**:
1. AI-powered job-candidate matching
2. Resume parsing (NLP)
3. Elasticsearch integration
4. Python ML worker (background jobs)
5. Recommendation engine

### 10.2 Handoff Checklist

Before Phase 1:
- [ ] All Phase 0 success criteria met
- [ ] Codex final approval (Round 3)
- [ ] Production deployment stable (1 week uptime)
- [ ] Documentation complete
- [ ] Phase 1 execution plan drafted
- [ ] Team retrospective completed

---

## 11. Appendix

### A. Reference Documents

- `specs/Master_How_Spec.md`: Spec Coding philosophy
- `specs/policy.md`: Business policies
- `openapi/api-spec.yaml`: API specification
- `db/schema.sql`: Database schema
- `docs/INNOVATION_ARCHITECTURE.md`: 18-month vision
- `docs/PHASE_0_FEEDBACK_ANALYSIS.md`: Codex Round 1 feedback

### B. Tool Versions

- Node.js: 20.x LTS
- TypeScript: 5.3+
- NestJS: 10.x
- Prisma: 5.x
- PostgreSQL: 15+
- Redis: 7+
- Docker: 24+
- Kubernetes: 1.28+
- Terraform: 1.6+

### C. Estimated Costs (AWS)

| Resource | Estimated Cost/Month |
|----------|----------------------|
| EKS Cluster | $75 |
| EC2 Nodes (2x t3.medium) | $70 |
| RDS PostgreSQL (db.t3.small) | $40 |
| ElastiCache Redis (cache.t3.micro) | $15 |
| Load Balancer | $20 |
| CloudWatch Logs | $10 |
| **Total** | **~$230/month** |

### D. Communication Protocol

**Claude Code → User**:
1. Before each task: Summary of work
2. After each task: Deliverable confirmation
3. Codex review needed: Provide prompt
4. Blocker encountered: Immediate notification
5. Weekly: Progress report (Fridays)

**User → Claude Code**:
1. Codex feedback: Forward full response
2. Direction change: Clear instructions
3. Priority shift: Update task order

---

## Document History

- **2025-10-27**: V2.0 created (Codex Round 1 feedback incorporated)
  - Changed: Microservices → Modular Monolith
  - Changed: 8 weeks → 12 weeks
  - Changed: Go + Python → TypeScript primary
  - Changed: GraphQL + REST → REST-only
  - Changed: Full K8s Week 6 → Staged (Weeks 9-12)
  - Changed: Heavy observability → Essential only
- **Author**: Claude Code
- **Review Status**: Ready for Codex Round 2 Review ⭐

---

**END OF PHASE 0 EXECUTION PLAN V2**
