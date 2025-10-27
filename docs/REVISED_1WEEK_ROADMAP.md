# Revised 1-Week MVP Roadmap

**Document Version:** 1.0
**Created:** 2025-10-27
**Based on:** Codex Feedback Implementation
**Status:** Ready to Execute

---

## Overview

This roadmap incorporates Codex feedback and reflects the reality that we've already completed 20% of the MVP in 5-6 hours. With frontend-first approach and E2E testing earlier, we aim to complete the MVP in 1 week (25-30 hours total).

---

## Day 1 (Monday) - 4-5 hours ✅ COMPLETED

### Morning (2-3 hours) - Frontend Foundation ✅
- [x] Next.js 14 project setup (20 min)
- [x] API client + Auth store (40 min)
- [x] Login page + Jobs list page (1 hour)
- [x] Test: Can login, see jobs list (even if empty)

### Afternoon (2 hours) - Backend Refinements ✅
- [x] Payment provider abstraction (1.5 hours)
  - Interface, Toss refactor, Stripe stub, Factory
- [x] Database schema update for provider field (10 min)
- [x] Quick manual test (20 min)

**End of Day 1:**
✅ Working frontend shell
✅ Payment abstraction ready for future
✅ Can see "full stack" (backend + frontend)

---

## Day 2 (Tuesday) - 4 hours

### Frontend Core (4 hours)
- [ ] Job posting page (1.5 hours)
  - Form with validation
  - Template selection (if ready)
- [ ] Job detail page (1 hour)
  - Display job info
  - Apply button
- [ ] Application form (1 hour)
  - Resume selection/upload
  - Cover letter
- [ ] Basic navigation & layout (30 min)

**End of Day 2:**
✅ Can post a job
✅ Can view job details
✅ Can apply to job

---

## Day 3 (Wednesday) - 4 hours

### Integration & Refinement (4 hours)
- [ ] Company dashboard (1.5 hours)
  - List my jobs
  - View applications
- [ ] Candidate dashboard (1 hour)
  - My applications
  - Status display
- [ ] Email notifications working (1 hour)
  - Application received
  - Status changes
- [ ] Styling polish (30 min)
  - Make it not ugly

**End of Day 3:**
✅ Full user journey works
✅ Email notifications send
✅ Dashboard shows data

---

## Day 4 (Thursday) - 4 hours

### Testing & E2E (4 hours)
- [ ] E2E test setup (if not done) (30 min)
- [ ] Run E2E critical path (30 min)
- [ ] Fix integration bugs found (2 hours)
- [ ] Manual testing (1 hour)
  - Register → Post → Apply → Email
  - Check all happy paths

**End of Day 4:**
✅ E2E tests passing (or close)
✅ Major integration issues fixed
✅ Confident in core flow

---

## Day 5 (Friday) - 3 hours

### Admin & Edge Cases (3 hours)
- [ ] Minimal admin dashboard (1 hour)
  - Stats only (4 cards)
- [ ] Error handling (1 hour)
  - Show errors nicely
  - Handle edge cases
- [ ] Validation improvements (1 hour)
  - Better form validation
  - API error messages

**End of Day 5:**
✅ Admin can see stats
✅ Errors handled gracefully
✅ No crashes on bad input

---

## Day 6 (Saturday) - 3 hours

### Performance & Polish (3 hours)
- [ ] Performance check (1 hour)
  - API response times < 200ms
  - Frontend loads < 2s
- [ ] UI polish (1 hour)
  - Consistent spacing
  - Loading states
  - Success/error messages
- [ ] Mobile responsive check (1 hour)
  - Test on mobile viewport
  - Fix major issues

**End of Day 6:**
✅ Fast and responsive
✅ Looks professional
✅ Works on mobile

---

## Day 7 (Sunday) - 3 hours

### Documentation & Deployment (3 hours)
- [ ] README update (30 min)
  - Setup instructions
  - Environment variables
  - Running locally
- [ ] Deployment (1.5 hours)
  - Choose platform (Railway/Render/Vercel)
  - Deploy backend + frontend
  - Configure environment
- [ ] Smoke test production (1 hour)
  - Register test user
  - Post test job
  - Apply to job
  - Verify emails

**End of Day 7:**
✅ Deployed to production
✅ Working end-to-end in prod
✅ Ready for beta users

---

## Scope Guarantee

### IN Scope:
- ✅ User registration & login
- ✅ Company posts job
- ✅ Candidate applies
- ✅ Email notifications
- ✅ Basic dashboards
- ✅ Admin stats (view only)
- ✅ Payment initiation (flow exists)

### OUT of Scope (Phase 2):
- ❌ Advanced job search filters
- ❌ Resume parsing
- ❌ Video interviews
- ❌ Team collaboration features
- ❌ Advanced analytics
- ❌ Payment confirmation (full flow)
- ❌ User management tools

---

## Success Criteria

**MVP is complete when:**
1. New user can register
2. Company can post job in < 2 minutes
3. Candidate can browse and apply
4. Email notifications work
5. Status updates visible
6. Admin can see stats
7. Deployed and accessible online
8. No critical bugs in happy path

---

## Risk Mitigation

**Top Risks:**
1. **Frontend takes longer** → Cut features, keep core only
2. **Integration issues** → E2E tests catch early (Day 4)
3. **Deployment problems** → Test deploy on Day 5, fix Day 6
4. **Scope creep** → Strict "NO" to new features

**Contingency:**
If behind schedule by Day 5:
- Cut admin dashboard
- Cut email templates (use plain text)
- Cut styling polish
- Focus on working > pretty

---

## Progress Tracking

### Completed (Day 1)
- ✅ Frontend Next.js 14 setup with TypeScript
- ✅ API client with token refresh interceptors
- ✅ Zustand auth store with persistence
- ✅ Login page and Jobs list page
- ✅ CORS configuration for frontend
- ✅ Payment provider abstraction (IPaymentProvider)
- ✅ Toss Payments provider implementation
- ✅ Stripe provider stub
- ✅ Payment provider factory pattern
- ✅ Database schema updated (provider field)

### Remaining (Days 2-7)
- 21-25 hours of work
- Frontend completion (Days 2-3)
- E2E testing (Day 4)
- Polish and deployment (Days 5-7)

---

## Time Breakdown

```
Day 1: ✅ 4-5 hours (Frontend + Payment Abstraction) - DONE
Day 2: ⏳ 4 hours (Frontend Core)
Day 3: ⏳ 4 hours (Integration & Dashboards)
Day 4: ⏳ 4 hours (E2E Testing)
Day 5: ⏳ 3 hours (Admin & Error Handling)
Day 6: ⏳ 3 hours (Performance & Polish)
Day 7: ⏳ 3 hours (Documentation & Deployment)
─────────────────────────────────
Total: 25-30 hours (1 week @ 3-5 hours/day)
```

---

## Next Steps

**Immediate (Day 2):**
1. Start building job posting page
2. Implement job detail page
3. Create application form
4. Add navigation

**This Week:**
- Follow daily plan strictly
- No scope creep
- Ship working > perfect
- Deploy by Sunday

---

## Key Decisions Made

1. **Frontend First**: Start Day 1 (not Day 2) - highest risk item
2. **E2E Early**: Day 4 (not Day 6) - catch integration issues sooner
3. **Admin Minimal**: Stats only - no management features in MVP
4. **Payment Abstract**: Multi-provider support from Day 1
5. **Redis Deferred**: Remove from MVP, add later when needed

---

**Generated:** 2025-10-27
**Status:** In Progress (Day 1 Complete)
**Expected Completion:** 2025-11-03 (7 days from start)
