# Conflict-Gate Plan (Spec-First)

**PR Status:** Merge conflicts detected — resolution required before review

**Conflicted Files:** 6 files require canonical resolution
- `package.json`
- `scripts/openapi-lint.mjs`
- `src/infra/memory/payments.repos.ts`
- `src/payments/adapters/mock.ts`
- `src/payments/registry.ts`
- `src/routes/webhooks.payments.ts`

---

## Canonical Resolutions

### 1. `package.json`

**Resolution:** Use consolidated `preflight.mjs` from main + keep Codex's real test commands

```json
{
  "scripts": {
    "preflight": "node scripts/preflight.mjs",
    "test": "node --loader ./scripts/ts-esm-loader.mjs --test tests/payments.prepare.test.ts && node --loader ./scripts/ts-esm-loader.mjs --test tests/payments.webhooks.test.ts"
  },
  "devDependencies": {
    "@redocly/cli": "file:./tools/redocly/redocly-cli-2.8.0.tgz",
    "yaml": "^2.6.0"
  }
}
```

**Rationale:** Consolidated preflight is cleaner; Codex tests are functional (main's stub is not)

**Gate:** If `tools/redocly/redocly-cli-2.8.0.tgz` missing → SPEC_GAPS GAP-003 (non-blocking)

---

### 2. `scripts/openapi-lint.mjs`

**Resolution:** Accept main's comprehensive YAML-based linting

**Rationale:** Main's implementation is more robust (YAML parsing, better error reporting)

**Required:** Offline fallback acceptable for v1, but create follow-up PR to vendor Redocly for DoD

---

### 3. `src/infra/memory/payments.repos.ts`

**Resolution:** Accept Codex (HEAD) implementation entirely

**Verify:**
- Interface matches DB repository contract
- No raw SQL leakage
- In-memory impl is ONLY for unit tests

---

### 4. `src/payments/adapters/mock.ts` ⚠️ **REQUIRES FIX**

**Resolution:** Accept Codex implementation with **critical encoding fix**

**❌ BLOCKING ISSUE:** Signature encoding mismatch

**Current (line 19):**
```typescript
return crypto.createHmac("sha256", secret).update(raw).digest("hex");
```

**Required (SPEC_GAPS GAP-001):**
```typescript
return crypto.createHmac("sha256", secret).update(raw).digest("base64");
```

**Also fix line 25:**
```typescript
// Change from:
const signatureBuffer = Buffer.from(signature, "hex");
const expectedBuffer = Buffer.from(expected, "hex");

// To:
const signatureBuffer = Buffer.from(signature, "base64");
const expectedBuffer = Buffer.from(expected, "base64");
```

**Why:** `specs/Spec-Trace.yml` test vectors (TV01-TV03) specify **base64 encoding**. Current hex encoding breaks contract conformance.

**Action:** Fix before merge (blocking)

---

### 5. `src/payments/registry.ts`

**Resolution:** Accept Codex (HEAD) implementation entirely

**Verify:** Registry only registers `mock` provider (no "iamport" in default)

**Gate:** If "iamport" or any non-mock provider in default registry → BLOCK merge

---

### 6. `src/routes/webhooks.payments.ts` ⚠️ **REQUIRES VERIFICATION**

**Resolution:** Accept Codex (HEAD) implementation with verification

**✅ Verified:**
- HMAC verification over rawBody
- Constant-time compare via adapter
- Timestamp tolerance ±300s
- Event de-dupe BEFORE effects
- Single transaction boundary
- Replay returns 200 without duplicate credits

**⚠️ Issue (SPEC_GAPS GAP-002):** rawBody fallback

**Line 43:**
```typescript
const rawBody = typeof request.rawBody === "string" ? request.rawBody : stableStringify(request.body ?? {});
```

**Risk:** Re-stringifying body may not match original wire format (timing attack vulnerability)

**Required:** Verify middleware captures `request.rawBody` BEFORE JSON parsing

**Action:** If middleware proven present in integration tests → non-blocking; otherwise add middleware

---

## Resolution Process

**DO:**
1. ✅ Resolve conflicts **locally** (3-way merge) — preserves type signatures
2. ✅ After resolution, run:
   ```bash
   npm run preflight
   npm test
   ```
3. ✅ Post outputs (last ~20 lines) in PR comment
4. ✅ Ping @spec-concierge when resolution pushed

**DON'T:**
1. ❌ Use GitHub web editor (loses type safety)
2. ❌ Skip preflight/test verification
3. ❌ Introduce new dependencies without SPEC_GAPS gate

---

## SPEC_GAPS Created

**GAP-001:** Signature encoding drift (hex vs. base64) — **BLOCKING**
**GAP-002:** rawBody fallback may re-stringify — **REQUIRES VERIFICATION**
**GAP-003:** Redocly CLI not vendored — **NON-BLOCKING** (follow-up PR required for DoD)

See `specs/SPEC_GAPS.md` for full details.

---

## Next Actions

1. **Codex:** Resolve conflicts locally per canonical resolutions above
2. **Codex:** Fix GAP-001 (hex → base64) in `src/payments/adapters/mock.ts`
3. **Codex:** Verify GAP-002 (middleware provides `request.rawBody`)
4. **Codex:** Run `npm run preflight && npm test`, paste outputs
5. **Codex:** Push resolution
6. **Spec Concierge:** Apply 7-phase review once conflicts resolved and preflight green

---

**Reviewed by:** Spec Concierge (Claude)
**Full resolution plan:** `docs/PR1_CONFLICT_GATE_PLAN.md`
