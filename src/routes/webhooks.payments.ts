import { createHash } from "node:crypto";
import {
  PaymentsRepository,
  SIGNATURE_HEADER,
  SIGNATURE_TIMESTAMP_HEADER,
  WebhookSettlementInput
} from "../payments/types.js";
import { verifySignature } from "../payments/adapters/mock.js";

const TIMESTAMP_TOLERANCE_SECONDS = 300;

export interface WebhookRequest {
  params?: { provider?: string };
  headers: Record<string, string | string[]>;
  rawBody?: Buffer;
}

export interface WebhookResponse {
  status(code: number): WebhookResponse;
  send(body: unknown): void;
}

export interface WebhookHandlerDeps {
  repository: PaymentsRepository;
  secretResolver: (provider: string) => Promise<string>;
  now?: () => Date;
}

function headerValue(headers: Record<string, string | string[]>, name: string): string | undefined {
  const raw = headers[name.toLowerCase()] ?? headers[name];
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

function ensureTimestampWithinTolerance(timestamp: Date, now: Date): boolean {
  const diffSeconds = Math.abs(now.getTime() - timestamp.getTime()) / 1000;
  return diffSeconds <= TIMESTAMP_TOLERANCE_SECONDS;
}

function fingerprintBody(rawBody: Buffer): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

function parsePayload(rawBody: Buffer): WebhookSettlementInput {
  const decoded = JSON.parse(rawBody.toString("utf8"));
  if (!decoded || typeof decoded !== "object") {
    throw new Error("INVALID_PAYLOAD");
  }
  const orderId = String((decoded as Record<string, unknown>).orderId ?? "").trim();
  const providerPaymentId = String((decoded as Record<string, unknown>).providerPaymentId ?? "").trim();
  const eventUid = String((decoded as Record<string, unknown>).eventUid ?? providerPaymentId ?? "").trim();
  const amount = Number((decoded as Record<string, unknown>).amountCents ?? 0);
  if (!orderId || !eventUid || Number.isNaN(amount)) {
    throw new Error("INVALID_PAYLOAD");
  }
  return {
    provider: String((decoded as Record<string, unknown>).provider ?? "mock"),
    eventUid,
    orderId,
    providerPaymentId: providerPaymentId || eventUid,
    amountCents: amount,
    fingerprint: fingerprintBody(rawBody)
  };
}

export async function handleWebhook(
  req: WebhookRequest,
  res: WebhookResponse,
  deps: WebhookHandlerDeps
): Promise<void> {
  if (!req.rawBody) {
    res.status(400).send({ error: "RAW_BODY_REQUIRED" });
    return;
  }
  const provider = req.params?.provider ?? "mock";
  const signature = headerValue(req.headers, SIGNATURE_HEADER);
  const timestampHeader = headerValue(req.headers, SIGNATURE_TIMESTAMP_HEADER);
  if (!timestampHeader) {
    res.status(400).send({ error: "SIGNATURE_TIMESTAMP_REQUIRED" });
    return;
  }
  const timestamp = new Date(timestampHeader);
  if (Number.isNaN(timestamp.getTime())) {
    res.status(400).send({ error: "INVALID_TIMESTAMP" });
    return;
  }
  const now = deps.now ? deps.now() : new Date();
  if (!ensureTimestampWithinTolerance(timestamp, now)) {
    res.status(400).send({ error: "STALE_TIMESTAMP" });
    return;
  }
  const secret = await deps.secretResolver(provider);
  if (!verifySignature(req.rawBody, signature, secret)) {
    res.status(401).send({ error: "INVALID_SIGNATURE" });
    return;
  }

  let payload: WebhookSettlementInput;
  try {
    payload = parsePayload(req.rawBody);
  } catch (error) {
    res.status(400).send({ error: (error as Error).message });
    return;
  }
  payload.provider = provider;

  await deps.repository.withTransaction(async tx => {
    const recorded = await tx.saveWebhookEvent({
      provider,
      eventUid: payload.eventUid,
      fingerprint: payload.fingerprint,
      receivedAt: now
    });
    if (!recorded) {
      res.status(200).send({ status: "duplicate" });
      return;
    }
    const order = await tx.getOrderById(payload.orderId);
    if (!order) {
      res.status(404).send({ error: "ORDER_NOT_FOUND" });
      return;
    }
    order.status = "SETTLED";
    order.providerPaymentId = payload.providerPaymentId;
    order.updatedAt = now;
    await tx.saveOrder(order);
    await tx.appendWalletLedger({
      entryId: `${payload.orderId}:${payload.eventUid}`,
      orderId: payload.orderId,
      amountCents: payload.amountCents,
      createdAt: now
    });
    res.status(200).send({ status: "settled" });
  });
}
