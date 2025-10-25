import test from "node:test";
import assert from "node:assert/strict";
import { createInMemoryRepository } from "../src/infra/memory/payments.repos.ts";
import { createDefaultRegistry } from "../src/payments/registry.ts";
import { PAYMENT_SIGNATURE_HEADER, PAYMENT_SIGNATURE_TIMESTAMP_HEADER } from "../src/payments/types.ts";
import { createPaymentsPrepareHandler } from "../src/routes/payments.prepare.ts";
import { createPaymentsWebhookHandler } from "../src/routes/webhooks.payments.ts";
import { HttpError } from "../src/routes/httpError.ts";
import { stableStringify } from "../src/utils/stableStringify.ts";

function setup() {
  const paymentsRepo = createInMemoryRepository({
    productPackages: [{ packageId: "pkg-basic", amountCents: 1500, currency: "KRW", active: true }],
  });
  const registry = createDefaultRegistry();
  const clock = () => new Date("2025-10-26T00:05:00Z");
  const prepare = createPaymentsPrepareHandler({ paymentsRepo, registry, clock });
  const webhook = createPaymentsWebhookHandler({ paymentsRepo, registry, clock });
  const adapter = registry.get("mock");
  return { paymentsRepo, prepare, webhook, adapter };
}

const companyActor = { role: "COMPANY" };

function sign(adapter, body, timestamp) {
  const raw = typeof body === "string" ? body : stableStringify(body);
  const signature = adapter.signPayload(raw);
  return { raw, signature, timestamp: String(Math.floor(timestamp.getTime() / 1000)) };
}

test("settles payment completion exactly once", async () => {
  const { prepare, webhook, paymentsRepo, adapter } = setup();
  const prepareResponse = await prepare({
    headers: { "Idempotency-Key": "order-1" },
    body: { userId: "company-1", amountCents: 1500, provider: "mock", packageId: "pkg-basic" },
    actor: companyActor,
  });

  const eventBody = {
    eventUid: "evt-1",
    provider: "mock",
    type: "payment.completed",
    occurredAt: "2025-10-26T00:05:00Z",
    data: {
      providerPaymentId: prepareResponse.body.providerPaymentId,
      orderId: prepareResponse.body.orderId,
    },
  };
  const { raw, signature, timestamp } = sign(adapter, eventBody, new Date("2025-10-26T00:05:00Z"));
  const signatureHeader = adapter.signatureHeader || PAYMENT_SIGNATURE_HEADER;

  const first = await webhook({
    params: { provider: "mock" },
    headers: { [signatureHeader]: signature, [PAYMENT_SIGNATURE_TIMESTAMP_HEADER]: timestamp },
    rawBody: raw,
    body: eventBody,
  });
  assert.equal(first.body.ok, true);
  assert.equal(first.body.replay, false);

  const replay = await webhook({
    params: { provider: "mock" },
    headers: { [signatureHeader]: signature, [PAYMENT_SIGNATURE_TIMESTAMP_HEADER]: timestamp },
    rawBody: raw,
    body: eventBody,
  });
  assert.equal(replay.body.replay, true);

  const snapshot = paymentsRepo.snapshot();
  assert.equal(snapshot.orders[0].status, "COMPLETED");
  assert.equal(snapshot.walletLedger.length, 1);
});

test("rejects tampered replay payload", async () => {
  const { prepare, webhook, adapter } = setup();
  const prepareResponse = await prepare({
    headers: { "Idempotency-Key": "order-2" },
    body: { userId: "company-2", amountCents: 1500, provider: "mock", packageId: "pkg-basic" },
    actor: companyActor,
  });

  const originalEvent = {
    eventUid: "evt-2",
    provider: "mock",
    type: "payment.completed",
    occurredAt: "2025-10-26T00:05:00Z",
    data: { providerPaymentId: prepareResponse.body.providerPaymentId, orderId: prepareResponse.body.orderId },
  };
  const original = sign(adapter, originalEvent, new Date("2025-10-26T00:05:00Z"));
  const signatureHeader = adapter.signatureHeader || PAYMENT_SIGNATURE_HEADER;

  await webhook({
    params: { provider: "mock" },
    headers: { [signatureHeader]: original.signature, [PAYMENT_SIGNATURE_TIMESTAMP_HEADER]: original.timestamp },
    rawBody: original.raw,
    body: originalEvent,
  });

  const tamperedEvent = { ...originalEvent, data: { ...originalEvent.data, amount: 9999 } };
  const tampered = sign(adapter, tamperedEvent, new Date("2025-10-26T00:05:00Z"));

  await assert.rejects(
    () =>
      webhook({
        params: { provider: "mock" },
        headers: { [signatureHeader]: tampered.signature, [PAYMENT_SIGNATURE_TIMESTAMP_HEADER]: tampered.timestamp },
        rawBody: tampered.raw,
        body: tamperedEvent,
      }),
    err => err instanceof HttpError && err.status === 400,
  );
});

test("rejects invalid signature", async () => {
  const { webhook } = setup();
  await assert.rejects(
    () =>
      webhook({
        params: { provider: "mock" },
        headers: {
          [PAYMENT_SIGNATURE_HEADER]: "deadbeef",
          [PAYMENT_SIGNATURE_TIMESTAMP_HEADER]: String(Math.floor(Date.now() / 1000)),
        },
        rawBody: "{}",
        body: { eventUid: "evt-3", provider: "mock", type: "payment.completed", occurredAt: "2025-10-26T02:00:00Z", data: {} },
      }),
    err => err instanceof HttpError && err.status === 400,
  );
});

test("rejects stale webhook timestamps", async () => {
  const { webhook, adapter } = setup();
  const eventBody = {
    eventUid: "evt-4",
    provider: "mock",
    type: "payment.completed",
    occurredAt: "2025-10-26T00:00:00Z",
    data: {},
  };
  const staleTimestamp = new Date("2025-10-25T23:55:00Z");
  const { raw, signature, timestamp } = sign(adapter, eventBody, staleTimestamp);
  const signatureHeader = adapter.signatureHeader || PAYMENT_SIGNATURE_HEADER;

  await assert.rejects(
    () =>
      webhook({
        params: { provider: "mock" },
        headers: { [signatureHeader]: signature, [PAYMENT_SIGNATURE_TIMESTAMP_HEADER]: timestamp },
        rawBody: raw,
        body: eventBody,
      }),
    err => err instanceof HttpError && err.status === 400,
  );
});
