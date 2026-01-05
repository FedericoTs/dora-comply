-- Migration: 010_soc2_roi_mapping
-- Description: SOC2-to-RoI Auto-Population feature
-- Created: 2025-01-05
-- Purpose: Enable one-click population of RoI from parsed SOC2 reports
-- Depends on: 001, 003, 005, 008 (parsed_soc2, vendors, subcontractors, ict_services)

-- ============================================
-- SOC2 TO ROI MAPPING TABLE
-- ============================================

-- Tracks the relationship between parsed SOC2 reports and RoI data
CREATE TABLE IF NOT EXISTS soc2_roi_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Source: SOC2 parsed data
  parsed_soc2_id UUID NOT NULL REFERENCES parsed_soc2(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Target: What we extracted and where it went
  extracted_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  extracted_service_ids UUID[] DEFAULT '{}',
  extracted_subcontractor_ids UUID[] DEFAULT '{}',

  -- Extraction metadata
  extraction_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (extraction_status IN (
    'pending', 'extracting', 'completed', 'failed', 'partial'
  )),
  extraction_confidence FLOAT CHECK (extraction_confidence >= 0 AND extraction_confidence <= 100),
  extraction_details JSONB DEFAULT '{}',
  -- Structure: { fields_extracted: [], fields_missing: [], warnings: [] }
  extracted_at TIMESTAMPTZ,
  error_message TEXT,

  -- Confirmation workflow (human-in-the-loop)
  is_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  confirmation_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, parsed_soc2_id)
);

-- Indexes for common queries
CREATE INDEX idx_soc2_roi_org ON soc2_roi_mappings(organization_id);
CREATE INDEX idx_soc2_roi_document ON soc2_roi_mappings(document_id);
CREATE INDEX idx_soc2_roi_status ON soc2_roi_mappings(extraction_status);
CREATE INDEX idx_soc2_roi_confirmed ON soc2_roi_mappings(is_confirmed);
CREATE INDEX idx_soc2_roi_vendor ON soc2_roi_mappings(extracted_vendor_id);

-- ============================================
-- SOC2 EXTRACTED DATA DETAILS
-- ============================================

-- Detailed tracking of each extracted field for audit trail
CREATE TABLE IF NOT EXISTS soc2_roi_extracted_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mapping_id UUID NOT NULL REFERENCES soc2_roi_mappings(id) ON DELETE CASCADE,

  -- What was extracted
  soc2_field VARCHAR(100) NOT NULL, -- e.g., 'serviceOrgName', 'subserviceOrgs[0].name'
  soc2_value TEXT, -- Original value from SOC2

  -- Where it went
  target_table VARCHAR(50) NOT NULL, -- e.g., 'vendors', 'subcontractors', 'ict_services'
  target_column VARCHAR(50) NOT NULL, -- e.g., 'name', 'service_description'
  target_id UUID, -- ID of created/updated record
  roi_template VARCHAR(10), -- e.g., 'B_05.01', 'B_05.02'

  -- Confidence and status
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 100),
  needs_review BOOLEAN DEFAULT FALSE,
  was_modified BOOLEAN DEFAULT FALSE, -- User changed the value
  final_value TEXT, -- Value after user confirmation

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extracted_fields_mapping ON soc2_roi_extracted_fields(mapping_id);
CREATE INDEX idx_extracted_fields_target ON soc2_roi_extracted_fields(target_table, target_id);

-- ============================================
-- VENDOR EXTENSIONS FOR SOC2 SOURCE TRACKING
-- ============================================

-- Add source tracking to vendors
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  source_type VARCHAR(50) CHECK (source_type IN (
    'manual', 'soc2_extraction', 'contract_extraction', 'bulk_import', 'api'
  )) DEFAULT 'manual';

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  last_soc2_audit_firm TEXT;

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  last_soc2_audit_date DATE;

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  soc2_report_type VARCHAR(10) CHECK (soc2_report_type IN ('type1', 'type2'));

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  soc2_opinion VARCHAR(20) CHECK (soc2_opinion IN ('unqualified', 'qualified', 'adverse'));

-- ============================================
-- SUBCONTRACTOR EXTENSIONS FOR SOC2 SOURCE
-- ============================================

-- Add source tracking and SOC2-specific fields to subcontractors
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS
  source_type VARCHAR(50) CHECK (source_type IN (
    'manual', 'soc2_extraction', 'contract_extraction', 'vendor_questionnaire'
  )) DEFAULT 'manual';

ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS
  source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS
  inclusion_method VARCHAR(20) CHECK (inclusion_method IN ('inclusive', 'carve_out'));

ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS
  controls_supported TEXT[] DEFAULT '{}';

ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS
  has_own_soc2 BOOLEAN DEFAULT FALSE;

ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS
  soc2_location_reference TEXT; -- Page reference from SOC2

-- ============================================
-- ICT SERVICES EXTENSIONS FOR SOC2 SOURCE
-- ============================================

-- Add source tracking to ict_services
ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  source_type VARCHAR(50) CHECK (source_type IN (
    'manual', 'soc2_extraction', 'contract_extraction'
  )) DEFAULT 'manual';

ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  system_boundaries TEXT;

ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  infrastructure_components TEXT[] DEFAULT '{}';

ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  software_components TEXT[] DEFAULT '{}';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE soc2_roi_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc2_roi_extracted_fields ENABLE ROW LEVEL SECURITY;

-- soc2_roi_mappings policies
CREATE POLICY "Users can view their org SOC2-RoI mappings"
  ON soc2_roi_mappings FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert SOC2-RoI mappings for their org"
  ON soc2_roi_mappings FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their org SOC2-RoI mappings"
  ON soc2_roi_mappings FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete their org SOC2-RoI mappings"
  ON soc2_roi_mappings FOR DELETE
  USING (organization_id = get_user_organization_id());

-- soc2_roi_extracted_fields policies (via mapping relationship)
CREATE POLICY "Users can view extracted fields for their org"
  ON soc2_roi_extracted_fields FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM soc2_roi_mappings m
    WHERE m.id = mapping_id AND m.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can manage extracted fields for their org"
  ON soc2_roi_extracted_fields FOR ALL
  USING (EXISTS (
    SELECT 1 FROM soc2_roi_mappings m
    WHERE m.id = mapping_id AND m.organization_id = get_user_organization_id()
  ));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get mapping statistics for a document
CREATE OR REPLACE FUNCTION get_soc2_roi_mapping_stats(p_document_id UUID)
RETURNS TABLE (
  has_mapping BOOLEAN,
  extraction_status VARCHAR,
  is_confirmed BOOLEAN,
  extracted_vendor_name TEXT,
  subcontractor_count INTEGER,
  service_count INTEGER,
  overall_confidence FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE as has_mapping,
    m.extraction_status,
    m.is_confirmed,
    v.name as extracted_vendor_name,
    COALESCE(array_length(m.extracted_subcontractor_ids, 1), 0) as subcontractor_count,
    COALESCE(array_length(m.extracted_service_ids, 1), 0) as service_count,
    m.extraction_confidence as overall_confidence
  FROM soc2_roi_mappings m
  LEFT JOIN vendors v ON v.id = m.extracted_vendor_id
  WHERE m.document_id = p_document_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE as has_mapping,
      NULL::VARCHAR as extraction_status,
      FALSE as is_confirmed,
      NULL::TEXT as extracted_vendor_name,
      0 as subcontractor_count,
      0 as service_count,
      NULL::FLOAT as overall_confidence;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to classify service type from infrastructure components
CREATE OR REPLACE FUNCTION classify_service_type(p_components TEXT[])
RETURNS VARCHAR AS $$
DECLARE
  v_components_lower TEXT;
  v_service_type VARCHAR(50);
BEGIN
  -- Combine all components to lowercase for matching
  v_components_lower := LOWER(array_to_string(p_components, ' '));

  -- Match keywords to service types (in order of specificity)
  IF v_components_lower ~ '(payment|stripe|adyen|checkout)' THEN
    v_service_type := 'payment_services';
  ELSIF v_components_lower ~ '(security|auth|okta|firewall|siem)' THEN
    v_service_type := 'security_services';
  ELSIF v_components_lower ~ '(analytics|bigquery|snowflake|databricks|looker)' THEN
    v_service_type := 'data_analytics';
  ELSIF v_components_lower ~ '(database|redis|mongodb|postgres|mysql|elasticsearch)' THEN
    v_service_type := 'data_management';
  ELSIF v_components_lower ~ '(cdn|cloudflare|akamai|fastly|network)' THEN
    v_service_type := 'network_services';
  ELSIF v_components_lower ~ '(kubernetes|k8s|container|docker|heroku|ecs)' THEN
    v_service_type := 'platform_as_service';
  ELSIF v_components_lower ~ '(ec2|compute|vm|virtual|infrastructure|storage|s3)' THEN
    v_service_type := 'infrastructure_as_service';
  ELSIF v_components_lower ~ '(saas|software|application|platform|api)' THEN
    v_service_type := 'software_as_service';
  ELSIF v_components_lower ~ '(cloud|aws|azure|gcp|google cloud)' THEN
    v_service_type := 'cloud_computing';
  ELSE
    v_service_type := 'other';
  END IF;

  RETURN v_service_type;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on soc2_roi_mappings
CREATE OR REPLACE FUNCTION update_soc2_roi_mappings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_soc2_roi_mappings_updated_at
  BEFORE UPDATE ON soc2_roi_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_soc2_roi_mappings_timestamp();

-- Track confirmation in roi_data_confirmations when mapping is confirmed
CREATE OR REPLACE FUNCTION sync_soc2_roi_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- When a mapping is confirmed, create confirmation records
  IF NEW.is_confirmed = TRUE AND (OLD.is_confirmed IS NULL OR OLD.is_confirmed = FALSE) THEN
    -- Vendor confirmation
    IF NEW.extracted_vendor_id IS NOT NULL THEN
      INSERT INTO roi_data_confirmations (
        organization_id, source_type, source_id, target_table, target_id,
        is_confirmed, confirmed_by, confirmed_at
      ) VALUES (
        NEW.organization_id, 'ai_document_analysis', NEW.parsed_soc2_id,
        'vendors', NEW.extracted_vendor_id,
        TRUE, NEW.confirmed_by, NEW.confirmed_at
      ) ON CONFLICT (organization_id, source_type, source_id, target_table, target_id)
      DO UPDATE SET is_confirmed = TRUE, confirmed_by = NEW.confirmed_by, confirmed_at = NEW.confirmed_at;
    END IF;

    -- Subcontractor confirmations
    IF NEW.extracted_subcontractor_ids IS NOT NULL THEN
      INSERT INTO roi_data_confirmations (
        organization_id, source_type, source_id, target_table, target_id,
        is_confirmed, confirmed_by, confirmed_at
      )
      SELECT
        NEW.organization_id, 'ai_document_analysis', NEW.parsed_soc2_id,
        'subcontractors', sub_id,
        TRUE, NEW.confirmed_by, NEW.confirmed_at
      FROM unnest(NEW.extracted_subcontractor_ids) AS sub_id
      ON CONFLICT (organization_id, source_type, source_id, target_table, target_id)
      DO UPDATE SET is_confirmed = TRUE, confirmed_by = EXCLUDED.confirmed_by, confirmed_at = EXCLUDED.confirmed_at;
    END IF;

    -- Service confirmations
    IF NEW.extracted_service_ids IS NOT NULL THEN
      INSERT INTO roi_data_confirmations (
        organization_id, source_type, source_id, target_table, target_id,
        is_confirmed, confirmed_by, confirmed_at
      )
      SELECT
        NEW.organization_id, 'ai_document_analysis', NEW.parsed_soc2_id,
        'ict_services', svc_id,
        TRUE, NEW.confirmed_by, NEW.confirmed_at
      FROM unnest(NEW.extracted_service_ids) AS svc_id
      ON CONFLICT (organization_id, source_type, source_id, target_table, target_id)
      DO UPDATE SET is_confirmed = TRUE, confirmed_by = EXCLUDED.confirmed_by, confirmed_at = EXCLUDED.confirmed_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_soc2_roi_to_confirmations
  AFTER UPDATE ON soc2_roi_mappings
  FOR EACH ROW
  EXECUTE FUNCTION sync_soc2_roi_confirmation();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE soc2_roi_mappings IS 'Tracks SOC2 report to RoI population mappings - enables one-click RoI generation';
COMMENT ON TABLE soc2_roi_extracted_fields IS 'Detailed audit trail of each field extracted from SOC2 to RoI';
COMMENT ON COLUMN soc2_roi_mappings.extraction_confidence IS 'Overall confidence score (0-100) for the extraction';
COMMENT ON COLUMN soc2_roi_mappings.is_confirmed IS 'Whether a human has reviewed and confirmed the extraction';
COMMENT ON COLUMN vendors.source_type IS 'How this vendor record was created';
COMMENT ON COLUMN subcontractors.inclusion_method IS 'SOC2 carve-out vs inclusive method for subservice organization';
COMMENT ON FUNCTION classify_service_type IS 'Classifies infrastructure components into ESA ICT service types';
