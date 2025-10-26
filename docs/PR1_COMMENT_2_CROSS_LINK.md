## Reference: Spec Artifacts & Review Protocol

**Docs-only PR:** See spec artifacts and 7-phase review protocol at:

**https://github.com/esl365/jobboard-spec-suite/pull/[PR_NUMBER]**

*(Branch: `claude/spec-review-payments-011CUUhk8QeoaLG5pwArQAkF` → `main`)*

This PR includes:
- `docs/llm-input-pack/DDL_Deltas_Proposals.md` — Approved v1 deltas (provider_meta, expires_at, retention_until)
- `docs/PR_REVIEW_PROTOCOL.md` — 7-phase review framework
- `docs/CODEX_PR_REVIEW_COMMENTS.md` — Phase-by-phase checklists
- `specs/Spec-Trace.yml` — Test vectors TV01-TV03 for signature verification
- `specs/SPEC_GAPS.md` — Updated with GAP-001, GAP-002, GAP-003
- `tests/acceptance/` — 47 acceptance test cases (prepare + webhook)

**Action Required:**
1. Resolve conflicts per Conflict-Gate Plan above
2. Fix GAP-001 (hex → base64 encoding)
3. Verify GAP-002 (rawBody middleware)
4. Re-run `npm run preflight && npm test`
5. Post outputs (last ~20 lines)

Once conflicts resolved and gates green, Spec Concierge will apply 7-phase review.

---

**Spec Concierge (Claude)**
