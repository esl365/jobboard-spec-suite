import crypto from "node:crypto";
import { OrderStatus, normalizeBusinessKey, validatePrepareRequest } from "../payments/types.ts";
import { stableStringify } from "../utils/stableStringify.ts";
import { badRequest, conflict, forbidden, unauthorized } from "./httpError.ts";

const IDEMPOTENCY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const METHOD = "POST";
const PATH = "/payments/prepare";

function readHeader(headers = {}, name) {
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === name.toLowerCase()) return value;
  }
  return undefined;
}

function ensureCompanyActor(actor) {
  if (!actor) {
    throw unauthorized("AUTH_REQUIRED", "Authentication required");
  }
  const role = actor.role || actor.type;
  if (role !== "COMPANY" && !(Array.isArray(role) && role.includes("COMPANY"))) {
    throw forbidden("COMPANY_ONLY", "Only company accounts can prepare payments");
  }
}

function createBusinessHash(business) {
  return crypto.createHash("sha256").update(stableStringify(business)).digest("hex");
}

export function createPaymentsPrepareHandler({ paymentsRepo, registry, clock = () => new Date() }) {
  if (!paymentsRepo) throw new Error("paymentsRepo required");
  if (!registry) throw new Error("registry required");

  return async function handle(request) {
    const key = readHeader(request.headers, "Idempotency-Key");
    if (!key) throw badRequest("IDEMPOTENCY_REQUIRED", "Idempotency-Key header required");
    ensureCompanyActor(request.actor);

    const payload = validatePrepareRequest(request.body);
    const adapter = registry.get(payload.provider);
    if (!adapter) {
      throw badRequest("UNKNOWN_PROVIDER", `Unsupported provider ${payload.provider}`);
    }

    return paymentsRepo.runInTransaction(async tx => {
      const pkg = await tx.getProductPackage(payload.packageId);
      if (!pkg) {
        throw badRequest("PACKAGE_NOT_FOUND", "Requested package is not available");
      }
      if (pkg.active === false) {
        throw conflict("PACKAGE_INACTIVE", "Requested package is inactive");
      }

      const canonicalAmount = pkg.amountCents;
      if (payload.amountCents !== canonicalAmount) {
        throw conflict("AMOUNT_MISMATCH", "Amount does not match package pricing");
      }

      const businessData = normalizeBusinessKey({
        packageId: payload.packageId,
        amountCents: canonicalAmount,
        provider: payload.provider,
      });
      const businessHash = createBusinessHash(businessData);

      const existing = await tx.findIdempotencyRecord(key, payload.userId, METHOD, PATH);
      if (existing) {
        if (existing.businessHash && existing.businessHash !== businessHash) {
          throw conflict("IDEMPOTENCY_COLLISION", "Idempotency-Key reused with different payload");
        }
        const existingOrder = await tx.findOrderById(existing.orderId);
        if (!existingOrder) {
          throw conflict("IDEMPOTENCY_STALE", "Stored idempotent order missing");
        }
        return {
          status: 200,
          body: existingOrder,
          reused: true,
        };
      }

      const now = clock();
      const orderId = crypto.randomUUID();
      const isoNow = now.toISOString();
      const paymentIntent = adapter.createPaymentIntent({
        orderId,
        amountCents: canonicalAmount,
        currency: pkg.currency || "KRW",
        metadata: {
          packageId: payload.packageId,
          userId: payload.userId,
        },
      });

      const order = {
        orderId,
        userId: payload.userId,
        totalAmountCents: canonicalAmount,
        provider: payload.provider,
        providerPaymentId: paymentIntent.providerPaymentId || null,
        status: OrderStatus.PENDING,
        createdAt: isoNow,
        updatedAt: isoNow,
        providerMeta: paymentIntent.requestPayload || null,
      };

      await tx.insertOrder(order);
      await tx.saveIdempotencyRecord({
        key,
        userId: payload.userId,
        method: METHOD,
        path: PATH,
        businessHash,
        businessData,
        orderId,
        createdAt: isoNow,
        expiresAt: new Date(now.getTime() + IDEMPOTENCY_WINDOW_MS).toISOString(),
      });

      return {
        status: 200,
        body: {
          orderId: order.orderId,
          userId: order.userId,
          status: order.status,
          totalAmountCents: order.totalAmountCents,
          provider: order.provider,
          providerPaymentId: order.providerPaymentId,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          pgRequestPayload: paymentIntent.requestPayload,
        },
        reused: false,
      };
    });
  };
}
