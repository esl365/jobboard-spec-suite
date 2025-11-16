# Conflict-Gate Plan (Spec-First)

**PR:** feat(payments): implement prepare + webhook (idempotent, provider-neutral)
**Status:** Merge conflicts detected — resolution required before review
**Reviewer:** Spec Concierge (Claude)

---

## Conflicted Files & Canonical Resolutions

### 1. `package.json`

**Conflict:** Scripts section differs between branches
- **HEAD (Codex):** Individual scripts (`openapi-merge-payments.mjs`, `openapi-lint.mjs`, `spec-drift-check.mjs`) + real test commands
- **main:** Consolidated `preflight.mjs` + stub test command + Redocly CLI dependency

**Canonical Resolution:**
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

**Rationale:**
- Use consolidated `preflight.mjs` (cleaner pipeline)
- **Keep Codex test commands** (main's stub is not functional)
- Preserve Node 20 target from main
- **GATE:** If `tools/redocly/redocly-cli-2.8.0.tgz` is missing, keep offline fallback but add SPEC_GAPS entry requiring vendored Redocly for DoD

---

### 2. `scripts/openapi-lint.mjs`

**Conflict:** Basic checks (HEAD) vs. comprehensive YAML-based linting (main)

**Canonical Resolution:**
- **Accept main's version** (comprehensive YAML-based linting with YAML.parse)
- **Add logic:** Prefer vendored Redocly if present → fallback to offline linter
- **Required enhancement:**
  ```javascript
  // At top of file, try Redocly first:
  import { execSync } from 'node:child_process';

  try {
    const redoclyPath = './node_modules/@redocly/cli/bin/cli.js';
    if (fs.existsSync(redoclyPath)) {
      console.log('[lint] Using vendored Redocly CLI...');
      execSync(`node ${redoclyPath} lint ${file}`, { stdio: 'inherit' });
      process.exit(0);
    }
  } catch (e) {
    console.warn('[lint] Redocly CLI failed or not found, falling back to offline linter');
  }

  // Then proceed with existing YAML-based offline linting
  ```

**Rationale:**
- Main's linter is more robust (YAML parsing, better error reporting)
- Codex's basic checks are insufficient for production
- Offline fallback is acceptable temporarily, but **require follow-up PR to vendor Redocly under `tools/`** for CI

**GATE:** Add to SPEC_GAPS if Redocly not vendored; mark as non-blocking but required for DoD

---

### 3. `src/infra/memory/payments.repos.ts`

**Conflict:** Full implementation (HEAD) vs. placeholder stubs (main)

**Canonical Resolution:**
- **Accept Codex (HEAD) implementation** entirely
- **Verify:** Interface matches DB repository contract (no leaking raw SQL)
- **Confirm:** In-memory impl is ONLY for unit tests (not production)

**Critical Checks:**
1. `InMemoryTransaction` implements `PaymentsRepositoryTransaction` interface correctly
2. Methods match expected signatures:
   - `findIdempotencyRecord(key, userId, method, path)`
   - `saveIdempotencyRecord(record)`
   - `findOrderById(orderId)`
   - `findOrderByProviderReference(provider, providerPaymentId)`
   - `updateOrder(orderId, patch)`
   - `insertWalletLedger(entry)`
   - `findWebhookEvent(eventUid)`
   - `insertWebhookEvent(event)`
   - `getProductPackage(packageId)`
3. Transaction boundary: `runInTransaction(fn)` properly clones state before/after
4. No raw SQL (ORM-only policy applies even to in-memory impl)

**Rationale:**
- Main's stubs are placeholders only
- Codex implementation is functional and required for tests
- Interface alignment ensures DB repos can drop-in replace for production

---

### 4. `src/payments/adapters/mock.ts`

**Conflict:** Full MockPaymentAdapter (HEAD) vs. stub (main)

**Canonical Resolution:**
- **Accept Codex (HEAD) implementation** entirely
- **Critical verification:**
  1. **Signature algorithm:** HMAC-SHA256 with **hex encoding** (line 19)
     - ⚠️ **SPEC ALERT:** Spec-Trace.yml specifies **base64 encoding** for test vectors
     - **Decision required:** Align on canonical encoding (recommend base64 per spec)
  2. **Constant-time compare:** `crypto.timingSafeEqual` present (line 29) ✅
  3. **Stringifier:** Uses `stableStringify` (line 18) ✅
  4. **Header name:** Verify webhook handler uses matching header name

**Required Change:**
```typescript
// Line 19: Change from hex to base64 to match Spec-Trace.yml
signPayload(payload, secret = this.webhookSecret) {
  const raw = typeof payload === "string" ? payload : stableStringify(payload);
  return crypto.createHmac("sha256", secret).update(raw).digest("base64"); // ← base64
}

// Line 25: Update comparison accordingly
verifySignature({ rawBody, signature, secret = this.webhookSecret }) {
  if (!signature) return false;
  const expected = this.signPayload(rawBody, secret);
  const signatureBuffer = Buffer.from(signature, "base64"); // ← base64
  const expectedBuffer = Buffer.from(expected, "base64"); // ← base64
  if (signatureBuffer.length !== expectedBuffer.length) return false;
  try {
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
```

**GATE:** If encoding mismatch remains, add SPEC_GAPS entry: "GAP-001: Signature encoding drift (hex vs. base64)"

---

### 5. `src/payments/registry.ts`

**Conflict:** Proper registry (HEAD) vs. stub listing "mock" + "iamport" (main)

**Canonical Resolution:**
- **Accept Codex (HEAD) implementation** entirely
- **Verify:** Registry only registers `mock` provider (no "iamport")
- **Confirm:** Provider-neutral design allows future providers via constructor

**Critical Checks:**
1. Default registry includes **only `mock`** (line 8-10) ✅
2. `get(provider)` returns adapter or undefined (line 13-15) ✅
3. Constructor accepts array of adapters for extensibility (line 5-6) ✅

**Rationale:**
- Main's stub incorrectly lists "iamport" (not in scope for v1)
- Codex implementation is provider-neutral and extensible
- Spec requires only `mock` for v1 vertical slice

**GATE:** If "iamport" or any non-mock provider appears in default registry, BLOCK merge

---

### 6. `src/routes/webhooks.payments.ts`

**Conflict:** Full webhook handler (HEAD) vs. TODO stubs (main)

**Canonical Resolution:**
- **Accept Codex (HEAD) implementation** with **critical fixes**
- **Required verifications:**

#### ✅ Verified Elements
1. **HMAC verification over rawBody** (line 43, 57) ✅
2. **Constant-time compare via adapter** (line 57 → adapter.verifySignature) ✅
3. **Timestamp tolerance ±300s** (line 52-55) ✅
4. **Event de-dupe BEFORE effects** (line 70-90) ✅
5. **Single transaction boundary** (line 69-141) ✅
   - Wraps: `insertWebhookEvent` + `updateOrder` + `insertWalletLedger`
6. **Replay returns 200 without duplicate credits** (line 71-89) ✅
7. **Fingerprint tamper detection** (line 72-74) ✅

#### ⚠️ Issues Requiring Fix

**Issue 1: Signature encoding mismatch**
- **Line 44:** `signature = readHeader(request.headers, "x-signature")`
- **Line 57:** Passed to `adapter.verifySignature({ rawBody, signature })`
- **Problem:** If adapter uses hex (current), but spec requires base64 (Spec-Trace.yml), mismatch occurs
- **Fix:** Align mock.ts signature encoding to base64 (see file #4 resolution)

**Issue 2: rawBody fallback logic**
- **Line 43:** `const rawBody = typeof request.rawBody === "string" ? request.rawBody : stableStringify(request.body ?? {});`
- **Risk:** If middleware doesn't provide `request.rawBody`, fallback re-stringifies body (may not match original)
- **Required:** Verify middleware captures raw body buffer BEFORE JSON parsing
- **Add test:** Signature verification fails if body is re-parsed (tamper detection)

**Issue 3: Missing wallet ledger direction enum**
- **Line 126:** `direction: "CREDIT"`
- **Verify:** Enum/type validation exists for direction field
- **Schema:** Should match `wallet_ledger.direction` enum (CREDIT, DEBIT, REFUND)

**Issue 4: Retention policy constant**
- **Line 6:** `const RETENTION_DAYS = 180;`
- **Spec:** DDL_Deltas_Proposals.md specifies provider-specific retention (90-180 days)
- **Decision:** Hardcoded 180 is acceptable for v1 (most permissive); recommend parameterize in v1.1

#### Final Canonical Code
```typescript
// Ensure these fixes are applied:
// 1. Use request.rawBody directly (no fallback)
const rawBody = request.rawBody;
if (!rawBody) {
  throw badRequest("RAW_BODY_REQUIRED", "Raw body middleware not configured");
}

// 2. Signature encoding matches adapter (base64 after fix in mock.ts)
const signature = readHeader(request.headers, "x-signature");
// ... rest remains the same

// 3. Validate wallet ledger direction
const VALID_DIRECTIONS = new Set(["CREDIT", "DEBIT", "REFUND"]);
const direction = "CREDIT";
if (!VALID_DIRECTIONS.has(direction)) {
  throw new Error(`Invalid ledger direction: ${direction}`);
}

// 4. Retention is acceptable as-is for v1
```

**GATE:** If any of these issues remain unfixed, add SPEC_GAPS entries:
- GAP-002: rawBody fallback may re-stringify (timing attack vulnerability)
- GAP-003: Wallet ledger direction not validated against enum

---

## Resolution Process

**DO:**
1. ✅ Resolve conflicts **locally** (3-way merge) rather than in GitHub web editor
   - Preserves type signatures and imports
   - Allows running TypeScript compiler to catch errors
2. ✅ After resolution, run:
   ```bash
   npm run preflight
   npm test
   ```
3. ✅ Post outputs (last ~20 lines) in PR comment:
   ```
   ## Conflict Resolution — Preflight Output

   \`\`\`bash
   $ npm run preflight
   # Paste output here
   \`\`\`

   \`\`\`bash
   $ npm test
   # Paste output here
   \`\`\`
   ```
4. ✅ Ping @spec-concierge when resolution is pushed

**DON'T:**
1. ❌ Use GitHub web editor (loses type safety)
2. ❌ Cherry-pick individual lines without understanding context
3. ❌ Skip preflight/test verification after resolution
4. ❌ Introduce new dependencies without SPEC_GAPS gate

---

## SPEC_GAPS Created (Pre-emptive)

**GAP-001: Signature encoding drift (hex vs. base64)**
**Context:** `src/payments/adapters/mock.ts:19` uses hex encoding; `specs/Spec-Trace.yml` test vectors expect base64.
**Impact:** Signature verification will fail with canonical test vectors TV01-TV03; breaks contract conformance.
**Minimal Proposal:** Change `digest("hex")` → `digest("base64")` in mock.ts lines 19, 25. Update tests to use base64 signatures.
**Status:** OPEN (blocking merge until resolved)

---

**GAP-002: rawBody fallback may re-stringify**
**Context:** `src/routes/webhooks.payments.ts:43` falls back to `stableStringify(request.body)` if `request.rawBody` is undefined.
**Impact:** Re-stringified body may not match original wire format; signature verification becomes timing attack vulnerable.
**Minimal Proposal:** Remove fallback; require `request.rawBody` from middleware. Add middleware that captures raw buffer before body-parser.
**Status:** OPEN (requires verification; non-blocking if middleware proven present)

---

**GAP-003: Redocly CLI not vendored**
**Context:** `package.json` references `tools/redocly/redocly-cli-2.8.0.tgz` but file may not exist; fallback to offline linter.
**Impact:** Cannot run full OpenAPI lint in CI; offline fallback is incomplete (missing Redocly rules).
**Minimal Proposal:** Vendor Redocly CLI tarball under `tools/redocly/` OR update package.json to use npm registry version.
**Status:** OPEN (non-blocking for v1 merge; requires follow-up PR for DoD)

---

## Next Actions

1. **Codex:** Resolve conflicts locally per canonical resolutions above
2. **Codex:** Fix GAP-001 (hex → base64 encoding) in `src/payments/adapters/mock.ts`
3. **Codex:** Verify GAP-002 (middleware provides `request.rawBody`)
4. **Codex:** Run `npm run preflight && npm test`, paste outputs
5. **Codex:** Push resolution, ping @spec-concierge
6. **Spec Concierge:** Apply 7-phase review once conflicts resolved and preflight green

---

**Language:** English (all identifiers, contracts, PR comments)

**Reviewed by:** Spec Concierge (Claude)
**Date:** 2025-10-25
