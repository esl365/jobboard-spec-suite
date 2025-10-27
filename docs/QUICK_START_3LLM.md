# Quick Start: 3-LLM Collaboration System

> **목표**: 10분 안에 ChatGPT, Claude Code, Codex 협업 시스템을 시작하기

---

## ⚡ 5분 설정

### Step 1: Repository 변수 설정 (2분)

#### 1.1 Claude Inbox 이슈 생성

1. GitHub Issues → **New Issue**
2. 제목: `Claude Inbox: Open Prompts`
3. 내용: `docs/CLAUDE_INBOX_ISSUE_TEMPLATE.md` 복사
4. **Create issue**
5. 이슈 번호 기록 (예: #10)

#### 1.2 Repository 변수 추가

**Settings** → **Secrets and variables** → **Actions** → **Variables** 탭

| Name | Value |
|------|-------|
| `CLAUDE_INBOX_ISSUE_NUMBER` | `10` (위에서 생성한 이슈 번호) |

#### 1.3 ChatGPT API Key 추가 (선택사항)

**Settings** → **Secrets and variables** → **Actions** → **Secrets** 탭

| Name | Value |
|------|-------|
| `CHATGPT_API_KEY` | `sk-...` (OpenAI API 키) |

> ⚠️ ChatGPT 자동 리뷰를 사용하려면 OpenAI API 키가 필요합니다.
> 키가 없으면 수동 리뷰로 진행할 수 있습니다.

---

### Step 2: 브랜치 보호 규칙 (2분)

**Settings** → **Branches** → **Add branch protection rule**

**Branch name pattern**: `main`

체크할 항목:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - `spec-runner / ci`
- ✅ Require branches to be up to date before merging

**Save changes**

---

### Step 3: 첫 작업 준비 (1분)

#### 프롬프트 템플릿 확인

```bash
ls prompts/TEMPLATE-*.md
```

출력:
```
TEMPLATE-claude-feature.md   # Claude 기능 개발용
TEMPLATE-codex-ui.md          # Codex UI 개발용
```

---

## 🚀 첫 번째 작업 시작 (5분)

### Example: 사용자 프로필 기능 추가

#### Step 1: GitHub Issue 생성 (1분)

**Title**: `Add user profile feature`

**Body**:
```markdown
## Requirements
- View user profile information
- Edit profile (name, email, bio)
- Upload profile picture
- Change password

## Scope
- Backend API (Claude)
- Frontend UI (Codex)
- Tests & Documentation

## Priority
High

## Estimate
6-8 hours (automated)
```

**Labels**: `enhancement`, `feature`
**Create issue** → Issue #11 생성됨

---

#### Step 2: 프롬프트 파일 생성 (3분)

##### 2.1 Claude 프롬프트 (백엔드)

파일: `prompts/P0010-claude-user-profile-api.md`

```markdown
# P0010: User Profile API

**Created:** 2025-10-27
**Priority:** High
**Estimate:** 4 hours
**Agent:** Claude Code
**Type:** Feature Development

## Context

Implement backend API for user profile management.

**Related Issues:**
- #11

## Task

### 1. Database Schema

```sql
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN profile_picture_url TEXT;
-- (기존 name, email 필드 사용)
```

### 2. API Endpoints

```
GET    /api/v1/users/:id/profile
PUT    /api/v1/users/:id/profile
POST   /api/v1/users/:id/profile/picture
PUT    /api/v1/users/:id/password
```

### 3. Implementation

- Profile service layer
- Input validation (Joi/Zod)
- Authorization (own profile only)
- File upload (profile picture)
- Password hashing (bcrypt)
- Tests (Jest/Vitest)

## Success Criteria

- [ ] API endpoints implemented
- [ ] Tests pass (>80% coverage)
- [ ] OpenAPI docs updated
- [ ] Authorization working
- [ ] File upload secure

## Related

- Branch: `claude/feature-user-profile-api`
- Codex Prompt: `prompts/P0011-codex-user-profile-ui.md`
```

저장!

##### 2.2 Codex 프롬프트 (프론트엔드)

파일: `prompts/P0011-codex-user-profile-ui.md`

```markdown
# P0011: User Profile UI

**Created:** 2025-10-27
**Priority:** High
**Estimate:** 3 hours
**Agent:** Codex (Web UI)
**Type:** UI Development

## Context

Build user profile page with view/edit capabilities.

**Related Issues:**
- #11

**Dependencies:**
- Backend API: P0010-claude-user-profile-api.md

## Task

### 1. Components

```
src/components/Profile/
  ProfileView.tsx       # Read-only view
  ProfileEdit.tsx       # Edit form
  ProfilePicture.tsx    # Picture upload
  PasswordChange.tsx    # Password form
```

### 2. Features

- View profile information
- Edit mode toggle
- Form validation
- Image upload with preview
- Password change modal
- Loading/error states

### 3. API Integration

```typescript
GET    /api/v1/users/:id/profile
PUT    /api/v1/users/:id/profile
POST   /api/v1/users/:id/profile/picture
PUT    /api/v1/users/:id/password
```

## Success Criteria

- [ ] All components implemented
- [ ] Responsive design (mobile/desktop)
- [ ] Form validation
- [ ] Image upload working
- [ ] Tests pass (>80% coverage)

## Related

- Branch: `codex/ui-user-profile`
- Backend: `prompts/P0010-claude-user-profile-api.md`
```

저장!

---

#### Step 3: Claude Inbox 업데이트 (1분)

Claude Inbox 이슈 (#10)에 코멘트 추가:

```markdown
## New Prompts Added

- **P0010** (Claude): User Profile API - High priority
- **P0011** (Codex): User Profile UI - High priority

@claude-code @codex please process these prompts in order.
```

---

## 🤖 LLM들이 작업 시작 (자동, 4-6시간)

### Claude Code 작업 (4시간)

```
[자동] P0010 프롬프트 확인
[자동] claude/feature-user-profile-api 브랜치 생성
[자동] 데이터베이스 마이그레이션 작성
[자동] API 엔드포인트 구현
[자동] 테스트 작성
[자동] 커밋 & 푸시
[대기] Codex 완료 대기...
```

### Codex 작업 (병렬, 3시간)

```
[자동] P0011 프롬프트 확인
[자동] codex/ui-user-profile 브랜치 생성
[자동] Profile 컴포넌트 구현
[자동] API 통합
[자동] 스타일링
[자동] 테스트 작성
[자동] 커밋 & 푸시
[완료] Claude에게 알림
```

### Claude 통합 (30분)

```
[자동] Codex 브랜치 머지
[자동] 통합 테스트
[자동] PR 생성 → main
[트리거] ChatGPT 리뷰 자동 시작
```

---

## 💬 ChatGPT 자동 리뷰 (5분)

```
[자동] PR 변경사항 분석
[자동] 7-Phase Review 수행
[자동] PR에 리뷰 코멘트 작성

리뷰 예시:
"# 🤖 ChatGPT Code Review

## Phase 1: Scope & Intent
✅ PR 범위가 명확하고 user profile 기능에 집중됨

## Phase 2: File-by-File Analysis
변경된 파일 15개:
- migrations/...: ✅ 적절
- src/api/profile.ts: ✅ 잘 구조화됨
- src/components/Profile/: ✅ 컴포넌트 분리 좋음

## Phase 3-6: ...

## Final Verdict: REQUEST_CHANGES
필수 수정사항:
1. 프로필 사진 업로드 시 파일 크기 제한 필요 (현재 무제한)
2. 비밀번호 변경 시 현재 비밀번호 확인 로직 누락
3. 테스트 커버리지 78% (목표 80%)

권장사항:
1. 프로필 편집 권한 체크 강화
2. 에러 메시지 다국어화 고려"
```

---

## 🔄 피드백 반영 (1시간)

### Claude Code (자동)

```
[자동] ChatGPT 리뷰 확인
[자동] 필수 수정사항 3개 처리
  1. 파일 크기 제한 추가 (10MB)
  2. 비밀번호 확인 로직 추가
  3. 테스트 보완 (커버리지 85%)
[자동] 재커밋 & 푸시
[트리거] ChatGPT 재리뷰
```

### ChatGPT 재리뷰 (자동, 2분)

```
"✅ 모든 필수 수정사항 반영 완료
✅ 테스트 커버리지 85%
✅ 보안 강화 적용

Final Verdict: APPROVE 👍

LGTM! 머지 가능합니다."
```

---

## ✅ 최종 승인 & 머지 (사용자, 2분)

1. PR 페이지 방문
2. 변경사항 최종 확인 (선택사항)
3. **Merge pull request** 클릭
4. **Confirm merge** 클릭
5. 브랜치 자동 삭제

완료! 🎉

---

## 📊 타임라인 요약

| 단계 | 소요 시간 | 담당 | 사용자 개입 |
|-----|----------|------|------------|
| 초기 설정 | 5분 | 사용자 | ✅ 필수 (최초 1회) |
| Issue 생성 | 1분 | 사용자 | ✅ 필수 |
| 프롬프트 생성 | 3분 | 사용자 | ✅ 필수 |
| Claude 백엔드 개발 | 4시간 | Claude | ❌ 자동 |
| Codex 프론트엔드 개발 | 3시간 | Codex | ❌ 자동 (병렬) |
| 통합 & PR | 30분 | Claude | ❌ 자동 |
| ChatGPT 리뷰 | 5분 | ChatGPT | ❌ 자동 |
| 피드백 반영 | 1시간 | Claude | ❌ 자동 |
| 재리뷰 | 2분 | ChatGPT | ❌ 자동 |
| 최종 승인 & 머지 | 2분 | 사용자 | ✅ 필수 |

**총 시간**: ~6시간 (자동화)
**사용자 시간**: ~11분

**ROI**: 사용자 11분 투자 → 6시간 개발 진행 = **30배 효율**

---

## 🎯 다음 단계

### 일일 루틴 (하루 30분)

#### 아침 (10분)
```
09:00 - Issue 2-3개 생성
09:05 - 프롬프트 파일 생성
09:10 - Claude Inbox 업데이트
```

#### 점심 (5분)
```
12:00 - PR 1-2개 승인 & 머지
```

#### 저녁 (15분)
```
18:00 - PR 2-3개 승인 & 머지
18:05 - 다음 날 작업 계획
18:10 - Issue 생성 (다음 날용)
18:15 - 완료 확인 및 배포
```

### 주간 루틴 (주 1시간)

#### 월요일 (30분)
- 이번 주 주요 기능 계획
- 우선순위 Issue 생성
- 프롬프트 사전 준비

#### 금요일 (30분)
- 주간 진행 상황 리뷰
- ChatGPT 리뷰 통계 확인
- 다음 주 계획

---

## 🔧 트러블슈팅

### Q: ChatGPT 리뷰가 안 나와요
**A**:
```bash
# Actions 탭 확인
# chatgpt-review 워크플로우 로그 확인

# API 키 확인
Settings → Secrets → CHATGPT_API_KEY 있는지 확인

# 없으면 수동 리뷰로 진행 (일시적)
```

### Q: Claude/Codex가 작업을 안 시작해요
**A**:
```
1. Claude Inbox 이슈에 프롬프트 링크 있는지 확인
2. 프롬프트 파일 형식 올바른지 확인 (P{number}-{agent}-{description}.md)
3. 우선순위 확인 (High 우선 처리)
```

### Q: 충돌(Conflict)이 발생했어요
**A**:
```bash
# Claude가 자동으로 해결하도록 코멘트
@claude-code please resolve merge conflicts in PR #12

# 또는 수동 해결 (필요시)
git checkout claude/feature-branch
git merge main
# (충돌 해결)
git commit -m "chore: resolve merge conflicts"
git push
```

### Q: 테스트가 실패해요
**A**:
```
# PR에 코멘트
@claude-code tests are failing, please fix

# Claude가 자동으로 수정
```

---

## 📚 추가 자료

### 필수 읽을거리
- `docs/3LLM_COLLABORATION_SYSTEM.md` - 전체 시스템 가이드
- `docs/BRANCH_STRATEGY.md` - Git 브랜치 전략
- `docs/PROMPT_QUEUE_AUTOMATION.md` - Prompt Queue 상세

### 프롬프트 템플릿
- `prompts/TEMPLATE-claude-feature.md` - Claude 기능 개발
- `prompts/TEMPLATE-codex-ui.md` - Codex UI 개발

### 예제
- `prompts/P0001-claude-prompt-queue-example.md` - 완료된 프롬프트 예제

---

## 🎉 축하합니다!

이제 3-LLM 협업 시스템이 가동 중입니다!

**하루 30분으로 6-10시간의 개발을 자동화하세요!** 🚀

---

## 💡 Pro Tips

1. **프롬프트는 구체적으로**
   - ❌ "로그인 만들어줘"
   - ✅ "OAuth 2.0 기반 로그인, JWT 토큰, 리프레시 토큰 포함"

2. **작은 단위로 나누기**
   - ❌ 1개 거대한 PR
   - ✅ 3-5개 작은 PR

3. **테스트 먼저 작성 요청**
   - TDD 접근으로 품질 향상

4. **정기적으로 main 동기화**
   - 충돌 방지

5. **ChatGPT 피드백 신뢰**
   - 보안/성능 이슈는 즉시 반영

Happy Collaborating! 🎊
