-- Migration: 005_esa_field_additions
-- Description: Add missing ESA-required fields for RoI compliance
-- Created: 2025-01-01
-- Purpose: Ensure all templates have complete data for ESA xBRL-CSV submission

-- ============================================
-- B_01.01 ENTITY ADDITIONS
-- ============================================

-- Annual ICT spend tracking (required for RT.01.01)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  last_roi_update TIMESTAMPTZ;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  annual_ict_spend_currency VARCHAR(3) DEFAULT 'EUR';

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  annual_ict_spend_amount DECIMAL(15,2);

-- Nature of entity classification
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  nature_of_entity VARCHAR(50); -- Maps to EBA entity type enumeration

-- ============================================
-- B_02.01 PROVIDER ADDITIONS
-- ============================================

-- Ultimate parent (for concentration risk)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  ultimate_parent_lei VARCHAR(20);

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  ultimate_parent_name TEXT;

-- ESA Register ID (for CTPPs)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  esa_register_id VARCHAR(50);

-- Substitutability assessment (DORA Art 28)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  substitutability_assessment VARCHAR(50) CHECK (substitutability_assessment IN (
    'easily_substitutable', 'substitutable_with_difficulty', 'not_substitutable', 'not_assessed'
  ));

-- Total expense with provider
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  total_annual_expense DECIMAL(18,2);

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  expense_currency VARCHAR(3) DEFAULT 'EUR';

-- ============================================
-- B_03.01 CONTRACT ADDITIONS
-- ============================================

-- Governing law (required for RT.02.01)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
  governing_law_country VARCHAR(2); -- ISO 3166-1 alpha-2

-- Notice periods (required for exit arrangements)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
  notice_period_entity_days INTEGER; -- Days notice entity must give

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
  notice_period_provider_days INTEGER; -- Days notice provider must give

-- Contract amendments tracking (for B_02.03)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
  is_amendment BOOLEAN DEFAULT FALSE;

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
  parent_contract_id UUID REFERENCES contracts(id);

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
  amendment_date DATE;

-- Service level metrics
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
  availability_sla DECIMAL(5,2); -- e.g., 99.95

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
  rto_hours_contractual INTEGER;

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
  rpo_hours_contractual INTEGER;

-- ============================================
-- B_04.01 ICT SERVICE ADDITIONS
-- ============================================

-- Service identification code (unique per service)
ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  service_identification_code VARCHAR(100);

-- Recipient entity (may differ from organization)
ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  recipient_entity_lei VARCHAR(20);

-- Service dates
ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  service_start_date DATE;

ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  service_end_date DATE;

-- Notice periods
ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  notice_period_entity_days INTEGER;

ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  notice_period_provider_days INTEGER;

-- Level of reliance (EBA enumeration)
ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  level_of_reliance VARCHAR(50) CHECK (level_of_reliance IN (
    'low_reliance', 'significant_reliance', 'high_reliance', 'critical_reliance'
  ));

-- Data sensitiveness (for B_04.02 linking)
ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  data_sensitiveness VARCHAR(50) CHECK (data_sensitiveness IN (
    'public', 'internal', 'confidential', 'restricted', 'highly_restricted'
  ));

-- Storage/processing countries (denormalized for performance)
ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  data_storage_countries VARCHAR(2)[] DEFAULT '{}';

ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  data_processing_countries VARCHAR(2)[] DEFAULT '{}';

-- ============================================
-- B_04.02 DATA LOCATION ADDITIONS
-- ============================================

-- Sensitivity level per location
ALTER TABLE service_data_locations ADD COLUMN IF NOT EXISTS
  sensitivity_level VARCHAR(50) CHECK (sensitivity_level IN (
    'public', 'internal', 'confidential', 'restricted', 'highly_restricted'
  ));

-- Data volume category
ALTER TABLE service_data_locations ADD COLUMN IF NOT EXISTS
  data_volume_category VARCHAR(20) CHECK (data_volume_category IN (
    'minimal', 'small', 'medium', 'large', 'very_large'
  ));

-- ============================================
-- B_05.01 CRITICAL FUNCTION ADDITIONS
-- ============================================

-- Business RTO/RPO (separate from technical)
ALTER TABLE critical_functions ADD COLUMN IF NOT EXISTS
  business_rto_hours INTEGER;

ALTER TABLE critical_functions ADD COLUMN IF NOT EXISTS
  business_rpo_hours INTEGER;

-- Regulatory notification threshold
ALTER TABLE critical_functions ADD COLUMN IF NOT EXISTS
  requires_regulatory_notification BOOLEAN DEFAULT FALSE;

-- Impact if function disrupted
ALTER TABLE critical_functions ADD COLUMN IF NOT EXISTS
  impact_level VARCHAR(20) CHECK (impact_level IN (
    'low', 'medium', 'high', 'severe'
  )) DEFAULT 'medium';

-- ============================================
-- B_06.01 SUBCONTRACTOR ADDITIONS
-- ============================================

-- Rank in subcontracting chain (distinct from tier)
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS
  rank_in_chain INTEGER;

-- Direct subcontractor vs nth-party
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS
  is_direct_subcontractor BOOLEAN DEFAULT TRUE;

-- Data access level
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS
  data_access_level VARCHAR(50) CHECK (data_access_level IN (
    'no_access', 'read_only', 'read_write', 'full_access'
  ));

-- ============================================
-- B_07.01 EXIT ARRANGEMENT ADDITIONS
-- ============================================

-- Add exit plan tracking to ict_services
ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  has_exit_plan BOOLEAN DEFAULT FALSE;

ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  exit_plan_tested BOOLEAN DEFAULT FALSE;

ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  exit_plan_last_test_date DATE;

ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  reintegration_possibility VARCHAR(50) CHECK (reintegration_possibility IN (
    'feasible_short_term', 'feasible_medium_term', 'feasible_long_term', 'not_feasible'
  ));

ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  alternative_providers_identified INTEGER DEFAULT 0;

-- ============================================
-- AI ANALYSIS TO ROI BRIDGE TABLE
-- ============================================

-- Table to track which AI-extracted data has been confirmed for RoI
CREATE TABLE IF NOT EXISTS roi_data_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Source tracking
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
    'ai_contract_analysis', 'ai_document_analysis', 'manual_entry', 'bulk_import'
  )),
  source_id UUID, -- Reference to parsed_contracts, documents, etc.

  -- Target tracking
  target_table VARCHAR(100) NOT NULL, -- e.g., 'contracts', 'ict_services', 'vendors'
  target_id UUID NOT NULL,

  -- Confirmation status
  is_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, source_type, source_id, target_table, target_id)
);

CREATE INDEX idx_roi_confirmations_org ON roi_data_confirmations(organization_id);
CREATE INDEX idx_roi_confirmations_target ON roi_data_confirmations(target_table, target_id);
CREATE INDEX idx_roi_confirmations_source ON roi_data_confirmations(source_type, source_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE roi_data_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's confirmations"
  ON roi_data_confirmations FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert confirmations for their organization"
  ON roi_data_confirmations FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their organization's confirmations"
  ON roi_data_confirmations FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to populate contract data from AI analysis
CREATE OR REPLACE FUNCTION populate_contract_from_analysis(
  p_document_id UUID,
  p_organization_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_analysis RECORD;
  v_contract_id UUID;
  v_vendor_id UUID;
BEGIN
  -- Get the parsed contract analysis
  SELECT * INTO v_analysis FROM parsed_contracts
  WHERE document_id = p_document_id
  AND organization_id = p_organization_id
  AND status = 'completed'
  LIMIT 1;

  IF v_analysis IS NULL THEN
    RAISE EXCEPTION 'No completed analysis found for document %', p_document_id;
  END IF;

  -- Find or create vendor based on provider name
  -- This is a simplified version - real implementation would need more logic
  SELECT id INTO v_vendor_id FROM vendors
  WHERE organization_id = p_organization_id
  AND name ILIKE '%' || COALESCE(
    v_analysis.identified_parties->0->>'name',
    v_analysis.identified_contract_type
  ) || '%'
  LIMIT 1;

  -- Insert/update contract with AI-extracted data
  INSERT INTO contracts (
    organization_id,
    vendor_id,
    contract_ref,
    contract_type,
    effective_date,
    expiry_date,
    governing_law_country,
    dora_provisions,
    document_ids,
    notes
  ) VALUES (
    p_organization_id,
    v_vendor_id,
    COALESCE('AI-' || LEFT(p_document_id::text, 8), 'AUTO-' || NOW()::text),
    'service_agreement',
    COALESCE(v_analysis.identified_effective_date::date, CURRENT_DATE),
    v_analysis.identified_expiry_date::date,
    v_analysis.identified_governing_law,
    jsonb_build_object(
      'article_30_2', v_analysis.article_30_2,
      'article_30_3', v_analysis.article_30_3,
      'compliance_score', v_analysis.overall_compliance_score
    ),
    ARRAY[p_document_id],
    'Auto-populated from AI contract analysis'
  )
  ON CONFLICT (organization_id, contract_ref) DO UPDATE SET
    effective_date = EXCLUDED.effective_date,
    expiry_date = EXCLUDED.expiry_date,
    governing_law_country = EXCLUDED.governing_law_country,
    dora_provisions = EXCLUDED.dora_provisions,
    updated_at = NOW()
  RETURNING id INTO v_contract_id;

  -- Track the confirmation
  INSERT INTO roi_data_confirmations (
    organization_id,
    source_type,
    source_id,
    target_table,
    target_id
  ) VALUES (
    p_organization_id,
    'ai_contract_analysis',
    v_analysis.id,
    'contracts',
    v_contract_id
  ) ON CONFLICT DO NOTHING;

  RETURN v_contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

-- Update organization's last_roi_update when related data changes
CREATE OR REPLACE FUNCTION update_org_roi_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE organizations
  SET last_roi_update = NOW()
  WHERE id = NEW.organization_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to key tables
CREATE TRIGGER update_roi_on_contract_change
  AFTER INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_org_roi_timestamp();

CREATE TRIGGER update_roi_on_vendor_change
  AFTER INSERT OR UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_org_roi_timestamp();

CREATE TRIGGER update_roi_on_service_change
  AFTER INSERT OR UPDATE ON ict_services
  FOR EACH ROW
  EXECUTE FUNCTION update_org_roi_timestamp();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN organizations.annual_ict_spend_amount IS 'Total annual ICT spend for ESA RT.01.01 reporting';
COMMENT ON COLUMN vendors.substitutability_assessment IS 'DORA Art 28 substitutability assessment per provider';
COMMENT ON COLUMN vendors.ultimate_parent_lei IS 'LEI of ultimate parent for concentration risk analysis';
COMMENT ON COLUMN contracts.governing_law_country IS 'ISO country code of governing law jurisdiction';
COMMENT ON COLUMN ict_services.level_of_reliance IS 'EBA level of reliance classification for the service';
COMMENT ON COLUMN ict_services.reintegration_possibility IS 'Assessment of ability to bring service back in-house';
COMMENT ON TABLE roi_data_confirmations IS 'Tracks AI-extracted data that has been confirmed for RoI inclusion';
