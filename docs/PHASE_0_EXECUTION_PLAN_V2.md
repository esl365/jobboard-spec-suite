# Phase 0 Execution Plan V2 (12-Week Modular Monolith Strategy)

## Guiding Principles
- **Slow, Solid, Innovative**: Prioritize durable foundations over speed.
- **Spec Coding Compliance**: API-first (OpenAPI), stateless JWT auth, RBAC enforcement, ORM-only, DDL adherence.
- **Monolith First**: Deliver a NestJS modular monolith that can evolve into microservices after Phase 0.
- **Automation & Quality**: CI-enforced validation, 80%+ coverage target, infrastructure as code.

## Architecture Overview
- **Application**: `jobboard-api` (NestJS) with modules: Auth, Jobs, Applications, Payments, Users.
- **Database**: PostgreSQL via AWS RDS (managed, Multi-AZ) + Prisma ORM.
- **Cache**: AWS ElastiCache (Redis) for sessionless caching and rate limiting.
- **API**: REST-only, OpenAPI-first, generated from NestJS Swagger decorators.
- **Infrastructure**: Docker for local dev, GitHub Actions CI/CD, Terraform-managed AWS (VPC, RDS, ElastiCache, EKS).
- **Observability**: OpenTelemetry SDK, Prometheus, Grafana, CloudWatch logs/alarms.

## 12-Week Timeline & Milestones

### Weeks 1–4: Foundation & Core Modules
| Week | Goals | Key Deliverables | Checkpoint |
|------|-------|------------------|------------|
| 1 | Project scaffolding | NestJS baseline; Prisma schema synced with `db/schema.sql`; ESLint/Prettier config; base CI pipeline skeleton | ✅ Repo ready; CI lint pass |
| 2 | AuthModule v1 | JWT login/register; password hashing; user entity and migrations; OpenAPI endpoints documented | |
| 3 | AuthModule v2 | RBAC via `@Roles()` + `RolesGuard`; device/session limits enforced with Redis; unit/integration tests | |
| 4 | JobModule | CRUD endpoints; search filters; Prisma queries; seed data scripts; API contract tests | **Checkpoint 1**: Auth + Jobs operational; ≥70% coverage |

### Weeks 5–8: Business Modules & Automation
| Week | Goals | Key Deliverables | Checkpoint |
|------|-------|------------------|------------|
| 5 | ApplicationModule | Apply workflow; status transitions; audit logging; integration tests |
| 6 | PaymentModule | Toss/Iamport webhook handlers; signature validation; retry/backoff logic; sandbox verification |
| 7 | CI/CD Hardening | GitHub Actions pipeline (lint, test, coverage gate, OpenAPI diff, Prisma drift); Docker build/push |
| 8 | Quality & Docs | E2E tests (Playwright); developer handbook; ADR drafts 001–005 | **Checkpoint 2**: All modules shipped; CI/CD live; ≥80% coverage |

### Weeks 9–12: Infrastructure, Observability, Production Readiness
| Week | Goals | Key Deliverables | Checkpoint |
|------|-------|------------------|------------|
| 9 | Terraform Foundations | Modules for networking, RDS, ElastiCache, Secrets Manager; remote state setup |
| 10 | Kubernetes Rollout | EKS cluster provisioning; Helm charts for app; ingress controller; HPA baseline |
| 11 | Observability & Security | OpenTelemetry exporters; Prometheus/Grafana dashboards; CloudWatch alerts; OWASP ASVS audit |
| 12 | Production Hardening | Load test and tuning; backup/restore drills; disaster recovery plan; go-live checklist | **Checkpoint 3**: Production deployment live; monitoring operational; Spec Coding compliance verified |

## Compliance Automation
- **OpenAPI Enforcement**: Generate spec via `@nestjs/swagger`, diff against `openapi/api-spec.yaml` in CI (`openapi-cli`).
- **Prisma & DDL Alignment**: `prisma migrate diff` compared to `db/schema.sql`; pipeline fails on drift.
- **ORM-Only Guardrails**: ESLint rule banning raw SQL imports; pre-commit hook scanning for `queryRaw` usage.
- **Test Coverage Gate**: `nyc`/`jest` coverage thresholds set to 0.8 lines/branches.
- **RBAC Tests**: Integration suites ensure each role’s access matrix matches `roles.csv` source of truth.

## Infrastructure Strategy
1. **Local (Weeks 1–4)**: Docker Compose for API, Postgres, Redis; `.env` managed via Doppler or direnv.
2. **CI/CD (Week 7)**: GitHub Actions building Docker image, publishing to ECR, running Prisma migrations against staging.
3. **Terraform (Week 9)**: Separate workspaces for staging/production, remote state in S3 with DynamoDB locking.
4. **Kubernetes (Week 10)**: EKS with managed node groups, Helm release for `jobboard-api`, secrets sourced from AWS Secrets Manager.
5. **Observability (Week 11)**: Prometheus Operator, Grafana dashboards per module, CloudWatch log shipping via Fluent Bit, OpenTelemetry collector deployment.
6. **Production Go-Live (Week 12)**: Blue/green deployment strategy, automated rollback, documented runbooks.

## Risk Register & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| NestJS learning curve | Medium | Medium | Schedule onboarding time Week 1, leverage official docs/examples |
| Terraform AWS access delays | High | Medium | Secure IAM roles/credentials before Week 9, dry-run plan in sandbox |
| Payment integration complexities | Medium | Medium | Engage Toss/Iamport sandbox early (Week 5), mock services for tests |
| Coverage target pressure | Medium | Medium | Focus on integration/E2E tests for core flows, track coverage weekly |
| Secrets rotation misconfig | High | Low | Use AWS Secrets Manager rotation templates, include runbook |

## Success Criteria
- Modular monolith operational with Auth, Jobs, Applications, Payments, Users modules.
- `docker-compose up` boots full stack locally.
- OpenAPI contract validated and published automatically.
- RBAC enforced with ≥80% automated test coverage.
- CI/CD pipeline deploys to staging and production EKS clusters.
- Terraform state managed, with documented apply/destroy procedures.
- Prometheus/Grafana dashboards and CloudWatch alerts active.
- OpenTelemetry traces/metrics exported to observability stack.
- Round 2 Codex review approval achieved.

## Pending Questions for Codex (Round 2)
1. Does the modular monolith meet the "solid foundation" requirement for Phase 0?
2. Are 12 weeks and the three checkpoints realistic for a single engineer?
3. Is the TypeScript + NestJS + Prisma stack sufficient for Spec Coding enforcement?
4. Does the staged infrastructure rollout (Docker → Terraform → EKS) balance risk appropriately?
5. Is the essential observability stack (Prometheus, Grafana, CloudWatch, OTel) adequate for Phase 0 while allowing future growth?
6. Are the security measures (Secrets Manager rotation, RBAC tests, OWASP review) aligned with expectations?
7. What is the most significant residual risk the reviewer sees in V2?

## Next Steps
- Share this document and the feedback analysis with Codex for Round 2 review.
- Incorporate reviewer guidance into Phase 0 V3 if necessary before development begins.
- Upon approval, initiate Week 1 tasks with CI pipeline and architecture scaffolding.
