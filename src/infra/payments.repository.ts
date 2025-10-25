export class PaymentsRepositoryTransaction {
  async findIdempotencyRecord(_key, _userId, _method, _path) {
    throw new Error("Not implemented");
  }

  async saveIdempotencyRecord(_record) {
    throw new Error("Not implemented");
  }

  async findOrderById(_orderId) {
    throw new Error("Not implemented");
  }

  async findOrderByProviderReference(_provider, _providerPaymentId) {
    throw new Error("Not implemented");
  }

  async insertOrder(_order) {
    throw new Error("Not implemented");
  }

  async updateOrder(_orderId, _patch) {
    throw new Error("Not implemented");
  }

  async insertWalletLedger(_entry) {
    throw new Error("Not implemented");
  }

  async findWebhookEvent(_eventUid) {
    throw new Error("Not implemented");
  }

  async insertWebhookEvent(_event) {
    throw new Error("Not implemented");
  }

  async getProductPackage(_packageId) {
    throw new Error("Not implemented");
  }
}

export class PaymentsRepository {
  constructor() {
    if (new.target === PaymentsRepository) {
      throw new Error("PaymentsRepository is abstract");
    }
  }

  async runInTransaction(_fn) {
    throw new Error("Not implemented");
  }
}
