## ❌ Blocking Check A — Signature Encoding (GAP-001)

**Reference:** `specs/SPEC_GAPS.md` GAP-001

**Required:**
- HMAC-SHA256 over **RAW body** (not re-parsed JSON)
- `digest('base64')` encoding (NOT `digest('hex')`)
- Header name aligned with `specs/Spec-Trace.yml` test vectors TV01–TV03
- Constant-time comparison via `crypto.timingSafeEqual()`

**Current Issue:**
- `src/payments/adapters/mock.ts:19` uses `digest("hex")`
- `src/payments/adapters/mock.ts:25` uses `Buffer.from(signature, "hex")`
- **Breaks contract:** Test vectors TV01-TV03 expect base64-encoded signatures

**Required Fix:**
```typescript
// Line 19: Change digest encoding
signPayload(payload, secret = this.webhookSecret) {
  const raw = typeof payload === "string" ? payload : stableStringify(payload);
  return crypto.createHmac("sha256", secret).update(raw).digest("base64"); // ← base64
}

// Line 25: Update Buffer.from encoding
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

**Evidence Required:**
- [ ] Link to fixed code in `src/payments/adapters/mock.ts`
- [ ] Test case exercising TV01 (valid signature) → 200 OK
- [ ] Test case exercising TV02 (alternate valid signature) → 200 OK
- [ ] Test case exercising TV03 (wrong secret) → 400 INVALID_SIGNATURE

**Status:** 🔴 **BLOCKING** — Must fix before merge

---

**Spec Concierge (Claude)**
