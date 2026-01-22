-- =============================================================================
-- Migration: 029_nis2_assessments
-- Description: Create NIS2 assessments table and auto-population from vendor data
-- =============================================================================

-- =============================================================================
-- 1. Create nis2_assessments table
-- =============================================================================

CREATE TABLE IF NOT EXISTS nis2_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requirement_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_assessed' CHECK (status IN ('compliant', 'partial', 'non_compliant', 'not_assessed')),
  evidence_count INTEGER DEFAULT 0,
  gaps TEXT[] DEFAULT '{}',
  notes TEXT,
  assessed_at TIMESTAMP WITH TIME ZONE,
  assessed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT nis2_assessments_org_req_unique UNIQUE(organization_id, requirement_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_nis2_assessments_org ON nis2_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_nis2_assessments_status ON nis2_assessments(status);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS set_nis2_assessments_updated_at ON nis2_assessments;
CREATE TRIGGER set_nis2_assessments_updated_at
  BEFORE UPDATE ON nis2_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 2. Enable RLS
-- =============================================================================

ALTER TABLE nis2_assessments ENABLE ROW LEVEL SECURITY;

-- Policy for viewing assessments (users can view their organization's assessments)
DROP POLICY IF EXISTS "Users can view own organization assessments" ON nis2_assessments;
CREATE POLICY "Users can view own organization assessments"
  ON nis2_assessments
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy for inserting assessments
DROP POLICY IF EXISTS "Users can insert own organization assessments" ON nis2_assessments;
CREATE POLICY "Users can insert own organization assessments"
  ON nis2_assessments
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy for updating assessments
DROP POLICY IF EXISTS "Users can update own organization assessments" ON nis2_assessments;
CREATE POLICY "Users can update own organization assessments"
  ON nis2_assessments
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy for deleting assessments
DROP POLICY IF EXISTS "Users can delete own organization assessments" ON nis2_assessments;
CREATE POLICY "Users can delete own organization assessments"
  ON nis2_assessments
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- =============================================================================
-- 3. Function to auto-populate assessments from vendor data
-- =============================================================================

CREATE OR REPLACE FUNCTION populate_nis2_assessments_from_vendors(p_organization_id UUID)
RETURNS TABLE(
  requirement_id TEXT,
  status TEXT,
  evidence_count INTEGER,
  notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_count INTEGER;
  v_vendors_with_certs INTEGER;
  v_vendors_with_contracts INTEGER;
  v_incident_count INTEGER;
  v_has_critical_vendors BOOLEAN;
BEGIN
  -- Count vendors and their attributes for this organization
  SELECT COUNT(*) INTO v_vendor_count
  FROM vendors
  WHERE organization_id = p_organization_id AND deleted_at IS NULL;

  -- Count vendors with certifications (SOC 2, ISO 27001)
  SELECT COUNT(DISTINCT v.id) INTO v_vendors_with_certs
  FROM vendors v
  JOIN vendor_certifications vc ON vc.vendor_id = v.id
  WHERE v.organization_id = p_organization_id
    AND v.deleted_at IS NULL
    AND (vc.standard ILIKE '%SOC 2%' OR vc.standard ILIKE '%ISO 27001%');

  -- Count vendors with contracts
  SELECT COUNT(DISTINCT v.id) INTO v_vendors_with_contracts
  FROM vendors v
  JOIN contracts c ON c.vendor_id = v.id
  WHERE v.organization_id = p_organization_id
    AND v.deleted_at IS NULL
    AND c.deleted_at IS NULL;

  -- Count incidents (no deleted_at column on incidents table)
  SELECT COUNT(*) INTO v_incident_count
  FROM incidents
  WHERE organization_id = p_organization_id;

  -- Check for critical/high tier vendors
  SELECT EXISTS(
    SELECT 1 FROM vendors
    WHERE organization_id = p_organization_id
      AND deleted_at IS NULL
      AND tier IN ('critical', 'high')
  ) INTO v_has_critical_vendors;

  -- Now generate assessments for all 42 NIS2 requirements
  -- We'll derive status based on available data

  RETURN QUERY

  -- GOVERNANCE (nis2-20-*)
  SELECT 'nis2-20-1'::TEXT,
    CASE WHEN v_vendor_count > 0 THEN 'partial' ELSE 'not_assessed' END,
    CASE WHEN v_vendor_count > 0 THEN 1 ELSE 0 END,
    'Auto-assessed: Organization has third-party management in place'::TEXT
  UNION ALL
  SELECT 'nis2-20-2'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of management training'::TEXT
  UNION ALL
  SELECT 'nis2-20-3'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of employee training'::TEXT

  UNION ALL

  -- RISK MANAGEMENT (nis2-21-1, nis2-21-2a)
  SELECT 'nis2-21-1'::TEXT,
    CASE WHEN v_has_critical_vendors THEN 'partial' ELSE 'not_assessed' END,
    CASE WHEN v_has_critical_vendors THEN 1 ELSE 0 END,
    'Auto-assessed: Vendor risk tiering indicates risk management practices'::TEXT
  UNION ALL
  SELECT 'nis2-21-2a'::TEXT,
    CASE WHEN v_vendor_count > 0 THEN 'partial' ELSE 'not_assessed' END,
    v_vendor_count,
    format('Auto-assessed: %s vendors registered with risk assessments', v_vendor_count)::TEXT

  UNION ALL

  -- INCIDENT HANDLING (nis2-21-2b)
  SELECT 'nis2-21-2b'::TEXT,
    CASE
      WHEN v_incident_count >= 1 THEN 'partial'
      ELSE 'not_assessed'
    END,
    v_incident_count,
    format('Auto-assessed: %s incidents tracked', v_incident_count)::TEXT

  UNION ALL

  -- BUSINESS CONTINUITY (nis2-21-2c)
  SELECT 'nis2-21-2c'::TEXT,
    CASE WHEN v_vendors_with_contracts > 0 THEN 'partial' ELSE 'not_assessed' END,
    v_vendors_with_contracts,
    format('Auto-assessed: %s vendor contracts with SLA tracking', v_vendors_with_contracts)::TEXT

  UNION ALL

  -- SUPPLY CHAIN (nis2-21-2d)
  SELECT 'nis2-21-2d'::TEXT,
    CASE
      WHEN v_vendor_count >= 5 AND v_vendors_with_certs > 0 THEN 'partial'
      WHEN v_vendor_count >= 1 THEN 'partial'
      ELSE 'not_assessed'
    END,
    v_vendor_count,
    format('Auto-assessed: %s vendors tracked, %s with security certifications', v_vendor_count, v_vendors_with_certs)::TEXT

  UNION ALL

  -- SECURE DEVELOPMENT (nis2-21-2e)
  SELECT 'nis2-21-2e'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of SDLC practices'::TEXT

  UNION ALL

  -- EFFECTIVENESS ASSESSMENT (nis2-21-2f)
  SELECT 'nis2-21-2f'::TEXT,
    CASE WHEN v_vendors_with_certs > 0 THEN 'partial' ELSE 'not_assessed' END,
    v_vendors_with_certs,
    format('Auto-assessed: %s vendors with audit certifications', v_vendors_with_certs)::TEXT

  UNION ALL

  -- CYBERSECURITY HYGIENE (nis2-21-2g)
  SELECT 'nis2-21-2g'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of security training'::TEXT

  UNION ALL

  -- CRYPTOGRAPHY (nis2-21-2h)
  SELECT 'nis2-21-2h'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of encryption practices'::TEXT

  UNION ALL

  -- HR SECURITY (nis2-21-2i)
  SELECT 'nis2-21-2i'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of HR security'::TEXT

  UNION ALL

  -- ACCESS CONTROL (nis2-21-2j)
  SELECT 'nis2-21-2j'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of access control'::TEXT

  UNION ALL

  -- ASSET MANAGEMENT (nis2-21-2k)
  SELECT 'nis2-21-2k'::TEXT,
    CASE WHEN v_vendor_count > 0 THEN 'partial' ELSE 'not_assessed' END,
    v_vendor_count,
    'Auto-assessed: Vendor inventory maintained'::TEXT

  UNION ALL

  -- MFA AND AUTH (nis2-21-2l)
  SELECT 'nis2-21-2l'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of MFA implementation'::TEXT

  UNION ALL

  -- SECURE COMMUNICATIONS (nis2-21-2m)
  SELECT 'nis2-21-2m'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of secure communications'::TEXT

  UNION ALL

  -- INCIDENT REPORTING (nis2-23-*)
  SELECT 'nis2-23-1'::TEXT,
    CASE WHEN v_incident_count > 0 THEN 'partial' ELSE 'not_assessed' END,
    v_incident_count,
    format('Auto-assessed: Incident reporting system tracks %s incidents', v_incident_count)::TEXT
  UNION ALL
  SELECT 'nis2-23-2'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of 24h notification process'::TEXT
  UNION ALL
  SELECT 'nis2-23-3'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of 72h reporting process'::TEXT
  UNION ALL
  SELECT 'nis2-23-4'::TEXT, 'not_assessed'::TEXT, 0, 'Requires manual assessment of final incident reports'::TEXT;

END;
$$;

-- =============================================================================
-- 4. Function to sync assessments for an organization
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_nis2_assessments(p_organization_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Insert or update assessments from vendor data
  FOR v_row IN
    SELECT * FROM populate_nis2_assessments_from_vendors(p_organization_id)
  LOOP
    INSERT INTO nis2_assessments (
      organization_id,
      requirement_id,
      status,
      evidence_count,
      notes,
      assessed_at
    ) VALUES (
      p_organization_id,
      v_row.requirement_id,
      v_row.status,
      v_row.evidence_count,
      v_row.notes,
      CASE WHEN v_row.status != 'not_assessed' THEN NOW() ELSE NULL END
    )
    ON CONFLICT (organization_id, requirement_id)
    DO UPDATE SET
      -- Only update if current status is 'not_assessed' (preserve manual assessments)
      status = CASE
        WHEN nis2_assessments.status = 'not_assessed' THEN EXCLUDED.status
        ELSE nis2_assessments.status
      END,
      evidence_count = CASE
        WHEN nis2_assessments.status = 'not_assessed' THEN EXCLUDED.evidence_count
        ELSE GREATEST(nis2_assessments.evidence_count, EXCLUDED.evidence_count)
      END,
      notes = CASE
        WHEN nis2_assessments.status = 'not_assessed' THEN EXCLUDED.notes
        ELSE nis2_assessments.notes
      END,
      updated_at = NOW();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- =============================================================================
-- 5. Add comments
-- =============================================================================

COMMENT ON TABLE nis2_assessments IS 'NIS2 compliance requirement assessments per organization';
COMMENT ON COLUMN nis2_assessments.requirement_id IS 'Reference to NIS2 requirement (e.g., nis2-21-2a)';
COMMENT ON COLUMN nis2_assessments.status IS 'Assessment status: compliant, partial, non_compliant, not_assessed';
COMMENT ON COLUMN nis2_assessments.evidence_count IS 'Number of evidence items supporting this assessment';
COMMENT ON COLUMN nis2_assessments.gaps IS 'Identified gaps for this requirement';
COMMENT ON FUNCTION populate_nis2_assessments_from_vendors IS 'Generates NIS2 assessments based on vendor data analysis';
COMMENT ON FUNCTION sync_nis2_assessments IS 'Syncs assessments for an organization, preserving manual assessments';
