-- Migration: 003_enhanced_roi
-- Description: Enhanced RoI Engine supporting all 15 ESA templates
-- Created: 2024-12-29
-- Depends on: 001_initial_schema.sql

-- ============================================
-- ORGANIZATION EXTENSIONS (B_01.01-03)
-- ============================================

-- B_01.01 Entity-level extensions
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  parent_entity_lei TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  competent_authorities TEXT[] DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  group_structure TEXT CHECK (group_structure IN ('standalone', 'parent', 'subsidiary'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  roi_metadata JSONB DEFAULT '{}';

-- B_01.02 Organization branches
CREATE TABLE IF NOT EXISTS organization_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL, -- Internal branch identifier
  country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2
  branch_name TEXT NOT NULL,
  address JSONB DEFAULT '{}', -- street, city, postal_code, country
  regulatory_status TEXT, -- e.g., "Passported", "Licensed"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, branch_id)
);

CREATE INDEX idx_org_branches_org ON organization_branches(organization_id);

-- B_01.03 Responsible persons
CREATE TABLE IF NOT EXISTS organization_responsible_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  person_type TEXT NOT NULL CHECK (person_type IN (
    'ict_risk_manager', 'dpo', 'compliance_officer', 'ciso', 'other'
  )),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, person_type, name)
);

CREATE INDEX idx_org_persons_org ON organization_responsible_persons(organization_id);

-- ============================================
-- VENDOR EXTENSIONS (B_02.01-03)
-- ============================================

-- B_02.01 Enhanced provider data
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  provider_type TEXT CHECK (provider_type IN (
    'ict_service_provider', 'cloud_service_provider',
    'data_centre', 'network_provider', 'other'
  ));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  headquarters_country TEXT; -- ISO 3166-1 alpha-2
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  is_intra_group BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  parent_provider_id UUID REFERENCES vendors(id);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  registration_number TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  regulatory_authorizations TEXT[] DEFAULT '{}';

-- B_02.02 Provider responsible persons
CREATE TABLE IF NOT EXISTS vendor_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN (
    'primary', 'technical', 'security', 'commercial', 'escalation'
  )),
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, contact_type, name)
);

CREATE INDEX idx_vendor_contacts_vendor ON vendor_contacts(vendor_id);

-- B_02.03 Provider entities/branches
CREATE TABLE IF NOT EXISTS vendor_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  entity_lei TEXT,
  country_code TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('headquarters', 'subsidiary', 'branch', 'data_center')),
  address JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, entity_name, country_code)
);

CREATE INDEX idx_vendor_entities_vendor ON vendor_entities(vendor_id);

-- ============================================
-- CONTRACTS (B_03.01-03)
-- ============================================

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Contract identification
  contract_ref TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN (
    'master_agreement', 'service_agreement', 'sla',
    'nda', 'dpa', 'amendment', 'statement_of_work', 'other'
  )),

  -- Dates
  signature_date DATE,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  auto_renewal BOOLEAN DEFAULT FALSE,
  termination_notice_days INTEGER,
  last_renewal_date DATE,

  -- DORA Article 30 provisions tracking
  dora_provisions JSONB DEFAULT '{}',
  -- Structure: { "provision_1": { "status": "present", "location": "Section 5.2", "notes": "" }, ... }

  -- Contract value
  annual_value DECIMAL(18,2),
  total_value DECIMAL(18,2),
  currency TEXT DEFAULT 'EUR',

  -- Linked documents
  document_ids UUID[] DEFAULT '{}',

  -- Status
  status TEXT CHECK (status IN ('draft', 'active', 'expiring', 'expired', 'terminated')) DEFAULT 'draft',

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, contract_ref)
);

CREATE INDEX idx_contracts_organization ON contracts(organization_id);
CREATE INDEX idx_contracts_vendor ON contracts(vendor_id);
CREATE INDEX idx_contracts_expiry ON contracts(expiry_date);
CREATE INDEX idx_contracts_status ON contracts(status);

-- Auto-update contract status based on dates
CREATE OR REPLACE FUNCTION update_contract_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    IF NEW.expiry_date < CURRENT_DATE THEN
      NEW.status := 'expired';
    ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN
      NEW.status := 'expiring';
    ELSIF NEW.effective_date <= CURRENT_DATE THEN
      NEW.status := 'active';
    ELSE
      NEW.status := 'draft';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_contract_status
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_status();

-- B_03.02 Contract responsible persons
CREATE TABLE IF NOT EXISTS contract_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('entity', 'provider')),
  contact_type TEXT NOT NULL CHECK (contact_type IN ('primary', 'commercial', 'technical')),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contract_contacts_contract ON contract_contacts(contract_id);

-- ============================================
-- ICT SERVICES (B_04.01-02)
-- ============================================

CREATE TABLE IF NOT EXISTS ict_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Service identification
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN (
    'cloud_computing', 'software_as_service', 'platform_as_service',
    'infrastructure_as_service', 'data_analytics', 'data_management',
    'network_services', 'security_services', 'payment_services',
    'hardware', 'other'
  )),
  service_subtype TEXT,
  description TEXT,

  -- Criticality
  criticality_level TEXT CHECK (criticality_level IN ('critical', 'important', 'non_critical')) DEFAULT 'non_critical',
  criticality_rationale TEXT,

  -- SLA metrics
  availability_target FLOAT CHECK (availability_target >= 0 AND availability_target <= 100),
  actual_availability FLOAT CHECK (actual_availability >= 0 AND actual_availability <= 100),
  rto_hours INTEGER,
  rpo_hours INTEGER,
  support_hours TEXT, -- e.g., "24x7", "8x5"

  -- Personal data
  processes_personal_data BOOLEAN DEFAULT FALSE,
  personal_data_categories TEXT[] DEFAULT '{}', -- 'name', 'email', 'financial', 'health', etc.
  data_subjects TEXT[] DEFAULT '{}', -- 'employees', 'customers', 'prospects', etc.
  data_volume_category TEXT CHECK (data_volume_category IN ('small', 'medium', 'large', 'very_large')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ict_services_contract ON ict_services(contract_id);
CREATE INDEX idx_ict_services_vendor ON ict_services(vendor_id);
CREATE INDEX idx_ict_services_org ON ict_services(organization_id);
CREATE INDEX idx_ict_services_criticality ON ict_services(criticality_level);

-- B_04.02 Service data locations
CREATE TABLE IF NOT EXISTS service_data_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES ict_services(id) ON DELETE CASCADE,

  location_type TEXT NOT NULL CHECK (location_type IN (
    'primary_processing', 'backup_processing', 'primary_storage',
    'backup_storage', 'disaster_recovery', 'development', 'testing'
  )),
  country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2
  region TEXT, -- e.g., "EU", "EEA", "Adequacy Decision"
  city TEXT,
  provider_name TEXT, -- If different from main provider
  data_center_name TEXT,

  -- Data at this location
  data_categories TEXT[] DEFAULT '{}',
  is_eu_adequate BOOLEAN DEFAULT FALSE, -- Per GDPR adequacy

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_locations_service ON service_data_locations(service_id);
CREATE INDEX idx_service_locations_country ON service_data_locations(country_code);

-- ============================================
-- CRITICAL FUNCTIONS (B_05.01-02)
-- ============================================

CREATE TABLE IF NOT EXISTS critical_functions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  function_name TEXT NOT NULL,
  function_code TEXT, -- Internal classification code
  function_category TEXT CHECK (function_category IN (
    'payment_services', 'lending', 'deposits', 'investment_services',
    'insurance', 'market_infrastructure', 'data_reporting', 'other'
  )),

  -- Criticality determination
  is_critical BOOLEAN DEFAULT FALSE,
  criticality_rationale TEXT,

  -- Impact assessment
  clients_affected_if_disrupted INTEGER,
  revenue_at_risk DECIMAL(18,2),
  regulatory_obligations TEXT[] DEFAULT '{}',

  -- Dependencies
  dependent_services UUID[] DEFAULT '{}', -- References to ict_services

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, function_name)
);

CREATE INDEX idx_critical_functions_org ON critical_functions(organization_id);
CREATE INDEX idx_critical_functions_critical ON critical_functions(is_critical);

-- B_05.02 Function-service mapping
CREATE TABLE IF NOT EXISTS function_service_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  function_id UUID NOT NULL REFERENCES critical_functions(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES ict_services(id) ON DELETE CASCADE,

  dependency_type TEXT CHECK (dependency_type IN ('essential', 'supporting', 'minimal')) DEFAULT 'supporting',
  substitutability TEXT CHECK (substitutability IN ('not_substitutable', 'substitutable_with_difficulty', 'easily_substitutable')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(function_id, service_id)
);

CREATE INDEX idx_function_service_function ON function_service_mapping(function_id);
CREATE INDEX idx_function_service_service ON function_service_mapping(service_id);

-- ============================================
-- SUBCONTRACTING CHAIN (B_06.01)
-- ============================================

CREATE TABLE IF NOT EXISTS subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  service_id UUID REFERENCES ict_services(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Subcontractor identification
  subcontractor_name TEXT NOT NULL,
  subcontractor_lei TEXT,
  country_code TEXT,

  -- Chain position
  tier_level INTEGER NOT NULL DEFAULT 1 CHECK (tier_level >= 1 AND tier_level <= 5),
  -- 1 = direct subcontractor, 2 = sub-subcontractor, etc.
  parent_subcontractor_id UUID REFERENCES subcontractors(id),

  -- Service provided
  service_description TEXT,
  service_type TEXT,

  -- Criticality
  supports_critical_function BOOLEAN DEFAULT FALSE,

  -- Monitoring
  is_monitored BOOLEAN DEFAULT FALSE,
  last_assessment_date TIMESTAMPTZ,
  risk_rating TEXT CHECK (risk_rating IN ('low', 'medium', 'high')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, subcontractor_name, tier_level)
);

CREATE INDEX idx_subcontractors_vendor ON subcontractors(vendor_id);
CREATE INDEX idx_subcontractors_org ON subcontractors(organization_id);
CREATE INDEX idx_subcontractors_service ON subcontractors(service_id);
CREATE INDEX idx_subcontractors_tier ON subcontractors(tier_level);
CREATE INDEX idx_subcontractors_parent ON subcontractors(parent_subcontractor_id);

-- ============================================
-- INTRA-GROUP ARRANGEMENTS (B_07.01)
-- ============================================

CREATE TABLE IF NOT EXISTS intra_group_arrangements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Intra-group entity
  group_entity_lei TEXT NOT NULL,
  group_entity_name TEXT NOT NULL,
  relationship_type TEXT CHECK (relationship_type IN ('parent', 'subsidiary', 'affiliate', 'branch')),

  -- Service details
  services_provided TEXT[] DEFAULT '{}',
  is_outsourcing BOOLEAN DEFAULT FALSE,

  -- Regulatory treatment
  regulatory_treatment TEXT,
  consolidated_supervision BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_intra_group_contract ON intra_group_arrangements(contract_id);
CREATE INDEX idx_intra_group_org ON intra_group_arrangements(organization_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE organization_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_responsible_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ict_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_data_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_service_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE intra_group_arrangements ENABLE ROW LEVEL SECURITY;

-- Organization branches
CREATE POLICY "Users can view org branches"
  ON organization_branches FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage org branches"
  ON organization_branches FOR ALL
  USING (organization_id = get_user_organization_id());

-- Contracts
CREATE POLICY "Users can view org contracts"
  ON contracts FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage org contracts"
  ON contracts FOR ALL
  USING (organization_id = get_user_organization_id());

-- ICT Services
CREATE POLICY "Users can view org services"
  ON ict_services FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage org services"
  ON ict_services FOR ALL
  USING (organization_id = get_user_organization_id());

-- Critical Functions
CREATE POLICY "Users can view org functions"
  ON critical_functions FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage org functions"
  ON critical_functions FOR ALL
  USING (organization_id = get_user_organization_id());

-- Subcontractors
CREATE POLICY "Users can view org subcontractors"
  ON subcontractors FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage org subcontractors"
  ON subcontractors FOR ALL
  USING (organization_id = get_user_organization_id());

-- Add policies for other tables via organization relationship...
-- (Similar patterns for vendor_contacts, service_data_locations, etc.)

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE contracts IS 'Contractual arrangements with ICT third-party providers (B_03.01)';
COMMENT ON TABLE ict_services IS 'ICT services received from providers (B_04.01)';
COMMENT ON TABLE service_data_locations IS 'Data processing and storage locations (B_04.02)';
COMMENT ON TABLE critical_functions IS 'Critical or important functions (B_05.01)';
COMMENT ON TABLE subcontractors IS 'Subcontracting chain visibility (B_06.01)';
COMMENT ON TABLE intra_group_arrangements IS 'Intra-group ICT service arrangements (B_07.01)';
