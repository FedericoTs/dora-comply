-- ============================================================================
-- Migration: 019_nis2_risk_management.sql
-- Description: NIS2 Risk Management Module - Phase 1
-- Date: January 2026
--
-- Creates tables for:
-- - Risk Register (nis2_risks)
-- - Control Library (nis2_controls)
-- - Risk-Control Linkage (nis2_risk_controls)
-- - Risk Assessment History (nis2_risk_assessments)
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Risk Level enum
CREATE TYPE nis2_risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Risk Status enum
CREATE TYPE nis2_risk_status AS ENUM ('identified', 'assessed', 'treating', 'monitoring', 'closed');

-- Treatment Strategy enum
CREATE TYPE nis2_treatment_strategy AS ENUM ('mitigate', 'accept', 'transfer', 'avoid');

-- Control Type enum
CREATE TYPE nis2_control_type AS ENUM ('preventive', 'detective', 'corrective');

-- Control Implementation Status enum
CREATE TYPE nis2_control_status AS ENUM ('planned', 'implementing', 'operational', 'needs_improvement', 'retired');

-- ============================================================================
-- TABLE: nis2_controls (Control Library)
-- Must be created first as nis2_risks references it
-- ============================================================================

CREATE TABLE nis2_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Control identification
  reference_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- NIS2 category

  -- Control details
  control_type nis2_control_type NOT NULL DEFAULT 'preventive',
  implementation_status nis2_control_status NOT NULL DEFAULT 'planned',

  -- Effectiveness scoring (0-100)
  design_effectiveness INTEGER CHECK (design_effectiveness IS NULL OR (design_effectiveness >= 0 AND design_effectiveness <= 100)),
  operational_effectiveness INTEGER CHECK (operational_effectiveness IS NULL OR (operational_effectiveness >= 0 AND operational_effectiveness <= 100)),

  -- Overall effectiveness is the minimum of design and operational (conservative approach)
  overall_effectiveness INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN design_effectiveness IS NULL OR operational_effectiveness IS NULL THEN COALESCE(design_effectiveness, operational_effectiveness, 0)
      ELSE LEAST(design_effectiveness, operational_effectiveness)
    END
  ) STORED,

  -- Evidence requirements
  evidence_requirements TEXT[],
  last_evidence_date TIMESTAMPTZ,
  next_review_date DATE,

  -- Ownership
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(organization_id, reference_code)
);

-- Indexes for controls
CREATE INDEX idx_nis2_controls_org ON nis2_controls(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nis2_controls_category ON nis2_controls(organization_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_nis2_controls_status ON nis2_controls(organization_id, implementation_status) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: nis2_risks (Risk Register)
-- ============================================================================

CREATE TABLE nis2_risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Risk identification
  reference_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- NIS2 category

  -- Inherent risk assessment (before controls)
  likelihood_score INTEGER NOT NULL CHECK (likelihood_score >= 1 AND likelihood_score <= 5),
  impact_score INTEGER NOT NULL CHECK (impact_score >= 1 AND impact_score <= 5),

  -- Generated columns for inherent risk
  inherent_risk_score INTEGER GENERATED ALWAYS AS (likelihood_score * impact_score) STORED,
  inherent_risk_level nis2_risk_level GENERATED ALWAYS AS (
    CASE
      WHEN likelihood_score * impact_score >= 16 THEN 'critical'::nis2_risk_level
      WHEN likelihood_score * impact_score >= 10 THEN 'high'::nis2_risk_level
      WHEN likelihood_score * impact_score >= 5 THEN 'medium'::nis2_risk_level
      ELSE 'low'::nis2_risk_level
    END
  ) STORED,

  -- Residual risk (after controls) - calculated by application, stored for querying
  residual_likelihood INTEGER CHECK (residual_likelihood IS NULL OR (residual_likelihood >= 1 AND residual_likelihood <= 5)),
  residual_impact INTEGER CHECK (residual_impact IS NULL OR (residual_impact >= 1 AND residual_impact <= 5)),
  residual_risk_score INTEGER,
  residual_risk_level nis2_risk_level,
  combined_control_effectiveness INTEGER CHECK (combined_control_effectiveness IS NULL OR (combined_control_effectiveness >= 0 AND combined_control_effectiveness <= 100)),

  -- Risk treatment
  treatment_strategy nis2_treatment_strategy,
  treatment_plan TEXT,
  treatment_due_date DATE,
  treatment_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Status tracking
  status nis2_risk_status NOT NULL DEFAULT 'identified',
  review_date DATE,
  last_assessed_at TIMESTAMPTZ,

  -- Risk appetite/tolerance
  is_within_tolerance BOOLEAN,
  tolerance_threshold INTEGER DEFAULT 9, -- Default: Medium (9) max acceptable

  -- Ownership
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(organization_id, reference_code)
);

-- Indexes for risks
CREATE INDEX idx_nis2_risks_org ON nis2_risks(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nis2_risks_category ON nis2_risks(organization_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_nis2_risks_status ON nis2_risks(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_nis2_risks_inherent_level ON nis2_risks(organization_id, inherent_risk_level) WHERE deleted_at IS NULL;
CREATE INDEX idx_nis2_risks_residual_level ON nis2_risks(organization_id, residual_risk_level) WHERE deleted_at IS NULL;
CREATE INDEX idx_nis2_risks_treatment_due ON nis2_risks(organization_id, treatment_due_date) WHERE deleted_at IS NULL AND treatment_due_date IS NOT NULL;

-- ============================================================================
-- TABLE: nis2_risk_controls (Risk-Control Linkage)
-- ============================================================================

CREATE TABLE nis2_risk_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_id UUID NOT NULL REFERENCES nis2_risks(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES nis2_controls(id) ON DELETE CASCADE,

  -- Effectiveness of this control for this specific risk
  effectiveness_score INTEGER NOT NULL CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  effectiveness_rationale TEXT,

  -- Testing information
  last_tested_at TIMESTAMPTZ,
  next_test_due DATE,
  test_result TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(risk_id, control_id)
);

-- Indexes for risk-controls
CREATE INDEX idx_nis2_risk_controls_risk ON nis2_risk_controls(risk_id);
CREATE INDEX idx_nis2_risk_controls_control ON nis2_risk_controls(control_id);

-- ============================================================================
-- TABLE: nis2_risk_assessments (Assessment History)
-- ============================================================================

CREATE TABLE nis2_risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_id UUID NOT NULL REFERENCES nis2_risks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Point-in-time assessment
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Inherent risk at assessment time
  likelihood_score INTEGER NOT NULL CHECK (likelihood_score >= 1 AND likelihood_score <= 5),
  impact_score INTEGER NOT NULL CHECK (impact_score >= 1 AND impact_score <= 5),
  inherent_risk_score INTEGER NOT NULL,
  inherent_risk_level nis2_risk_level NOT NULL,

  -- Residual risk at assessment time
  residual_likelihood INTEGER,
  residual_impact INTEGER,
  residual_risk_score INTEGER,
  residual_risk_level nis2_risk_level,
  combined_control_effectiveness INTEGER,

  -- Assessment context
  assessor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assessment_notes TEXT,
  treatment_strategy nis2_treatment_strategy,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for assessments
CREATE INDEX idx_nis2_risk_assessments_risk ON nis2_risk_assessments(risk_id);
CREATE INDEX idx_nis2_risk_assessments_org_date ON nis2_risk_assessments(organization_id, assessment_date DESC);

-- ============================================================================
-- TABLE: nis2_control_evidence (Evidence Attachments)
-- ============================================================================

CREATE TABLE nis2_control_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  control_id UUID NOT NULL REFERENCES nis2_controls(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

  -- Evidence details
  evidence_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  external_url TEXT,

  -- Validity period
  valid_from DATE,
  valid_until DATE,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for evidence
CREATE INDEX idx_nis2_control_evidence_control ON nis2_control_evidence(control_id);
CREATE INDEX idx_nis2_control_evidence_document ON nis2_control_evidence(document_id) WHERE document_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE nis2_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_risk_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_control_evidence ENABLE ROW LEVEL SECURITY;

-- nis2_controls policies
CREATE POLICY "Users can view their organization's controls"
  ON nis2_controls FOR SELECT
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Users can insert controls for their organization"
  ON nis2_controls FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their organization's controls"
  ON nis2_controls FOR UPDATE
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Users can delete their organization's controls"
  ON nis2_controls FOR DELETE
  USING (organization_id = get_user_organization_id());

-- nis2_risks policies
CREATE POLICY "Users can view their organization's risks"
  ON nis2_risks FOR SELECT
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Users can insert risks for their organization"
  ON nis2_risks FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their organization's risks"
  ON nis2_risks FOR UPDATE
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Users can delete their organization's risks"
  ON nis2_risks FOR DELETE
  USING (organization_id = get_user_organization_id());

-- nis2_risk_controls policies (via risk ownership)
CREATE POLICY "Users can view risk-control links for their org"
  ON nis2_risk_controls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nis2_risks r
      WHERE r.id = risk_id
      AND r.organization_id = get_user_organization_id()
      AND r.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can insert risk-control links for their org"
  ON nis2_risk_controls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nis2_risks r
      WHERE r.id = risk_id
      AND r.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update risk-control links for their org"
  ON nis2_risk_controls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM nis2_risks r
      WHERE r.id = risk_id
      AND r.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete risk-control links for their org"
  ON nis2_risk_controls FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM nis2_risks r
      WHERE r.id = risk_id
      AND r.organization_id = get_user_organization_id()
    )
  );

-- nis2_risk_assessments policies
CREATE POLICY "Users can view their organization's assessments"
  ON nis2_risk_assessments FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert assessments for their organization"
  ON nis2_risk_assessments FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- nis2_control_evidence policies (via control ownership)
CREATE POLICY "Users can view evidence for their org controls"
  ON nis2_control_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nis2_controls c
      WHERE c.id = control_id
      AND c.organization_id = get_user_organization_id()
      AND c.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can insert evidence for their org controls"
  ON nis2_control_evidence FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nis2_controls c
      WHERE c.id = control_id
      AND c.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete evidence for their org controls"
  ON nis2_control_evidence FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM nis2_controls c
      WHERE c.id = control_id
      AND c.organization_id = get_user_organization_id()
    )
  );

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

CREATE TRIGGER update_nis2_controls_updated_at
  BEFORE UPDATE ON nis2_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nis2_risks_updated_at
  BEFORE UPDATE ON nis2_risks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nis2_risk_controls_updated_at
  BEFORE UPDATE ON nis2_risk_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate risk level from score
CREATE OR REPLACE FUNCTION get_nis2_risk_level(score INTEGER)
RETURNS nis2_risk_level AS $$
BEGIN
  IF score >= 16 THEN RETURN 'critical';
  ELSIF score >= 10 THEN RETURN 'high';
  ELSIF score >= 5 THEN RETURN 'medium';
  ELSE RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate next reference code for risks
CREATE OR REPLACE FUNCTION generate_nis2_risk_code(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  code TEXT;
BEGIN
  SELECT COALESCE(MAX(
    CASE
      WHEN reference_code ~ '^NIS2-RISK-[0-9]+$'
      THEN CAST(SUBSTRING(reference_code FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM nis2_risks
  WHERE organization_id = org_id;

  code := 'NIS2-RISK-' || LPAD(next_num::TEXT, 4, '0');
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate next reference code for controls
CREATE OR REPLACE FUNCTION generate_nis2_control_code(org_id UUID, ctrl_type TEXT)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
  code TEXT;
BEGIN
  prefix := CASE ctrl_type
    WHEN 'preventive' THEN 'CTRL-PRV'
    WHEN 'detective' THEN 'CTRL-DET'
    WHEN 'corrective' THEN 'CTRL-COR'
    ELSE 'CTRL-GEN'
  END;

  SELECT COALESCE(MAX(
    CASE
      WHEN reference_code ~ ('^' || prefix || '-[0-9]+$')
      THEN CAST(SUBSTRING(reference_code FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM nis2_controls
  WHERE organization_id = org_id;

  code := prefix || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Risk register with control count
CREATE OR REPLACE VIEW nis2_risks_with_controls AS
SELECT
  r.*,
  COALESCE(rc.control_count, 0) as control_count,
  COALESCE(rc.avg_effectiveness, 0) as avg_control_effectiveness
FROM nis2_risks r
LEFT JOIN (
  SELECT
    risk_id,
    COUNT(*) as control_count,
    AVG(effectiveness_score) as avg_effectiveness
  FROM nis2_risk_controls
  GROUP BY risk_id
) rc ON rc.risk_id = r.id
WHERE r.deleted_at IS NULL;

-- View: Control library with risk count
CREATE OR REPLACE VIEW nis2_controls_with_risks AS
SELECT
  c.*,
  COALESCE(rc.risk_count, 0) as linked_risk_count
FROM nis2_controls c
LEFT JOIN (
  SELECT
    control_id,
    COUNT(*) as risk_count
  FROM nis2_risk_controls
  GROUP BY control_id
) rc ON rc.control_id = c.id
WHERE c.deleted_at IS NULL;

-- View: Organization risk summary
CREATE OR REPLACE VIEW nis2_org_risk_summary AS
SELECT
  organization_id,
  COUNT(*) as total_risks,
  COUNT(*) FILTER (WHERE inherent_risk_level = 'critical') as critical_inherent,
  COUNT(*) FILTER (WHERE inherent_risk_level = 'high') as high_inherent,
  COUNT(*) FILTER (WHERE inherent_risk_level = 'medium') as medium_inherent,
  COUNT(*) FILTER (WHERE inherent_risk_level = 'low') as low_inherent,
  COUNT(*) FILTER (WHERE residual_risk_level = 'critical') as critical_residual,
  COUNT(*) FILTER (WHERE residual_risk_level = 'high') as high_residual,
  COUNT(*) FILTER (WHERE residual_risk_level = 'medium') as medium_residual,
  COUNT(*) FILTER (WHERE residual_risk_level = 'low') as low_residual,
  COUNT(*) FILTER (WHERE residual_risk_level IS NULL) as not_assessed,
  AVG(inherent_risk_score) as avg_inherent_score,
  AVG(residual_risk_score) as avg_residual_score,
  AVG(combined_control_effectiveness) as avg_control_effectiveness
FROM nis2_risks
WHERE deleted_at IS NULL
GROUP BY organization_id;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on enums
GRANT USAGE ON TYPE nis2_risk_level TO authenticated;
GRANT USAGE ON TYPE nis2_risk_status TO authenticated;
GRANT USAGE ON TYPE nis2_treatment_strategy TO authenticated;
GRANT USAGE ON TYPE nis2_control_type TO authenticated;
GRANT USAGE ON TYPE nis2_control_status TO authenticated;

-- Grant access to views
GRANT SELECT ON nis2_risks_with_controls TO authenticated;
GRANT SELECT ON nis2_controls_with_risks TO authenticated;
GRANT SELECT ON nis2_org_risk_summary TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE nis2_risks IS 'NIS2 Risk Register - Central repository for organizational risks';
COMMENT ON TABLE nis2_controls IS 'NIS2 Control Library - Security controls that mitigate risks';
COMMENT ON TABLE nis2_risk_controls IS 'Risk-Control linkage with effectiveness scoring';
COMMENT ON TABLE nis2_risk_assessments IS 'Historical risk assessments for trend tracking';
COMMENT ON TABLE nis2_control_evidence IS 'Evidence attachments for controls';

COMMENT ON COLUMN nis2_risks.inherent_risk_score IS 'Auto-calculated: likelihood × impact (1-25)';
COMMENT ON COLUMN nis2_risks.inherent_risk_level IS 'Auto-calculated: low (1-4), medium (5-9), high (10-15), critical (16-25)';
COMMENT ON COLUMN nis2_risks.combined_control_effectiveness IS 'Compound effectiveness: 1 - Π(1 - effectiveness_i)';
COMMENT ON COLUMN nis2_risks.tolerance_threshold IS 'Maximum acceptable risk score (default: 9 = Medium)';

COMMENT ON COLUMN nis2_controls.overall_effectiveness IS 'Auto-calculated: MIN(design, operational) effectiveness';

COMMENT ON FUNCTION get_nis2_risk_level IS 'Convert risk score (1-25) to risk level enum';
COMMENT ON FUNCTION generate_nis2_risk_code IS 'Generate sequential risk reference code (NIS2-RISK-0001)';
COMMENT ON FUNCTION generate_nis2_control_code IS 'Generate sequential control reference code by type';
