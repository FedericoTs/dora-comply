-- Migration 016: Maturity History Tracking
-- Adds historical snapshots of compliance maturity for trend analysis and audit trails

-- =============================================================================
-- MATURITY SNAPSHOTS TABLE
-- =============================================================================
-- Stores point-in-time snapshots of organization-wide or vendor-specific maturity

CREATE TABLE IF NOT EXISTS maturity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Optional vendor scope (NULL = organization-wide snapshot)
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

  -- Snapshot metadata
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN (
    'scheduled',      -- Automatic weekly/monthly snapshot
    'manual',         -- User-triggered snapshot
    'soc2_upload',    -- After SOC 2 report processing
    'assessment',     -- After compliance assessment
    'remediation',    -- After gap remediation
    'baseline'        -- Initial baseline snapshot
  )),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Overall maturity (L0-L4 scale, stored as 0-4 integer)
  overall_maturity_level INTEGER NOT NULL CHECK (overall_maturity_level BETWEEN 0 AND 4),
  overall_maturity_label TEXT NOT NULL CHECK (overall_maturity_label IN (
    'L0 - Not Performed',
    'L1 - Informal',
    'L2 - Planned & Tracked',
    'L3 - Well-Defined',
    'L4 - Quantitatively Managed'
  )),
  overall_readiness_percent NUMERIC(5,2) NOT NULL CHECK (overall_readiness_percent BETWEEN 0 AND 100),

  -- Per-pillar maturity levels (L0-L4)
  pillar_ict_risk_mgmt INTEGER NOT NULL CHECK (pillar_ict_risk_mgmt BETWEEN 0 AND 4),
  pillar_incident_reporting INTEGER NOT NULL CHECK (pillar_incident_reporting BETWEEN 0 AND 4),
  pillar_resilience_testing INTEGER NOT NULL CHECK (pillar_resilience_testing BETWEEN 0 AND 4),
  pillar_third_party_risk INTEGER NOT NULL CHECK (pillar_third_party_risk BETWEEN 0 AND 4),
  pillar_info_sharing INTEGER NOT NULL CHECK (pillar_info_sharing BETWEEN 0 AND 4),

  -- Per-pillar readiness percentages
  pillar_ict_risk_mgmt_percent NUMERIC(5,2) DEFAULT 0,
  pillar_incident_reporting_percent NUMERIC(5,2) DEFAULT 0,
  pillar_resilience_testing_percent NUMERIC(5,2) DEFAULT 0,
  pillar_third_party_risk_percent NUMERIC(5,2) DEFAULT 0,
  pillar_info_sharing_percent NUMERIC(5,2) DEFAULT 0,

  -- Gap metrics
  total_requirements INTEGER NOT NULL DEFAULT 0,
  requirements_met INTEGER NOT NULL DEFAULT 0,
  requirements_partial INTEGER NOT NULL DEFAULT 0,
  requirements_not_met INTEGER NOT NULL DEFAULT 0,
  critical_gaps_count INTEGER NOT NULL DEFAULT 0,
  high_gaps_count INTEGER NOT NULL DEFAULT 0,
  medium_gaps_count INTEGER NOT NULL DEFAULT 0,
  low_gaps_count INTEGER NOT NULL DEFAULT 0,

  -- Critical gaps detail (array of gap descriptions)
  critical_gaps JSONB DEFAULT '[]'::jsonb,

  -- Estimated remediation timeline
  estimated_remediation_weeks INTEGER,

  -- Change from previous snapshot
  change_from_previous JSONB DEFAULT NULL,
  -- Format: { "overall": +1, "pillars": { "ict_risk_mgmt": 0, ... }, "gaps_closed": 5 }

  -- Audit fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,

  -- Ensure unique snapshots per day per scope
  CONSTRAINT unique_daily_snapshot UNIQUE (organization_id, vendor_id, snapshot_date)
);

-- =============================================================================
-- MATURITY CHANGE LOG TABLE
-- =============================================================================
-- Detailed audit trail of individual requirement/evidence changes

CREATE TABLE IF NOT EXISTS maturity_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,

  -- What changed
  change_type TEXT NOT NULL CHECK (change_type IN (
    'maturity_level_change',    -- Overall or pillar maturity changed
    'requirement_status_change', -- Requirement met/not met
    'evidence_added',           -- New evidence linked
    'evidence_removed',         -- Evidence unlinked
    'gap_identified',           -- New gap found
    'gap_remediated',           -- Gap closed
    'assessment_completed',     -- Full assessment done
    'score_recalculated'        -- Scores recalculated
  )),

  -- Scope of change
  pillar TEXT CHECK (pillar IN (
    'ict_risk_management',
    'incident_reporting',
    'resilience_testing',
    'third_party_risk',
    'information_sharing'
  )),
  requirement_id TEXT,  -- e.g., 'art_5_1' for Article 5.1

  -- Change details
  previous_value JSONB,  -- What it was before
  new_value JSONB,       -- What it is now

  -- Impact
  maturity_impact INTEGER DEFAULT 0,  -- -1, 0, or +1 to maturity level

  -- Audit fields
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_reason TEXT,
  source TEXT,  -- 'manual', 'soc2_extraction', 'api', etc.

  -- Related entities
  related_document_id UUID REFERENCES documents(id),
  related_snapshot_id UUID REFERENCES maturity_snapshots(id)
);

-- =============================================================================
-- SCHEDULED SNAPSHOT SETTINGS TABLE
-- =============================================================================
-- Configure automatic snapshot frequency per organization

CREATE TABLE IF NOT EXISTS maturity_snapshot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,

  -- Snapshot frequency
  auto_snapshot_enabled BOOLEAN NOT NULL DEFAULT true,
  snapshot_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (snapshot_frequency IN (
    'daily',
    'weekly',
    'biweekly',
    'monthly'
  )),
  snapshot_day_of_week INTEGER CHECK (snapshot_day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  snapshot_day_of_month INTEGER CHECK (snapshot_day_of_month BETWEEN 1 AND 28),

  -- Notification settings
  notify_on_improvement BOOLEAN DEFAULT true,
  notify_on_regression BOOLEAN DEFAULT true,
  notify_threshold_change INTEGER DEFAULT 1, -- Notify if maturity changes by this much

  -- Retention
  retention_months INTEGER NOT NULL DEFAULT 24, -- Keep snapshots for 2 years

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Maturity snapshots indexes
CREATE INDEX IF NOT EXISTS idx_maturity_snapshots_org
  ON maturity_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_maturity_snapshots_vendor
  ON maturity_snapshots(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_maturity_snapshots_date
  ON maturity_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_maturity_snapshots_org_date
  ON maturity_snapshots(organization_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_maturity_snapshots_type
  ON maturity_snapshots(snapshot_type);

-- Change log indexes
CREATE INDEX IF NOT EXISTS idx_maturity_change_log_org
  ON maturity_change_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_maturity_change_log_vendor
  ON maturity_change_log(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_maturity_change_log_date
  ON maturity_change_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_maturity_change_log_type
  ON maturity_change_log(change_type);
CREATE INDEX IF NOT EXISTS idx_maturity_change_log_pillar
  ON maturity_change_log(pillar) WHERE pillar IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE maturity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE maturity_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE maturity_snapshot_settings ENABLE ROW LEVEL SECURITY;

-- Maturity snapshots policies
CREATE POLICY "Users can view own org maturity snapshots"
  ON maturity_snapshots FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create own org maturity snapshots"
  ON maturity_snapshots FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own org maturity snapshots"
  ON maturity_snapshots FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Change log policies
CREATE POLICY "Users can view own org change log"
  ON maturity_change_log FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create own org change log"
  ON maturity_change_log FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- Settings policies
CREATE POLICY "Users can view own org snapshot settings"
  ON maturity_snapshot_settings FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage own org snapshot settings"
  ON maturity_snapshot_settings FOR ALL
  USING (organization_id = get_user_organization_id());

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get maturity level label from integer
CREATE OR REPLACE FUNCTION get_maturity_label(level INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE level
    WHEN 0 THEN 'L0 - Not Performed'
    WHEN 1 THEN 'L1 - Informal'
    WHEN 2 THEN 'L2 - Planned & Tracked'
    WHEN 3 THEN 'L3 - Well-Defined'
    WHEN 4 THEN 'L4 - Quantitatively Managed'
    ELSE 'Unknown'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate change from previous snapshot
CREATE OR REPLACE FUNCTION calculate_snapshot_change(
  p_organization_id UUID,
  p_vendor_id UUID,
  p_new_overall INTEGER,
  p_new_pillars JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_previous RECORD;
  v_result JSONB;
BEGIN
  -- Get the most recent previous snapshot
  SELECT * INTO v_previous
  FROM maturity_snapshots
  WHERE organization_id = p_organization_id
    AND (vendor_id = p_vendor_id OR (vendor_id IS NULL AND p_vendor_id IS NULL))
  ORDER BY snapshot_date DESC
  LIMIT 1;

  IF v_previous IS NULL THEN
    RETURN NULL;
  END IF;

  v_result := jsonb_build_object(
    'overall_change', p_new_overall - v_previous.overall_maturity_level,
    'previous_overall', v_previous.overall_maturity_level,
    'previous_date', v_previous.snapshot_date,
    'pillar_changes', jsonb_build_object(
      'ict_risk_mgmt', (p_new_pillars->>'ict_risk_mgmt')::int - v_previous.pillar_ict_risk_mgmt,
      'incident_reporting', (p_new_pillars->>'incident_reporting')::int - v_previous.pillar_incident_reporting,
      'resilience_testing', (p_new_pillars->>'resilience_testing')::int - v_previous.pillar_resilience_testing,
      'third_party_risk', (p_new_pillars->>'third_party_risk')::int - v_previous.pillar_third_party_risk,
      'info_sharing', (p_new_pillars->>'info_sharing')::int - v_previous.pillar_info_sharing
    ),
    'gaps_change', (p_new_pillars->>'critical_gaps')::int - v_previous.critical_gaps_count
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE maturity_snapshots IS 'Point-in-time snapshots of DORA compliance maturity for trend analysis';
COMMENT ON TABLE maturity_change_log IS 'Detailed audit trail of compliance maturity changes';
COMMENT ON TABLE maturity_snapshot_settings IS 'Per-organization settings for automatic snapshot scheduling';

COMMENT ON COLUMN maturity_snapshots.overall_maturity_level IS 'L0-L4 maturity level as integer (0-4)';
COMMENT ON COLUMN maturity_snapshots.change_from_previous IS 'JSON object with deltas from the previous snapshot';
COMMENT ON COLUMN maturity_change_log.maturity_impact IS 'Impact on maturity level: -1 (regression), 0 (no change), +1 (improvement)';
