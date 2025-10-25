-- Canonical schema snapshot for payments vertical slice
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS orders (
  order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  total_amount_cents INTEGER NOT NULL CHECK (total_amount_cents >= 0),
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING','COMPLETED','FAILED','REFUNDED')),
  provider_meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id)
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  idem_key TEXT NOT NULL,
  user_id UUID NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  business_hash TEXT NOT NULL DEFAULT '',
  order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  PRIMARY KEY (idem_key, user_id, method, path)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id BIGSERIAL PRIMARY KEY,
  event_uid TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL,
  signature TEXT,
  payload_fingerprint TEXT,
  retention_until TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '180 days'),
  UNIQUE (provider, event_uid)
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  ledger_id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID,
  direction TEXT NOT NULL CHECK (direction IN ('CREDIT','DEBIT')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  reason_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_idem_expires ON idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_webhook_retention ON webhook_events(retention_until);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON wallet_ledger(user_id, created_at);
