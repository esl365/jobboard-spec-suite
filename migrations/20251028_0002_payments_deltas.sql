-- Delta 1: provider metadata payload on orders for provider-specific context
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS provider_meta JSONB;

-- Delta 2: idempotency expiry + payload hash for replay detection (7d retention)
ALTER TABLE idempotency_keys
  ADD COLUMN IF NOT EXISTS business_hash TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS order_id UUID,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days');

COMMENT ON COLUMN idempotency_keys.expires_at IS 'Clean up expired idempotency records after 7 days';

-- Delta 3: webhook retention horizon (180d) and payload fingerprint
ALTER TABLE webhook_events
  ADD COLUMN IF NOT EXISTS payload_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '180 days');

COMMENT ON COLUMN webhook_events.retention_until IS 'Housekeeping: purge webhook events after 180 days';

CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_event_uid_idx
  ON webhook_events(provider, event_uid);
