-- Migration: 014_resilience_testing
-- Description: Resilience Testing Programme for DORA Chapter IV (Articles 24-27) compliance
-- Created: 2026-01-07
-- Depends on: 001_initial_schema.sql

-- ============================================
-- TESTING PROGRAMMES TABLE (Article 24)
-- ============================================
CREATE TABLE testing_programmes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Programme identification
  programme_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'active', 'completed', 'archived'
  )) DEFAULT 'draft',

  -- Dates
  start_date DATE,
  end_date DATE,
  approval_date DATE,

  -- Management
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  programme_manager UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Description
  description TEXT,
  scope TEXT,
  objectives TEXT[] DEFAULT '{}',

  -- Risk-based approach
  risk_assessment_basis TEXT,
  critical_systems_in_scope TEXT[] DEFAULT '{}',

  -- Budget
  budget_allocated DECIMAL(12,2),
  budget_spent DECIMAL(12,2) DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate programme reference
CREATE OR REPLACE FUNCTION generate_testing_programme_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.programme_ref := 'TP-' || NEW.year || '-' ||
    LPAD(CAST((
      SELECT COUNT(*) + 1 FROM testing_programmes
      WHERE organization_id = NEW.organization_id
      AND year = NEW.year
    ) AS TEXT), 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_testing_programme_ref
  BEFORE INSERT ON testing_programmes
  FOR EACH ROW
  WHEN (NEW.programme_ref IS NULL)
  EXECUTE FUNCTION generate_testing_programme_ref();

-- Auto-update updated_at
CREATE TRIGGER update_testing_programmes_updated_at
  BEFORE UPDATE ON testing_programmes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RESILIENCE TESTS TABLE (Article 25)
-- ============================================
CREATE TABLE resilience_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  programme_id UUID REFERENCES testing_programmes(id) ON DELETE SET NULL,

  -- Test identification
  test_ref TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Test type (Article 25.1 - 10 types)
  test_type TEXT NOT NULL CHECK (test_type IN (
    'vulnerability_assessment',        -- (a) vulnerability assessments and scans
    'open_source_analysis',            -- (b) open source analyses
    'network_security_assessment',     -- (c) network security assessments
    'gap_analysis',                    -- (d) gap analyses
    'physical_security_review',        -- (e) physical security reviews
    'source_code_review',              -- (f) source code reviews
    'scenario_based_test',             -- (g) scenario-based tests
    'compatibility_test',              -- (h) compatibility testing
    'performance_test',                -- (i) performance testing
    'penetration_test'                 -- (j) penetration testing
  )),

  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'planned', 'scheduled', 'in_progress', 'completed',
    'cancelled', 'on_hold', 'remediation_required'
  )) DEFAULT 'planned',

  -- Dates
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,

  -- Testing details
  description TEXT,
  methodology TEXT,
  scope_description TEXT,
  systems_in_scope TEXT[] DEFAULT '{}',

  -- Tester information (Article 27)
  tester_type TEXT CHECK (tester_type IN ('internal', 'external', 'hybrid')),
  tester_name TEXT,
  tester_organization TEXT,
  tester_certifications TEXT[] DEFAULT '{}', -- e.g., ['CREST', 'OSCP', 'CEH']
  tester_independence_verified BOOLEAN DEFAULT FALSE,

  -- Results
  overall_result TEXT CHECK (overall_result IN ('pass', 'pass_with_findings', 'fail', 'inconclusive')),
  executive_summary TEXT,
  findings_count INTEGER DEFAULT 0,
  critical_findings_count INTEGER DEFAULT 0,
  high_findings_count INTEGER DEFAULT 0,
  medium_findings_count INTEGER DEFAULT 0,
  low_findings_count INTEGER DEFAULT 0,

  -- Costs
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),

  -- Vendor linkage (for third-party system tests)
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate test reference
CREATE OR REPLACE FUNCTION generate_resilience_test_ref()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
BEGIN
  -- Short prefix based on test type
  CASE NEW.test_type
    WHEN 'vulnerability_assessment' THEN prefix := 'VA';
    WHEN 'open_source_analysis' THEN prefix := 'OSA';
    WHEN 'network_security_assessment' THEN prefix := 'NSA';
    WHEN 'gap_analysis' THEN prefix := 'GA';
    WHEN 'physical_security_review' THEN prefix := 'PSR';
    WHEN 'source_code_review' THEN prefix := 'SCR';
    WHEN 'scenario_based_test' THEN prefix := 'SBT';
    WHEN 'compatibility_test' THEN prefix := 'CT';
    WHEN 'performance_test' THEN prefix := 'PT';
    WHEN 'penetration_test' THEN prefix := 'PEN';
    ELSE prefix := 'TST';
  END CASE;

  NEW.test_ref := prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(CAST((
      SELECT COUNT(*) + 1 FROM resilience_tests
      WHERE organization_id = NEW.organization_id
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    ) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_resilience_test_ref
  BEFORE INSERT ON resilience_tests
  FOR EACH ROW
  WHEN (NEW.test_ref IS NULL)
  EXECUTE FUNCTION generate_resilience_test_ref();

-- Auto-update updated_at
CREATE TRIGGER update_resilience_tests_updated_at
  BEFORE UPDATE ON resilience_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TEST FINDINGS TABLE
-- ============================================
CREATE TABLE test_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES resilience_tests(id) ON DELETE CASCADE,

  -- Finding identification
  finding_ref TEXT NOT NULL,
  title TEXT NOT NULL,

  -- Severity
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'informational')),

  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'open', 'in_remediation', 'remediated', 'verified',
    'risk_accepted', 'false_positive', 'deferred'
  )) DEFAULT 'open',

  -- Details
  description TEXT NOT NULL,
  affected_systems TEXT[] DEFAULT '{}',
  cvss_score DECIMAL(3,1) CHECK (cvss_score >= 0 AND cvss_score <= 10),
  cve_ids TEXT[] DEFAULT '{}',
  cwe_ids TEXT[] DEFAULT '{}',

  -- Remediation
  recommendation TEXT,
  remediation_plan TEXT,
  remediation_owner UUID REFERENCES users(id) ON DELETE SET NULL,
  remediation_deadline DATE,
  remediation_date DATE,
  remediation_evidence TEXT,

  -- Verification
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_date DATE,
  verification_notes TEXT,

  -- Risk acceptance (if applicable)
  risk_acceptance_reason TEXT,
  risk_acceptance_approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  risk_acceptance_date DATE,
  risk_acceptance_expiry DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate finding reference
CREATE OR REPLACE FUNCTION generate_test_finding_ref()
RETURNS TRIGGER AS $$
DECLARE
  test_ref TEXT;
BEGIN
  SELECT rt.test_ref INTO test_ref FROM resilience_tests rt WHERE rt.id = NEW.test_id;
  NEW.finding_ref := test_ref || '-F' ||
    LPAD(CAST((
      SELECT COUNT(*) + 1 FROM test_findings
      WHERE test_id = NEW.test_id
    ) AS TEXT), 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_test_finding_ref
  BEFORE INSERT ON test_findings
  FOR EACH ROW
  WHEN (NEW.finding_ref IS NULL)
  EXECUTE FUNCTION generate_test_finding_ref();

-- Auto-update updated_at
CREATE TRIGGER update_test_findings_updated_at
  BEFORE UPDATE ON test_findings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update finding counts on test when findings change
CREATE OR REPLACE FUNCTION update_test_finding_counts()
RETURNS TRIGGER AS $$
DECLARE
  target_test_id UUID;
BEGIN
  -- Get the relevant test_id
  IF TG_OP = 'DELETE' THEN
    target_test_id := OLD.test_id;
  ELSE
    target_test_id := NEW.test_id;
  END IF;

  -- Update counts on the test
  UPDATE resilience_tests SET
    findings_count = (SELECT COUNT(*) FROM test_findings WHERE test_id = target_test_id),
    critical_findings_count = (SELECT COUNT(*) FROM test_findings WHERE test_id = target_test_id AND severity = 'critical'),
    high_findings_count = (SELECT COUNT(*) FROM test_findings WHERE test_id = target_test_id AND severity = 'high'),
    medium_findings_count = (SELECT COUNT(*) FROM test_findings WHERE test_id = target_test_id AND severity = 'medium'),
    low_findings_count = (SELECT COUNT(*) FROM test_findings WHERE test_id = target_test_id AND severity = 'low'),
    updated_at = NOW()
  WHERE id = target_test_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_finding_counts_on_insert
  AFTER INSERT ON test_findings
  FOR EACH ROW EXECUTE FUNCTION update_test_finding_counts();

CREATE TRIGGER update_finding_counts_on_update
  AFTER UPDATE ON test_findings
  FOR EACH ROW EXECUTE FUNCTION update_test_finding_counts();

CREATE TRIGGER update_finding_counts_on_delete
  AFTER DELETE ON test_findings
  FOR EACH ROW EXECUTE FUNCTION update_test_finding_counts();

-- ============================================
-- TLPT ENGAGEMENTS TABLE (Article 26)
-- ============================================
CREATE TABLE tlpt_engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  programme_id UUID REFERENCES testing_programmes(id) ON DELETE SET NULL,

  -- TLPT identification
  tlpt_ref TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Framework
  framework TEXT NOT NULL CHECK (framework IN (
    'tiber_eu', 'tiber_nl', 'tiber_de', 'tiber_be',
    'cbest', 'icast', 'aase', 'other'
  )) DEFAULT 'tiber_eu',

  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'planning', 'threat_intelligence', 'red_team_test',
    'closure', 'remediation', 'completed', 'cancelled'
  )) DEFAULT 'planning',

  -- TIBER-EU Phases
  -- Preparation phase
  scope_defined BOOLEAN DEFAULT FALSE,
  scope_definition_date DATE,
  scope_systems TEXT[] DEFAULT '{}',
  scope_critical_functions TEXT[] DEFAULT '{}',

  -- Threat Intelligence phase
  ti_provider TEXT,
  ti_provider_accreditation TEXT,
  ti_start_date DATE,
  ti_end_date DATE,
  ti_report_received BOOLEAN DEFAULT FALSE,
  ti_report_date DATE,

  -- Red Team phase
  rt_provider TEXT,
  rt_provider_accreditation TEXT, -- e.g., CREST, CHECK
  rt_start_date DATE,
  rt_end_date DATE,
  rt_report_received BOOLEAN DEFAULT FALSE,
  rt_report_date DATE,

  -- Closure phase
  purple_team_session_date DATE,
  remediation_plan_date DATE,
  attestation_date DATE,
  attestation_reference TEXT,

  -- Due dates (Article 26.1 - every 3 years)
  last_tlpt_date DATE,
  next_tlpt_due DATE,

  -- Results summary
  scenarios_tested INTEGER DEFAULT 0,
  scenarios_successful INTEGER DEFAULT 0, -- Red team achieved objective
  findings_count INTEGER DEFAULT 0,
  critical_findings_count INTEGER DEFAULT 0,

  -- Cost tracking
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),

  -- Regulatory
  regulator_notified BOOLEAN DEFAULT FALSE,
  regulator_notification_date DATE,
  regulator_reference TEXT,

  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate TLPT reference
CREATE OR REPLACE FUNCTION generate_tlpt_ref()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tlpt_ref := 'TLPT-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(CAST((
      SELECT COUNT(*) + 1 FROM tlpt_engagements
      WHERE organization_id = NEW.organization_id
    ) AS TEXT), 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tlpt_ref
  BEFORE INSERT ON tlpt_engagements
  FOR EACH ROW
  WHEN (NEW.tlpt_ref IS NULL)
  EXECUTE FUNCTION generate_tlpt_ref();

-- Auto-update updated_at
CREATE TRIGGER update_tlpt_engagements_updated_at
  BEFORE UPDATE ON tlpt_engagements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TESTING DOCUMENTS TABLE
-- ============================================
CREATE TABLE testing_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Polymorphic reference
  test_id UUID REFERENCES resilience_tests(id) ON DELETE CASCADE,
  tlpt_id UUID REFERENCES tlpt_engagements(id) ON DELETE CASCADE,
  programme_id UUID REFERENCES testing_programmes(id) ON DELETE CASCADE,

  -- Must reference at least one
  CONSTRAINT testing_documents_reference_check CHECK (
    (test_id IS NOT NULL)::int +
    (tlpt_id IS NOT NULL)::int +
    (programme_id IS NOT NULL)::int >= 1
  ),

  -- Document reference
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Document type
  document_type TEXT NOT NULL CHECK (document_type IN (
    'test_plan', 'test_report', 'executive_summary',
    'findings_report', 'remediation_plan', 'remediation_evidence',
    'ti_report', 'rt_report', 'attestation', 'scope_document', 'other'
  )),

  -- Metadata
  description TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
-- Testing programmes
CREATE INDEX idx_testing_programmes_organization ON testing_programmes(organization_id);
CREATE INDEX idx_testing_programmes_year ON testing_programmes(year);
CREATE INDEX idx_testing_programmes_status ON testing_programmes(status);

-- Resilience tests
CREATE INDEX idx_resilience_tests_organization ON resilience_tests(organization_id);
CREATE INDEX idx_resilience_tests_programme ON resilience_tests(programme_id);
CREATE INDEX idx_resilience_tests_type ON resilience_tests(test_type);
CREATE INDEX idx_resilience_tests_status ON resilience_tests(status);
CREATE INDEX idx_resilience_tests_vendor ON resilience_tests(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_resilience_tests_ref ON resilience_tests(test_ref);

-- Test findings
CREATE INDEX idx_test_findings_test ON test_findings(test_id);
CREATE INDEX idx_test_findings_severity ON test_findings(severity);
CREATE INDEX idx_test_findings_status ON test_findings(status);
CREATE INDEX idx_test_findings_ref ON test_findings(finding_ref);

-- TLPT engagements
CREATE INDEX idx_tlpt_engagements_organization ON tlpt_engagements(organization_id);
CREATE INDEX idx_tlpt_engagements_programme ON tlpt_engagements(programme_id);
CREATE INDEX idx_tlpt_engagements_status ON tlpt_engagements(status);
CREATE INDEX idx_tlpt_engagements_next_due ON tlpt_engagements(next_tlpt_due);
CREATE INDEX idx_tlpt_engagements_ref ON tlpt_engagements(tlpt_ref);

-- Testing documents
CREATE INDEX idx_testing_documents_test ON testing_documents(test_id);
CREATE INDEX idx_testing_documents_tlpt ON testing_documents(tlpt_id);
CREATE INDEX idx_testing_documents_programme ON testing_documents(programme_id);
CREATE INDEX idx_testing_documents_document ON testing_documents(document_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE testing_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resilience_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tlpt_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE testing_documents ENABLE ROW LEVEL SECURITY;

-- Testing programmes: org-level access
CREATE POLICY "Users can view org testing_programmes"
  ON testing_programmes FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create org testing_programmes"
  ON testing_programmes FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org testing_programmes"
  ON testing_programmes FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete org testing_programmes"
  ON testing_programmes FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Resilience tests: org-level access
CREATE POLICY "Users can view org resilience_tests"
  ON resilience_tests FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create org resilience_tests"
  ON resilience_tests FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org resilience_tests"
  ON resilience_tests FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete org resilience_tests"
  ON resilience_tests FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Test findings: via test relationship
CREATE POLICY "Users can view org test_findings"
  ON test_findings FOR SELECT
  USING (test_id IN (
    SELECT id FROM resilience_tests WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can create org test_findings"
  ON test_findings FOR INSERT
  WITH CHECK (test_id IN (
    SELECT id FROM resilience_tests WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can update org test_findings"
  ON test_findings FOR UPDATE
  USING (test_id IN (
    SELECT id FROM resilience_tests WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can delete org test_findings"
  ON test_findings FOR DELETE
  USING (test_id IN (
    SELECT id FROM resilience_tests WHERE organization_id = get_user_organization_id()
  ));

-- TLPT engagements: org-level access
CREATE POLICY "Users can view org tlpt_engagements"
  ON tlpt_engagements FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create org tlpt_engagements"
  ON tlpt_engagements FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org tlpt_engagements"
  ON tlpt_engagements FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete org tlpt_engagements"
  ON tlpt_engagements FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Testing documents: via parent relationships
CREATE POLICY "Users can view org testing_documents"
  ON testing_documents FOR SELECT
  USING (
    (test_id IN (SELECT id FROM resilience_tests WHERE organization_id = get_user_organization_id()))
    OR (tlpt_id IN (SELECT id FROM tlpt_engagements WHERE organization_id = get_user_organization_id()))
    OR (programme_id IN (SELECT id FROM testing_programmes WHERE organization_id = get_user_organization_id()))
  );

CREATE POLICY "Users can create org testing_documents"
  ON testing_documents FOR INSERT
  WITH CHECK (
    (test_id IN (SELECT id FROM resilience_tests WHERE organization_id = get_user_organization_id()))
    OR (tlpt_id IN (SELECT id FROM tlpt_engagements WHERE organization_id = get_user_organization_id()))
    OR (programme_id IN (SELECT id FROM testing_programmes WHERE organization_id = get_user_organization_id()))
  );

CREATE POLICY "Users can delete org testing_documents"
  ON testing_documents FOR DELETE
  USING (
    (test_id IN (SELECT id FROM resilience_tests WHERE organization_id = get_user_organization_id()))
    OR (tlpt_id IN (SELECT id FROM tlpt_engagements WHERE organization_id = get_user_organization_id()))
    OR (programme_id IN (SELECT id FROM testing_programmes WHERE organization_id = get_user_organization_id()))
  );

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View: Testing programme statistics
CREATE VIEW testing_programme_stats AS
SELECT
  tp.id AS programme_id,
  tp.organization_id,
  tp.programme_ref,
  tp.name,
  tp.year,
  tp.status,
  COUNT(rt.id) AS total_tests,
  COUNT(rt.id) FILTER (WHERE rt.status = 'completed') AS completed_tests,
  COUNT(rt.id) FILTER (WHERE rt.status IN ('planned', 'scheduled')) AS planned_tests,
  COUNT(rt.id) FILTER (WHERE rt.status = 'in_progress') AS in_progress_tests,
  SUM(rt.findings_count) AS total_findings,
  SUM(rt.critical_findings_count) AS total_critical_findings,
  SUM(rt.actual_cost) AS total_cost_spent
FROM testing_programmes tp
LEFT JOIN resilience_tests rt ON rt.programme_id = tp.id
GROUP BY tp.id;

-- View: Open findings by severity
CREATE VIEW open_findings_summary AS
SELECT
  rt.organization_id,
  tf.severity,
  COUNT(*) AS finding_count,
  COUNT(*) FILTER (WHERE tf.remediation_deadline < CURRENT_DATE) AS overdue_count
FROM test_findings tf
JOIN resilience_tests rt ON rt.id = tf.test_id
WHERE tf.status IN ('open', 'in_remediation')
GROUP BY rt.organization_id, tf.severity;

-- View: TLPT compliance status
CREATE VIEW tlpt_compliance_status AS
SELECT
  organization_id,
  tlpt_ref,
  name,
  status,
  next_tlpt_due,
  CASE
    WHEN next_tlpt_due IS NULL THEN 'not_scheduled'
    WHEN next_tlpt_due < CURRENT_DATE THEN 'overdue'
    WHEN next_tlpt_due < CURRENT_DATE + INTERVAL '6 months' THEN 'due_soon'
    ELSE 'compliant'
  END AS compliance_status,
  next_tlpt_due - CURRENT_DATE AS days_until_due
FROM tlpt_engagements
WHERE status != 'cancelled';

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE testing_programmes IS 'Annual digital operational resilience testing programmes per DORA Article 24';
COMMENT ON TABLE resilience_tests IS 'Individual resilience tests per DORA Article 25 (10 test types)';
COMMENT ON TABLE test_findings IS 'Vulnerabilities and findings from resilience tests';
COMMENT ON TABLE tlpt_engagements IS 'Threat-Led Penetration Testing engagements per DORA Article 26';
COMMENT ON TABLE testing_documents IS 'Documents linked to testing activities (reports, plans, evidence)';
COMMENT ON COLUMN resilience_tests.test_type IS 'One of 10 test types mandated by DORA Article 25.1';
COMMENT ON COLUMN resilience_tests.tester_certifications IS 'Tester qualifications per DORA Article 27 (e.g., CREST, OSCP)';
COMMENT ON COLUMN tlpt_engagements.framework IS 'TLPT framework (TIBER-EU or national variants)';
COMMENT ON COLUMN tlpt_engagements.next_tlpt_due IS 'Per Article 26.1: every 3 years for significant entities';
