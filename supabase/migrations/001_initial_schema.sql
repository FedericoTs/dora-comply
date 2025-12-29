-- Migration: 001_initial_schema
-- Description: Core tables for DORA Compliance Platform
-- Created: 2024-12-28

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  lei TEXT,
  entity_type TEXT NOT NULL DEFAULT 'financial_entity',
  jurisdiction TEXT NOT NULL DEFAULT 'EU',
  data_region TEXT NOT NULL CHECK (data_region IN ('us', 'eu')) DEFAULT 'eu',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint for LEI format (20 alphanumeric characters)
ALTER TABLE organizations
  ADD CONSTRAINT valid_lei CHECK (lei IS NULL OR lei ~ '^[A-Z0-9]{20}$');

-- Index for quick lookups
CREATE INDEX idx_organizations_lei ON organizations(lei) WHERE lei IS NOT NULL;

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- ============================================
-- VENDORS
-- ============================================
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  lei TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('critical', 'important', 'standard')) DEFAULT 'standard',
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'inactive', 'offboarding')) DEFAULT 'pending',

  -- Classification
  jurisdiction TEXT,
  service_types TEXT[] DEFAULT '{}',

  -- DORA specific
  supports_critical_function BOOLEAN DEFAULT FALSE,
  critical_functions TEXT[] DEFAULT '{}',

  -- Risk
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  last_assessment_date TIMESTAMPTZ,

  -- Contact
  primary_contact JSONB DEFAULT '{}',

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Add constraint for LEI format
ALTER TABLE vendors
  ADD CONSTRAINT valid_vendor_lei CHECK (lei IS NULL OR lei ~ '^[A-Z0-9]{20}$');

-- Indexes
CREATE INDEX idx_vendors_organization ON vendors(organization_id);
CREATE INDEX idx_vendors_tier ON vendors(tier);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_risk ON vendors(risk_score);
CREATE INDEX idx_vendors_deleted ON vendors(deleted_at) WHERE deleted_at IS NULL;

-- Full text search
CREATE INDEX idx_vendors_search ON vendors USING gin(to_tsvector('english', name));

-- ============================================
-- DOCUMENTS
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- File info
  type TEXT NOT NULL CHECK (type IN ('soc2', 'iso27001', 'pentest', 'contract', 'other')),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,

  -- Parsing
  parsing_status TEXT NOT NULL CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  parsing_error TEXT,
  parsed_at TIMESTAMPTZ,
  parsing_confidence FLOAT CHECK (parsing_confidence >= 0 AND parsing_confidence <= 1),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_documents_vendor ON documents(vendor_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(parsing_status);

-- ============================================
-- PARSED SOC2 DATA
-- ============================================
CREATE TABLE parsed_soc2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Report metadata
  report_type TEXT NOT NULL CHECK (report_type IN ('type1', 'type2')),
  audit_firm TEXT,
  opinion TEXT CHECK (opinion IN ('unqualified', 'qualified', 'adverse')),
  period_start DATE,
  period_end DATE,

  -- Scope
  criteria TEXT[] DEFAULT '{}', -- security, availability, etc.
  system_description TEXT,

  -- Extracted data (JSONB for flexibility)
  controls JSONB DEFAULT '[]',
  exceptions JSONB DEFAULT '[]',
  subservice_orgs JSONB DEFAULT '[]',
  cuecs JSONB DEFAULT '[]',

  -- Raw extraction (for debugging/improvement)
  raw_extraction JSONB,
  confidence_scores JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_parsed_soc2_document ON parsed_soc2(document_id);

-- ============================================
-- PARSED ISO27001 DATA
-- ============================================
CREATE TABLE parsed_iso27001 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Certificate metadata
  certificate_number TEXT,
  certification_body TEXT,
  accreditation_body TEXT,
  issue_date DATE,
  expiry_date DATE,

  -- Scope
  scope TEXT,
  locations TEXT[] DEFAULT '{}',

  -- Statement of Applicability
  soa_controls JSONB DEFAULT '[]',

  -- DORA relevance mapping
  dora_relevance JSONB DEFAULT '{}',

  -- Confidence
  confidence_scores JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_parsed_iso27001_document ON parsed_iso27001(document_id);
CREATE INDEX idx_parsed_iso27001_expiry ON parsed_iso27001(expiry_date);

-- ============================================
-- ROI ENTRIES
-- ============================================
CREATE TABLE roi_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- ESA required fields
  entity_lei TEXT NOT NULL,
  provider_lei TEXT,
  provider_name TEXT NOT NULL,

  -- Contract
  contract_reference TEXT,
  contract_start_date DATE,
  contract_end_date DATE,

  -- Service description
  service_description TEXT,
  service_type TEXT,

  -- Data handling
  data_locations TEXT[] DEFAULT '{}',
  personal_data_processed BOOLEAN DEFAULT FALSE,
  data_categories TEXT[] DEFAULT '{}',

  -- Critical function
  supports_critical_function BOOLEAN DEFAULT FALSE,
  critical_functions TEXT[] DEFAULT '{}',

  -- SLA
  availability_sla FLOAT,
  rto_hours INTEGER,
  rpo_hours INTEGER,

  -- Subcontracting
  subcontractors JSONB DEFAULT '[]',

  -- Validation
  validation_status TEXT CHECK (validation_status IN ('valid', 'warning', 'error')) DEFAULT 'warning',
  validation_errors JSONB DEFAULT '[]',

  -- Source tracking
  source_document_id UUID REFERENCES documents(id),
  manual_override BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_roi_entries_organization ON roi_entries(organization_id);
CREATE INDEX idx_roi_entries_vendor ON roi_entries(vendor_id);
CREATE INDEX idx_roi_entries_validation ON roi_entries(validation_status);

-- ============================================
-- RISK SCORES (HISTORICAL)
-- ============================================
CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Score
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  breakdown JSONB NOT NULL DEFAULT '{}',

  -- Source
  calculation_method TEXT DEFAULT 'automatic',

  -- Timestamp
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_risk_scores_vendor ON risk_scores(vendor_id);
CREATE INDEX idx_risk_scores_date ON risk_scores(calculated_at);

-- ============================================
-- ACTIVITY LOG
-- ============================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Activity
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,

  -- Details
  details JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_log_organization ON activity_log(organization_id);
CREATE INDEX idx_activity_log_date ON activity_log(created_at);

-- ============================================
-- ROI EXPORTS
-- ============================================
CREATE TABLE roi_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Export details
  format TEXT NOT NULL CHECK (format IN ('xbrl-csv', 'excel', 'json')),
  templates TEXT[] NOT NULL,

  -- File
  storage_path TEXT,
  file_size INTEGER,

  -- Stats
  vendor_count INTEGER,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_roi_exports_organization ON roi_exports(organization_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_soc2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_iso27001 ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_exports ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Organizations: users can only see their own org
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

CREATE POLICY "Admins can update own organization"
  ON organizations FOR UPDATE
  USING (id = get_user_organization_id())
  WITH CHECK (id = get_user_organization_id());

-- Users: users can see users in their org
CREATE POLICY "Users can view org members"
  ON users FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Vendors: org-level access
CREATE POLICY "Users can view org vendors"
  ON vendors FOR SELECT
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create org vendors"
  ON vendors FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org vendors"
  ON vendors FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete org vendors"
  ON vendors FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Documents: org-level access
CREATE POLICY "Users can view org documents"
  ON documents FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create org documents"
  ON documents FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org documents"
  ON documents FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete org documents"
  ON documents FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Parsed data: via document relationship
CREATE POLICY "Users can view org parsed_soc2"
  ON parsed_soc2 FOR SELECT
  USING (document_id IN (
    SELECT id FROM documents WHERE organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can view org parsed_iso27001"
  ON parsed_iso27001 FOR SELECT
  USING (document_id IN (
    SELECT id FROM documents WHERE organization_id = get_user_organization_id()
  ));

-- ROI entries: org-level access
CREATE POLICY "Users can view org roi_entries"
  ON roi_entries FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create org roi_entries"
  ON roi_entries FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org roi_entries"
  ON roi_entries FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Risk scores: via vendor relationship
CREATE POLICY "Users can view org risk_scores"
  ON risk_scores FOR SELECT
  USING (vendor_id IN (
    SELECT id FROM vendors WHERE organization_id = get_user_organization_id()
  ));

-- Activity log: org-level access
CREATE POLICY "Users can view org activity_log"
  ON activity_log FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create org activity_log"
  ON activity_log FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- ROI exports: org-level access
CREATE POLICY "Users can view org roi_exports"
  ON roi_exports FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create org roi_exports"
  ON roi_exports FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_roi_entries_updated_at
  BEFORE UPDATE ON roi_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA (Optional - remove for production)
-- ============================================

-- Uncomment to add test data
-- INSERT INTO organizations (name, lei, entity_type, jurisdiction, data_region)
-- VALUES ('Test Financial Corp', '5493001KJTIIGC8Y1R17', 'credit_institution', 'DE', 'eu');
