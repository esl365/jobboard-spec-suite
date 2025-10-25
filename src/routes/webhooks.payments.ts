import {
  OrderStatus,
  PAYMENT_SIGNATURE_HEADER,
  PAYMENT_SIGNATURE_TIMESTAMP_HEADER,
  validateWebhookEvent,
} from "../payments/types.ts";
import { fingerprintPayload, stableStringify } from "../utils/stableStringify.ts";
import { badRequest } from "./httpError.ts";

const RETENTION_DAYS = 180;
const SIGNATURE_TOLERANCE_SECONDS = 300;

function readHeader(headers = {}, name) {
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === name.toLowerCase()) return value;
  }
  return undefined;
}

function resolveRawBody(request) {
  if (typeof request.rawBody === "string") return request.rawBody;
  if (typeof Buffer !== "undefined" && typeof Buffer.isBuffer === "function" && Buffer.isBuffer(request.rawBody)) {
    return request.rawBody.toString("utf8");
  }
  if (typeof request.body === "string") return request.body;
  return stableStringify(request.body ?? {});
}

function resolveOrderStatus(type) {
  if (type === "payment.completed") return OrderStatus.COMPLETED;
  if (type === "payment.failed") return OrderStatus.FAILED;
  if (type === "payment.refunded") return OrderStatus.REFUNDED;
  throw badRequest("UNKNOWN_EVENT", `Unsupported event type ${type}`);
}

function parseTimestamp(value) {
  if (!value) return null;
  if (/^\d+$/.test(value)) {
    return new Date(Number(value) * 1000);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function createPaymentsWebhookHandler({ paymentsRepo, registry, clock = () => new Date() }) {
  if (!paymentsRepo) throw new Error("paymentsRepo required");
  if (!registry) throw new Error("registry required");

  return async function handle(request) {
    const provider = request.params?.provider;
    if (!provider) throw badRequest("PROVIDER_REQUIRED", "Provider path parameter missing");
    const adapter = registry.get(provider);
    if (!adapter) throw badRequest("UNKNOWN_PROVIDER", `Unsupported provider ${provider}`);

    const rawBody = resolveRawBody(request);
    const signature = readHeader(request.headers, PAYMENT_SIGNATURE_HEADER) || request.body?.signature;
    const timestampHeader = readHeader(request.headers, PAYMENT_SIGNATURE_TIMESTAMP_HEADER);
    const timestamp = parseTimestamp(timestampHeader);
    if (!timestamp) {
      throw badRequest("MISSING_TIMESTAMP", "Signature timestamp required");
    }

    const now = clock();
    const skewSeconds = Math.abs((now.getTime() - timestamp.getTime()) / 1000);
    if (skewSeconds > SIGNATURE_TOLERANCE_SECONDS) {
      throw badRequest("TIMESTAMP_SKEW", "Webhook timestamp outside tolerance window");
    }

    if (!adapter.verifySignature({ rawBody, signature })) {
      throw badRequest("INVALID_SIGNATURE", "Signature mismatch");
    }

    const event = validateWebhookEvent(request.body);
    if (event.provider !== provider) {
      throw badRequest("PROVIDER_MISMATCH", "Provider payload mismatch");
    }

    const fingerprint = fingerprintPayload(request.body);
    const retentionUntil = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    return paymentsRepo.runInTransaction(async tx => {
      const existingEvent = await tx.findWebhookEvent(provider, event.eventUid);
      if (existingEvent) {
        if (existingEvent.payloadFingerprint && existingEvent.payloadFingerprint !== fingerprint) {
          throw badRequest("EVENT_REPLAY_TAMPERED", "Replay payload does not match original");
        }
        let replayOrder = null;
        if (event.data.providerPaymentId) {
          replayOrder = await tx.findOrderByProviderReference(provider, event.data.providerPaymentId);
        }
        if (!replayOrder && event.data.orderId) {
          replayOrder = await tx.findOrderById(event.data.orderId);
        }
        return {
          status: 200,
          body: {
            ok: true,
            orderId: replayOrder?.orderId || null,
            replay: true,
          },
        };
      }

      const orderLookupId = event.data.orderId || null;
      let order = null;
      if (event.data.providerPaymentId) {
        order = await tx.findOrderByProviderReference(provider, event.data.providerPaymentId);
      }
      if (!order && orderLookupId) {
        order = await tx.findOrderById(orderLookupId);
      }
      if (!order) {
        throw badRequest("ORDER_NOT_FOUND", "Order not found for webhook event");
      }

      await tx.insertWebhookEvent({
        eventUid: event.eventUid,
        provider,
        receivedAt: now.toISOString(),
        payload: request.body,
        signature,
        payloadFingerprint: fingerprint,
        retentionUntil,
      });

      const status = resolveOrderStatus(event.type);
      const updated = await tx.updateOrder(order.orderId, {
        status,
        providerPaymentId: event.data.providerPaymentId || order.providerPaymentId,
        updatedAt: now.toISOString(),
      });
      order = updated || order;

      if (event.type === "payment.completed") {
        await tx.insertWalletLedger({
          userId: order.userId,
          orderId: order.orderId,
          direction: "CREDIT",
          amountCents: order.totalAmountCents,
          reasonType: "PAYMENT_COMPLETED",
          createdAt: now.toISOString(),
        });
      }

      return {
        status: 200,
        body: {
          ok: true,
          orderId: order.orderId,
          replay: false,
        },
      };
    });
  };
}
