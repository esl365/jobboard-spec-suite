import crypto from "node:crypto";
import { stableStringify } from "../../utils/stableStringify.ts";
import { PAYMENT_SIGNATURE_HEADER } from "../types.ts";

const DEFAULT_SECRET = "mock_webhook_secret";

export const MOCK_SIGNATURE_HEADER = PAYMENT_SIGNATURE_HEADER;

export class MockPaymentAdapter {
  constructor(options = {}) {
    this.provider = "mock";
    this.webhookSecret = options.webhookSecret || DEFAULT_SECRET;
    this.signatureHeader = MOCK_SIGNATURE_HEADER;
  }

  providerName() {
    return this.provider;
  }

  signPayload(payload, secret = this.webhookSecret) {
    const raw =
      typeof payload === "string"
        ? payload
        : typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(payload)
        ? payload.toString("utf8")
        : stableStringify(payload);
    return crypto.createHmac("sha256", secret).update(raw).digest("base64");
  }

  verifySignature({ rawBody, signature, secret = this.webhookSecret }) {
    if (!signature) return false;
    const expected = this.signPayload(rawBody, secret);
    const signatureBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expected, "base64");
    if (signatureBuffer.length !== expectedBuffer.length) return false;
    try {
      return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  createPaymentIntent({ orderId, amountCents, currency, metadata = {} }) {
    const providerPaymentId = `mock_${orderId}`;
    const requestPayload = {
      amount: amountCents,
      currency,
      reference: orderId,
      metadata,
    };
    return {
      providerPaymentId,
      requestPayload,
    };
  }
}

export function createMockAdapter(options = {}) {
  return new MockPaymentAdapter(options);
}
