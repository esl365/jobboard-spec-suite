# routes
export async function prepareOrderHandler(req, res) { /* TODO: validate Idempotency-Key, persist order */ res.json({ ok: true }); }
export async function webhookPaymentsHandler(req, res) { /* TODO: verify signature, dedupe, settle */ res.json({ ok: true }); }
