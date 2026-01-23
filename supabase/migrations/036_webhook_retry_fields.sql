-- Migration: 036_webhook_retry_fields.sql
-- Description: Add retry tracking fields to webhook_deliveries table

-- Add next_retry_at field for scheduled retries
ALTER TABLE webhook_deliveries
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- Add max_retries field to track retry limit
ALTER TABLE webhook_deliveries
ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 3;

-- Add error_code for categorizing failures
ALTER TABLE webhook_deliveries
ADD COLUMN IF NOT EXISTS error_code TEXT;

-- Index for finding pending retries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending_retry
ON webhook_deliveries(next_retry_at)
WHERE next_retry_at IS NOT NULL AND failed_at IS NOT NULL;

-- Update retry_count default
ALTER TABLE webhook_deliveries
ALTER COLUMN retry_count SET DEFAULT 0;

-- Comment
COMMENT ON COLUMN webhook_deliveries.next_retry_at IS 'Scheduled time for automatic retry (if background jobs implemented)';
COMMENT ON COLUMN webhook_deliveries.max_retries IS 'Maximum number of retry attempts allowed';
COMMENT ON COLUMN webhook_deliveries.error_code IS 'Error code categorization (timeout, connection_refused, http_error, etc.)';
