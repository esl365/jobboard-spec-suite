# Phase 0: Foundation & Infrastructure - Detailed Execution Plan

**Timeline**: Months 1-2 (8 weeks)
**Philosophy**: 오래 걸리더라도 단단하고, 혁신적인 시스템
**Approach**: Spec Coding 철학 100% 준수

---

## 1. Executive Summary

### Objectives
Phase 0는 18개월 혁신 로드맵의 **기초 인프라**를 구축하는 단계입니다. 이 단계에서는:

1. **Microservices Architecture** 기반 마련
2. **Infrastructure as Code** 구현
3. **CI/CD Pipeline** 자동화
4. **Foundational Services** 구현 (API Gateway, Auth Service)
5. **Monitoring & Observability** 구축

### Success Criteria
- ✅ Microservices monorepo 구조 완성
- ✅ 로컬 개발 환경 Docker Compose로 자동화
- ✅ API Gateway가 GraphQL + REST 동시 지원
- ✅ Auth Service가 JWT 기반 인증 제공
- ✅ CI/CD로 자동 테스트 + 배포
- ✅ 모든 서비스가 헬스체크 엔드포인트 제공
- ✅ Prometheus로 메트릭 수집 시작

---

## 2. Spec Coding 철학 준수

Phase 0에서도 기존 Spec Coding 철학을 **100% 준수**합니다:

### [규칙: API-First]
- OpenAPI 3.0 명세 우선 작성 → 코드 생성
- API Gateway에서 `openapi/api-spec.yaml` 기반 검증

### [규칙: Stateless]
- JWT 토큰만 사용 (세션 파일 금지)
- Auth Service는 stateless하게 설계

### [규칙: RBAC]
- `db/schema.sql`의 roles, permissions 테이블 100% 준수
- API Gateway에서 RBAC 미들웨어 구현

### [규칙: DDL 준수]
- `db/schema.sql` 변경 없이 그대로 사용
- Prisma schema는 DDL에서 생성

### [규칙: ORM 사용]
- 원시 SQL 금지
- Prisma (TypeScript 서비스), GORM (Go 서비스), SQLAlchemy (Python 서비스)

### [규칙: OpenAPI 준수]
- `openapi/api-spec.yaml` 100% 준수
- API Gateway가 validation 수행

---

## 3. Phase 0 Architecture

### 3.1 Microservices Structure

```
jobboard-spec-suite/
├── services/
│   ├── api-gateway/          # Node.js + Apollo GraphQL + Express
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── auth-service/         # Go + Gin + GORM
│   │   ├── cmd/
│   │   ├── internal/
│   │   ├── Dockerfile
│   │   └── go.mod
│   ├── job-service/          # NestJS (준비만, Phase 2에서 구현)
│   ├── match-service/        # Python + FastAPI (준비만, Phase 1에서 구현)
│   └── shared/               # 공통 라이브러리
├── infrastructure/
│   ├── docker/
│   │   └── docker-compose.yml
│   ├── kubernetes/
│   │   ├── api-gateway.yaml
│   │   ├── auth-service.yaml
│   │   └── ingress.yaml
│   └── terraform/            # (Optional for Phase 0)
├── db/
│   ├── schema.sql            # 기존 유지
│   ├── migrations/           # Prisma migrations
│   └── seeds/                # 초기 데이터
├── openapi/
│   ├── api-spec.yaml         # 기존 유지
│   └── generated/            # 코드 생성 결과
├── monitoring/
│   ├── prometheus/
│   └── grafana/
└── .github/
    └── workflows/
        ├── api-gateway.yml
        └── auth-service.yml
```

### 3.2 Service Communication

```
                   ┌─────────────────┐
                   │   API Gateway   │
                   │  (GraphQL+REST) │
                   └────────┬────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
    │ Auth Service │ │ Job Service│ │Match Service│
    │     (Go)     │ │  (NestJS)  │ │  (Python)   │
    └──────┬───────┘ └─────┬──────┘ └─────┬───────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                  ┌────────▼─────────┐
                  │   PostgreSQL     │
                  │   Redis Cache    │
                  └──────────────────┘
```

### 3.3 Technology Stack Decisions

| Service | Language | Framework | Database | Rationale |
|---------|----------|-----------|----------|-----------|
| API Gateway | TypeScript | Apollo + Express | N/A | GraphQL 통합, REST 호환성 |
| Auth Service | Go | Gin | PostgreSQL + Redis | 고성능, 낮은 레이턴시 |
| Job Service | TypeScript | NestJS | PostgreSQL | Type safety, DI pattern |
| Match Service | Python | FastAPI | PostgreSQL + Elasticsearch | ML 라이브러리 생태계 |

---

## 4. Week-by-Week Execution Plan

### Week 1-2: Monorepo Setup & API Gateway

**Week 1: Monorepo Structure**
- [ ] Task 1.1: Monorepo 구조 설계 및 디렉토리 생성
- [ ] Task 1.2: Root `package.json` 설정 (workspaces)
- [ ] Task 1.3: Linting/Formatting 공통 설정 (ESLint, Prettier)
- [ ] Task 1.4: TypeScript 공통 설정
- [ ] Task 1.5: Git hooks 설정 (Husky + lint-staged)

**Deliverable**:
- `docs/MONOREPO_STRUCTURE.md` (Codex 리뷰 필요 ⭐)
- Root package.json with workspaces
- 공통 설정 파일들

**Codex Review Prompt**:
```
I've designed a monorepo structure for our microservices-based job board platform.
Please review the following aspects:

1. Directory structure (services/, infrastructure/, shared/)
2. Workspace configuration (npm/yarn/pnpm workspaces)
3. Common tooling setup (ESLint, Prettier, TypeScript)
4. Git workflow considerations

Files to review:
- docs/MONOREPO_STRUCTURE.md
- package.json (root)
- .eslintrc.js
- tsconfig.base.json

Focus areas:
- Scalability: Can we easily add 10+ microservices?
- Developer Experience: Is local development smooth?
- CI/CD compatibility: Easy to build/test/deploy?
- Spec Coding compliance: Does it support API-First, ORM, etc.?

Please provide feedback on architecture decisions and potential issues.
```

---

**Week 2: API Gateway Foundation**
- [ ] Task 2.1: API Gateway 프로젝트 초기화 (services/api-gateway/)
- [ ] Task 2.2: Apollo Server + Express 통합
- [ ] Task 2.3: OpenAPI spec 로딩 및 validation 미들웨어
- [ ] Task 2.4: GraphQL schema 설계 (Auth, Job 타입)
- [ ] Task 2.5: REST → GraphQL 통합 레이어
- [ ] Task 2.6: Health check 엔드포인트
- [ ] Task 2.7: CORS, Rate Limiting, Security headers

**Deliverable**:
- API Gateway 기본 구현
- GraphQL Playground 동작
- `/api/v1/health` 엔드포인트

**Codex Review Prompt**:
```
I've implemented the API Gateway that serves both GraphQL and REST APIs.

Architecture:
- Apollo Server 4 for GraphQL
- Express for REST endpoints
- OpenAPI validation middleware
- RBAC middleware (placeholder)

Files to review:
- services/api-gateway/src/index.ts
- services/api-gateway/src/graphql/schema.ts
- services/api-gateway/src/middleware/openapi-validator.ts
- services/api-gateway/src/middleware/rbac.ts

Key decisions:
1. GraphQL + REST coexistence strategy
2. OpenAPI validation approach (uses openapi/api-spec.yaml)
3. RBAC enforcement at gateway level
4. Error handling and logging

Please review:
- Architecture soundness
- Security considerations (XSS, CSRF, Rate Limiting)
- Performance implications
- Compliance with Spec Coding rules (API-First, Stateless)
```

---

### Week 3-4: Auth Service (Go)

**Week 3: Auth Service Core**
- [ ] Task 3.1: Go 프로젝트 구조 설정 (cmd/, internal/, pkg/)
- [ ] Task 3.2: Gin framework 설정
- [ ] Task 3.3: GORM + PostgreSQL 연결
- [ ] Task 3.4: JWT 토큰 생성/검증 로직
- [ ] Task 3.5: `/auth/login` 엔드포인트 구현
- [ ] Task 3.6: `/auth/register` 엔드포인트 구현
- [ ] Task 3.7: Password hashing (bcrypt)

**Deliverable**:
- Auth Service 기본 구현
- Login/Register 동작

**Codex Review Prompt** (Round 1):
```
I've implemented the Auth Service in Go with JWT-based authentication.

Architecture:
- Gin framework for HTTP routing
- GORM for database ORM
- JWT for stateless authentication
- bcrypt for password hashing

Files to review:
- services/auth-service/cmd/main.go
- services/auth-service/internal/handlers/auth.go
- services/auth-service/internal/models/user.go
- services/auth-service/internal/utils/jwt.go

Implementation highlights:
1. JWT payload includes: user_id, email, role_id
2. Token expiry: 24 hours (configurable)
3. Password complexity: min 8 chars (matches policy.md)
4. Database schema compliance: 100% matches db/schema.sql

Please review:
- Security best practices (JWT secret management, password hashing rounds)
- Error handling (avoid leaking user existence)
- Performance (database queries, bcrypt rounds)
- Compliance with [POL-A-001] JWT 방식만 사용
- Compliance with [규칙: Stateless]
```

---

**Week 4: Auth Service Advanced**
- [ ] Task 4.1: RBAC 로직 구현 (역할/권한 검증)
- [ ] Task 4.2: Redis 캐싱 (블랙리스트, rate limiting)
- [ ] Task 4.3: Device 관리 (최대 5대 동시 로그인)
- [ ] Task 4.4: Token refresh 엔드포인트
- [ ] Task 4.5: Logout (토큰 블랙리스트)
- [ ] Task 4.6: Unit tests (80%+ coverage)
- [ ] Task 4.7: Integration tests

**Deliverable**:
- Auth Service 완전 구현
- Test coverage 80%+

**Codex Review Prompt** (Round 2 - After Feedback):
```
I've incorporated your feedback from Round 1 and added advanced features.

Changes from Round 1:
- [List specific changes based on Codex feedback]

New features:
1. RBAC implementation (checks roles/permissions from DB)
2. Redis-based token blacklist for logout
3. Device limit enforcement (POL-A-002: max 5 devices)
4. Token refresh mechanism
5. Comprehensive test suite (unit + integration)

Files to review:
- services/auth-service/internal/middleware/rbac.go
- services/auth-service/internal/cache/redis.go
- services/auth-service/internal/handlers/device.go
- services/auth-service/tests/

New concerns:
- Redis failover handling (what if Redis is down?)
- Device tracking accuracy (fingerprinting method)
- Test coverage blind spots

Please review:
- Feedback incorporation completeness
- New feature implementations
- Edge cases in RBAC/device management
- Test quality and coverage
```

---

### Week 5-6: Infrastructure & Docker

**Week 5: Docker Containerization**
- [ ] Task 5.1: API Gateway Dockerfile (multi-stage build)
- [ ] Task 5.2: Auth Service Dockerfile (multi-stage build)
- [ ] Task 5.3: PostgreSQL + Redis docker-compose 설정
- [ ] Task 5.4: docker-compose.yml 전체 통합
- [ ] Task 5.5: 환경변수 관리 (.env.example)
- [ ] Task 5.6: Health check scripts
- [ ] Task 5.7: 로컬 개발 문서 작성

**Deliverable**:
- `docker-compose up` 한 번에 전체 시스템 실행
- 로컬 개발 가이드

**Codex Review Prompt**:
```
I've containerized all services with Docker and created a docker-compose setup.

Architecture:
- Multi-stage Dockerfile for each service (reduce image size)
- docker-compose with services: api-gateway, auth-service, postgres, redis
- Health check probes for all services
- Volume mounts for local development

Files to review:
- services/api-gateway/Dockerfile
- services/auth-service/Dockerfile
- infrastructure/docker/docker-compose.yml
- docs/LOCAL_DEVELOPMENT.md

Key decisions:
1. Image size optimization (Alpine base images)
2. Build caching strategy (layer ordering)
3. Environment variable injection
4. Network isolation (internal network for DB)

Please review:
- Dockerfile best practices
- docker-compose service dependencies
- Security (secrets management, user permissions)
- Developer experience (hot reload, debugging)
```

---

**Week 6: Kubernetes Preparation**
- [ ] Task 6.1: Kubernetes manifests (Deployment, Service)
- [ ] Task 6.2: ConfigMap 및 Secret 설정
- [ ] Task 6.3: Ingress 설정 (NGINX Ingress Controller)
- [ ] Task 6.4: HPA (Horizontal Pod Autoscaler) 설정
- [ ] Task 6.5: Persistent Volume 설정 (PostgreSQL)
- [ ] Task 6.6: Namespace 설계 (dev, staging, prod)
- [ ] Task 6.7: Kubernetes 배포 문서

**Deliverable**:
- Kubernetes manifests
- Deployment guide

**Codex Review Prompt**:
```
I've prepared Kubernetes manifests for production deployment.

Architecture:
- Deployments: api-gateway (3 replicas), auth-service (2 replicas)
- Services: ClusterIP for internal, LoadBalancer for gateway
- Ingress: NGINX with TLS termination
- HPA: CPU-based autoscaling (50-90% threshold)
- Namespaces: dev, staging, prod isolation

Files to review:
- infrastructure/kubernetes/api-gateway.yaml
- infrastructure/kubernetes/auth-service.yaml
- infrastructure/kubernetes/ingress.yaml
- infrastructure/kubernetes/hpa.yaml

Key decisions:
1. StatefulSet for PostgreSQL vs managed DB service
2. HPA scaling thresholds
3. Resource requests/limits
4. Liveness/readiness probe configuration

Please review:
- Production-readiness
- High availability setup
- Resource allocation strategy
- Security (RBAC, Network Policies)
```

---

### Week 7-8: CI/CD & Monitoring

**Week 7: CI/CD Pipeline**
- [ ] Task 7.1: GitHub Actions workflow 설계
- [ ] Task 7.2: Lint + Test 자동화
- [ ] Task 7.3: Docker image build + push (GHCR)
- [ ] Task 7.4: Kubernetes 자동 배포 (ArgoCD or kubectl)
- [ ] Task 7.5: Semantic versioning 자동화
- [ ] Task 7.6: Slack/Discord 알림 통합
- [ ] Task 7.7: Rollback 전략 문서화

**Deliverable**:
- `.github/workflows/` 완성
- 자동 배포 파이프라인

**Codex Review Prompt**:
```
I've implemented a complete CI/CD pipeline with GitHub Actions.

Pipeline stages:
1. Lint & Format check
2. Unit tests + coverage report
3. Integration tests (docker-compose)
4. Docker build + push to GHCR
5. Kubernetes deployment (kubectl apply)
6. Smoke tests (health checks)
7. Notifications (Slack)

Files to review:
- .github/workflows/api-gateway.yml
- .github/workflows/auth-service.yml
- .github/workflows/deploy-kubernetes.yml

Key decisions:
1. Trigger strategy (push to main = auto deploy to staging)
2. Docker image tagging (git SHA + semver)
3. Deployment approval (manual for prod)
4. Rollback mechanism (kubectl rollout undo)

Please review:
- Pipeline reliability (failure handling)
- Security (secrets management, image scanning)
- Deployment strategy (blue-green vs rolling)
- Observability (how to debug failed deployments?)
```

---

**Week 8: Monitoring & Observability**
- [ ] Task 8.1: Prometheus 설정 (메트릭 수집)
- [ ] Task 8.2: Grafana 대시보드 구성
- [ ] Task 8.3: 서비스별 메트릭 노출 (Prometheus client)
- [ ] Task 8.4: Alerting rules 설정
- [ ] Task 8.5: Jaeger 트레이싱 설정 (OpenTelemetry)
- [ ] Task 8.6: 로그 수집 (Loki or ELK)
- [ ] Task 8.7: Monitoring runbook 작성

**Deliverable**:
- Monitoring stack 동작
- Grafana 대시보드

**Codex Review Prompt**:
```
I've set up a complete monitoring stack with Prometheus, Grafana, and Jaeger.

Architecture:
- Prometheus: scrapes metrics from all services (/metrics endpoint)
- Grafana: dashboards for system health, latency, errors
- Jaeger: distributed tracing for request flows
- Alert Manager: PagerDuty integration for critical alerts

Files to review:
- monitoring/prometheus/prometheus.yml
- monitoring/grafana/dashboards/
- monitoring/alerting/rules.yml
- services/*/metrics.go (metric instrumentation)

Key decisions:
1. Metric naming conventions (RED method: Rate, Errors, Duration)
2. Alert thresholds (when to wake up on-call?)
3. Trace sampling (100% in dev, 1% in prod)
4. Log retention (7 days in dev, 30 days in prod)

Please review:
- Observability completeness (can we debug production issues?)
- Alert quality (avoid false positives)
- Performance overhead (metric collection cost)
- Runbook effectiveness (clear action items?)
```

---

## 5. Codex Collaboration Strategy

### 5.1 3-Round Feedback Loop for Critical Code

**Critical Code** (3 rounds 필요):
1. API Gateway implementation (Week 2)
2. Auth Service implementation (Week 3-4)
3. Kubernetes manifests (Week 6)
4. CI/CD pipeline (Week 7)

**Feedback Loop Process**:
```
Round 1: Initial Implementation
  ↓
Claude Code presents code + Codex Review Prompt
  ↓
User manually sends prompt to Codex
  ↓
Codex provides feedback
  ↓
Round 2: Incorporate Feedback
  ↓
Claude Code revises code + new Codex Review Prompt
  ↓
User manually sends prompt to Codex
  ↓
Codex provides feedback
  ↓
Round 3: Final Review
  ↓
Claude Code finalizes + final Codex Review Prompt
  ↓
User manually sends prompt to Codex
  ↓
Codex approval → Move to next task
```

### 5.2 Non-Critical Code (1 round)

**Non-Critical Code** (1 round):
- Docker compose setup (Week 5)
- Monitoring setup (Week 8)
- Documentation

### 5.3 Codex Review Checklist

모든 Codex 리뷰 프롬프트는 다음을 포함해야 합니다:

```markdown
**Context**: [What this code does]
**Architecture**: [High-level design decisions]
**Files to Review**: [Specific file paths]
**Key Decisions**: [Numbered list of important choices]
**Concerns**: [Known issues or uncertainties]

**Review Focus**:
1. Spec Coding Compliance: [규칙 체크리스트]
2. Security: [보안 고려사항]
3. Performance: [성능 영향]
4. Maintainability: [유지보수성]
5. Edge Cases: [예외 상황 처리]

**Questions for Codex**:
1. [Specific question 1]
2. [Specific question 2]
```

---

## 6. Progress Tracking & Checkpoints

### 6.1 Weekly Review Meetings

매주 금요일마다 **진도 점검**:
- ✅ 완료된 작업
- 🚧 진행 중인 작업
- ❌ 블로커
- 📊 다음 주 계획

### 6.2 Milestone Checkpoints

**Checkpoint 1** (Week 2 끝):
- Monorepo 구조 완성
- API Gateway 기본 동작
- **Go/No-Go Decision**: API Gateway가 OpenAPI spec를 정확히 검증하는가?

**Checkpoint 2** (Week 4 끝):
- Auth Service 완전 구현
- Login/Register/RBAC 동작
- **Go/No-Go Decision**: JWT 인증이 정책(POL-A-001)을 준수하는가?

**Checkpoint 3** (Week 6 끝):
- Docker + Kubernetes 완성
- `docker-compose up` 전체 시스템 실행 가능
- **Go/No-Go Decision**: 로컬 개발 환경이 원활한가?

**Checkpoint 4** (Week 8 끝):
- CI/CD + Monitoring 완성
- Phase 0 완료
- **Go/No-Go Decision**: Phase 1으로 진행 준비 완료?

### 6.3 Claude Code's Self-Check Questions

매 작업 후 자문:
1. ✅ Spec Coding 철학을 준수했는가?
2. ✅ OpenAPI spec와 100% 일치하는가?
3. ✅ `db/schema.sql`을 변경 없이 사용했는가?
4. ✅ ORM만 사용했는가? (원시 SQL 없음)
5. ✅ Stateless 원칙을 지켰는가? (JWT만 사용)
6. ✅ RBAC이 올바르게 구현되었는가?
7. ✅ Test coverage 80% 이상인가?
8. ✅ Codex 리뷰를 받았는가? (Critical code의 경우)

---

## 7. Risk Management

### 7.1 Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Go 경험 부족 (Auth Service) | Medium | High | Go 예제 코드 분석, Codex 리뷰 3회 |
| Kubernetes 복잡도 | High | Medium | 단계적 접근 (Docker Compose → Minikube → EKS) |
| OpenAPI validation 성능 | Low | Medium | 벤치마크 후 캐싱 전략 |
| JWT secret 관리 | Medium | High | Kubernetes Secret + 주기적 rotation |
| PostgreSQL migration 실패 | Low | High | Backup 전략, rollback 스크립트 |

### 7.2 Contingency Plans

**Plan A**: Phase 0가 8주 내 완료되지 않을 경우
- Week 9-10 추가 투입
- Kubernetes는 Phase 1으로 연기 (Docker Compose만으로 개발 진행)

**Plan B**: Auth Service Go 구현이 어려울 경우
- NestJS (TypeScript)로 전환
- 성능은 나중에 최적화

**Plan C**: Microservices 복잡도가 너무 높을 경우
- Modular monolith로 임시 전환
- Phase 1에서 점진적으로 분리

---

## 8. Success Metrics

### 8.1 Technical Metrics

Phase 0 종료 시 달성해야 할 지표:

- ✅ API Gateway uptime: 99%+
- ✅ Auth Service response time: < 100ms (p95)
- ✅ Test coverage: 80%+ (unit + integration)
- ✅ Docker image size: < 100MB (Alpine 기반)
- ✅ CI/CD build time: < 5 minutes
- ✅ Kubernetes pod startup time: < 30 seconds

### 8.2 Qualitative Metrics

- ✅ Spec Coding 철학 100% 준수
- ✅ Codex가 architecture를 승인
- ✅ 로컬 개발 환경이 원활 (개발자 만족도)
- ✅ 문서가 명확하고 최신 상태

---

## 9. Next Steps After Phase 0

Phase 0가 완료되면 **Phase 1: Smart Matching Engine**으로 진행:

### Phase 1 Preview (Months 3-6)

**Objectives**:
- AI-powered job matching
- Resume parsing (NLP)
- Elasticsearch integration
- Match Service (Python) 구현

**Prerequisites from Phase 0**:
- ✅ API Gateway가 Match Service와 통신 가능
- ✅ PostgreSQL에 jobs/applications 데이터 축적
- ✅ CI/CD로 Python 서비스 배포 가능

**Handoff Checklist**:
- [ ] API Gateway에 Match Service stub 추가
- [ ] PostgreSQL에 embedding 저장용 vector 컬럼 추가 준비
- [ ] Phase 1 실행 계획 문서 작성
- [ ] Codex에게 Phase 0 최종 리뷰 요청

---

## 10. Appendix

### A. Reference Documents

- `specs/Master_How_Spec.md`: Spec Coding 철학
- `specs/policy.md`: 비즈니스 정책
- `openapi/api-spec.yaml`: API 명세
- `db/schema.sql`: 데이터베이스 스키마
- `docs/INNOVATION_ARCHITECTURE.md`: 전체 혁신 로드맵

### B. Tool & Framework Versions

- Node.js: 20.x LTS
- Go: 1.21+
- Python: 3.11+
- PostgreSQL: 15+
- Redis: 7+
- Kubernetes: 1.28+
- Docker: 24+

### C. Communication Protocol

**Claude Code → User**:
1. 작업 시작 전: 작업 내용 요약
2. 작업 완료 후: Deliverable 확인
3. Codex 리뷰 필요 시: 프롬프트 제시
4. 블로커 발생 시: 즉시 보고

**User → Claude Code**:
1. Codex 피드백 전달
2. 방향 수정 지시
3. 우선순위 변경

---

## Document History

- **2025-10-27**: Initial version (Phase 0 detailed execution plan)
- **Author**: Claude Code
- **Review Status**: Pending Codex Review ⭐

---

**END OF PHASE 0 EXECUTION PLAN**
