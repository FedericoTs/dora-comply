-- Migration: 039_contract_lifecycle
-- Description: Contract Lifecycle Management - clauses, renewals, and alerts
-- Created: 2026-01-23
-- Depends on: 003_enhanced_roi.sql (contracts table)

-- ============================================
-- CONTRACT CLAUSES (AI-extracted)
-- ============================================

CREATE TABLE IF NOT EXISTS contract_clauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  -- Clause identification
  clause_type TEXT NOT NULL CHECK (clause_type IN (
    'termination', 'liability', 'indemnification', 'confidentiality',
    'data_protection', 'audit_rights', 'subcontracting', 'exit_strategy',
    'service_levels', 'business_continuity', 'security_requirements',
    'incident_notification', 'intellectual_property', 'governing_law',
    'dispute_resolution', 'force_majeure', 'insurance', 'other'
  )),

  -- Clause content
  title TEXT NOT NULL,
  summary TEXT, -- AI-generated summary
  full_text TEXT, -- Extracted clause text
  location TEXT, -- e.g., "Section 5.2, Page 12"

  -- AI extraction metadata
  ai_extracted BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  extracted_at TIMESTAMPTZ,

  -- Risk assessment
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_notes TEXT,

  -- Key dates within clause
  effective_date DATE,
  expiry_date DATE,
  notice_period_days INTEGER,

  -- Financial terms
  liability_cap DECIMAL(18,2),
  liability_cap_currency TEXT DEFAULT 'EUR',

  -- Compliance flags
  dora_relevant BOOLEAN DEFAULT FALSE,
  nis2_relevant BOOLEAN DEFAULT FALSE,
  gdpr_relevant BOOLEAN DEFAULT FALSE,

  -- Review status
  review_status TEXT CHECK (review_status IN ('pending', 'reviewed', 'flagged', 'approved')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contract_clauses_org ON contract_clauses(organization_id);
CREATE INDEX idx_contract_clauses_contract ON contract_clauses(contract_id);
CREATE INDEX idx_contract_clauses_type ON contract_clauses(clause_type);
CREATE INDEX idx_contract_clauses_risk ON contract_clauses(risk_level) WHERE risk_level IN ('high', 'critical');

-- ============================================
-- CONTRACT RENEWALS
-- ============================================

CREATE TABLE IF NOT EXISTS contract_renewals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  -- Renewal details
  renewal_number INTEGER NOT NULL DEFAULT 1,
  renewal_type TEXT NOT NULL CHECK (renewal_type IN (
    'automatic', 'manual', 'renegotiated', 'extended', 'terminated'
  )),

  -- Dates
  previous_expiry_date DATE NOT NULL,
  new_expiry_date DATE,
  decision_date DATE,
  notice_sent_date DATE,

  -- Decision tracking
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled'
  )) DEFAULT 'pending',
  decision_by UUID REFERENCES users(id),
  decision_notes TEXT,

  -- Changes in terms
  value_change DECIMAL(18,2), -- Positive or negative
  value_change_percent DECIMAL(5,2),
  terms_changed BOOLEAN DEFAULT FALSE,
  terms_change_summary TEXT,

  -- New contract reference (if renegotiated creates new contract)
  new_contract_id UUID REFERENCES contracts(id),

  -- Workflow
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  reminder_sent BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contract_id, renewal_number)
);

CREATE INDEX idx_contract_renewals_org ON contract_renewals(organization_id);
CREATE INDEX idx_contract_renewals_contract ON contract_renewals(contract_id);
CREATE INDEX idx_contract_renewals_status ON contract_renewals(status) WHERE status IN ('pending', 'under_review');
CREATE INDEX idx_contract_renewals_due ON contract_renewals(due_date) WHERE status = 'pending';

-- ============================================
-- CONTRACT ALERTS
-- ============================================

CREATE TABLE IF NOT EXISTS contract_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  -- Alert type
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'expiry_90_days', 'expiry_60_days', 'expiry_30_days', 'expiry_14_days', 'expiry_7_days',
    'expired', 'renewal_due', 'review_due', 'clause_expiry', 'compliance_review',
    'value_threshold', 'auto_renewal_notice', 'termination_window', 'custom'
  )),

  -- Alert details
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',

  -- Trigger info
  trigger_date DATE NOT NULL, -- When alert should/did trigger
  triggered_at TIMESTAMPTZ, -- When it actually triggered

  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'scheduled', 'triggered', 'acknowledged', 'resolved', 'dismissed', 'snoozed'
  )) DEFAULT 'scheduled',

  -- Assignment
  assigned_to UUID REFERENCES users(id),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Snooze functionality
  snoozed_until DATE,
  snooze_count INTEGER DEFAULT 0,

  -- Notifications
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT FALSE,

  -- Link to related entities
  renewal_id UUID REFERENCES contract_renewals(id),
  clause_id UUID REFERENCES contract_clauses(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contract_alerts_org ON contract_alerts(organization_id);
CREATE INDEX idx_contract_alerts_contract ON contract_alerts(contract_id);
CREATE INDEX idx_contract_alerts_status ON contract_alerts(status) WHERE status IN ('scheduled', 'triggered');
CREATE INDEX idx_contract_alerts_trigger ON contract_alerts(trigger_date) WHERE status = 'scheduled';
CREATE INDEX idx_contract_alerts_priority ON contract_alerts(priority) WHERE status IN ('triggered', 'acknowledged');

-- ============================================
-- CONTRACT VERSIONS (for amendment tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS contract_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  -- Version info
  version_number INTEGER NOT NULL DEFAULT 1,
  version_type TEXT NOT NULL CHECK (version_type IN (
    'original', 'amendment', 'addendum', 'restatement', 'renewal'
  )),

  -- Document reference
  document_id UUID REFERENCES documents(id),

  -- Dates
  effective_date DATE NOT NULL,
  supersedes_version INTEGER,

  -- Summary of changes
  change_summary TEXT,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contract_id, version_number)
);

CREATE INDEX idx_contract_versions_contract ON contract_versions(contract_id);

-- ============================================
-- ADD MISSING COLUMNS TO CONTRACTS TABLE
-- ============================================

-- Add next_review_date for periodic contract reviews
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS next_review_date DATE;

-- Add owner assignment
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

-- Add criticality level
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS criticality TEXT CHECK (criticality IN ('low', 'medium', 'high', 'critical'));

-- Add contract category for filtering
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN (
  'ict_services', 'cloud_services', 'software_licenses', 'maintenance',
  'consulting', 'data_processing', 'infrastructure', 'security', 'other'
));

-- Add AI analysis timestamp
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- Add clause extraction status
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS clauses_extracted BOOLEAN DEFAULT FALSE;

-- ============================================
-- FUNCTION: Auto-generate contract alerts
-- ============================================

CREATE OR REPLACE FUNCTION generate_contract_alerts()
RETURNS TRIGGER AS $$
DECLARE
  alert_intervals INTEGER[] := ARRAY[90, 60, 30, 14, 7];
  interval_day INTEGER;
  alert_type_name TEXT;
BEGIN
  -- Only for contracts with expiry dates
  IF NEW.expiry_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- Remove old scheduled alerts for this contract
  DELETE FROM contract_alerts
  WHERE contract_id = NEW.id
    AND status = 'scheduled'
    AND alert_type LIKE 'expiry_%';

  -- Generate alerts for each interval
  FOREACH interval_day IN ARRAY alert_intervals
  LOOP
    alert_type_name := 'expiry_' || interval_day || '_days';

    -- Only create alert if the trigger date is in the future
    IF (NEW.expiry_date - interval_day) > CURRENT_DATE THEN
      INSERT INTO contract_alerts (
        organization_id,
        contract_id,
        alert_type,
        title,
        description,
        priority,
        trigger_date,
        status
      ) VALUES (
        NEW.organization_id,
        NEW.id,
        alert_type_name,
        'Contract expiring in ' || interval_day || ' days',
        'Contract "' || NEW.contract_ref || '" expires on ' || NEW.expiry_date,
        CASE
          WHEN interval_day <= 7 THEN 'critical'
          WHEN interval_day <= 14 THEN 'high'
          WHEN interval_day <= 30 THEN 'medium'
          ELSE 'low'
        END,
        NEW.expiry_date - interval_day,
        'scheduled'
      );
    END IF;
  END LOOP;

  -- Generate auto-renewal notice alert if applicable
  IF NEW.auto_renewal = TRUE AND NEW.termination_notice_days IS NOT NULL THEN
    INSERT INTO contract_alerts (
      organization_id,
      contract_id,
      alert_type,
      title,
      description,
      priority,
      trigger_date,
      status
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      'auto_renewal_notice',
      'Auto-renewal notice deadline approaching',
      'Contract "' || NEW.contract_ref || '" auto-renews. Notice required by ' ||
        (NEW.expiry_date - NEW.termination_notice_days),
      'high',
      NEW.expiry_date - NEW.termination_notice_days - 14, -- 2 weeks before notice deadline
      'scheduled'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for alert generation
DROP TRIGGER IF EXISTS trigger_contract_alerts ON contracts;
CREATE TRIGGER trigger_contract_alerts
  AFTER INSERT OR UPDATE OF expiry_date, auto_renewal, termination_notice_days
  ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION generate_contract_alerts();

-- ============================================
-- FUNCTION: Trigger pending alerts
-- ============================================

CREATE OR REPLACE FUNCTION trigger_pending_contract_alerts()
RETURNS INTEGER AS $$
DECLARE
  triggered_count INTEGER;
BEGIN
  UPDATE contract_alerts
  SET
    status = 'triggered',
    triggered_at = NOW(),
    updated_at = NOW()
  WHERE status = 'scheduled'
    AND trigger_date <= CURRENT_DATE;

  GET DIAGNOSTICS triggered_count = ROW_COUNT;
  RETURN triggered_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;

-- Contract Clauses policies
CREATE POLICY contract_clauses_select ON contract_clauses
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_clauses_insert ON contract_clauses
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_clauses_update ON contract_clauses
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_clauses_delete ON contract_clauses
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Contract Renewals policies
CREATE POLICY contract_renewals_select ON contract_renewals
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_renewals_insert ON contract_renewals
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_renewals_update ON contract_renewals
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_renewals_delete ON contract_renewals
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Contract Alerts policies
CREATE POLICY contract_alerts_select ON contract_alerts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_alerts_insert ON contract_alerts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_alerts_update ON contract_alerts
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_alerts_delete ON contract_alerts
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Contract Versions policies
CREATE POLICY contract_versions_select ON contract_versions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_versions_insert ON contract_versions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_versions_update ON contract_versions
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY contract_versions_delete ON contract_versions
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_contract_clauses_updated_at
  BEFORE UPDATE ON contract_clauses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contract_renewals_updated_at
  BEFORE UPDATE ON contract_renewals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contract_alerts_updated_at
  BEFORE UPDATE ON contract_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE contract_clauses IS 'AI-extracted contract clauses with risk assessment and compliance flags';
COMMENT ON TABLE contract_renewals IS 'Contract renewal tracking and workflow management';
COMMENT ON TABLE contract_alerts IS 'Automated alerts for contract expiry, renewals, and compliance reviews';
COMMENT ON TABLE contract_versions IS 'Version history for contract amendments and modifications';
COMMENT ON FUNCTION generate_contract_alerts() IS 'Auto-generates expiry alerts when contracts are created or updated';
COMMENT ON FUNCTION trigger_pending_contract_alerts() IS 'Triggers scheduled alerts - call via cron job daily';
