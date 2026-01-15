-- Migration: 018_vendor_framework_compliance
-- Description: Generic vendor framework compliance tracking (multi-framework support)
-- Created: 2025-01-15

-- ============================================
-- GENERIC VENDOR FRAMEWORK COMPLIANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vendor_framework_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL CHECK (framework IN ('dora', 'nis2', 'gdpr', 'iso27001')),

  -- Generic compliance metrics
  overall_score NUMERIC(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
  overall_status TEXT CHECK (overall_status IN (
    'compliant', 'partially_compliant', 'non_compliant', 'not_assessed', 'not_applicable'
  )) DEFAULT 'not_assessed',

  -- Framework-specific maturity data (flexible JSONB)
  -- DORA: { "level": 3, "pillar_scores": {...} }
  -- NIS2: { "compliant_count": 45, "total": 100 }
  -- GDPR: { "risk_level": "medium", "controls_implemented": 28 }
  -- ISO: { "implemented": 80, "documented": 75, "maintained": 60 }
  maturity_data JSONB DEFAULT '{}'::JSONB,

  -- Category/pillar breakdown
  category_scores JSONB DEFAULT '{}'::JSONB,

  -- Assessment tracking
  assessment_date TIMESTAMPTZ,
  assessed_by UUID REFERENCES profiles(id),
  assessment_method TEXT CHECK (assessment_method IN (
    'ai_parsing', 'manual', 'questionnaire', 'audit', 'certification'
  )),

  -- Evidence linkage
  evidence_document_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, organization_id, framework)
);

-- Enable RLS
ALTER TABLE vendor_framework_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own org vendor compliance"
  ON vendor_framework_compliance FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert own org vendor compliance"
  ON vendor_framework_compliance FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own org vendor compliance"
  ON vendor_framework_compliance FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete own org vendor compliance"
  ON vendor_framework_compliance FOR DELETE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Service role full access vendor_framework_compliance"
  ON vendor_framework_compliance FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vfc_vendor ON vendor_framework_compliance(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vfc_org ON vendor_framework_compliance(organization_id);
CREATE INDEX IF NOT EXISTS idx_vfc_framework ON vendor_framework_compliance(framework);
CREATE INDEX IF NOT EXISTS idx_vfc_org_framework ON vendor_framework_compliance(organization_id, framework);
CREATE INDEX IF NOT EXISTS idx_vfc_status ON vendor_framework_compliance(overall_status);

-- ============================================
-- VENDOR COMPLIANCE SUMMARY VIEW
-- ============================================
CREATE OR REPLACE VIEW vendor_compliance_summary AS
SELECT
  v.id AS vendor_id,
  v.name AS vendor_name,
  v.tier,
  v.status AS vendor_status,
  vfc.framework,
  vfc.overall_score,
  vfc.overall_status,
  vfc.maturity_data,
  vfc.category_scores,
  vfc.assessment_date,
  vfc.assessment_method,
  vfc.organization_id
FROM vendors v
LEFT JOIN vendor_framework_compliance vfc ON v.id = vfc.vendor_id
WHERE v.deleted_at IS NULL;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_vendor_framework_compliance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_framework_compliance_updated
  BEFORE UPDATE ON vendor_framework_compliance
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_framework_compliance_timestamp();

-- ============================================
-- MIGRATE EXISTING DORA DATA TO NEW TABLE
-- ============================================
INSERT INTO vendor_framework_compliance (
  vendor_id,
  organization_id,
  framework,
  overall_score,
  overall_status,
  maturity_data,
  category_scores,
  assessment_date,
  created_at,
  updated_at
)
SELECT
  vdc.vendor_id,
  vdc.organization_id,
  'dora' AS framework,
  -- Calculate overall score from maturity levels (each level is 0-4, so scale to 0-100)
  CASE
    WHEN vdc.overall_maturity_level IS NOT NULL
    THEN (vdc.overall_maturity_level::NUMERIC / 4) * 100
    ELSE COALESCE(
      (COALESCE(vdc.pillar_ict_risk_maturity, 0) +
       COALESCE(vdc.pillar_incident_maturity, 0) +
       COALESCE(vdc.pillar_testing_maturity, 0) +
       COALESCE(vdc.pillar_tprm_maturity, 0) +
       COALESCE(vdc.pillar_sharing_maturity, 0))::NUMERIC / 20 * 100,
      0
    )
  END AS overall_score,
  COALESCE(vdc.overall_readiness_status, 'not_assessed') AS overall_status,
  jsonb_build_object(
    'level', COALESCE(vdc.overall_maturity_level, 0),
    'pillar_scores', jsonb_build_object(
      'ict_risk', COALESCE(vdc.pillar_ict_risk_maturity, 0),
      'incident', COALESCE(vdc.pillar_incident_maturity, 0),
      'testing', COALESCE(vdc.pillar_testing_maturity, 0),
      'tprm', COALESCE(vdc.pillar_tprm_maturity, 0),
      'sharing', COALESCE(vdc.pillar_sharing_maturity, 0)
    ),
    'evidence_summary', COALESCE(vdc.evidence_summary, '{}'::JSONB),
    'critical_gaps', COALESCE(vdc.critical_gaps, ARRAY[]::TEXT[])
  ) AS maturity_data,
  jsonb_build_object(
    'ict_risk', COALESCE(vdc.pillar_ict_risk_maturity, 0) * 25,
    'incident', COALESCE(vdc.pillar_incident_maturity, 0) * 25,
    'testing', COALESCE(vdc.pillar_testing_maturity, 0) * 25,
    'tprm', COALESCE(vdc.pillar_tprm_maturity, 0) * 25,
    'sharing', COALESCE(vdc.pillar_sharing_maturity, 0) * 25
  ) AS category_scores,
  vdc.assessment_date,
  vdc.created_at,
  vdc.updated_at
FROM vendor_dora_compliance vdc
ON CONFLICT (vendor_id, organization_id, framework)
DO UPDATE SET
  overall_score = EXCLUDED.overall_score,
  overall_status = EXCLUDED.overall_status,
  maturity_data = EXCLUDED.maturity_data,
  category_scores = EXCLUDED.category_scores,
  assessment_date = EXCLUDED.assessment_date,
  updated_at = NOW();

-- ============================================
-- SET DEFAULT ENTITLEMENTS FOR EXISTING ORGS
-- ============================================
-- Grandfather existing organizations into Professional tier
INSERT INTO organization_framework_entitlements (
  organization_id,
  framework,
  enabled,
  modules_enabled
)
SELECT
  o.id,
  fw.framework,
  true,
  CASE fw.framework
    WHEN 'dora' THEN '{"dashboard": true, "scoring": true, "gaps": true, "roi": true, "incidents": true, "testing": true, "tprm": true, "reports": true}'::JSONB
    WHEN 'nis2' THEN '{"dashboard": true, "scoring": true, "gaps": true, "reports": true}'::JSONB
    ELSE '{"dashboard": true, "scoring": true, "gaps": true, "reports": true}'::JSONB
  END
FROM organizations o
CROSS JOIN (VALUES ('dora'), ('nis2')) AS fw(framework)
WHERE NOT EXISTS (
  SELECT 1 FROM organization_framework_entitlements ofe
  WHERE ofe.organization_id = o.id AND ofe.framework = fw.framework
);

-- Update existing orgs to Professional tier (grandfathered)
UPDATE organizations
SET
  license_tier = 'professional',
  licensed_frameworks = ARRAY['nis2', 'dora']::TEXT[]
WHERE license_tier IS NULL OR license_tier = 'starter';
