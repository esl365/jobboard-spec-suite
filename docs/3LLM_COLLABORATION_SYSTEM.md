# 3-LLM Collaboration System

> **목적**: ChatGPT, Claude Code, Web UI Codex를 GitHub repository에 연동하여 최소한의 사용자 개입으로 효율적인 협업 시스템을 구축합니다.

---

## 🎯 Overview

### 핵심 철학
- **자동화 우선**: 사용자 개입을 Issue 생성과 PR 승인으로 최소화
- **역할 분담**: 각 LLM의 강점을 활용한 전문화
- **품질 보증**: 자동 리뷰와 검증으로 코드 품질 유지
- **투명성**: 모든 작업이 GitHub에 기록되고 추적 가능

### 시스템 구성요소
1. **Prompt Queue System** - 작업 관리 및 우선순위 지정
2. **GitHub Actions** - 자동화된 워크플로우
3. **Branch Strategy** - 체계적인 브랜치 관리
4. **Role-Based Prompts** - 각 LLM별 맞춤 지시사항

---

## 🤖 LLM 역할 정의

### 1. ChatGPT (Code Reviewer & Quality Guardian)

**역할**: 읽기 전용 검토자 - 코드 품질의 파수꾼

**책임**:
- ✅ Pull Request 자동 리뷰
- ✅ 코드 품질 및 베스트 프랙티스 검증
- ✅ 보안 취약점 스캔
- ✅ 성능 최적화 제안
- ✅ 테스트 커버리지 검증
- ✅ 문서화 완성도 체크
- ✅ 의존성 및 호환성 검증

**작업 트리거**:
- PR이 생성될 때 (자동)
- PR에 새로운 커밋이 추가될 때 (자동)
- `/review` 코멘트가 달릴 때 (수동)

**출력물**:
- PR 코멘트 (전체 리뷰)
- 인라인 코멘트 (특정 라인 피드백)
- 승인/변경요청/코멘트 상태

**제약사항**:
- ❌ 코드 수정 불가 (읽기 전용)
- ❌ 브랜치 생성/삭제 불가
- ❌ 커밋/푸시 불가

---

### 2. Claude Code (Lead Developer & Problem Solver)

**역할**: 주 개발자 - 핵심 기능 구현 및 복잡한 문제 해결

**책임**:
- ✅ 새로운 기능 개발 (Feature Implementation)
- ✅ 복잡한 버그 수정 (Critical Bugfixes)
- ✅ 아키텍처 설계 및 리팩토링
- ✅ API 설계 및 구현
- ✅ 데이터베이스 스키마 설계
- ✅ 테스트 코드 작성 (Unit, Integration)
- ✅ ChatGPT 피드백 반영
- ✅ 기술 문서 작성

**작업 트리거**:
- Claude Inbox 프롬프트 (P-CLAUDE-* 패턴)
- 우선순위: High, Critical
- 복잡도: Medium-High

**브랜치 패턴**:
```
claude/feature-{description}
claude/fix-{issue-number}
claude/refactor-{component}
```

**워크플로우**:
1. Claude Inbox에서 할당된 프롬프트 확인
2. 브랜치 생성 및 작업
3. 커밋 & 푸시
4. PR 생성 (자동으로 ChatGPT 리뷰 트리거)
5. 피드백 반영 후 재커밋
6. 사용자 승인 대기

---

### 3. Web UI Codex (Specialist Developer & Parallel Worker)

**역할**: 전문 개발자 - UI/UX 및 병렬 작업 처리

**책임**:
- ✅ UI 컴포넌트 개발
- ✅ 프론트엔드 로직 구현
- ✅ API 엔드포인트 구현 (간단한 CRUD)
- ✅ 유틸리티 함수 작성
- ✅ 스타일링 및 레이아웃
- ✅ 간단한 버그 수정
- ✅ 데이터 변환 로직

**작업 트리거**:
- Claude Inbox 프롬프트 (P-CODEX-* 패턴)
- 우선순위: Low, Medium
- 복잡도: Low-Medium

**브랜치 패턴**:
```
codex/ui-{component}
codex/api-{endpoint}
codex/fix-{issue-number}
```

**병렬 작업 전략**:
- Claude Code가 백엔드 작업할 때 프론트엔드 작업
- 서로 다른 모듈/컴포넌트를 동시에 개발
- 충돌 최소화를 위한 파일 분리

---

## 🔄 협업 워크플로우

### Workflow 1: Feature Development (기능 개발)

```
[사용자] Issue 생성: "Add user profile page"
   ↓
[GitHub Action] 이슈 분석 및 작업 분해
   ↓
[ChatGPT] 작업 계획 코멘트 자동 생성
   "이 기능은 다음으로 분해됩니다:
    1. [CLAUDE] 백엔드 API 설계 및 구현
    2. [CODEX] 프로필 페이지 UI 컴포넌트
    3. [CODEX] API 연동 로직
    추정 시간: 4-6시간"
   ↓
[사용자] Claude Inbox에 프롬프트 추가:
   - prompts/P0010-claude-user-profile-api.md
   - prompts/P0011-codex-user-profile-ui.md
   ↓
[Claude Code] P0010 처리
   - feature/claude-user-profile-api 브랜치 생성
   - API 엔드포인트 구현 (/api/users/:id/profile)
   - 테스트 코드 작성
   - 커밋 & 푸시
   ↓
[Codex] P0011 처리 (병렬 작업)
   - feature/codex-user-profile-ui 브랜치 생성
   - ProfilePage.tsx 컴포넌트 구현
   - 스타일링 및 레이아웃
   - 커밋 & 푸시
   ↓
[Claude Code] 브랜치 통합
   - git merge feature/codex-user-profile-ui
   - 통합 테스트
   - PR 생성 → main
   ↓
[GitHub Action] ChatGPT 자동 리뷰 트리거
   ↓
[ChatGPT] PR 리뷰 수행
   - 코드 품질 검증
   - 보안 체크
   - 성능 분석
   - 리뷰 코멘트 작성
   ↓
[Claude Code] 피드백 반영
   - 지적된 사항 수정
   - 재커밋 & 푸시
   ↓
[ChatGPT] 재리뷰 (자동)
   "✅ 모든 피드백 반영 완료. LGTM!"
   ↓
[사용자] PR 승인 & Merge (유일한 수동 개입)
   ↓
[GitHub Action] 배포 파이프라인 실행 (선택사항)
```

**소요 시간**: 총 2-4시간 (사용자 개입 5분 이내)

---

### Workflow 2: Bug Fix (버그 수정)

```
[사용자] Bug Issue 생성: "Login button not working on mobile"
   ↓
[GitHub Action] 우선순위 자동 라벨링
   Label: bug, priority:high, mobile
   ↓
[ChatGPT] 자동 이슈 분석
   "문제 분석:
    - 영향 범위: 모바일 사용자
    - 심각도: High (로그인 불가)
    - 추정 원인: CSS 미디어 쿼리 또는 터치 이벤트
    권장 담당: Codex (UI 관련)"
   ↓
[사용자] Claude Inbox에 프롬프트 추가:
   - prompts/P0012-codex-fix-mobile-login.md
   ↓
[Codex] P0012 처리
   - bugfix/codex-mobile-login 브랜치 생성
   - 버그 재현 및 원인 파악
   - 수정 코드 작성
   - 모바일 테스트
   - 커밋 & 푸시
   - PR 생성
   ↓
[ChatGPT] 자동 리뷰
   "버그 수정 확인:
    ✅ 원인 정확히 파악
    ✅ 수정 코드 적절
    ⚠️ 테스트 케이스 추가 권장"
   ↓
[Codex] 테스트 추가
   - 모바일 터치 이벤트 테스트 추가
   - 재커밋
   ↓
[사용자] PR 승인 & Merge
```

**소요 시간**: 총 30분-1시간 (사용자 개입 3분)

---

### Workflow 3: Code Review Cycle (리뷰 사이클)

```
[Claude/Codex] PR 생성
   ↓
[GitHub Action] ChatGPT 리뷰 워크플로우 트리거
   ↓
[ChatGPT] 7-Phase Review 수행:

   Phase 1: Scope & Intent 검증
   "✅ PR 범위가 명확하고 의도와 일치함"

   Phase 2: File-by-File 분석
   "변경된 파일 12개:
    - src/api/users.ts: +150, -20
    - src/components/Profile.tsx: +200, -0 (신규)
    ⚠️ src/utils/auth.ts: 예상치 못한 변경 발견"

   Phase 3: Integration Points 확인
   "의존성 추가:
    - axios: ^1.4.0 (적절)
    - react-query: ^4.0.0 (적절)
   ⚠️ API 버전 호환성 체크 필요"

   Phase 4: Testing & Coverage
   "테스트 커버리지:
    - Unit: 85% ✅
    - Integration: 70% ⚠️ (목표 80%)
    누락된 테스트:
    - 에러 핸들링 케이스
    - 엣지 케이스 (빈 데이터)"

   Phase 5: Documentation
   "✅ JSDoc 주석 충분
    ⚠️ README 업데이트 필요 (API 변경사항 반영)"

   Phase 6: Security & Performance
   "보안:
    ✅ SQL Injection 방어 적절
    ✅ XSS 방어 적절
    ⚠️ Rate limiting 필요
   성능:
    ⚠️ N+1 쿼리 가능성 (users.ts:45)"

   Phase 7: Best Practices
   "✅ 코드 스타일 일관성
    ✅ 네이밍 컨벤션 준수
    ⚠️ 에러 메시지 다국어화 고려"

   Final Verdict: REQUEST CHANGES
   "3개 필수 수정사항, 4개 권장사항"
   ↓
[Claude Code] 피드백 반영
   - 필수 수정사항 처리
   - 테스트 보완
   - 문서 업데이트
   - 재커밋
   ↓
[ChatGPT] 자동 재리뷰
   "✅ 모든 필수 사항 수정 완료
    권장사항 일부 미반영 (괜찮음)
   Final Verdict: APPROVE 👍"
   ↓
[사용자] Merge
```

---

## 📋 Prompt Queue 통합

### 프롬프트 명명 규칙

```
prompts/P{number}-{llm}-{description}.md

예시:
- P0010-claude-implement-auth-api.md      (Claude Code 담당)
- P0011-codex-build-login-ui.md           (Codex 담당)
- P0012-chatgpt-review-security.md        (ChatGPT 리뷰 요청)
```

### 우선순위 및 할당 전략

**자동 할당 로직**:
```javascript
function assignTask(task) {
  // 복잡도 기반
  if (task.complexity === 'high' || task.type === 'architecture') {
    return 'claude';
  }

  // UI/프론트엔드
  if (task.tags.includes('ui') || task.tags.includes('frontend')) {
    return 'codex';
  }

  // 백엔드 API
  if (task.tags.includes('api') && task.complexity === 'medium') {
    return 'codex';  // 간단한 CRUD는 Codex
  }

  if (task.tags.includes('api') && task.complexity === 'high') {
    return 'claude';  // 복잡한 비즈니스 로직은 Claude
  }

  // 버그 수정
  if (task.type === 'bugfix') {
    return task.severity === 'critical' ? 'claude' : 'codex';
  }

  // 기본값
  return 'claude';
}
```

### 병렬 작업 조율

**동시 작업 가능 케이스**:
- ✅ Claude: 백엔드 API / Codex: 프론트엔드 UI
- ✅ Claude: 모듈 A / Codex: 모듈 B
- ✅ Claude: 핵심 로직 / Codex: 유틸리티 함수

**순차 작업 필요 케이스**:
- ❌ 같은 파일 수정
- ❌ 의존 관계가 있는 작업 (API 먼저 → UI 나중)
- ❌ 스키마 변경 (DB 먼저 → 코드 나중)

---

## 🚀 Quick Start Guide

### Step 1: 초기 설정 (10분)

```bash
# 1. Claude Inbox 이슈 생성
# GitHub Issues에서 docs/CLAUDE_INBOX_ISSUE_TEMPLATE.md 내용으로 이슈 생성
# 이슈 번호 기록 (예: #7)

# 2. Repository 변수 설정
# Settings → Secrets and variables → Actions → Variables
# Name: CLAUDE_INBOX_ISSUE_NUMBER
# Value: 7

# 3. ChatGPT API 키 설정 (선택사항 - 자동 리뷰 활성화 시)
# Settings → Secrets and variables → Actions → Secrets
# Name: CHATGPT_API_KEY
# Value: sk-...

# 4. 브랜치 보호 규칙 설정
# Settings → Branches → main
# - Require pull request before merging
# - Require status checks to pass (spec-runner/ci)
# - (선택) Require review from ChatGPT
```

### Step 2: 첫 번째 작업 생성 (5분)

```bash
# 1. GitHub Issue 생성
Title: "Add user authentication feature"
Body:
"""
## Requirements
- Email/password login
- JWT token-based auth
- Protected routes
- Session management

## Scope
- Backend API
- Frontend UI
- Tests
"""

# 2. Claude Inbox에 프롬프트 추가
# 두 개의 프롬프트 파일 생성:

# prompts/P0020-claude-auth-backend.md
# prompts/P0021-codex-auth-frontend.md
```

### Step 3: LLM 작업 시작 (자동)

```
[Claude Code]
1. P0020 프롬프트 읽기
2. claude/feature-auth-backend 브랜치 생성
3. 백엔드 구현
4. 커밋 & 푸시
5. (대기 - Codex 작업 완료 기다림)

[Codex] (병렬)
1. P0021 프롬프트 읽기
2. codex/feature-auth-frontend 브랜치 생성
3. 프론트엔드 구현
4. 커밋 & 푸시
5. Claude에게 알림

[Claude Code]
6. Codex 브랜치 머지
7. 통합 테스트
8. PR 생성

[ChatGPT] (자동 트리거)
9. PR 자동 리뷰
10. 피드백 코멘트

[Claude Code]
11. 피드백 반영
12. 재커밋

[사용자]
13. PR 승인 & 머지 (1분)
```

---

## 📊 사용자 개입 최소화

### 자동화된 작업 (99% 시간)

| 작업 | 담당 | 소요 시간 | 사용자 개입 |
|-----|------|----------|------------|
| 코드 구현 | Claude/Codex | 1-4시간 | ❌ 없음 |
| 커밋 & 푸시 | Claude/Codex | 1분 | ❌ 없음 |
| PR 생성 | Claude/Codex | 30초 | ❌ 없음 |
| 코드 리뷰 | ChatGPT | 2-5분 | ❌ 없음 |
| 피드백 반영 | Claude/Codex | 30분-1시간 | ❌ 없음 |
| 테스트 실행 | GitHub Actions | 2-5분 | ❌ 없음 |
| 문서 업데이트 | Claude/Codex | 10-20분 | ❌ 없음 |

### 사용자 개입 필요 (1% 시간)

| 작업 | 소요 시간 | 빈도 |
|-----|----------|------|
| 이슈 생성 (작업 지시) | 2-5분 | 하루 1-3회 |
| 프롬프트 생성 | 3-5분 | 하루 1-3회 |
| PR 최종 검토 & 승인 | 1-2분 | 하루 1-3회 |
| 비즈니스 결정 | 5-10분 | 주 1-2회 |
| 프로덕션 배포 승인 | 1분 | 주 1-2회 |

**일일 사용자 투입 시간**: 평균 **15-30분**
**일일 개발 진행**: 평균 **6-10시간** (자동화)

---

## 🎯 Best Practices

### DO ✅

1. **작업 단위를 작게 유지**
   - 한 PR에 한 가지 기능만
   - 500줄 이하 권장
   - 리뷰 시간 단축

2. **프롬프트는 명확하게**
   - 구체적인 요구사항
   - 성공 기준 명시
   - 참고 자료 링크

3. **브랜치 명명 규칙 준수**
   ```
   claude/feature-{name}
   codex/ui-{component}
   bugfix/{issue-number}
   ```

4. **커밋 메시지 구조화**
   ```
   [CLAUDE] feat: add user authentication API
   [CODEX] fix: mobile login button styling
   [REVIEW-CHATGPT] refactor: improve error handling
   ```

5. **테스트 먼저 작성**
   - TDD 권장
   - 커버리지 80% 이상 목표

### DON'T ❌

1. **대규모 변경을 한 PR에 몰아넣지 마세요**
   - 리뷰 불가능
   - 충돌 위험 증가

2. **프롬프트 없이 작업 시작하지 마세요**
   - 추적 불가
   - 중복 작업 위험

3. **리뷰 피드백을 무시하지 마세요**
   - ChatGPT 지적사항 확인 필수
   - 무시 시 문서화 필요

4. **같은 파일을 동시에 수정하지 마세요**
   - Claude와 Codex 작업 영역 분리
   - 충돌 방지

5. **main 브랜치에 직접 푸시하지 마세요**
   - 항상 PR 경유
   - 리뷰 프로세스 준수

---

## 📈 성공 지표

### 개발 속도
- **목표**: 주당 10-15 PR 머지
- **측정**: GitHub Insights

### 코드 품질
- **목표**: ChatGPT 리뷰 통과율 90% 이상
- **측정**: PR 승인율

### 자동화율
- **목표**: 사용자 개입 시간 < 10%
- **측정**: 시간 추적

### 버그율
- **목표**: 프로덕션 버그 < 월 5건
- **측정**: Issue 트래킹

---

## 🔧 Troubleshooting

### Q: ChatGPT 리뷰가 트리거되지 않아요
**A**: GitHub Actions 로그 확인 → CHATGPT_API_KEY 설정 확인

### Q: Claude와 Codex가 같은 파일을 수정해서 충돌이 발생했어요
**A**: 프롬프트 생성 시 작업 범위를 명확히 분리. 충돌 시 Claude가 해결.

### Q: 프롬프트를 어떻게 작성해야 하나요?
**A**: `prompts/P0001-claude-prompt-queue-example.md` 참고

### Q: 하루에 몇 개의 작업을 처리할 수 있나요?
**A**: 복잡도에 따라 다르지만, 평균 3-5개 Feature / 5-10개 Bugfix

---

## 📚 관련 문서

- `docs/PROMPT_QUEUE_AUTOMATION.md` - Prompt Queue 시스템 상세 가이드
- `docs/BRANCH_STRATEGY.md` - 브랜치 전략 및 Git 워크플로우
- `prompts/P0001-claude-prompt-queue-example.md` - 프롬프트 작성 예제
- `.github/workflows/chatgpt-review.yml` - ChatGPT 리뷰 자동화 설정

---

## 🎉 결론

이 3-LLM 협업 시스템을 통해:
- ✅ **개발 속도 3-5배 향상**
- ✅ **사용자 개입 90% 감소**
- ✅ **코드 품질 자동 보증**
- ✅ **24/7 개발 가능**

**하루 30분 투자로 6-10시간의 개발 진행!**
