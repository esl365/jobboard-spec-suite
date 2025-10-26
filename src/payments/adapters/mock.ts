import { createHmac, timingSafeEqual } from "node:crypto";
import { SIGNATURE_HEADER, SIGNATURE_TIMESTAMP_HEADER } from "../types.js";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function sortKeys(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortKeys) as JsonValue;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, JsonValue>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, inner]) => [key, sortKeys(inner)] as const);
    return Object.fromEntries(entries) as JsonValue;
  }
  return value;
}

export function stableStringify(value: JsonValue): string {
  const normalized = sortKeys(value);
  return JSON.stringify(normalized);
}

export function hmacBase64(raw: Buffer | string, secret: string): string {
  const buffer = typeof raw === "string" ? Buffer.from(raw, "utf8") : raw;
  return createHmac("sha256", secret).update(buffer).digest("base64");
}

export interface MockPaymentPayload {
  orderId: string;
  providerPaymentId: string;
  amountCents: number;
  currency: string;
}

export function buildProviderPayload(payload: MockPaymentPayload): string {
  return stableStringify({
    orderId: payload.orderId,
    providerPaymentId: payload.providerPaymentId,
    amountCents: payload.amountCents,
    currency: payload.currency
  });
}

export interface SignatureHeaders {
  [SIGNATURE_HEADER]: string;
  [SIGNATURE_TIMESTAMP_HEADER]: string;
}

export function createSignedHeaders(rawBody: Buffer, secret: string, timestamp: Date): SignatureHeaders {
  const signature = hmacBase64(rawBody, secret);
  return {
    [SIGNATURE_HEADER]: signature,
    [SIGNATURE_TIMESTAMP_HEADER]: timestamp.toISOString()
  };
}

export function verifySignature(rawBody: Buffer, providedSignature: string | undefined, secret: string): boolean {
  if (!providedSignature) {
    return false;
  }
  const expected = Buffer.from(hmacBase64(rawBody, secret), "base64");
  let incoming: Buffer;
  try {
    incoming = Buffer.from(providedSignature, "base64");
  } catch {
    return false;
  }
  if (incoming.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(incoming, expected);
}
