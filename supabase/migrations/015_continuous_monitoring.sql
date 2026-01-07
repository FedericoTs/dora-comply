-- Migration 015: Continuous Monitoring Integration
-- Adds SecurityScorecard and external risk monitoring capabilities

-- ============================================================================
-- VENDOR MONITORING FIELDS
-- ============================================================================

-- Add external monitoring score fields to vendors
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS external_risk_score INTEGER CHECK (external_risk_score >= 0 AND external_risk_score <= 100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS external_risk_grade TEXT CHECK (external_risk_grade IN ('A', 'B', 'C', 'D', 'F'));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS external_score_provider TEXT DEFAULT 'securityscorecard';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS external_score_updated_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS external_score_factors JSONB DEFAULT '[]'::jsonb;

-- Monitoring configuration
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS monitoring_enabled BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS monitoring_domain TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_monitoring_sync TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS monitoring_alert_threshold INTEGER DEFAULT 70;

-- Add index for monitoring queries
CREATE INDEX IF NOT EXISTS idx_vendors_monitoring_enabled ON vendors(monitoring_enabled) WHERE monitoring_enabled = true;
CREATE INDEX IF NOT EXISTS idx_vendors_external_risk_grade ON vendors(external_risk_grade) WHERE external_risk_grade IS NOT NULL;

-- ============================================================================
-- VENDOR SCORE HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Score data
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  provider TEXT NOT NULL DEFAULT 'securityscorecard',
  factors JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT vendor_score_history_unique UNIQUE (vendor_id, recorded_at)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_vendor_score_history_vendor ON vendor_score_history(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_score_history_recorded ON vendor_score_history(vendor_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_score_history_org ON vendor_score_history(organization_id);

-- Enable RLS
ALTER TABLE vendor_score_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's score history"
  ON vendor_score_history FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert score history for their organization"
  ON vendor_score_history FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete their organization's score history"
  ON vendor_score_history FOR DELETE
  USING (organization_id = get_user_organization_id());

-- ============================================================================
-- MONITORING ALERTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'score_drop',           -- Score decreased significantly
    'grade_change',         -- Grade changed (e.g., B → C)
    'threshold_breach',     -- Score dropped below threshold
    'critical_finding',     -- New critical security finding
    'score_improvement'     -- Score improved significantly
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',

  -- Score context
  previous_score INTEGER,
  current_score INTEGER,
  previous_grade TEXT,
  current_grade TEXT,
  score_change INTEGER,

  -- Alert status
  status TEXT NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')) DEFAULT 'active',
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Message and metadata
  title TEXT NOT NULL,
  message TEXT,
  details JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_vendor ON monitoring_alerts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_org ON monitoring_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON monitoring_alerts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_created ON monitoring_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's alerts"
  ON monitoring_alerts FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert alerts for their organization"
  ON monitoring_alerts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their organization's alerts"
  ON monitoring_alerts FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate grade from score
CREATE OR REPLACE FUNCTION calculate_security_grade(score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF score >= 90 THEN RETURN 'A';
  ELSIF score >= 80 THEN RETURN 'B';
  ELSIF score >= 70 THEN RETURN 'C';
  ELSIF score >= 60 THEN RETURN 'D';
  ELSE RETURN 'F';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine alert severity based on score change
CREATE OR REPLACE FUNCTION calculate_alert_severity(
  old_score INTEGER,
  new_score INTEGER,
  old_grade TEXT,
  new_grade TEXT
)
RETURNS TEXT AS $$
DECLARE
  score_drop INTEGER;
  grade_levels TEXT[] := ARRAY['A', 'B', 'C', 'D', 'F'];
  old_level INTEGER;
  new_level INTEGER;
BEGIN
  score_drop := old_score - new_score;

  -- Find grade positions
  old_level := array_position(grade_levels, old_grade);
  new_level := array_position(grade_levels, new_grade);

  -- Critical: Grade dropped 2+ levels or score dropped 20+
  IF (new_level - old_level >= 2) OR (score_drop >= 20) THEN
    RETURN 'critical';
  -- High: Grade dropped 1 level or score dropped 15+
  ELSIF (new_level > old_level) OR (score_drop >= 15) THEN
    RETURN 'high';
  -- Medium: Score dropped 10+
  ELSIF score_drop >= 10 THEN
    RETURN 'medium';
  -- Low: Minor changes
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_monitoring_alert_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monitoring_alerts_updated_at
  BEFORE UPDATE ON monitoring_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_monitoring_alert_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vendor_score_history IS 'Historical record of external security scores for vendors';
COMMENT ON TABLE monitoring_alerts IS 'Alerts generated from continuous monitoring score changes';
COMMENT ON COLUMN vendors.external_risk_score IS 'Latest external security score (0-100) from monitoring provider';
COMMENT ON COLUMN vendors.external_risk_grade IS 'Letter grade (A-F) corresponding to external score';
COMMENT ON COLUMN vendors.monitoring_domain IS 'Domain used for external security monitoring lookups';
COMMENT ON COLUMN vendors.monitoring_alert_threshold IS 'Alert when external score drops below this value';
