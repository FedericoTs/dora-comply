-- ============================================================================
-- Migration: 045_business_intelligence
-- Description: Business intelligence module for vendor news monitoring,
--              breach exposure tracking, and external data enrichment
-- ============================================================================

-- ============================================================================
-- Vendor News Alerts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_news_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Source identification
  source TEXT NOT NULL,              -- 'newsapi', 'sec_edgar', 'opencorporates', 'hibp'
  external_id TEXT,                  -- External reference ID from source

  -- Alert classification
  alert_type TEXT NOT NULL,          -- 'news', 'regulatory', 'financial', 'leadership', 'breach', 'filing'
  severity TEXT NOT NULL DEFAULT 'medium',

  -- Content
  headline TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  image_url TEXT,

  -- Metadata
  published_at TIMESTAMPTZ,
  sentiment_score NUMERIC,           -- -1 to 1 (negative to positive)
  sentiment_label TEXT,              -- 'positive', 'neutral', 'negative'
  keywords TEXT[],                   -- Matched keywords

  -- Status
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_source CHECK (source IN ('newsapi', 'sec_edgar', 'opencorporates', 'hibp', 'manual')),
  CONSTRAINT valid_alert_type CHECK (alert_type IN ('news', 'regulatory', 'financial', 'leadership', 'breach', 'filing', 'other'))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_vendor_news_alerts_vendor ON vendor_news_alerts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_news_alerts_org ON vendor_news_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendor_news_alerts_unread ON vendor_news_alerts(organization_id, is_read) WHERE NOT is_read AND NOT is_dismissed;
CREATE INDEX IF NOT EXISTS idx_vendor_news_alerts_severity ON vendor_news_alerts(organization_id, severity) WHERE NOT is_dismissed;
CREATE INDEX IF NOT EXISTS idx_vendor_news_alerts_source ON vendor_news_alerts(source);
CREATE INDEX IF NOT EXISTS idx_vendor_news_alerts_created ON vendor_news_alerts(created_at DESC);

-- Unique constraint to prevent duplicate alerts
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_news_alerts_unique
  ON vendor_news_alerts(vendor_id, source, external_id)
  WHERE external_id IS NOT NULL;

-- Enable RLS
ALTER TABLE vendor_news_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own org news alerts" ON vendor_news_alerts;
CREATE POLICY "Users can view own org news alerts"
  ON vendor_news_alerts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert news alerts for own org" ON vendor_news_alerts;
CREATE POLICY "Users can insert news alerts for own org"
  ON vendor_news_alerts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own org news alerts" ON vendor_news_alerts;
CREATE POLICY "Users can update own org news alerts"
  ON vendor_news_alerts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own org news alerts" ON vendor_news_alerts;
CREATE POLICY "Users can delete own org news alerts"
  ON vendor_news_alerts FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- Vendor Fields for Intelligence Monitoring
-- ============================================================================

-- News monitoring fields
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS news_monitoring_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_news_sync TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS news_keywords TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS news_alert_count INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS news_unread_count INTEGER DEFAULT 0;

-- Breach exposure fields (HIBP)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS breach_exposure_count INTEGER;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS breach_exposure_checked_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS breach_domains TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS breach_severity TEXT;

-- SEC filings fields
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sec_cik TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_sec_filing_date TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sec_filing_count INTEGER;

-- OpenCorporates fields
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS opencorporates_url TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS company_number TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS incorporation_date DATE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS company_status TEXT;

-- Add index for monitoring-enabled vendors
CREATE INDEX IF NOT EXISTS idx_vendors_news_monitoring
  ON vendors(organization_id, news_monitoring_enabled)
  WHERE news_monitoring_enabled = TRUE;

-- ============================================================================
-- Intelligence Sync Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- Sync details
  source TEXT NOT NULL,
  sync_type TEXT NOT NULL,           -- 'manual', 'scheduled', 'webhook'
  status TEXT NOT NULL,              -- 'pending', 'running', 'completed', 'failed'

  -- Results
  alerts_created INTEGER DEFAULT 0,
  alerts_updated INTEGER DEFAULT 0,
  error_message TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_sync_status CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_intelligence_sync_log_org ON intelligence_sync_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_sync_log_vendor ON intelligence_sync_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_sync_log_status ON intelligence_sync_log(status) WHERE status IN ('pending', 'running');

-- Enable RLS
ALTER TABLE intelligence_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org sync log" ON intelligence_sync_log;
CREATE POLICY "Users can view own org sync log"
  ON intelligence_sync_log FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert sync log for own org" ON intelligence_sync_log;
CREATE POLICY "Users can insert sync log for own org"
  ON intelligence_sync_log FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to update vendor alert counts
CREATE OR REPLACE FUNCTION update_vendor_alert_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts for the affected vendor
  UPDATE vendors
  SET
    news_alert_count = (
      SELECT COUNT(*) FROM vendor_news_alerts
      WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
      AND NOT is_dismissed
    ),
    news_unread_count = (
      SELECT COUNT(*) FROM vendor_news_alerts
      WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
      AND NOT is_read
      AND NOT is_dismissed
    )
  WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update counts on alert changes
DROP TRIGGER IF EXISTS trigger_update_vendor_alert_counts ON vendor_news_alerts;
CREATE TRIGGER trigger_update_vendor_alert_counts
  AFTER INSERT OR UPDATE OR DELETE ON vendor_news_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_alert_counts();

-- Function to get unread alert summary
CREATE OR REPLACE FUNCTION get_intelligence_summary(p_organization_id UUID)
RETURNS TABLE (
  total_alerts BIGINT,
  unread_alerts BIGINT,
  critical_alerts BIGINT,
  high_alerts BIGINT,
  vendors_with_alerts BIGINT,
  latest_alert_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_alerts,
    COUNT(*) FILTER (WHERE NOT is_read)::BIGINT as unread_alerts,
    COUNT(*) FILTER (WHERE severity = 'critical' AND NOT is_dismissed)::BIGINT as critical_alerts,
    COUNT(*) FILTER (WHERE severity = 'high' AND NOT is_dismissed)::BIGINT as high_alerts,
    COUNT(DISTINCT vendor_id)::BIGINT as vendors_with_alerts,
    MAX(created_at) as latest_alert_at
  FROM vendor_news_alerts
  WHERE organization_id = p_organization_id
  AND NOT is_dismissed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE vendor_news_alerts IS 'Stores business intelligence alerts from various sources (news, SEC filings, breach data)';
COMMENT ON TABLE intelligence_sync_log IS 'Tracks synchronization history for intelligence data sources';
COMMENT ON COLUMN vendors.news_monitoring_enabled IS 'Whether to automatically fetch news and intelligence for this vendor';
COMMENT ON COLUMN vendors.breach_exposure_count IS 'Number of known data breaches affecting this vendor domain';
COMMENT ON COLUMN vendors.sec_cik IS 'SEC Central Index Key for US public companies';
