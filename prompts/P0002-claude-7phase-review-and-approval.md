# P0002 (claude-code) — 7-phase review & approval for PR #1

Pre-req
- Codex posted evidence on PR #1 showing tests ✅ and `drift mismatches: 0`.

Tasks
1) Post on PR #1:
   - Cross-link to docs PR (#2)
   - (Short route) Approval block:

     **7-Phase Review: PASS — APPROVE**
     - Drift: **0** (`drift mismatches: 0`)
     - Auth/RBAC OK; Idempotency OK
     - Exactly-Once OK (de-dupe BEFORE effects; single TX; replay=200/no double credit)
     - DDL scope: v1 deltas only + unique (provider,event_uid)
     - Tests + preflight: ✅
     Follow-up: GAP-003 — vendor @redocly/cli (prefer vendored→global→offline in CI)

   - Or post detailed Deliverables 1–3 + SPEC_GAPS status.

2) Final verdict comment: **APPROVE** (when drift=0), otherwise **REQUEST CHANGES** and open SPEC_GAP.

Done
- Links to PR comments
- Final verdict line
- `NOTIFY-USER:` final line
