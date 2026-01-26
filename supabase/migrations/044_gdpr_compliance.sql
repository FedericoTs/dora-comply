-- ============================================================================
-- GDPR Compliance Module
-- Migration: 044_gdpr_compliance.sql
--
-- Implements GDPR compliance tracking including:
-- - Record of Processing Activities (RoPA) - Article 30
-- - Data Protection Impact Assessments (DPIA) - Article 35
-- - Data Subject Requests (DSR) - Articles 15-22
-- - Personal Data Breach Log - Articles 33-34
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Lawful basis for processing (Article 6)
CREATE TYPE gdpr_lawful_basis AS ENUM (
  'consent',
  'contract',
  'legal_obligation',
  'vital_interests',
  'public_task',
  'legitimate_interests'
);

-- Special category data basis (Article 9)
CREATE TYPE gdpr_special_category_basis AS ENUM (
  'explicit_consent',
  'employment_law',
  'vital_interests',
  'legitimate_activities',
  'public_data',
  'legal_claims',
  'substantial_public_interest',
  'health_purposes',
  'public_health',
  'archiving_research'
);

-- Processing activity status
CREATE TYPE gdpr_activity_status AS ENUM (
  'active',
  'under_review',
  'suspended',
  'terminated'
);

-- DPIA status
CREATE TYPE gdpr_dpia_status AS ENUM (
  'draft',
  'in_progress',
  'pending_review',
  'approved',
  'rejected',
  'requires_consultation'
);

-- DPIA risk level
CREATE TYPE gdpr_risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'very_high'
);

-- Data subject request type
CREATE TYPE gdpr_dsr_type AS ENUM (
  'access',           -- Article 15
  'rectification',    -- Article 16
  'erasure',          -- Article 17
  'restriction',      -- Article 18
  'portability',      -- Article 20
  'objection',        -- Article 21
  'automated_decision' -- Article 22
);

-- DSR status
CREATE TYPE gdpr_dsr_status AS ENUM (
  'received',
  'identity_verification',
  'in_progress',
  'extended',
  'completed',
  'refused'
);

-- Breach severity
CREATE TYPE gdpr_breach_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Breach status
CREATE TYPE gdpr_breach_status AS ENUM (
  'detected',
  'investigating',
  'contained',
  'notified_authority',
  'notified_subjects',
  'resolved',
  'closed'
);

-- ============================================================================
-- RECORD OF PROCESSING ACTIVITIES (RoPA) - Article 30
-- ============================================================================

CREATE TABLE gdpr_processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  reference_code VARCHAR(50), -- Internal reference

  -- Controller/Processor Information
  is_controller BOOLEAN DEFAULT true,
  joint_controller_details TEXT,
  processor_details TEXT,

  -- Processing Details
  purposes TEXT[] NOT NULL DEFAULT '{}',
  lawful_basis gdpr_lawful_basis NOT NULL,
  lawful_basis_details TEXT,

  -- Special Category Data
  involves_special_category BOOLEAN DEFAULT false,
  special_category_types TEXT[], -- health, biometric, etc.
  special_category_basis gdpr_special_category_basis,
  special_category_basis_details TEXT,

  -- Data Subjects
  data_subject_categories TEXT[] NOT NULL DEFAULT '{}', -- employees, customers, etc.
  estimated_data_subjects INTEGER,

  -- Data Categories
  personal_data_categories TEXT[] NOT NULL DEFAULT '{}',

  -- Recipients
  recipient_categories TEXT[] DEFAULT '{}',

  -- International Transfers
  involves_international_transfer BOOLEAN DEFAULT false,
  transfer_countries TEXT[] DEFAULT '{}',
  transfer_safeguards TEXT, -- SCCs, BCRs, adequacy decision

  -- Retention
  retention_period TEXT,
  retention_criteria TEXT,

  -- Security
  security_measures TEXT[] DEFAULT '{}',

  -- Systems/Vendors
  systems_used TEXT[] DEFAULT '{}',
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL, -- Link to third-party processor

  -- Status
  status gdpr_activity_status DEFAULT 'active',

  -- Ownership
  data_owner VARCHAR(255),
  department VARCHAR(255),

  -- DPIA Link
  requires_dpia BOOLEAN DEFAULT false,
  dpia_id UUID, -- Will be set later when DPIA created

  -- Metadata
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATA PROTECTION IMPACT ASSESSMENTS (DPIA) - Article 35
-- ============================================================================

CREATE TABLE gdpr_dpias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Information
  title VARCHAR(255) NOT NULL,
  reference_code VARCHAR(50),
  description TEXT,

  -- Linked Processing Activity
  processing_activity_id UUID REFERENCES gdpr_processing_activities(id) ON DELETE SET NULL,

  -- Project Details (for new processing)
  project_name VARCHAR(255),
  project_description TEXT,

  -- Assessment Trigger
  trigger_reason TEXT, -- Why DPIA is required

  -- Processing Description
  processing_description TEXT,
  processing_purposes TEXT[] DEFAULT '{}',
  data_categories TEXT[] DEFAULT '{}',
  data_subject_categories TEXT[] DEFAULT '{}',
  data_volume_estimate TEXT,

  -- Necessity & Proportionality
  necessity_assessment TEXT,
  proportionality_assessment TEXT,

  -- Risks Assessment (summary)
  risks_to_rights_freedoms TEXT,
  overall_risk_level gdpr_risk_level,
  residual_risk_level gdpr_risk_level,

  -- Consultation
  dpo_consulted BOOLEAN DEFAULT false,
  dpo_consultation_date TIMESTAMPTZ,
  dpo_opinion TEXT,
  authority_consultation_required BOOLEAN DEFAULT false,
  authority_consultation_date TIMESTAMPTZ,
  authority_response TEXT,

  -- Approval
  status gdpr_dpia_status DEFAULT 'draft',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Review Schedule
  next_review_date DATE,
  review_frequency_months INTEGER DEFAULT 12,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from processing activities to DPIAs
ALTER TABLE gdpr_processing_activities
  ADD CONSTRAINT fk_processing_activity_dpia
  FOREIGN KEY (dpia_id) REFERENCES gdpr_dpias(id) ON DELETE SET NULL;

-- ============================================================================
-- DPIA RISKS
-- ============================================================================

CREATE TABLE gdpr_dpia_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dpia_id UUID NOT NULL REFERENCES gdpr_dpias(id) ON DELETE CASCADE,

  -- Risk Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  risk_category VARCHAR(100), -- confidentiality, integrity, availability, rights

  -- Risk Assessment
  likelihood gdpr_risk_level NOT NULL,
  impact gdpr_risk_level NOT NULL,
  inherent_risk_level gdpr_risk_level NOT NULL,

  -- After Mitigation
  residual_likelihood gdpr_risk_level,
  residual_impact gdpr_risk_level,
  residual_risk_level gdpr_risk_level,

  -- Metadata
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DPIA MITIGATIONS
-- ============================================================================

CREATE TABLE gdpr_dpia_mitigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dpia_id UUID NOT NULL REFERENCES gdpr_dpias(id) ON DELETE CASCADE,
  risk_id UUID REFERENCES gdpr_dpia_risks(id) ON DELETE CASCADE,

  -- Mitigation Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  mitigation_type VARCHAR(100), -- technical, organizational, contractual

  -- Implementation
  status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, implemented
  responsible_party VARCHAR(255),
  implementation_date DATE,

  -- Effectiveness
  effectiveness_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATA SUBJECT REQUESTS (DSR) - Articles 15-22
-- ============================================================================

CREATE TABLE gdpr_data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Request Reference
  reference_number VARCHAR(50) NOT NULL,

  -- Request Type
  request_type gdpr_dsr_type NOT NULL,

  -- Data Subject Information
  data_subject_name VARCHAR(255),
  data_subject_email VARCHAR(255),
  data_subject_phone VARCHAR(50),
  identity_verified BOOLEAN DEFAULT false,
  identity_verification_method TEXT,
  identity_verified_at TIMESTAMPTZ,

  -- Request Details
  request_details TEXT,
  received_via VARCHAR(100), -- email, web_form, letter, in_person
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Processing
  status gdpr_dsr_status DEFAULT 'received',
  assigned_to UUID REFERENCES profiles(id),

  -- Timeline
  response_due_date DATE NOT NULL,
  extension_applied BOOLEAN DEFAULT false,
  extension_reason TEXT,
  extended_due_date DATE,

  -- Response
  response_date TIMESTAMPTZ,
  response_method VARCHAR(100),
  response_summary TEXT,

  -- Refusal (if applicable)
  refusal_reason TEXT,
  refusal_legal_basis TEXT,

  -- Linked Entities
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL, -- If involves third-party

  -- Notes
  internal_notes TEXT,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PERSONAL DATA BREACH LOG - Articles 33-34
-- ============================================================================

CREATE TABLE gdpr_breaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Breach Reference
  reference_number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,

  -- Detection
  detected_at TIMESTAMPTZ NOT NULL,
  detected_by VARCHAR(255),
  detection_method TEXT,

  -- Breach Details
  description TEXT NOT NULL,
  breach_type TEXT[], -- unauthorized_access, loss, theft, disclosure, etc.

  -- Affected Data
  data_categories_affected TEXT[] DEFAULT '{}',
  special_category_affected BOOLEAN DEFAULT false,
  estimated_records_affected INTEGER,
  data_subjects_affected TEXT[], -- employees, customers, etc.

  -- Systems/Vendors
  systems_affected TEXT[] DEFAULT '{}',
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- Impact Assessment
  severity gdpr_breach_severity NOT NULL,
  likelihood_of_risk gdpr_risk_level,
  impact_assessment TEXT,

  -- Notification Decisions
  notify_authority BOOLEAN,
  authority_notification_reason TEXT,
  notify_data_subjects BOOLEAN,
  data_subject_notification_reason TEXT,

  -- Authority Notification (Article 33)
  authority_notified_at TIMESTAMPTZ,
  authority_reference VARCHAR(100),
  authority_response TEXT,

  -- Data Subject Notification (Article 34)
  data_subjects_notified_at TIMESTAMPTZ,
  notification_method TEXT,
  notification_content TEXT,

  -- Containment & Remediation
  status gdpr_breach_status DEFAULT 'detected',
  containment_actions TEXT,
  containment_date TIMESTAMPTZ,
  remediation_actions TEXT,
  remediation_date TIMESTAMPTZ,

  -- Root Cause
  root_cause TEXT,
  preventive_measures TEXT,

  -- Related Incident
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,

  -- Closure
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id),
  lessons_learned TEXT,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Processing Activities
CREATE INDEX idx_gdpr_processing_org ON gdpr_processing_activities(organization_id);
CREATE INDEX idx_gdpr_processing_status ON gdpr_processing_activities(status);
CREATE INDEX idx_gdpr_processing_vendor ON gdpr_processing_activities(vendor_id);
CREATE INDEX idx_gdpr_processing_basis ON gdpr_processing_activities(lawful_basis);

-- DPIAs
CREATE INDEX idx_gdpr_dpias_org ON gdpr_dpias(organization_id);
CREATE INDEX idx_gdpr_dpias_status ON gdpr_dpias(status);
CREATE INDEX idx_gdpr_dpias_activity ON gdpr_dpias(processing_activity_id);
CREATE INDEX idx_gdpr_dpias_risk_level ON gdpr_dpias(overall_risk_level);

-- DPIA Risks
CREATE INDEX idx_gdpr_dpia_risks_dpia ON gdpr_dpia_risks(dpia_id);

-- DPIA Mitigations
CREATE INDEX idx_gdpr_dpia_mitigations_dpia ON gdpr_dpia_mitigations(dpia_id);
CREATE INDEX idx_gdpr_dpia_mitigations_risk ON gdpr_dpia_mitigations(risk_id);

-- DSRs
CREATE INDEX idx_gdpr_dsr_org ON gdpr_data_subject_requests(organization_id);
CREATE INDEX idx_gdpr_dsr_type ON gdpr_data_subject_requests(request_type);
CREATE INDEX idx_gdpr_dsr_status ON gdpr_data_subject_requests(status);
CREATE INDEX idx_gdpr_dsr_due_date ON gdpr_data_subject_requests(response_due_date);
CREATE INDEX idx_gdpr_dsr_assigned ON gdpr_data_subject_requests(assigned_to);

-- Breaches
CREATE INDEX idx_gdpr_breaches_org ON gdpr_breaches(organization_id);
CREATE INDEX idx_gdpr_breaches_status ON gdpr_breaches(status);
CREATE INDEX idx_gdpr_breaches_severity ON gdpr_breaches(severity);
CREATE INDEX idx_gdpr_breaches_detected ON gdpr_breaches(detected_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE gdpr_processing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_dpias ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_dpia_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_dpia_mitigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_breaches ENABLE ROW LEVEL SECURITY;

-- Processing Activities Policies
CREATE POLICY "Users can view their org's processing activities"
  ON gdpr_processing_activities FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's processing activities"
  ON gdpr_processing_activities FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- DPIAs Policies
CREATE POLICY "Users can view their org's DPIAs"
  ON gdpr_dpias FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's DPIAs"
  ON gdpr_dpias FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- DPIA Risks Policies
CREATE POLICY "Users can view DPIA risks"
  ON gdpr_dpia_risks FOR SELECT
  USING (dpia_id IN (
    SELECT id FROM gdpr_dpias WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage DPIA risks"
  ON gdpr_dpia_risks FOR ALL
  USING (dpia_id IN (
    SELECT id FROM gdpr_dpias WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- DPIA Mitigations Policies
CREATE POLICY "Users can view DPIA mitigations"
  ON gdpr_dpia_mitigations FOR SELECT
  USING (dpia_id IN (
    SELECT id FROM gdpr_dpias WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage DPIA mitigations"
  ON gdpr_dpia_mitigations FOR ALL
  USING (dpia_id IN (
    SELECT id FROM gdpr_dpias WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- DSR Policies
CREATE POLICY "Users can view their org's DSRs"
  ON gdpr_data_subject_requests FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's DSRs"
  ON gdpr_data_subject_requests FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Breaches Policies
CREATE POLICY "Users can view their org's breaches"
  ON gdpr_breaches FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can manage their org's breaches"
  ON gdpr_breaches FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_gdpr_processing_activities_updated_at
  BEFORE UPDATE ON gdpr_processing_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_dpias_updated_at
  BEFORE UPDATE ON gdpr_dpias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_dpia_risks_updated_at
  BEFORE UPDATE ON gdpr_dpia_risks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_dpia_mitigations_updated_at
  BEFORE UPDATE ON gdpr_dpia_mitigations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_data_subject_requests_updated_at
  BEFORE UPDATE ON gdpr_data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_breaches_updated_at
  BEFORE UPDATE ON gdpr_breaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTION: Generate DSR Reference Number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_dsr_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := 'DSR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
      LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_dsr_reference_trigger
  BEFORE INSERT ON gdpr_data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION generate_dsr_reference();

-- ============================================================================
-- HELPER FUNCTION: Generate Breach Reference Number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_breach_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := 'BRC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
      LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_breach_reference_trigger
  BEFORE INSERT ON gdpr_breaches
  FOR EACH ROW EXECUTE FUNCTION generate_breach_reference();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE gdpr_processing_activities IS 'GDPR Article 30 Record of Processing Activities (RoPA)';
COMMENT ON TABLE gdpr_dpias IS 'GDPR Article 35 Data Protection Impact Assessments';
COMMENT ON TABLE gdpr_dpia_risks IS 'Risks identified during DPIA assessment';
COMMENT ON TABLE gdpr_dpia_mitigations IS 'Mitigation measures for DPIA risks';
COMMENT ON TABLE gdpr_data_subject_requests IS 'GDPR Articles 15-22 Data Subject Rights Requests';
COMMENT ON TABLE gdpr_breaches IS 'GDPR Articles 33-34 Personal Data Breach Log';
