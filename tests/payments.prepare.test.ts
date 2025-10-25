import test from "node:test";
import assert from "node:assert/strict";
import { createInMemoryRepository } from "../src/infra/memory/payments.repos.ts";
import { createDefaultRegistry } from "../src/payments/registry.ts";
import { createPaymentsPrepareHandler } from "../src/routes/payments.prepare.ts";
import { HttpError } from "../src/routes/httpError.ts";

function createHandler(initialState = {}) {
  const paymentsRepo = createInMemoryRepository({
    productPackages: [
      { packageId: "pkg-basic", amountCents: 5000, currency: "KRW", active: true },
      { packageId: "pkg-inactive", amountCents: 7500, currency: "KRW", active: false },
    ],
    ...initialState,
  });
  const registry = createDefaultRegistry();
  const handler = createPaymentsPrepareHandler({ paymentsRepo, registry, clock: () => new Date("2025-10-26T00:00:00Z") });
  return { handler, paymentsRepo };
}

const companyActor = { role: "COMPANY", companyId: "co-1" };

test("creates a pending order using package pricing", async () => {
  const { handler, paymentsRepo } = createHandler();
  const response = await handler({
    headers: { "Idempotency-Key": "key-123" },
    body: { userId: "user-1", amountCents: 5000, provider: "mock", packageId: "pkg-basic" },
    actor: companyActor,
  });

  assert.equal(response.status, 200);
  assert.equal(response.reused, false);
  assert.equal(response.body.status, "PENDING");
  assert.equal(response.body.totalAmountCents, 5000);
  assert.ok(response.body.pgRequestPayload);

  const snapshot = paymentsRepo.snapshot();
  assert.equal(snapshot.orders.length, 1);
  assert.equal(snapshot.orders[0].totalAmountCents, 5000);
  assert.equal(snapshot.idempotencyKeys.length, 1);
  assert.equal(snapshot.idempotencyKeys[0].businessData.amountCents, 5000);
});

test("reuses the same order when the payload matches", async () => {
  const { handler } = createHandler();
  const first = await handler({
    headers: { "Idempotency-Key": "key-abc" },
    body: { userId: "user-2", amountCents: 5000, provider: "mock", packageId: "pkg-basic" },
    actor: companyActor,
  });
  const second = await handler({
    headers: { "Idempotency-Key": "key-abc" },
    body: { userId: "user-2", amountCents: 5000, provider: "mock", packageId: "pkg-basic" },
    actor: companyActor,
  });

  assert.equal(first.body.orderId, second.body.orderId);
  assert.equal(second.reused, true);
});

test("rejects mismatched payload for same idempotency key", async () => {
  const { handler } = createHandler();
  await handler({
    headers: { "Idempotency-Key": "key-diff" },
    body: { userId: "user-3", amountCents: 5000, provider: "mock", packageId: "pkg-basic" },
    actor: companyActor,
  });

  await assert.rejects(
    () =>
      handler({
        headers: { "Idempotency-Key": "key-diff" },
        body: { userId: "user-3", amountCents: 5000, provider: "mock", packageId: "pkg-inactive" },
        actor: companyActor,
      }),
    err => err instanceof HttpError && err.status === 409,
  );
});

test("rejects amount mismatches against package pricing", async () => {
  const { handler } = createHandler();
  await assert.rejects(
    () =>
      handler({
        headers: { "Idempotency-Key": "key-amount" },
        body: { userId: "user-4", amountCents: 5100, provider: "mock", packageId: "pkg-basic" },
        actor: companyActor,
      }),
    err => err instanceof HttpError && err.status === 409,
  );
});

test("rejects inactive packages", async () => {
  const { handler } = createHandler();
  await assert.rejects(
    () =>
      handler({
        headers: { "Idempotency-Key": "key-inactive" },
        body: { userId: "user-5", amountCents: 7500, provider: "mock", packageId: "pkg-inactive" },
        actor: companyActor,
      }),
    err => err instanceof HttpError && err.status === 409,
  );
});

test("requires company actors", async () => {
  const { handler } = createHandler();
  await assert.rejects(
    () =>
      handler({
        headers: { "Idempotency-Key": "key-actor" },
        body: { userId: "user-6", amountCents: 5000, provider: "mock", packageId: "pkg-basic" },
        actor: { role: "JOB_SEEKER" },
      }),
    err => err instanceof HttpError && err.status === 403,
  );
});

