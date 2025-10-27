# Phase 0 Execution Plan – Architecture Review (Round 1 of 3)

## Review Scope

The requested document `docs/PHASE_0_EXECUTION_PLAN.md` is not present in the repository. This review therefore synthesizes the details provided in the handoff brief (microservice decomposition, technology stack, week-by-week milestones, infrastructure roadmap, observability stack, and risk register) and evaluates them against the Phase 0 goals and constraints.

## 1. Architecture Soundness

### Microservices vs. Modular Monolith
- **Observation**: The plan begins Phase 0 with four independently deployable services (API Gateway, Auth, Job, Match) plus shared datastores.
- **Concern**: With a single engineer and no pre-existing platform, the surface area of four services multiplies operational overhead (service scaffolding, CI pipelines, containerization, deployment manifests, observability wiring) before feature scope is validated.
- **Recommendation**: Start with a modular monolith (NestJS or FastAPI) that enforces strict module boundaries and interfaces. Extract services only once product requirements and load justify the split (Phase 1+). This preserves API-first and Spec Coding constraints while deferring cross-service complexities such as distributed tracing, message contracts, and deployment orchestration.

### Language Choices
- **Auth in Go**: Go is well-suited for stateless auth, but the plan also flags a Go experience gap. Introducing a new language in Phase 0 adds ramp-up time, fragmented tooling, and duplicated ORM/validation logic.
  - **Recommendation**: Keep Auth inside the primary application stack (NestJS with Passport/Prisma) during Phase 0. Revisit a Go rewrite once the RBAC model stabilizes and additional engineers join.
- **Match Service in Python**: Python is appropriate for ML/AI experimentation. However, prioritize a thin integration layer that can run as an internal module or background worker until real matching models exist. Ensure message contracts (e.g., via AsyncAPI or at least OpenAPI-compatible endpoints) are defined early if a standalone service is unavoidable.

### API Gateway Strategy
- **Dual GraphQL + REST**: Maintaining two parallel API surfaces doubles schema maintenance, versioning, and test matrices for minimal Phase 0 payoff.
  - **Recommendation**: Pick one API style for Phase 0. If frontend flexibility is paramount, go GraphQL-only with schema-driven generation (GraphQL SDL + codegen) while supplying OpenAPI via tooling like `graphql-to-openapi` later. Alternatively, deliver REST-only now (OpenAPI-first) and add GraphQL in Phase 1 when bandwidth allows. The key is to avoid splitting the limited engineering capacity across redundant interfaces.

## 2. Timeline Realism

- **Scope**: 56 tasks in eight weeks equates to ~7 substantive deliverables per week for a single engineer, each touching multiple services.
- **Assessment**: Aggressive. Weeks 5-8 (Dockerization, Kubernetes, CI/CD, observability) each contain enough work for multi-person teams. Expect significant spillover even without feature creep.
- **Recommendation**: Extend Phase 0 to 12 weeks or explicitly de-scope. Suggested phasing:
  1. **Weeks 1-4**: Modular monolith foundation (auth, jobs, RBAC, testing harness, API specs).
  2. **Weeks 5-8**: Containerization, continuous integration, automated testing, initial monitoring (basic metrics/logging).
  3. **Weeks 9-12**: Kubernetes pilot (single service), infrastructure-as-code, advanced observability, performance hardening.
- **Parallelization**: With one engineer, true parallelization is limited. Batch similar tasks (e.g., write OpenAPI once, generate clients for all modules) and invest in automation to reduce repeated toil.

## 3. Spec Coding Compliance

- **OpenAPI Governance**: Enforce compliance via CI by generating specs from source (e.g., `nestjs/swagger`, `fastapi-codegen`) and validating with `spectral` or `openapi-cli`. Include JSON schema tests to ensure spec fidelity.
- **RBAC Enforcement**: Centralize RBAC policies in code (e.g., CASL, Oso, or custom decorators) and back them with integration tests. Document mapping between roles and endpoints early to prevent drift.
- **ORM-Only Constraint**: Introduce automated linting that fails if raw SQL files change (except migrations) and ensure Prisma/GORM/SQLAlchemy migrations are reviewed.
- **DDL Compliance**: Embed schema drift checks in CI (e.g., Prisma migrate diff, Atlas, or Sqitch). Schedule weekly schema diff reviews during Phase 0.

## 4. Infrastructure Strategy

- **Docker → Kubernetes**: A one-week jump from Docker Compose to production-grade Kubernetes (with Ingress, HPA) is unrealistic without prior templates. Allow at least 3-4 weeks for cluster design, IaC, security hardening, and testing.
- **Infrastructure as Code**: Yes—use Terraform or Pulumi from the outset to avoid clickops debt. Start with networking, databases, and Kubernetes add-ons defined as code.
- **Database Deployment**: Prefer managed PostgreSQL (e.g., RDS) immediately. Running a StatefulSet in Phase 0 introduces backup/restore, HA, storage provisioning, and upgrade burdens that distract from product delivery.

## 5. Observability Plan

- **Stack Size**: Prometheus, Grafana, Jaeger, and Loki is enterprise-grade but heavy. For Phase 0, implement basic metrics (Prometheus + Grafana) and structured logging via a managed service (e.g., CloudWatch, LogDNA) or lightweight stack (Vector + S3). Add Jaeger and Loki once multi-service traffic and SLOs justify distributed tracing.
- **OpenTelemetry**: Instrument code with OTel SDKs from day one, even if the backend is minimal. This future-proofs telemetry pipelines and avoids retrofitting later.

## 6. Risk Management

- **Largest Risk**: Schedule overload stemming from microservice sprawl combined with ambitious infra goals. This endangers all Phase 0 success criteria.
- **Additional Risks**:
  - **Spec Drift**: Maintaining OpenAPI & GraphQL concurrently increases drift risk.
  - **Security**: JWT secret rotation, audit logging, and compliance requirements need explicit tasks.
  - **Testing Debt**: Achieving 80% coverage across four services is formidable; coverage goals may cannibalize feature time without automation.
- **Mitigations**: Simplify architecture, automate compliance checks, allocate buffer weeks, and stage deliverables (auth prototype, RBAC validation, infrastructure dry runs).

## 7. Collaboration Workflow

- **Three-Round Reviews**: For critical components (gateway, auth, Kubernetes, CI/CD), three review cycles are reasonable. However, apply the same rigor to database migrations and security configurations.
- **Checkpoints**: Add daily or mid-week syncs for visibility, and maintain a living risk burndown chart. Incorporate demos at the end of Weeks 4, 8, and 12 (if timeline extended).
- **Documentation**: Capture architectural decisions in ADRs to support future service extraction.

## 8. Direct Answers to Specific Questions

1. **Monolith vs. Microservices**: Start with a modular monolith. Reassess microservice extraction post-Phase 0 once domain boundaries solidify.
2. **Auth Service Language**: Use NestJS (or the chosen monolith framework) for consistency and faster delivery. Re-platform to Go later if required.
3. **API Strategy**: Adopt a single API surface during Phase 0 (REST/OpenAPI or GraphQL). Expand when team size grows.
4. **Database Deployment**: Choose a managed PostgreSQL service (RDS/GCP SQL) immediately; avoid self-managed StatefulSets.
5. **Timeline**: Extend to at least 10-12 weeks or reduce scope dramatically.
6. **Observability**: Begin with essential metrics/logging plus OpenTelemetry instrumentation. Defer full tracing/log aggregation stack to Phase 1.
7. **Testing Goal**: 80% coverage is ambitious across four codebases. Focus on critical-path integration tests and contract tests first, then grow coverage once architecture stabilizes.
8. **Biggest Risk**: Overextension from microservices + heavy infra with a single engineer. Address by simplifying architecture and elongating schedule.

## 9. Recommended Next Steps

1. **Consolidate architecture** into a single deployable application with clear module boundaries.
2. **Re-baseline the schedule** with realistic buffer time and milestone reviews.
3. **Automate Spec Coding compliance** (OpenAPI validation, ORM checks, drift detection) within CI.
4. **Adopt managed infrastructure** (PostgreSQL, Terraform) to reduce ops load.
5. **Instrument with OpenTelemetry** and stage observability rollout.
6. **Document decisions and risks** in ADRs and maintain weekly retrospectives to adjust scope.

With these adjustments, Phase 0 can remain ambitious yet achievable, preserving the “slow but solid, innovative” philosophy while acknowledging resource limits.
