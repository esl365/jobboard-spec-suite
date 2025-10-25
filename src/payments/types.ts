export const OrderStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};

export function assertOrderStatus(value) {
  if (!Object.values(OrderStatus).includes(value)) {
    throw new Error(`Unknown order status: ${value}`);
  }
  return value;
}

export function normalizeBusinessKey(payload) {
  const { packageId, amountCents, provider } = payload;
  return {
    packageId,
    amountCents,
    provider,
  };
}

export function validatePrepareRequest(body) {
  if (!body || typeof body !== "object") throw new Error("Invalid body");
  const { userId, amountCents, provider, packageId } = body;
  if (!userId) throw new Error("userId required");
  if (typeof amountCents !== "number" || Number.isNaN(amountCents) || amountCents < 0) {
    throw new Error("amountCents must be >= 0");
  }
  if (!provider) throw new Error("provider required");
  if (!packageId) throw new Error("packageId required");
  return {
    userId,
    amountCents,
    provider,
    packageId,
    providerMeta: body.providerMeta ?? null,
  };
}

export function validateWebhookEvent(event) {
  if (!event || typeof event !== "object") throw new Error("event body required");
  const { eventUid, provider, type, occurredAt, data = {} } = event;
  if (!eventUid) throw new Error("eventUid required");
  if (!provider) throw new Error("provider required");
  if (!type) throw new Error("type required");
  if (!occurredAt) throw new Error("occurredAt required");
  return { eventUid, provider, type, occurredAt, data };
}
