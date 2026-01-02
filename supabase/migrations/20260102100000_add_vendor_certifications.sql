-- ============================================================================
-- Vendor Certifications Table
-- ============================================================================
-- Store ISO and other compliance certifications for vendors
-- This allows direct data entry instead of relying on external APIs

-- Create certifications table
CREATE TABLE IF NOT EXISTS vendor_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Certification details
  standard TEXT NOT NULL, -- e.g., 'ISO 27001', 'ISO 27017', 'SOC 2'
  standard_version TEXT, -- e.g., '2022', '2015'
  certificate_number TEXT,

  -- Certification body
  certification_body TEXT NOT NULL, -- e.g., 'BSI', 'TÜV', 'Deloitte'
  accreditation_body TEXT, -- e.g., 'UKAS', 'DAkkS'

  -- Validity
  valid_from DATE NOT NULL,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'suspended', 'withdrawn', 'pending')),

  -- Scope and details
  scope TEXT, -- Certification scope description
  certificate_url TEXT, -- Link to certificate document

  -- Verification
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  verification_method TEXT, -- 'manual', 'iaf_certsearch', 'vendor_provided'
  verification_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Unique constraint to prevent duplicates
  UNIQUE(vendor_id, standard, certificate_number)
);

-- Create indexes
CREATE INDEX idx_vendor_certifications_vendor ON vendor_certifications(vendor_id);
CREATE INDEX idx_vendor_certifications_org ON vendor_certifications(organization_id);
CREATE INDEX idx_vendor_certifications_standard ON vendor_certifications(standard);
CREATE INDEX idx_vendor_certifications_status ON vendor_certifications(status);
CREATE INDEX idx_vendor_certifications_expiry ON vendor_certifications(valid_until) WHERE valid_until IS NOT NULL;

-- Enable RLS
ALTER TABLE vendor_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view certifications in their organization"
  ON vendor_certifications
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert certifications in their organization"
  ON vendor_certifications
  FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update certifications in their organization"
  ON vendor_certifications
  FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete certifications in their organization"
  ON vendor_certifications
  FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Updated_at trigger
CREATE TRIGGER update_vendor_certifications_updated_at
  BEFORE UPDATE ON vendor_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE vendor_certifications IS 'Stores ISO and compliance certifications for ICT third-party providers under DORA';
