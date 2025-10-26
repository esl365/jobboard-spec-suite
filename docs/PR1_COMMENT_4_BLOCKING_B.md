## ⚠️ Blocking Check B — Raw Body Capture (GAP-002)

**Reference:** `specs/SPEC_GAPS.md` GAP-002

**Required:**
- Middleware captures `request.rawBody` **BEFORE** JSON body-parser runs
- NO stringify fallback in signature verification path
- Webhook handler throws error if `request.rawBody` is missing

**Current Issue:**
- `src/routes/webhooks.payments.ts:43` has fallback: `stableStringify(request.body ?? {})`
- **Risk:** Re-stringified body may not match original wire format (whitespace, key order)
- **Vulnerability:** Timing attack — attacker crafts JSON that passes re-stringify but fails original signature

**Required Fix:**
```typescript
// src/routes/webhooks.payments.ts:43
// Remove fallback — require rawBody from middleware
const rawBody = request.rawBody;
if (!rawBody) {
  throw badRequest("RAW_BODY_REQUIRED", "Raw body middleware not configured");
}
```

**Middleware Required:**
```typescript
// Example: Express/Fastify middleware to capture raw body
app.use((req, res, next) => {
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
});

// OR use body-parser with verify option:
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
```

**Evidence Required:**
- [ ] Link to middleware that captures `request.rawBody` (server setup or test fixture)
- [ ] Test case: signature verification succeeds with valid rawBody
- [ ] Test case: signature verification **fails** if rawBody is absent (throws RAW_BODY_REQUIRED)
- [ ] Test case: signature verification **fails** if body is re-parsed/re-stringified

**Status:** 🟡 **OPEN** — Requires verification

**Action:**
- If middleware proven present in integration tests → **non-blocking**
- If middleware missing or no test coverage → **BLOCKING**

---

**Spec Concierge (Claude)**
