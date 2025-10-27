# Phase 0 Feedback Analysis (Round 1 → Round 2)

## Executive Summary
Round 1 review highlighted eight critical blockers that made the original Phase 0 execution plan unrealistic for a single engineer. This document itemizes those issues, the resulting impact assessment, and the concrete design changes shipped in Phase 0 V2 to resolve them.

## Critical Issues Identified
1. **Microservice Overextension** – Four services created outsized operational overhead (pipelines, deployments, observability) with no buffer.
2. **Fragmented Language Stack** – Go, TypeScript, and Python split tooling and slowed onboarding.
3. **Dual API Surfaces** – Maintaining GraphQL and REST simultaneously risked spec drift and duplicated work.
4. **Compressed Timeline** – Eight weeks for 56 tasks left no contingency for discovery, testing, or revisions.
5. **DIY Infrastructure Burden** – Self-managed PostgreSQL/Kubernetes in early weeks diverted focus from feature delivery.
6. **Observability Overkill** – Prometheus/Grafana/Jaeger/Loki in one sprint overloaded setup and maintenance cost.
7. **Spec Coding Compliance Risk** – Lack of automated checks jeopardized API-first, ORM-only, and DDL rules.
8. **Security & Secrets Debt** – No clear plan for JWT secret rotation or centralized policy enforcement.

## Resolutions in Phase 0 V2
- **Consolidated Architecture** – Adopted a NestJS modular monolith (`jobboard-api`) with distinct modules for Auth, Jobs, Applications, Payments, and Users.
- **Unified Language & ORM** – Standardized on TypeScript + NestJS + Prisma, eliminating Go/Python from Phase 0 delivery scope.
- **REST-Only Surface** – Deferred GraphQL to Phase 1, reinforcing a single OpenAPI-governed REST contract.
- **Extended Timeline** – Re-baselined Phase 0 to 12 weeks with explicit 4-week stages and checkpoint demos.
- **Managed Core Services** – Selected AWS RDS (PostgreSQL) and ElastiCache (Redis) via Terraform, avoiding StatefulSets in early milestones.
- **Essential Observability** – Focused on Prometheus + Grafana + CloudWatch with OpenTelemetry instrumentation, deferring Jaeger/Loki.
- **Automated Compliance** – Added CI gates for OpenAPI drift, Prisma schema alignment with `db/schema.sql`, ESLint bans on raw SQL, and coverage targets.
- **Secrets Management Plan** – Committed to AWS Secrets Manager, 90-day rotation policy, and infrastructure-as-code integration.

## V1 vs V2 Snapshot
| Dimension | V1 Plan | V2 Response |
|-----------|---------|-------------|
| Architecture | Four microservices | NestJS modular monolith |
| Timeline | 8 weeks, 56 tasks | 12 weeks, 3 checkpoints |
| Languages | TypeScript, Go, Python | TypeScript only |
| APIs | GraphQL + REST | REST (OpenAPI-first) |
| Infrastructure | Self-managed DB/K8s early | Managed RDS/ElastiCache, staged K8s |
| Observability | Prometheus + Grafana + Jaeger + Loki | Prometheus + Grafana + CloudWatch + OTel |
| Compliance | Manual review | Automated CI gates |
| Security | Ad hoc secrets | AWS Secrets Manager + rotation |

## Outstanding Watchpoints
- **Future Service Extraction** – Document ADRs to preserve module boundaries for Phase 1 microservice splits.
- **Learning Curve** – Allocate onboarding time for NestJS best practices and Prisma migration workflows.
- **Terraform Ramp-Up** – Reserve Week 9 spike to validate AWS accounts, permissions, and networking baselines before applying infrastructure.

## Next Steps
1. Socialize V2 plan with stakeholders for approval before Week 1 kickoff.
2. Prepare ADR drafts (001–005) summarizing architecture, tech stack, API, infrastructure, and observability decisions.
3. Lock CI pipelines for OpenAPI, Prisma, linting, and testing during Week 1 setup tasks.
