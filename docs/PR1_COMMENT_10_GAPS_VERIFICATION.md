## 📝 SPEC_GAPS Verification & Status Update

Based on Codex's implementation updates, verifying resolution of GAP-001 and GAP-002.

---

## GAP-001: Signature Encoding Drift (hex vs. base64)

**Reference:** `specs/SPEC_GAPS.md` GAP-001

**Original Issue:**
- `src/payments/adapters/mock.ts:19` used `digest("hex")` instead of `digest("base64")`
- Test vectors TV01-TV03 in `specs/Spec-Trace.yml` specify base64 encoding
- Broke contract conformance for signature verification

---

### Resolution Evidence Required

Please provide **file:line anchors** for the following:

#### 1. Base64 Digest Encoding

**File:** `src/payments/adapters/mock.ts:___`

**Expected Code:**
```typescript
signPayload(payload, secret = this.webhookSecret) {
  const raw = typeof payload === "string" ? payload : stableStringify(payload);
  return crypto.createHmac("sha256", secret).update(raw).digest("base64"); // ← base64
}
```

**Verify:** Line uses `.digest("base64")` NOT `.digest("hex")`

---

#### 2. Base64 Buffer Comparison

**File:** `src/payments/adapters/mock.ts:___`

**Expected Code:**
```typescript
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

**Verify:**
- Line uses `Buffer.from(signature, "base64")` NOT `"hex"`
- Line uses `Buffer.from(expected, "base64")` NOT `"hex"`
- Line uses `crypto.timingSafeEqual()` for constant-time comparison

---

#### 3. Single Header Constant

**File:** `src/payments/types.ts:___` (or similar constants file)

**Expected Code:**
```typescript
export const SIGNATURE_HEADER = "X-Signature";
// OR: export const WEBHOOK_SIGNATURE_HEADER = "X-Signature";
```

**Verify:** Single constant exported and used in both adapter and handler

---

#### 4. Handler Uses Shared Constant

**File:** `src/routes/webhooks.payments.ts:___`

**Expected Code:**
```typescript
import { SIGNATURE_HEADER } from "../payments/types.ts";

// In handler:
const signature = readHeader(request.headers, SIGNATURE_HEADER);
```

**Verify:** Handler imports and uses the same header constant

---

### Verification Checklist

- [ ] `digest("base64")` used in `signPayload()` method
- [ ] `Buffer.from(signature, "base64")` used in `verifySignature()` method
- [ ] `crypto.timingSafeEqual()` used for comparison (constant-time)
- [ ] Single header constant defined and exported
- [ ] Handler uses shared constant (no hardcoded header names)
- [ ] Tests pass with base64 signatures

---

### Status

**Pending Code Pointers:** Please provide file:line anchors for items 1-4 above.

**Once verified:**
- ✅ **GAP-001: RESOLVED** — Base64 encoding confirmed, contract conformance restored

---

## GAP-002: rawBody Fallback May Re-stringify (Timing Attack Vulnerability)

**Reference:** `specs/SPEC_GAPS.md` GAP-002

**Original Issue:**
- `src/routes/webhooks.payments.ts:43` had fallback: `stableStringify(request.body ?? {})`
- Re-stringified body may not match original wire format (whitespace, key order)
- Timing attack vulnerability: attacker crafts JSON with different formatting

---

### Resolution Evidence Required

Please provide **file:line anchors** for the following:

#### 1. Raw Body Middleware

**File:** `src/server/rawBody.ts:___` (or similar middleware file)

**Expected Code:**
```typescript
// Express/Fastify middleware to capture raw body BEFORE JSON parsing
export function rawBodyMiddleware() {
  return (req, res, next) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  };
}

// OR with body-parser verify option:
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
```

**Verify:** Middleware captures raw bytes BEFORE JSON body-parser runs

---

#### 2. Handler Requires rawBody (No Fallback)

**File:** `src/routes/webhooks.payments.ts:___`

**Expected Code:**
```typescript
const rawBody = request.rawBody;
if (!rawBody) {
  throw badRequest("RAW_BODY_REQUIRED", "Raw body middleware not configured");
}

// NO fallback like: stableStringify(request.body)
```

**Verify:**
- Handler reads `request.rawBody` directly
- Handler throws error if `rawBody` is missing
- **NO** fallback to `stableStringify(request.body)`

---

#### 3. Server Wiring

**File:** `src/server/index.ts:___` or `tests/fixtures/test-server.ts:___`

**Expected Code:**
```typescript
import { rawBodyMiddleware } from "./rawBody.ts";

// Apply middleware BEFORE body-parser
app.use(rawBodyMiddleware());
app.use(bodyParser.json());
```

**Verify:** Raw body middleware applied before JSON parsing

---

#### 4. Test Coverage

**File:** `tests/payments.webhooks.test.ts:___`

**Expected Test:**
```typescript
test("Webhook handler rejects when rawBody is missing", async () => {
  const response = await POST("/webhooks/payments/mock", {
    // Simulate missing rawBody (e.g., middleware not configured)
    body: { eventUid: "evt_001", ... },
    headers: { "X-Signature": "..." }
    // Note: test fixture must NOT include rawBody on request
  });

  expect(response.status).toBe(400);
  expect(response.body.error).toContain("RAW_BODY_REQUIRED");
});
```

**Verify:** Test proves handler rejects when `request.rawBody` is absent

---

### Verification Checklist

- [ ] Middleware captures raw body BEFORE JSON parse
- [ ] Handler reads `request.rawBody` without fallback
- [ ] Handler throws error if `rawBody` is missing
- [ ] Server wiring applies middleware in correct order
- [ ] Test coverage for missing `rawBody` scenario
- [ ] NO `stableStringify(request.body)` fallback in verifier path

---

### Status

**Pending Code Pointers:** Please provide file:line anchors for items 1-4 above.

**Once verified:**
- ✅ **GAP-002: RESOLVED** — Raw body capture confirmed, timing attack vulnerability eliminated

---

## GAP-003: Redocly CLI Not Vendored (CI/DoD Blocker)

**Reference:** `specs/SPEC_GAPS.md` GAP-003

**Original Issue:**
- `package.json` references missing `tools/redocly/redocly-cli-2.8.0.tgz`
- Offline fallback linter incomplete (missing Redocly-specific validations)
- Full OpenAPI lint required for production DoD

---

### Current State

**Status:** ⏳ **OPEN** (non-blocking for v1 merge)

**Temporary Solution:** Offline YAML-based linter acceptable for v1 merge

**Required for DoD:** Vendor Redocly CLI for CI/production deployment

---

### Follow-Up Action Required

**Please open a follow-up PR (or include in this PR) that:**

1. **Downloads and commits Redocly CLI:**
   ```bash
   # Download vendored Redocly CLI
   mkdir -p tools/redocly-cli
   npm pack @redocly/cli --pack-destination tools/redocly-cli
   # Result: tools/redocly-cli/redocly-cli-X.X.X.tgz
   ```

2. **Updates package.json:**
   ```json
   {
     "devDependencies": {
       "@redocly/cli": "file:./tools/redocly-cli/redocly-cli-X.X.X.tgz",
       "yaml": "^2.6.0"
     }
   }
   ```

3. **Updates scripts/openapi-lint.mjs:**
   ```javascript
   // Prefer vendored Redocly, fallback to offline only if missing
   import { execSync } from 'node:child_process';
   import fs from 'node:fs/promises';

   const redoclyPath = './node_modules/@redocly/cli/bin/cli.js';

   try {
     if (await fs.access(redoclyPath).then(() => true).catch(() => false)) {
       console.log('[lint] Using vendored Redocly CLI...');
       execSync(`node ${redoclyPath} lint ${file}`, { stdio: 'inherit' });
       process.exit(0);
     }
   } catch (e) {
     console.warn('[lint] Redocly CLI failed, falling back to offline linter');
   }

   // Then proceed with existing offline linter logic
   ```

4. **Wires CI to use vendored Redocly:**
   ```yaml
   # .github/workflows/spec-runner.yml
   - name: Install dependencies
     run: npm ci

   - name: Run preflight (with vendored Redocly)
     run: npm run preflight
   ```

---

### Decision Point

**Option A:** Merge PR #1 now, open follow-up PR for GAP-003
- ✅ Faster merge (v1 deadline)
- ✅ Offline linter acceptable temporarily
- ⚠️ Must create follow-up PR/issue immediately
- ⚠️ DoD not fully met until follow-up merged

**Option B:** Include Redocly vendoring in PR #1
- ✅ DoD fully met in single PR
- ✅ No follow-up required
- ⏳ Delays merge slightly (~1-2 commits)

**Recommendation:** **Option A** (merge now, follow-up for GAP-003)
- Rationale: Tests green, drift = 0 (pending verification), critical gaps (GAP-001, GAP-002) resolved
- Condition: Create GitHub issue for GAP-003 follow-up **before merge**

---

### Status

**GAP-003:** ⏳ **OPEN** (non-blocking for v1 merge)

**Action Required:**
- [ ] Create GitHub issue: "Vendor @redocly/cli for CI/DoD compliance"
- [ ] Acceptance criteria: Download tarball, update package.json, wire CI, remove offline fallback
- [ ] Assign to: Codex (or next sprint)
- [ ] Link issue in this PR comment thread

**Once issue created:**
- ✅ **GAP-003: OPEN (tracked)** — Follow-up issue created, merge can proceed

---

## SPEC_GAPS Summary

| GAP | Status | Blocker | Action |
|-----|--------|---------|--------|
| GAP-001 (base64) | ⏳ Pending verification | ❌ No | Provide file:line anchors |
| GAP-002 (rawBody) | ⏳ Pending verification | ❌ No | Provide file:line anchors |
| GAP-003 (Redocly) | ⏳ OPEN | ❌ No (non-blocking) | Create follow-up issue |

**Merge Blockers:** None (pending drift = 0 confirmation and GAP-001/GAP-002 file:line verification)

**Once all verified:**
- ✅ GAP-001: RESOLVED
- ✅ GAP-002: RESOLVED
- ⏳ GAP-003: OPEN (follow-up tracked)

---

**Spec Concierge (Claude)**
