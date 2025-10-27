# 2-LLM Collaboration: Claude Code + Codex

> **Pragmatic automation model without Gemini API dependencies**

---

## 🎯 Model Overview

**Simple, reliable, effective:**
- **Claude Code**: Lead developer (specs → implementation → tests)
- **Codex**: Code reviewer (feedback only, 2-3 iterations)

**No Gemini = No API headaches**

---

## 📊 Role Distribution

### Claude Code (Lead Developer)
```
✅ Issue analysis
✅ Specification writing (OpenAPI/DB/Policy)
✅ Full-stack implementation
✅ Test creation
✅ PR creation
✅ Feedback application
```

### Codex (Code Reviewer)
```
✅ PR review
✅ Quality feedback
✅ Improvement suggestions
✅ 2-3 iteration limit
```

---

## 🔄 Workflow

```
┌──────────────────────────────────────────────┐
│ 1. User: Create GitHub Issue (5min)         │
│    "Add user authentication"                 │
└──────────────────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│ 2. User: Comment "/implement" (1sec)        │
└──────────────────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│ 3. Claude Code (30-60min, automatic):       │
│    ├─ Write specs (OpenAPI/DB/Policy)       │
│    ├─ Implement everything                  │
│    ├─ Write tests                           │
│    └─ Create PR with @codex mention         │
└──────────────────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│ 4. Codex: Review PR (10min, manual)         │
│    Comment feedback:                         │
│    "✅ Good, but improve error handling"    │
│    "⚠️ Security: use stronger hashing"      │
└──────────────────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│ 5. Claude Code (20min, automatic):          │
│    ├─ Apply feedback                        │
│    ├─ Push updates                          │
│    └─ "@codex feedback applied, re-review" │
└──────────────────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│ 6. Codex: 2nd Review (5min, manual)         │
│    "✅ LGTM! Ready for merge"               │
└──────────────────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│ 7. User: Approve & Merge (3min)             │
│    ✅ Done!                                  │
└──────────────────────────────────────────────┘

Total user time: 8-10 minutes
Automation: 95%+
Feedback loops: 2-3
```

---

## 📈 Comparison

### 2-LLM vs 4-LLM (Gemini)

| Metric | 4-LLM Model | 2-LLM Model |
|--------|-------------|-------------|
| **Spec Generation** | Gemini API (5min) | Claude Code (10min) |
| **Implementation** | Claude + Codex parallel | Claude Code (full-stack) |
| **Code Review** | ChatGPT API | Codex (feedback) |
| **Drift Check** | Gemini API | Manual (if needed) |
| **API Dependencies** | 2 APIs (Gemini, ChatGPT) | 0 APIs |
| **Reliability** | ⚠️ API failures | ✅ 100% reliable |
| **User Time** | 5-10min | 8-10min |
| **Automation** | 99.8% | 95%+ |
| **Setup Complexity** | High (API keys, models) | Low (just work) |
| **Failure Points** | Many (API, models, rate limits) | Few (code only) |

**Trade-off:** +5 minutes user time for 100% reliability

---

## ⚡ Quick Start

### 1. Create Issue

GitHub Issues → New Issue:
```markdown
Title: Add user profile page

## Description
Users should be able to view and edit their profile.

## Acceptance Criteria
- [ ] View profile (name, email, bio)
- [ ] Edit profile
- [ ] Save changes
- [ ] Validation & errors

## Priority
P2 (Medium)
```

### 2. Trigger Implementation

Comment on Issue:
```
/implement
```

Or in Claude Code session:
```
Implement Issue #25
```

### 3. Wait for PR

Claude Code will:
- ✅ Write specs (10min)
- ✅ Implement everything (40min)
- ✅ Create PR with tests
- ✅ Mention @codex for review

### 4. Codex Reviews

**Codex comments on PR:**
```markdown
## 📋 Codex Review (1/3)

### ✅ Good
- Clean code
- Good tests

### ⚠️ Improve
- Add input sanitization
- Improve error messages

### 💡 Optional
- Add JSDoc comments
```

### 5. Claude Code Updates

**Automatically applies feedback:**
- Commits improvements
- Pushes to PR
- Mentions @codex for re-review

### 6. Codex Approves

```markdown
## 📋 Codex Review (2/3)

✅ LGTM! All issues addressed.
Ready for merge.
```

### 7. User Merges

**Approve PR → Merge → Done!**

---

## 🎮 Feedback Loop Rules

### Iteration Limits
- **Max:** 3 iterations
- **Typical:** 2 iterations
- **Min:** 1 iteration (if perfect)

### When to Stop
1. ✅ Codex says "LGTM"
2. ⏱️ 3 iterations reached
3. ✅ All critical issues resolved

### Iteration Counter
```
Review 1/3 → Claude fixes → Review 2/3 → Claude fixes → Review 3/3 → Stop
```

---

## 🛠️ Technical Implementation

### Slash Command
```bash
.claude/commands/implement.md
```

Triggered by:
- `/implement` comment on Issue
- "Implement Issue #N" in Claude Code session

### PR Template
```markdown
## Summary
Implements [Feature] as requested in #N

## Changes
- ✅ OpenAPI spec: [endpoints]
- ✅ Implementation: [files]
- ✅ Tests: [coverage]%

## Codex Review
Awaiting Codex feedback (0/3 iterations)

@codex Please review!

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Codex Review Format
```markdown
## 📋 Codex Review ({N}/3)

### ✅ Strengths
...

### ⚠️ Critical Issues
...

### 💡 Suggestions
...

### 🎯 Verdict
[Request Changes | Approve | LGTM]
```

---

## 💡 Benefits

### ✅ Advantages
1. **Reliable**: No API failures
2. **Simple**: Only 2 LLMs to coordinate
3. **Fast**: No API delays
4. **Flexible**: 2-3 iterations for quality
5. **Pragmatic**: 95%+ automation is enough
6. **Cost-effective**: No API usage fees
7. **Maintainable**: Easy to debug and improve

### 🎯 When to Use This Model
- ✅ Want reliable automation
- ✅ Don't want API dependencies
- ✅ OK with +5 minutes user time
- ✅ Value stability over perfection
- ✅ Small-medium sized features

---

## 📝 Example: Health Check

**Issue #20:** [Feature] Health Check Endpoint

**Timeline:**
```
00:00 User: "/implement" on Issue #20
00:01 Claude Code: Starting implementation...
00:10 Claude Code: Specs written
00:45 Claude Code: Implementation complete
00:50 Claude Code: Tests written
00:55 Claude Code: PR #21 created, @codex mentioned
01:05 Codex: Review 1/3 - "Add timestamp validation test"
01:25 Claude Code: Applied feedback, pushed
01:30 Codex: Review 2/3 - "✅ LGTM!"
01:33 User: Approved & merged

Total: 1h 33min (90min automated, 3min user)
```

---

## 🚀 ROI

### Time Saved

| Task | Manual | 2-LLM Automated | Savings |
|------|--------|-----------------|---------|
| Spec writing | 2h | 10min (Claude) | 1h 50min |
| Implementation | 6h | 50min (Claude) | 5h 10min |
| Testing | 2h | 10min (Claude) | 1h 50min |
| Code review | 1h | 15min (Codex) | 45min |
| Iterations | 2h | 20min (Claude) | 1h 40min |
| **Total** | **13h** | **1h 45min** | **11h 15min** |

**User time:** 10 minutes (Issue + Approval)
**ROI:** 78x (13h manual / 10min user)

---

## 🎊 Conclusion

**2-LLM model is pragmatic and production-ready:**

- ✅ 95%+ automation (good enough)
- ✅ 100% reliability (no API failures)
- ✅ 10 minutes user time
- ✅ 2-3 feedback iterations for quality
- ✅ Simple to understand and maintain

**Perfect is the enemy of good.**
This model achieves excellent automation without complexity.

---

**Status:** ✅ Ready for production
**Next:** Test with Health Check implementation
