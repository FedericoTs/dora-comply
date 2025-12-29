-- Migration: 004_framework_mapping
-- Description: Cross-framework control mapping for gap analysis
-- Created: 2024-12-29
-- Depends on: 001_initial_schema.sql

-- ============================================
-- FRAMEWORKS
-- ============================================

CREATE TABLE IF NOT EXISTS frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- 'soc2', 'iso27001', 'dora', 'nist_csf'
  name TEXT NOT NULL,
  version TEXT,
  publisher TEXT,
  effective_date DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial frameworks
INSERT INTO frameworks (code, name, version, publisher, effective_date, description) VALUES
  ('dora', 'Digital Operational Resilience Act', '2022/2554', 'European Union', '2025-01-17', 'EU regulation on digital operational resilience for the financial sector'),
  ('soc2', 'SOC 2', '2017', 'AICPA', '2017-04-01', 'Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy'),
  ('iso27001', 'ISO/IEC 27001', '2022', 'ISO/IEC', '2022-10-25', 'Information security management systems requirements'),
  ('nist_csf', 'NIST Cybersecurity Framework', '2.0', 'NIST', '2024-02-26', 'Framework for improving critical infrastructure cybersecurity')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- FRAMEWORK CONTROLS
-- ============================================

CREATE TABLE IF NOT EXISTS framework_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,

  -- Control identification
  control_id TEXT NOT NULL, -- e.g., 'CC1.1', 'A.5.1', 'Art. 5'
  control_name TEXT NOT NULL,
  control_description TEXT,

  -- Hierarchy
  category TEXT, -- e.g., 'ICT Risk Management', 'Security'
  subcategory TEXT,
  parent_control_id UUID REFERENCES framework_controls(id),

  -- Attributes
  is_mandatory BOOLEAN DEFAULT TRUE,
  evidence_types TEXT[] DEFAULT '{}', -- Types of evidence that satisfy this control

  -- DORA-specific
  dora_pillar TEXT CHECK (dora_pillar IN (
    'ICT_RISK', 'INCIDENT', 'RESILIENCE', 'TPRM', 'SHARING'
  )),
  dora_article TEXT, -- e.g., 'Art. 5', 'Art. 28(8)'

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(framework_id, control_id)
);

CREATE INDEX idx_framework_controls_framework ON framework_controls(framework_id);
CREATE INDEX idx_framework_controls_category ON framework_controls(category);
CREATE INDEX idx_framework_controls_parent ON framework_controls(parent_control_id);
CREATE INDEX idx_framework_controls_dora_pillar ON framework_controls(dora_pillar);

-- ============================================
-- CONTROL MAPPINGS
-- ============================================

CREATE TABLE IF NOT EXISTS control_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  source_control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,
  target_control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,

  -- Mapping characteristics
  mapping_type TEXT NOT NULL CHECK (mapping_type IN (
    'equivalent', -- 1:1 direct mapping, fully satisfies
    'partial', -- Partially covers the target control
    'supports', -- Provides supporting evidence
    'related' -- Conceptually related but not direct evidence
  )),

  -- Coverage percentage (0-100)
  coverage_percentage INTEGER CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),

  -- Confidence in mapping (0.0-1.0)
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),

  -- Direction
  bidirectional BOOLEAN DEFAULT FALSE, -- If true, mapping works both ways

  -- Documentation
  mapping_notes TEXT,
  evidence_requirements TEXT, -- What additional evidence might be needed

  -- Source of mapping
  source TEXT CHECK (source IN ('regulatory', 'industry', 'expert', 'ai_generated')) DEFAULT 'expert',
  verified_by TEXT,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_control_id, target_control_id)
);

CREATE INDEX idx_mappings_source ON control_mappings(source_control_id);
CREATE INDEX idx_mappings_target ON control_mappings(target_control_id);
CREATE INDEX idx_mappings_type ON control_mappings(mapping_type);

-- ============================================
-- VENDOR CONTROL ASSESSMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS vendor_control_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Assessment result
  status TEXT NOT NULL CHECK (status IN (
    'met', 'partially_met', 'not_met', 'not_applicable', 'pending', 'unknown'
  )),

  -- Evidence
  evidence_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  evidence_location TEXT, -- Page/section reference in document
  evidence_notes TEXT,
  evidence_date DATE, -- When evidence was generated/collected

  -- Confidence
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  assessment_source TEXT CHECK (assessment_source IN (
    'ai_parsed', 'manual', 'questionnaire', 'vendor_provided', 'external_rating'
  )),

  -- Review workflow
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Validity
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_current BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, control_id, organization_id, valid_from)
);

CREATE INDEX idx_assessments_vendor ON vendor_control_assessments(vendor_id);
CREATE INDEX idx_assessments_control ON vendor_control_assessments(control_id);
CREATE INDEX idx_assessments_org ON vendor_control_assessments(organization_id);
CREATE INDEX idx_assessments_status ON vendor_control_assessments(status);
CREATE INDEX idx_assessments_current ON vendor_control_assessments(is_current) WHERE is_current = TRUE;

-- Trigger to manage "is_current" status
CREATE OR REPLACE FUNCTION manage_assessment_currency()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark previous assessments for same vendor+control as not current
  UPDATE vendor_control_assessments
  SET is_current = FALSE, updated_at = NOW()
  WHERE vendor_id = NEW.vendor_id
    AND control_id = NEW.control_id
    AND organization_id = NEW.organization_id
    AND id != NEW.id
    AND is_current = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_current_assessment
  AFTER INSERT ON vendor_control_assessments
  FOR EACH ROW
  EXECUTE FUNCTION manage_assessment_currency();

-- ============================================
-- GAP ANALYSIS CACHE
-- ============================================

CREATE TABLE IF NOT EXISTS vendor_gap_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,

  -- Coverage scores
  overall_coverage FLOAT CHECK (overall_coverage >= 0 AND overall_coverage <= 100),
  coverage_by_category JSONB DEFAULT '{}',
  -- Structure: { "ICT_RISK": 85.5, "INCIDENT": 54.2, ... }

  -- Gap summary
  controls_met INTEGER DEFAULT 0,
  controls_partial INTEGER DEFAULT 0,
  controls_not_met INTEGER DEFAULT 0,
  controls_total INTEGER DEFAULT 0,

  -- Critical gaps
  critical_gaps JSONB DEFAULT '[]',
  -- Structure: [{ "control_id": "...", "control_name": "...", "severity": "critical" }]

  -- Source frameworks used
  source_frameworks TEXT[] DEFAULT '{}',

  -- Calculation metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  calculation_version TEXT DEFAULT '1.0',
  is_stale BOOLEAN DEFAULT FALSE,

  UNIQUE(vendor_id, organization_id, target_framework_id)
);

CREATE INDEX idx_gap_analysis_vendor ON vendor_gap_analysis(vendor_id);
CREATE INDEX idx_gap_analysis_org ON vendor_gap_analysis(organization_id);
CREATE INDEX idx_gap_analysis_stale ON vendor_gap_analysis(is_stale) WHERE is_stale = FALSE;

-- Mark gap analysis as stale when assessments change
CREATE OR REPLACE FUNCTION mark_gap_analysis_stale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendor_gap_analysis
  SET is_stale = TRUE, updated_at = NOW()
  WHERE vendor_id = NEW.vendor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_changes_stale_gap_analysis
  AFTER INSERT OR UPDATE ON vendor_control_assessments
  FOR EACH ROW
  EXECUTE FUNCTION mark_gap_analysis_stale();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Frameworks and controls are public (read-only for users)
-- Mappings are public (maintained by system)
-- Assessments and gap analysis are org-scoped

ALTER TABLE vendor_control_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_gap_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org assessments"
  ON vendor_control_assessments FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage org assessments"
  ON vendor_control_assessments FOR ALL
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can view org gap analysis"
  ON vendor_gap_analysis FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage org gap analysis"
  ON vendor_gap_analysis FOR ALL
  USING (organization_id = get_user_organization_id());

-- ============================================
-- SEED DORA CONTROLS
-- ============================================

-- Insert DORA framework controls (key articles)
WITH dora_framework AS (
  SELECT id FROM frameworks WHERE code = 'dora'
)
INSERT INTO framework_controls (framework_id, control_id, control_name, control_description, category, dora_pillar, dora_article, is_mandatory)
SELECT
  dora_framework.id,
  control_id,
  control_name,
  control_description,
  category,
  dora_pillar,
  dora_article,
  is_mandatory
FROM dora_framework,
(VALUES
  -- ICT Risk Management (Pillar 1)
  ('Art.5', 'ICT Risk Management Framework', 'Establish and maintain an ICT risk management framework', 'ICT Risk Management', 'ICT_RISK', 'Art. 5', TRUE),
  ('Art.6', 'ICT Systems Documentation', 'Document ICT systems, assets, and dependencies', 'ICT Risk Management', 'ICT_RISK', 'Art. 6', TRUE),
  ('Art.7', 'ICT Systems Protection', 'Implement technical and organizational measures for ICT protection', 'ICT Risk Management', 'ICT_RISK', 'Art. 7', TRUE),
  ('Art.8', 'Detection of Anomalous Activities', 'Detect anomalous activities and ICT-related incidents', 'ICT Risk Management', 'ICT_RISK', 'Art. 8', TRUE),
  ('Art.9', 'Response and Recovery', 'Respond to and recover from ICT-related incidents', 'ICT Risk Management', 'ICT_RISK', 'Art. 9', TRUE),
  ('Art.10', 'Backup Policies', 'Implement backup and recovery policies', 'ICT Risk Management', 'ICT_RISK', 'Art. 10', TRUE),
  ('Art.11', 'Learning and Evolving', 'Learn and evolve from ICT-related incidents', 'ICT Risk Management', 'ICT_RISK', 'Art. 11', TRUE),
  ('Art.12', 'Communication', 'Communicate on ICT-related incidents and vulnerabilities', 'ICT Risk Management', 'ICT_RISK', 'Art. 12', TRUE),

  -- Incident Reporting (Pillar 2)
  ('Art.17', 'Incident Classification', 'Classify ICT-related incidents according to criteria', 'Incident Reporting', 'INCIDENT', 'Art. 17', TRUE),
  ('Art.19', 'Major Incident Reporting', 'Report major ICT-related incidents to competent authorities', 'Incident Reporting', 'INCIDENT', 'Art. 19', TRUE),
  ('Art.20', 'Incident Report Content', 'Include required content in incident reports', 'Incident Reporting', 'INCIDENT', 'Art. 20', TRUE),

  -- Resilience Testing (Pillar 3)
  ('Art.24', 'General Testing Requirements', 'Conduct ICT testing as part of risk management', 'Resilience Testing', 'RESILIENCE', 'Art. 24', TRUE),
  ('Art.25', 'Testing Tools and Systems', 'Use appropriate tools and methodologies for testing', 'Resilience Testing', 'RESILIENCE', 'Art. 25', TRUE),
  ('Art.26', 'TLPT Requirements', 'Conduct Threat-Led Penetration Testing for significant entities', 'Resilience Testing', 'RESILIENCE', 'Art. 26', FALSE),

  -- Third-Party Risk Management (Pillar 4)
  ('Art.28', 'General Principles on TPRM', 'Manage ICT third-party risk as integral part of ICT risk', 'TPRM', 'TPRM', 'Art. 28', TRUE),
  ('Art.28(4)', 'Preliminary Assessment', 'Conduct due diligence before entering arrangements', 'TPRM', 'TPRM', 'Art. 28(4)', TRUE),
  ('Art.28(5)', 'Exit Strategies', 'Develop exit strategies for critical providers', 'TPRM', 'TPRM', 'Art. 28(5)', TRUE),
  ('Art.28(8)', 'Subcontracting Chain', 'Monitor and manage subcontracting chains', 'TPRM', 'TPRM', 'Art. 28(8)', TRUE),
  ('Art.29', 'Register of Information', 'Maintain register of all ICT third-party arrangements', 'TPRM', 'TPRM', 'Art. 29', TRUE),
  ('Art.30', 'Contractual Requirements', 'Include mandatory contractual provisions', 'TPRM', 'TPRM', 'Art. 30', TRUE),

  -- Information Sharing (Pillar 5)
  ('Art.45', 'Information Sharing', 'Participate in cyber threat information sharing arrangements', 'Information Sharing', 'SHARING', 'Art. 45', FALSE)

) AS v(control_id, control_name, control_description, category, dora_pillar, dora_article, is_mandatory)
ON CONFLICT (framework_id, control_id) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE frameworks IS 'Compliance frameworks (DORA, SOC 2, ISO 27001, etc.)';
COMMENT ON TABLE framework_controls IS 'Individual controls/requirements within frameworks';
COMMENT ON TABLE control_mappings IS 'Cross-framework control mappings for gap analysis';
COMMENT ON TABLE vendor_control_assessments IS 'Assessment of vendor compliance against framework controls';
COMMENT ON TABLE vendor_gap_analysis IS 'Cached gap analysis results for performance';
