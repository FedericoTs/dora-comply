-- Migration: 047_vendor_multi_framework
-- Description: Add multi-framework vendor fields (website, industry, applicable_frameworks)
-- Date: 2026-01-28

-- =============================================================================
-- VENDOR TABLE ADDITIONS
-- =============================================================================

-- Website field (domain for intelligence monitoring)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS website TEXT;
COMMENT ON COLUMN vendors.website IS 'Vendor domain for breach monitoring and news intelligence';

-- Industry classification
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS industry TEXT;
COMMENT ON COLUMN vendors.industry IS 'Industry classification (financial_services, healthcare, technology, etc.)';

-- Applicable compliance frameworks (multi-select)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS applicable_frameworks TEXT[] DEFAULT '{}';
COMMENT ON COLUMN vendors.applicable_frameworks IS 'Array of applicable compliance frameworks (nis2, dora, soc2, iso27001, gdpr, hipaa)';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index for website lookups (for breach monitoring)
CREATE INDEX IF NOT EXISTS idx_vendors_website ON vendors(website) WHERE website IS NOT NULL;

-- Index for industry filtering
CREATE INDEX IF NOT EXISTS idx_vendors_industry ON vendors(industry) WHERE industry IS NOT NULL;

-- GIN index for framework array containment queries
CREATE INDEX IF NOT EXISTS idx_vendors_frameworks ON vendors USING GIN (applicable_frameworks);

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- Validate industry values
ALTER TABLE vendors ADD CONSTRAINT IF NOT EXISTS chk_vendor_industry
  CHECK (industry IS NULL OR industry IN (
    'financial_services',
    'healthcare',
    'technology',
    'manufacturing',
    'retail',
    'energy',
    'telecommunications',
    'transportation',
    'government',
    'education',
    'professional_services',
    'other'
  ));

-- Note: Framework values validated at application layer (Zod schema)
-- to allow easy addition of new frameworks without migration
