import crypto from "node:crypto";
import { stableStringify } from "../../utils/stableStringify.ts";

const DEFAULT_SECRET = "mock_webhook_secret";

export class MockPaymentAdapter {
  constructor(options = {}) {
    this.provider = "mock";
    this.webhookSecret = options.webhookSecret || DEFAULT_SECRET;
  }

  providerName() {
    return this.provider;
  }

  signPayload(payload, secret = this.webhookSecret) {
    const raw = typeof payload === "string" ? payload : stableStringify(payload);
    return crypto.createHmac("sha256", secret).update(raw).digest("hex");
  }

  verifySignature({ rawBody, signature, secret = this.webhookSecret }) {
    if (!signature) return false;
    const expected = this.signPayload(rawBody, secret);
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
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
