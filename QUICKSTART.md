# ⚡ Quick Start Guide

**For:** Quickly resuming work or testing the application
**Time:** 5-10 minutes
**Prerequisites:** Docker, Node.js 20+

---

## 🏃 Start Everything (3 Commands)

```bash
# 1. Start backend services
docker-compose up -d

# 2. Start frontend (in new terminal)
cd frontend && npm run dev

# 3. Open browser
# http://localhost:3001
```

Done! You should see the job board with 10 seed jobs.

---

## 🧪 Quick Test (2 Minutes)

```bash
# Test backend
curl http://localhost:3000/api/v1/health
# Expected: {"status":"ok"}

curl http://localhost:3000/api/v1/jobs
# Expected: JSON with 10 jobs

# Test frontend
# Open: http://localhost:3001
# Expected: Job board with search and filters
```

---

## 🔑 Quick Login

Use any of these test accounts:

**Job Seeker:**
```
Email: john.doe@example.com
Password: password123
```

**Company:**
```
Email: samsung@example.com
Password: password123
```

---

## ✅ Quick Feature Test

1. **Search:** Type "engineer" → See filtered results
2. **Filters:** Click "Filters" → Try location/remote/type
3. **Bookmark:** Login → Click star icon (should toggle)
4. **Share:** Click share button → URL copied

---

## 🐛 Quick Debug

### Backend not starting?
```bash
docker-compose logs api --tail 50
```

### Frontend not connecting?
```bash
# Check .env in frontend/
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### See 429 errors?
```bash
# Rate limit is set to 100/min (dev mode)
# Check: src/app.module.ts line 28
```

---

## 🔄 Quick Reset

```bash
# Reset database
docker-compose down -v
docker-compose up -d
sleep 10
docker-compose exec api npx ts-node prisma/seed.ts

# Reset frontend
cd frontend
rm -rf .next
npm run dev
```

---

## 📋 Quick Checklist

Before calling work "done":

- [ ] Backend health check returns OK
- [ ] Frontend shows 10 jobs
- [ ] Search works
- [ ] Filters work
- [ ] Bookmark works (after login)
- [ ] Share button works
- [ ] No 429 errors in console

---

## 🎯 Current Branch

```bash
git checkout claude/continue-job-board-frontend-011CUY4BY317qSHYg9DrSGXQ
git pull
```

---

## 📖 Need More Info?

- **Full Context:** Read `HANDOVER.md`
- **Current Status:** Read `STATUS.md`
- **New Session:** Read `NEW_SESSION_PROMPT.md`
- **Deployment:** Read `DEPLOY.md`

---

**Last Updated:** 2025-10-27
