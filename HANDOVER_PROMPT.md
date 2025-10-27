# Handover Prompt for Next Session

Copy and paste this into the next Claude Code session to continue seamlessly:

---

## Context Restoration Prompt

```
I'm continuing work on the job board platform. Please read the HANDOVER.md file for full context.

**Current Status:**
- Branch: claude/continue-job-board-platform-011CUXakMfKGEgBkYeocRTkW
- Backend API: ✅ Running successfully on http://localhost:3000
- Database: ✅ MySQL running, schema updated
- Frontend: 🔄 Not started yet (needs to be launched)
- Location: C:\SpecCoding\jobboard-spec-suite (Windows PowerShell)

**Completed:**
- P0 features (search, bookmark, share, enhanced UI) - merged to main
- P1 features (SEO, advanced filters) - merged to main
- Database migration completed
- Docker infrastructure fixed (mysql2 dependency, Debian slim migration)

**Next Steps:**
1. Start the frontend development server
2. Test all P0 and P1 features
3. Verify everything works end-to-end
4. Consider creating a PR if needed

**Important Files:**
- HANDOVER.md - Complete handover documentation
- .env - Environment configuration
- docker-compose.yml - Services configuration
- frontend/ - Next.js frontend (not started)

Please help me continue from here. First, let me know if you need any clarification, then help me start the frontend and test the features.
```

---

## Alternative: Minimal Prompt

If you just need to jump straight into work:

```
Continue job board platform work. Read HANDOVER.md for context.

Current: Backend ✅ running, Frontend 🔄 needs start.
Branch: claude/continue-job-board-platform-011CUXakMfKGEgBkYeocRTkW
Location: C:\SpecCoding\jobboard-spec-suite

Help me start frontend and test P0/P1 features.
```

---

## Troubleshooting Prompt

If there are issues in the next session:

```
Continuing job board work. Please read HANDOVER.md.

I'm encountering [DESCRIBE ISSUE].

Context:
- Backend API should be on http://localhost:3000
- Database: MySQL in Docker (jobboard-mysql container)
- Frontend should run on http://localhost:3001
- All Docker fixes completed in previous session

Check HANDOVER.md section "🐛 Issues Resolved" for previously fixed issues.
```

---

## Commands Reference for Next Session

### Quick Start
```powershell
# Backend is already running, just check status
docker-compose ps

# If backend needs restart
docker-compose up -d

# Start frontend (in new PowerShell window)
cd C:\SpecCoding\jobboard-spec-suite\frontend
npm install  # First time only
npm run dev
```

### If Backend is Down
```powershell
cd C:\SpecCoding\jobboard-spec-suite
docker-compose up -d
docker-compose logs -f api
```

### View API Documentation
```
http://localhost:3000/api/docs
```

---

## Expected Session Flow

1. **Session Start** → Paste handover prompt
2. **Claude reads HANDOVER.md** → Understands full context
3. **Frontend setup** → Claude helps start frontend
4. **Testing** → Verify P0/P1 features work
5. **Next steps** → PR creation or additional work

---

**Note:** Keep this file and HANDOVER.md in the repository for future reference.
