# Acceptance Tests: POST /payments/prepare

## Test Suite: Payments Prepare Endpoint

### Purpose
Verify that the payments prepare endpoint creates/ensures orders with proper idempotency guarantees and contract adherence.

---

## A) Happy Path Tests

### A1: First-time order creation (idempotent success)
**Given:**
- Valid COMPANY user authenticated
- Request body:
  ```json
  {
    "userId": "usr_123",
    "amountCents": 50000,
    "provider": "mock",
    "packageId": "pkg_premium"
  }
  ```
- Header: `Idempotency-Key: idem_abc123xyz`

**When:**
- POST /payments/prepare

**Then:**
- Status: 200
- Response body matches Order schema:
  ```json
  {
    "orderId": "<UUID>",
    "userId": "usr_123",
    "status": "PENDING",
    "totalAmountCents": 50000,
    "provider": "mock",
    "providerPaymentId": null,
    "createdAt": "<ISO8601>",
    "updatedAt": "<ISO8601>"
  }
  ```
- DB state:
  - 1 row in `orders` with status=PENDING
  - 1 row in `idempotency_keys` with (idem_abc123xyz, usr_123, POST, /payments/prepare)
  - 0 rows in `wallet_ledger` (no credits until webhook)

**Trace:**
- OpenAPI: POST /payments/prepare (200 response)
- Part2: Section 4.1 (prepare endpoint spec)
- DDL: orders, idempotency_keys tables

---

### A2: Idempotent replay (exact same request)
**Given:**
- Order from A1 already exists
- Identical request replayed with same Idempotency-Key

**When:**
- POST /payments/prepare (second call)

**Then:**
- Status: 200 (not 201)
- Response body: **exact same Order** from A1
- DB state: **no new rows** created (idempotent)
- Response time: < 100ms (fast path)

**Invariant:**
- Replays are safe; client can retry without side-effects

**Trace:**
- Part2: Section 4.1 (idempotency requirement)
- Part1: Section 6.2 (idempotency store)

---

## B) Negative Path Tests

### B1: Missing Idempotency-Key header
**Given:**
- Valid request body
- **No** Idempotency-Key header

**When:**
- POST /payments/prepare

**Then:**
- Status: 400
- Error response:
  ```json
  {
    "code": "MISSING_IDEMPOTENCY_KEY",
    "message": "Idempotency-Key header is required"
  }
  ```

**Trace:**
- OpenAPI: required parameter validation
- Part2: Section 4.1 (idempotency required)

---

### B2: Idempotency-Key too short
**Given:**
- Request with `Idempotency-Key: abc` (< 8 chars)

**When:**
- POST /payments/prepare

**Then:**
- Status: 400
- Error:
  ```json
  {
    "code": "INVALID_IDEMPOTENCY_KEY",
    "message": "Idempotency-Key must be at least 8 characters"
  }
  ```

**Trace:**
- OpenAPI: minLength: 8 constraint

---

### B3: Idempotency collision (different business keys)
**Given:**
- Existing order with idem_key="idem_same" for userId="usr_123", amountCents=50000
- New request with **same** idem_key but **different** amountCents=60000

**When:**
- POST /payments/prepare

**Then:**
- Status: 409 Conflict
- Error:
  ```json
  {
    "code": "IDEMPOTENCY_COLLISION",
    "message": "Idempotency key already used with different parameters"
  }
  ```

**Trace:**
- Part2: Section 4.1 (409 on collision)
- Part1: Section 6.2 (scope: key + user + method + path + product)

---

### B4: Invalid amountCents (negative)
**Given:**
- Request with `amountCents: -100`

**When:**
- POST /payments/prepare

**Then:**
- Status: 400
- Error:
  ```json
  {
    "code": "INVALID_AMOUNT",
    "message": "amountCents must be >= 0"
  }
  ```

**Trace:**
- OpenAPI: minimum: 0 constraint
- Part2: Section 4.1 (amountCents >= 0)

---

### B5: Invalid amountCents (zero - boundary)
**Given:**
- Request with `amountCents: 0`

**When:**
- POST /payments/prepare

**Then:**
- Status: 200 (zero-amount orders allowed per spec)
- Order created with totalAmountCents=0

**Rationale:**
- Spec allows >= 0; zero may be valid for free trials or credits-only

**Trace:**
- Part2: Section 4.1 (amountCents >= 0 includes zero)

---

### B6: Missing required field (userId)
**Given:**
- Request body missing `userId`

**When:**
- POST /payments/prepare

**Then:**
- Status: 400
- Error:
  ```json
  {
    "code": "VALIDATION_ERROR",
    "message": "userId is required"
  }
  ```

**Trace:**
- OpenAPI: required fields [userId, amountCents, provider]

---

### B7: Unknown provider
**Given:**
- Request with `provider: "unknown_provider"`

**When:**
- POST /payments/prepare

**Then:**
- Status: 400
- Error:
  ```json
  {
    "code": "INVALID_PROVIDER",
    "message": "Unknown payment provider"
  }
  ```

**Trace:**
- Part1: Section 6.2 (provider label)
- Implementation: PaymentsRegistry must reject unknown providers

---

### B8: Inactive packageId
**Given:**
- Request with `packageId: "pkg_inactive"`
- Package exists but `isActive=false`

**When:**
- POST /payments/prepare

**Then:**
- Status: 400
- Error:
  ```json
  {
    "code": "INACTIVE_PRODUCT",
    "message": "Product package is not available"
  }
  ```

**Trace:**
- Part1: Section 6.1 (product packages isActive)
- Part2: Section 4.1 (product reference must be active)

---

## C) Security Tests

### C1: Unauthenticated request
**Given:**
- No JWT token in Authorization header

**When:**
- POST /payments/prepare

**Then:**
- Status: 401 Unauthorized
- Error:
  ```json
  {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
  ```

**Trace:**
- Part2: Section 4.1 (security: required_permission = ORDER_CREATE)

---

### C2: Wrong user type (PERSONAL user)
**Given:**
- Authenticated as PERSONAL user (not COMPANY)

**When:**
- POST /payments/prepare

**Then:**
- Status: 403 Forbidden
- Error:
  ```json
  {
    "code": "FORBIDDEN",
    "message": "Only COMPANY users can create orders"
  }
  ```

**Trace:**
- Part2: Section 4.1 (userType == COMPANY precondition)

---

### C3: userId mismatch (token vs body)
**Given:**
- JWT token for userId="usr_123"
- Request body has `userId: "usr_999"` (different user)

**When:**
- POST /payments/prepare

**Then:**
- Status: 403 Forbidden
- Error:
  ```json
  {
    "code": "USER_MISMATCH",
    "message": "Cannot create order for another user"
  }
  ```

**Trace:**
- Part2: Section 4.1 (userId implicit from token)
- Security policy: prevent cross-user order creation

---

## D) Edge Cases & Concurrency

### D1: Concurrent identical requests (race condition)
**Given:**
- 5 parallel requests with identical Idempotency-Key

**When:**
- All sent simultaneously

**Then:**
- Exactly 1 order created
- All 5 responses return same orderId
- DB constraint enforces uniqueness

**Trace:**
- Part1: Section 6.2 (idempotency enforcement)
- DDL: PRIMARY KEY (idem_key, user_id, method, path)

---

### D2: Maximum amountCents (integer overflow check)
**Given:**
- Request with `amountCents: 2147483647` (max int32)

**When:**
- POST /payments/prepare

**Then:**
- Status: 200
- Order created successfully

**Trace:**
- DDL: INTEGER type handling

---

### D3: Null packageId (custom charge)
**Given:**
- Request with `packageId: null`

**When:**
- POST /payments/prepare

**Then:**
- Status: 200
- Order created with packageId=null (custom/one-off charge)

**Trace:**
- OpenAPI: packageId nullable
- Part1: Section 6.2 (optional packageId)

---

## E) Golden Samples

### E1: Minimal valid request
```bash
curl -X POST https://api.example.com/payments/prepare \
  -H "Authorization: Bearer <JWT>" \
  -H "Idempotency-Key: min_valid_001" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usr_company_1",
    "amountCents": 100,
    "provider": "mock"
  }'
```

**Expected:**
```json
{
  "orderId": "ord_abc123",
  "userId": "usr_company_1",
  "status": "PENDING",
  "totalAmountCents": 100,
  "provider": "mock",
  "providerPaymentId": null,
  "createdAt": "2025-10-25T10:00:00Z",
  "updatedAt": "2025-10-25T10:00:00Z"
}
```

---

### E2: Full request with package
```bash
curl -X POST https://api.example.com/payments/prepare \
  -H "Authorization: Bearer <JWT>" \
  -H "Idempotency-Key: full_pkg_002" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usr_company_2",
    "amountCents": 150000,
    "provider": "iamport",
    "packageId": "pkg_premium_30d"
  }'
```

**Expected:**
```json
{
  "orderId": "ord_def456",
  "userId": "usr_company_2",
  "status": "PENDING",
  "totalAmountCents": 150000,
  "provider": "iamport",
  "providerPaymentId": null,
  "createdAt": "2025-10-25T10:05:00Z",
  "updatedAt": "2025-10-25T10:05:00Z"
}
```

---

## F) Contract Adherence Checklist

- [ ] Response matches OpenAPI Order schema exactly
- [ ] All required fields present (orderId, userId, status, totalAmountCents)
- [ ] Timestamps are ISO8601 format
- [ ] Status is always PENDING at prepare time
- [ ] providerPaymentId is null initially
- [ ] Idempotency-Key header enforced (400 if missing)
- [ ] 409 on collision with different business keys
- [ ] 200 on replay with same keys
- [ ] No wallet_ledger entries until webhook
- [ ] DB constraints prevent duplicate idempotency keys
- [ ] Transaction boundaries ensure atomicity

---

## G) Performance Benchmarks

- Idempotent replay path: < 100ms
- First-time creation: < 500ms
- Concurrent requests: handle 100 req/s without collisions

---

## H) Test Data Setup

### Required DB seed:
```sql
-- Users
INSERT INTO users (user_id, email, user_type, status) VALUES
  ('usr_company_1', 'company1@example.com', 'COMPANY', 'ACTIVE'),
  ('usr_company_2', 'company2@example.com', 'COMPANY', 'ACTIVE'),
  ('usr_personal_1', 'person1@example.com', 'PERSONAL', 'ACTIVE');

-- Product packages
INSERT INTO product_packages (package_id, package_name, price, benefits, is_active) VALUES
  ('pkg_premium_30d', 'Premium 30 Days', 150000, '{"premiumListings":5,"duration":30}', true),
  ('pkg_inactive', 'Old Package', 100000, '{}', false);
```

---

## Summary
- **Total test cases:** 23
- **Coverage:** happy path (2), negative (8), security (3), edge cases (3), golden (2), contract (11), perf (3)
- **Critical invariants tested:** idempotency, exactly-once, status=PENDING, no wallet effects
