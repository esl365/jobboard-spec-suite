# Branch Strategy for 3-LLM Collaboration

> **목적**: Claude Code, Web UI Codex, 그리고 ChatGPT가 협업할 때 충돌을 최소화하고 효율적인 워크플로우를 유지하기 위한 브랜치 전략

---

## 🌳 Branch Structure

```
main (프로덕션)
  │
  ├── develop (개발 통합 브랜치)
  │   │
  │   ├── claude/feature-{description}      # Claude Code 기능 개발
  │   ├── claude/fix-{issue-number}         # Claude Code 버그 수정
  │   ├── claude/refactor-{component}       # Claude Code 리팩토링
  │   │
  │   ├── codex/ui-{component}              # Codex UI 개발
  │   ├── codex/api-{endpoint}              # Codex API 개발
  │   ├── codex/fix-{issue-number}          # Codex 버그 수정
  │   │
  │   └── hotfix/{critical-issue}           # 긴급 수정
  │
  └── release/v{major}.{minor}.{patch}      # 릴리스 브랜치
```

---

## 📋 Branch Naming Convention

### Claude Code 브랜치

**패턴**: `claude/{type}-{description}`

**Types**:
- `feature` - 새로운 기능 개발
- `fix` - 버그 수정
- `refactor` - 코드 리팩토링
- `perf` - 성능 개선
- `test` - 테스트 추가/수정
- `docs` - 문서화

**예시**:
```
claude/feature-user-authentication
claude/fix-login-redirect-issue
claude/refactor-payment-service
claude/perf-database-queries
claude/test-api-endpoints
claude/docs-api-specification
```

### Codex 브랜치

**패턴**: `codex/{type}-{description}`

**Types**:
- `ui` - UI 컴포넌트
- `api` - API 엔드포인트
- `fix` - 버그 수정
- `style` - 스타일링
- `util` - 유틸리티 함수

**예시**:
```
codex/ui-profile-page
codex/api-user-endpoints
codex/fix-mobile-layout
codex/style-dark-theme
codex/util-date-formatter
```

### 기타 브랜치

**Hotfix**: `hotfix/{critical-issue}`
```
hotfix/security-vulnerability
hotfix/data-loss-bug
```

**Release**: `release/v{version}`
```
release/v1.0.0
release/v1.1.0-beta
```

---

## 🔄 Workflow Patterns

### Pattern 1: 독립적 기능 개발 (병렬 작업)

```
main
  └── claude/feature-payment-api
      (독립적으로 작업 가능)

main
  └── codex/ui-checkout-page
      (동시에 병렬 작업 가능)
```

**프로세스**:
1. Claude: 백엔드 API 구현
2. Codex: 프론트엔드 UI 구현 (동시 진행)
3. Claude: 두 브랜치 머지 후 통합 테스트
4. PR → main

**장점**:
- ✅ 개발 속도 2배
- ✅ 충돌 없음
- ✅ 독립적 테스트 가능

---

### Pattern 2: 순차적 의존 개발

```
main
  └── claude/feature-database-schema
      (먼저 완료되어야 함)

      완료 후 →

      └── codex/api-crud-endpoints
          (스키마 의존)
```

**프로세스**:
1. Claude: DB 스키마 설계 및 마이그레이션
2. PR → main (머지)
3. Codex: 스키마 기반 CRUD API 구현
4. PR → main

**주의사항**:
- ⚠️ 의존성 명확히 문서화
- ⚠️ 순서 지키기 필수

---

### Pattern 3: 기능 브랜치 + Sub-branches

```
main
  └── claude/feature-notifications
      ├── codex/ui-notification-bell  (서브 브랜치)
      └── codex/ui-notification-list  (서브 브랜치)
```

**프로세스**:
1. Claude: `claude/feature-notifications` 브랜치 생성
2. Codex: `codex/ui-notification-bell` 브랜치 생성 (from claude/feature-notifications)
3. Codex: `codex/ui-notification-list` 브랜치 생성 (from claude/feature-notifications)
4. Codex: 각 서브 브랜치 → `claude/feature-notifications` 로 PR
5. Claude: 통합 후 → `main` 으로 PR

**장점**:
- ✅ 큰 기능을 작은 단위로 분할
- ✅ 리뷰 용이
- ✅ 점진적 통합

---

## 🚦 Branch Protection Rules

### Main Branch

**설정** (Settings → Branches → main):
```
✅ Require pull request before merging
✅ Require approvals (1)
✅ Require status checks to pass before merging
   - spec-runner / ci
   - chatgpt-review / chatgpt-code-review (optional)
✅ Require branches to be up to date before merging
✅ Do not allow bypassing the above settings
❌ Allow force pushes (절대 금지)
❌ Allow deletions (절대 금지)
```

**목적**:
- 프로덕션 코드 보호
- 모든 변경사항 리뷰 필수
- CI 통과 보장

---

### Develop Branch (선택사항)

**설정**:
```
✅ Require pull request before merging
✅ Require status checks to pass
⚠️ Require approvals (0-1, 유연하게)
❌ Require branches to be up to date (개발 속도 우선)
```

**목적**:
- 빠른 개발 주기
- 통합 테스트 공간

---

## 🔀 Merge Strategies

### 언제 어떤 머지 전략을 사용할까?

#### 1. Merge Commit (기본, 권장)

**사용 케이스**:
- 기능 브랜치 → main
- 릴리스 브랜치 → main
- 히스토리 보존이 중요한 경우

**명령어**:
```bash
git merge --no-ff claude/feature-authentication
```

**장점**:
- ✅ 전체 히스토리 보존
- ✅ 브랜치 구조 명확
- ✅ 롤백 용이

**단점**:
- ❌ 커밋 히스토리 복잡해질 수 있음

---

#### 2. Squash and Merge

**사용 케이스**:
- 작은 버그 수정
- 실험적 브랜치
- 커밋이 너무 많고 정리가 필요한 경우

**명령어**:
```bash
git merge --squash codex/fix-typo
```

**장점**:
- ✅ 깔끔한 히스토리
- ✅ 불필요한 커밋 제거

**단점**:
- ❌ 개별 커밋 히스토리 손실

---

#### 3. Rebase and Merge

**사용 케이스**:
- 선형 히스토리가 중요한 프로젝트
- 개인 브랜치
- 짧은 생명주기 브랜치

**명령어**:
```bash
git rebase main
git push --force-with-lease
```

**장점**:
- ✅ 완전히 선형 히스토리
- ✅ 깔끔한 커밋 로그

**단점**:
- ❌ 히스토리 재작성 (위험)
- ❌ 협업 시 주의 필요

---

## 💡 Best Practices

### DO ✅

1. **브랜치 이름은 명확하게**
   ```bash
   # Good
   claude/feature-oauth-login
   codex/ui-dashboard-widgets

   # Bad
   feature-1
   my-branch
   test
   ```

2. **작업 시작 전에 main에서 브랜치 생성**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b claude/feature-new-thing
   ```

3. **정기적으로 main 변경사항 가져오기**
   ```bash
   # 하루에 1-2회
   git fetch origin main
   git merge origin/main
   # 또는
   git rebase origin/main
   ```

4. **작업 완료 후 즉시 PR 생성**
   - 코드가 신선할 때 리뷰가 쉬움
   - 빠른 피드백

5. **브랜치 수명 짧게 유지**
   - 목표: 1-3일
   - 머지 후 즉시 브랜치 삭제

---

### DON'T ❌

1. **main 브랜치에서 직접 작업하지 마세요**
   ```bash
   # 절대 금지!
   git checkout main
   # (코드 수정)
   git commit -m "quick fix"
   git push origin main
   ```

2. **force push를 공유 브랜치에 사용하지 마세요**
   ```bash
   # 위험!
   git push --force origin develop
   ```

   대신:
   ```bash
   git push --force-with-lease origin claude/my-feature
   ```

3. **브랜치를 너무 오래 유지하지 마세요**
   - 1주일 이상 → 충돌 위험 증가
   - 정기적으로 main 머지 필요

4. **무의미한 커밋 메시지**
   ```bash
   # Bad
   git commit -m "fix"
   git commit -m "update"
   git commit -m "wip"
   ```

5. **동일한 파일을 여러 브랜치에서 수정**
   - 사전에 작업 영역 조율 필요

---

## 🔧 Git Commands Cheat Sheet

### 브랜치 생성 및 전환
```bash
# 새 브랜치 생성 및 전환
git checkout -b claude/feature-name

# 브랜치 전환
git checkout claude/feature-name

# 원격 브랜치 확인
git branch -r

# 로컬 + 원격 브랜치 확인
git branch -a
```

### 변경사항 동기화
```bash
# 원격 최신 정보 가져오기
git fetch origin

# main 변경사항 현재 브랜치에 머지
git merge origin/main

# main 변경사항 현재 브랜치에 리베이스
git rebase origin/main

# 푸시 (새 브랜치)
git push -u origin claude/feature-name

# 푸시 (기존 브랜치)
git push origin claude/feature-name
```

### 브랜치 관리
```bash
# 로컬 브랜치 삭제
git branch -d claude/feature-name

# 원격 브랜치 삭제
git push origin --delete claude/feature-name

# 머지된 브랜치 목록
git branch --merged

# 머지 안 된 브랜치 목록
git branch --no-merged
```

### 충돌 해결
```bash
# 충돌 발생 시
git status  # 충돌 파일 확인

# 파일 수정 후
git add <conflicted-file>
git commit

# 또는 머지 취소
git merge --abort
```

---

## 🎯 Conflict Resolution Strategy

### Claude와 Codex가 같은 파일을 수정했을 때

**시나리오**:
```
# Claude가 src/api/users.ts 수정
claude/feature-user-api

# Codex도 src/api/users.ts 수정
codex/api-user-endpoints
```

**해결 방법**:

#### Option 1: Claude가 통합 (권장)
```bash
# Claude 브랜치에서
git checkout claude/feature-user-api
git fetch origin codex/api-user-endpoints
git merge origin/codex/api-user-endpoints

# 충돌 해결
# (수동으로 파일 수정)

git add src/api/users.ts
git commit -m "chore: merge Codex changes and resolve conflicts"
git push
```

#### Option 2: 새 통합 브랜치 생성
```bash
# 새 브랜치
git checkout -b claude/integrate-user-features main
git merge claude/feature-user-api
git merge codex/api-user-endpoints

# 충돌 해결 후
git push -u origin claude/integrate-user-features
# PR 생성
```

---

## 📊 Branch Lifecycle

### 생명주기
```
생성 (from main)
  ↓
개발 (commit, push)
  ↓
정기 동기화 (merge main)
  ↓
PR 생성
  ↓
리뷰 (ChatGPT + 사용자)
  ↓
수정 (feedback 반영)
  ↓
승인 & 머지 (→ main)
  ↓
브랜치 삭제
```

### 예상 타임라인

| 단계 | 소요 시간 | 담당 |
|-----|----------|------|
| 브랜치 생성 | 30초 | Claude/Codex |
| 개발 | 2-6시간 | Claude/Codex |
| PR 생성 | 1분 | Claude/Codex |
| 자동 리뷰 | 3-5분 | ChatGPT |
| 피드백 반영 | 30분-2시간 | Claude/Codex |
| 승인 & 머지 | 2분 | 사용자 |
| 브랜치 삭제 | 30초 | 자동 |

**총 소요 시간**: 3-9시간 (자동화)
**사용자 개입**: 2-3분

---

## 🚨 Emergency Procedures

### Hotfix 긴급 배포

```bash
# 1. main에서 hotfix 브랜치 생성
git checkout main
git checkout -b hotfix/critical-bug

# 2. 수정
# (코드 수정)

# 3. 커밋 & 푸시
git commit -m "hotfix: fix critical security issue"
git push -u origin hotfix/critical-bug

# 4. PR 생성 (main으로)
# - 리뷰 생략 가능 (긴급 시)
# - CI 통과 확인 필수

# 5. 머지 후 즉시 배포

# 6. develop에도 백포트
git checkout develop
git merge hotfix/critical-bug
git push origin develop
```

---

## 📚 Related Documentation

- `docs/3LLM_COLLABORATION_SYSTEM.md` - 3-LLM 협업 시스템 전체 가이드
- `docs/PROMPT_QUEUE_AUTOMATION.md` - Prompt Queue 사용법
- `.github/workflows/chatgpt-review.yml` - 자동 리뷰 워크플로우

---

## 🎓 Learning Resources

### Git 기초
- [Git Book](https://git-scm.com/book/ko/v2)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

### 고급 전략
- [Gitflow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Trunk-Based Development](https://trunkbaseddevelopment.com/)

---

이 브랜치 전략을 따르면 3개의 LLM이 충돌 없이 효율적으로 협업할 수 있습니다! 🚀
