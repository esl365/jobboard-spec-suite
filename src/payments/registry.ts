import { buildProviderPayload, createSignedHeaders } from "./adapters/mock.js";

export interface PaymentProviderAdapter {
  name: string;
  createSignedHeaders: typeof createSignedHeaders;
  buildProviderPayload: typeof buildProviderPayload;
}

const mockProvider: PaymentProviderAdapter = {
  name: "mock",
  createSignedHeaders,
  buildProviderPayload
};

const registry: Record<string, PaymentProviderAdapter> = {
  mock: mockProvider
};

export function getPaymentProvider(name: string): PaymentProviderAdapter {
  const provider = registry[name];
  if (!provider) {
    throw new Error(`Unknown payment provider: ${name}`);
  }
  return provider;
}

export function listProviders(): PaymentProviderAdapter[] {
  return Object.values(registry);
}
