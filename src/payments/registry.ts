import { createMockAdapter } from "./adapters/mock.ts";

export class PaymentAdapterRegistry {
  constructor(adapters = []) {
    this.adapters = new Map(adapters.map(adapter => [adapter.providerName(), adapter]));
    if (!this.adapters.has("mock")) {
      const mock = createMockAdapter();
      this.adapters.set(mock.providerName(), mock);
    }
  }

  get(provider) {
    return this.adapters.get(provider);
  }
}

export function createDefaultRegistry() {
  return new PaymentAdapterRegistry();
}
