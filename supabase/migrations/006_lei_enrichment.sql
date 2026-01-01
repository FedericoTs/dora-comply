-- Migration: 006_lei_enrichment
-- Description: Add LEI enrichment fields for comprehensive GLEIF data storage
-- Created: 2026-01-01
-- Purpose: Store all GLEIF API data for ESA DORA compliance and vendor auto-population

-- ============================================
-- VENDOR LEI ENRICHMENT FIELDS
-- ============================================

-- LEI Verification Status (from GLEIF registration)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  lei_status VARCHAR(30) CHECK (lei_status IN (
    'ISSUED', 'LAPSED', 'RETIRED', 'ANNULLED',
    'PENDING_VALIDATION', 'PENDING_TRANSFER', 'PENDING_ARCHIVAL'
  ));

-- When LEI was last verified against GLEIF
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  lei_verified_at TIMESTAMPTZ;

-- LEI renewal date for compliance warnings
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  lei_next_renewal DATE;

-- Entity operational status (distinct from LEI registration status)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  entity_status VARCHAR(20) CHECK (entity_status IN ('ACTIVE', 'INACTIVE'));

-- Registration authority ID (GLEIF registeredAt.id)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  registration_authority_id VARCHAR(100);

-- ISO legal form code (GLEIF legalForm.id)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  legal_form_code VARCHAR(50);

-- Full legal address from GLEIF (structured JSONB)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  legal_address JSONB DEFAULT '{}';

-- Full headquarters address from GLEIF (structured JSONB)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  headquarters_address JSONB DEFAULT '{}';

-- Entity creation/incorporation date
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  entity_creation_date DATE;

-- Complete GLEIF API response cache (for reference/audit)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  gleif_data JSONB DEFAULT '{}';

-- When GLEIF data was last fetched
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  gleif_fetched_at TIMESTAMPTZ;

-- ============================================
-- PARENT COMPANY DATA (FROM GLEIF LEVEL 2)
-- ============================================

-- Direct parent LEI (if different from ultimate parent)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  direct_parent_lei VARCHAR(20);

-- Direct parent name
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  direct_parent_name TEXT;

-- Direct parent country
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  direct_parent_country VARCHAR(2);

-- Ultimate parent country (for concentration risk)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  ultimate_parent_country VARCHAR(2);

-- Exception reason if no parent reported
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  parent_exception_reason TEXT;

-- ============================================
-- INDEXES FOR COMMON QUERIES
-- ============================================

-- Index for LEI status queries (compliance monitoring)
CREATE INDEX IF NOT EXISTS idx_vendors_lei_status
  ON vendors(lei_status) WHERE lei IS NOT NULL;

-- Index for entity status
CREATE INDEX IF NOT EXISTS idx_vendors_entity_status
  ON vendors(entity_status) WHERE lei IS NOT NULL;

-- Index for LEI renewal date (for warning queries)
CREATE INDEX IF NOT EXISTS idx_vendors_lei_next_renewal
  ON vendors(lei_next_renewal) WHERE lei_next_renewal IS NOT NULL;

-- Index for ultimate parent LEI (concentration risk)
CREATE INDEX IF NOT EXISTS idx_vendors_ultimate_parent_lei
  ON vendors(ultimate_parent_lei) WHERE ultimate_parent_lei IS NOT NULL;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN vendors.lei_status IS 'LEI registration status from GLEIF (ISSUED, LAPSED, RETIRED, etc.)';
COMMENT ON COLUMN vendors.lei_verified_at IS 'Timestamp when LEI was last verified against GLEIF API';
COMMENT ON COLUMN vendors.lei_next_renewal IS 'Date when LEI needs to be renewed - used for compliance warnings';
COMMENT ON COLUMN vendors.entity_status IS 'Entity operational status from GLEIF (ACTIVE/INACTIVE)';
COMMENT ON COLUMN vendors.registration_authority_id IS 'Business registration authority ID from GLEIF';
COMMENT ON COLUMN vendors.legal_form_code IS 'ISO legal form code from GLEIF (e.g., GMBH, PLC)';
COMMENT ON COLUMN vendors.legal_address IS 'Full structured legal address from GLEIF API';
COMMENT ON COLUMN vendors.headquarters_address IS 'Full structured headquarters address from GLEIF API';
COMMENT ON COLUMN vendors.entity_creation_date IS 'Date entity was incorporated/formed';
COMMENT ON COLUMN vendors.gleif_data IS 'Complete GLEIF API response cached for audit and reference';
COMMENT ON COLUMN vendors.gleif_fetched_at IS 'When GLEIF data was last fetched - for cache invalidation';
COMMENT ON COLUMN vendors.direct_parent_lei IS 'LEI of direct parent company from GLEIF Level 2 data';
COMMENT ON COLUMN vendors.direct_parent_name IS 'Name of direct parent company';
COMMENT ON COLUMN vendors.direct_parent_country IS 'Country of direct parent (ISO 2-letter code)';
COMMENT ON COLUMN vendors.ultimate_parent_country IS 'Country of ultimate parent for concentration risk analysis';
COMMENT ON COLUMN vendors.parent_exception_reason IS 'Reason if no parent is reported (e.g., entity is ultimate parent)';

-- ============================================
-- FUNCTION: Populate vendor from GLEIF data
-- ============================================

CREATE OR REPLACE FUNCTION populate_vendor_from_gleif(
  p_vendor_id UUID,
  p_gleif_data JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE vendors SET
    -- Basic info
    name = COALESCE(p_gleif_data->>'legalName', name),

    -- LEI verification
    lei_status = (p_gleif_data->>'registrationStatus')::VARCHAR(30),
    lei_verified_at = NOW(),
    lei_next_renewal = (p_gleif_data->>'nextRenewalDate')::DATE,
    entity_status = (p_gleif_data->>'entityStatus')::VARCHAR(20),

    -- Registration details
    registration_authority_id = p_gleif_data->>'registeredAt',
    registration_number = COALESCE(p_gleif_data->>'registeredAs', registration_number),
    legal_form_code = p_gleif_data->>'legalFormCode',
    jurisdiction = COALESCE(p_gleif_data->>'jurisdiction', jurisdiction),

    -- Addresses
    legal_address = COALESCE(p_gleif_data->'legalAddress', legal_address),
    headquarters_address = COALESCE(p_gleif_data->'headquartersAddress', headquarters_address),
    headquarters_country = COALESCE(p_gleif_data->'headquartersAddress'->>'country',
                                     p_gleif_data->'legalAddress'->>'country',
                                     headquarters_country),

    -- Dates
    entity_creation_date = (p_gleif_data->>'entityCreationDate')::DATE,

    -- Parent companies
    direct_parent_lei = COALESCE(p_gleif_data->'directParent'->>'lei', direct_parent_lei),
    direct_parent_name = COALESCE(p_gleif_data->'directParent'->>'legalName', direct_parent_name),
    direct_parent_country = COALESCE(p_gleif_data->'directParent'->>'country', direct_parent_country),
    ultimate_parent_lei = COALESCE(p_gleif_data->'ultimateParent'->>'lei', ultimate_parent_lei),
    ultimate_parent_name = COALESCE(p_gleif_data->'ultimateParent'->>'legalName', ultimate_parent_name),
    ultimate_parent_country = COALESCE(p_gleif_data->'ultimateParent'->>'country', ultimate_parent_country),
    parent_exception_reason = p_gleif_data->>'parentException',

    -- Cache full response
    gleif_data = p_gleif_data,
    gleif_fetched_at = NOW(),

    -- Update timestamp
    updated_at = NOW()

  WHERE id = p_vendor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION populate_vendor_from_gleif IS 'Populates vendor record with data from GLEIF API response';
