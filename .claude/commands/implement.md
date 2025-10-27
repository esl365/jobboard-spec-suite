# /implement - Claude Code-Led Implementation with Codex Feedback

**New 2-LLM Collaboration Model:**
- Claude Code: Lead developer (specs + implementation)
- Codex: Code reviewer (feedback only, 2-3 iterations)
- Gemini: Excluded (API issues)

---

## Workflow Overview

```
User → /implement → Claude Code (specs + code) → PR → Codex feedback →
Claude Code (improvements) → Codex 2nd review → User approval
```

**Total user time: 8-10 minutes**
**Automation: 95%+**

---

## Step-by-Step Process

### 1. Trigger Command

User comments on GitHub Issue:
```
/implement
```

Or in Claude Code session:
```
User: Implement Issue #20
```

---

### 2. Claude Code: Spec-First Analysis

**Analyze the Issue and create specifications:**

#### 2.1 OpenAPI Specification
- Read existing `openapi/api-spec.yaml`
- Add new endpoints
- Define request/response schemas
- Document authentication requirements
- Add error responses

#### 2.2 Database Schema (if needed)
- Create migration file: `migrations/YYYYMMDD_HHMMSS_{feature}.sql`
- Define tables/columns
- Add indexes
- Include comments

#### 2.3 Policy Documentation (if needed)
- Create `docs/policies/{feature}-policy.md`
- Define validation rules
- Specify authorization requirements
- Document business constraints

---

### 3. Claude Code: Full Implementation

**Implement everything:**

#### 3.1 Backend
- API routes (`src/routes/`)
- Business logic (`src/services/`)
- Database access (`src/repositories/`)
- Validation & error handling

#### 3.2 Frontend (if needed)
- Components (`src/components/`)
- API integration
- State management
- Styling

#### 3.3 Tests
- Unit tests
- Integration tests
- API tests
- Aim for 80%+ coverage

---

### 4. Claude Code: Create PR

```bash
git checkout -b claude/feature-{feature-name}-{issue-number}
git add .
git commit -m "feat: implement {feature-name}

- Add OpenAPI spec
- Implement {components}
- Add tests
- Update documentation

Closes #{issue-number}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin claude/feature-{feature-name}-{issue-number}

gh pr create \
  --title "feat: implement {feature-name}" \
  --body "...details..." \
  --label "awaiting-codex-review"
```

**Add PR comment:**
```
@codex 초벌 구현 완료했습니다. 리뷰 부탁드립니다!

체크 포인트:
- [ ] 코드 품질
- [ ] 에러 처리
- [ ] 테스트 커버리지
- [ ] 보안 이슈
- [ ] 성능 최적화

2-3회 피드백 예상합니다.
```

---

### 5. Codex: First Review (Manual)

**Codex reviews PR and comments:**

```markdown
## 📋 Codex Review (1/3)

### ✅ Strengths
- Clean code structure
- Good test coverage (85%)
- Proper error handling

### ⚠️ Suggestions
1. **Security**: Password hashing algorithm
   - Current: bcrypt rounds=10
   - Recommend: rounds=12 for better security

2. **Performance**: Database query optimization
   - Add index on `users.email` for faster lookups

3. **Code Quality**: Error messages
   - Generic messages → More specific user-friendly messages

### 💡 Minor Issues
- Typo in comment (line 45)
- Unused import (line 3)

### 🎯 Action Required
Please address security and performance items.
Minor issues are optional.

Ready for iteration 2/3.
```

---

### 6. Claude Code: Apply Feedback (Automatic)

**Detect Codex comment and auto-respond:**

```markdown
## 🔧 Claude Code: Applying Feedback

Processing Codex review (1/3)...

### Changes Made:
✅ **Security**: Updated bcrypt rounds to 12
✅ **Performance**: Added index on users.email
✅ **Error Messages**: Improved user-facing messages
✅ **Code Quality**: Fixed typo and removed unused import

### Files Updated:
- `src/auth/password.ts`: bcrypt config
- `migrations/20251027_add_email_index.sql`: new index
- `src/auth/errors.ts`: error messages
- `src/routes/auth.ts`: cleanup

### Commits:
- feat: improve security (bcrypt rounds)
- perf: add email index for faster lookups
- refactor: improve error messages

Pushed to `claude/feature-{feature-name}-{issue-number}`

@codex 피드백 반영 완료! 재검토 부탁드립니다. (Iteration 2/3)
```

---

### 7. Codex: Second Review (Manual)

```markdown
## 📋 Codex Review (2/3)

### ✅ All Issues Addressed
- Security: ✅ bcrypt rounds=12
- Performance: ✅ Email index added
- Error messages: ✅ Much better!
- Code cleanup: ✅ Done

### 🎉 LGTM (Looks Good To Me)

No further changes needed.
Ready for user approval!

### Final Score: 9.5/10
Great work! This is production-ready.
```

---

### 8. Claude Code: Final Response

```markdown
## ✅ Implementation Complete

Codex review completed (2/3 iterations).

### Summary:
- ✅ All specs implemented
- ✅ Tests passing (85% coverage)
- ✅ Codex feedback addressed
- ✅ No issues remaining

### Ready for Merge:
@{user} PR is ready for your approval!

**Total iterations:** 2/3
**Total time:** ~1 hour automated
```

---

### 9. User: Approve & Merge

**User reviews PR and merges** (3 minutes)

✅ Done!

---

## Feedback Loop Rules

### Iteration Limits
- **Maximum:** 3 iterations
- **Typical:** 2 iterations
- **Minimum:** 1 iteration (if perfect)

### When to Stop
1. Codex says "LGTM"
2. 3 iterations reached
3. All critical issues resolved

### What Counts as Iteration
- Each Codex review = 1 iteration
- Claude Code response = same iteration
- New Codex review = next iteration

---

## Communication Protocol

### Claude Code → Codex
```
"@codex {status} 완료! 리뷰 부탁합니다. (Iteration {N}/3)"
```

### Codex → Claude Code
```
"## 📋 Codex Review ({N}/3)"
```

### Codex → User
```
"✅ LGTM - Ready for approval"
```

---

## Success Criteria

- [x] Specs written (OpenAPI/DB/Policy)
- [x] Full implementation complete
- [x] Tests passing (80%+)
- [x] PR created
- [x] Codex reviewed (1-3 times)
- [x] All feedback addressed
- [x] User approved
- [x] Total user time < 15 minutes

---

## Example: Health Check Feature

**Issue #20:** Add Health Check Endpoint

**1. User:** `/implement` (on Issue #20)

**2. Claude Code:**
- Write OpenAPI spec for GET /health
- Implement `src/routes/health.ts`
- Add tests `tests/routes/health.test.ts`
- Create PR #21

**3. Codex Review 1:**
```
⚠️ Suggestion: Add timestamp validation test
💡 Minor: JSDoc comments would help
```

**4. Claude Code:**
- Add timestamp validation test
- Add JSDoc comments
- Push update

**5. Codex Review 2:**
```
✅ LGTM! Perfect.
```

**6. User:** Approve → Merge

**Total:** 8 minutes user time, 1 hour automated

---

## Advantages of This Model

### ✅ Pros
- Simple: Only 2 LLMs (vs 4)
- Fast: No Gemini API delays
- Reliable: No API failures
- High quality: Codex feedback improves code
- Flexible: 2-3 iterations for quality

### 🎯 Compared to Original 4-LLM
| Aspect | 4-LLM (Gemini) | 2-LLM (Claude+Codex) |
|--------|----------------|----------------------|
| Spec generation | Gemini (5min, API) | Claude Code (10min, direct) |
| Implementation | Claude + Codex | Claude Code (everything) |
| Review | ChatGPT | Codex (feedback) |
| Reliability | ⚠️ API failures | ✅ Stable |
| User time | 5-10min | 8-10min |
| Automation | 99.8% | 95%+ |

**Trade-off:** +5 minutes user time, but 100% reliability

---

## Notes

- Claude Code can handle full-stack implementation
- Codex provides quality assurance through feedback
- 2-3 iterations ensure high quality without over-engineering
- No Gemini = No API headaches
- User still only needs 8-10 minutes per feature
- This is pragmatic and production-ready

---

**Remember:** The goal is reliable automation, not perfect automation.
This model achieves 95%+ automation with 100% reliability.
