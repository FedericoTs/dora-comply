-- Migration: 017_framework_licensing
-- Description: Add licensing infrastructure for modular framework support
-- Created: 2025-01-15

-- ============================================
-- ADD LICENSING COLUMNS TO ORGANIZATIONS
-- ============================================
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS license_tier TEXT DEFAULT 'starter'
  CHECK (license_tier IN ('starter', 'professional', 'enterprise', 'trial')),
ADD COLUMN IF NOT EXISTS licensed_frameworks TEXT[] DEFAULT ARRAY['nis2']::TEXT[],
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'active'
  CHECK (billing_status IN ('active', 'past_due', 'canceled', 'trialing'));

-- Index for license lookups
CREATE INDEX IF NOT EXISTS idx_organizations_license_tier ON organizations(license_tier);

-- ============================================
-- ORGANIZATION FRAMEWORK ENTITLEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS organization_framework_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL CHECK (framework IN ('dora', 'nis2', 'gdpr', 'iso27001')),
  enabled BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  modules_enabled JSONB DEFAULT '{
    "dashboard": true,
    "scoring": true,
    "gaps": true,
    "reports": true
  }'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, framework)
);

-- Enable RLS
ALTER TABLE organization_framework_entitlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own org entitlements"
  ON organization_framework_entitlements FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can modify own org entitlements"
  ON organization_framework_entitlements FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_org_framework_entitlements_org
  ON organization_framework_entitlements(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_framework_entitlements_framework
  ON organization_framework_entitlements(framework);

-- ============================================
-- FRAMEWORK MODULES DEFINITION (SEED DATA)
-- ============================================
CREATE TABLE IF NOT EXISTS framework_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework TEXT NOT NULL CHECK (framework IN ('dora', 'nis2', 'gdpr', 'iso27001')),
  module_code TEXT NOT NULL,
  module_name TEXT NOT NULL,
  description TEXT,
  min_tier TEXT DEFAULT 'starter' CHECK (min_tier IN ('starter', 'professional', 'enterprise')),
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(framework, module_code)
);

-- Enable RLS (read-only for all)
ALTER TABLE framework_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read framework modules"
  ON framework_modules FOR SELECT
  USING (true);

-- ============================================
-- SEED FRAMEWORK MODULES DATA
-- ============================================
INSERT INTO framework_modules (framework, module_code, module_name, description, min_tier, is_premium) VALUES
-- NIS2 Modules (Starter tier)
('nis2', 'dashboard', 'NIS2 Dashboard', 'Compliance overview and scoring', 'starter', false),
('nis2', 'scoring', 'Compliance Scoring', 'Automated NIS2 compliance assessment', 'starter', false),
('nis2', 'gaps', 'Gap Analysis', 'Identify compliance gaps', 'starter', false),
('nis2', 'reports', 'Compliance Reports', 'Generate NIS2 compliance reports', 'starter', false),
('nis2', 'incidents', 'Incident Reporting', 'NIS2 incident notification workflow', 'professional', true),

-- DORA Modules (Professional tier)
('dora', 'dashboard', 'DORA Dashboard', 'DORA compliance overview', 'professional', false),
('dora', 'scoring', 'Maturity Scoring', 'L0-L4 maturity assessment', 'professional', false),
('dora', 'gaps', 'Gap Analysis', 'DORA gap identification', 'professional', false),
('dora', 'roi', 'Register of Information', 'ESA RoI templates (15)', 'professional', true),
('dora', 'incidents', 'ICT Incidents', 'Article 19 incident reporting', 'professional', true),
('dora', 'testing', 'Resilience Testing', 'TLPT management', 'professional', true),
('dora', 'tprm', 'Third Party Risk', 'ICT concentration risk', 'professional', true),
('dora', 'reports', 'Board Reports', 'Executive compliance reports', 'professional', false),

-- GDPR Modules (Enterprise tier)
('gdpr', 'dashboard', 'GDPR Dashboard', 'GDPR compliance overview', 'enterprise', false),
('gdpr', 'scoring', 'Compliance Scoring', 'Risk-based assessment', 'enterprise', false),
('gdpr', 'dpia', 'DPIA Tool', 'Data Protection Impact Assessments', 'enterprise', true),
('gdpr', 'breach', 'Breach Management', '72-hour breach notification', 'enterprise', true),
('gdpr', 'consent', 'Consent Management', 'Track consent records', 'enterprise', true),
('gdpr', 'reports', 'GDPR Reports', 'Compliance documentation', 'enterprise', false),

-- ISO 27001 Modules (Enterprise tier)
('iso27001', 'dashboard', 'ISMS Dashboard', 'ISO 27001 overview', 'enterprise', false),
('iso27001', 'scoring', 'Control Assessment', 'Control implementation status', 'enterprise', false),
('iso27001', 'soa', 'Statement of Applicability', 'Generate SoA document', 'enterprise', true),
('iso27001', 'audit', 'Audit Preparation', 'Internal audit toolkit', 'enterprise', true),
('iso27001', 'reports', 'Certification Reports', 'Audit-ready documentation', 'enterprise', false)
ON CONFLICT (framework, module_code) DO UPDATE SET
  module_name = EXCLUDED.module_name,
  description = EXCLUDED.description,
  min_tier = EXCLUDED.min_tier,
  is_premium = EXCLUDED.is_premium;

-- ============================================
-- HELPER FUNCTION: Check Module Access
-- ============================================
CREATE OR REPLACE FUNCTION check_module_access(
  p_organization_id UUID,
  p_framework TEXT,
  p_module TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_enabled BOOLEAN;
  v_modules JSONB;
BEGIN
  SELECT
    enabled,
    modules_enabled
  INTO v_enabled, v_modules
  FROM organization_framework_entitlements
  WHERE organization_id = p_organization_id
    AND framework = p_framework;

  IF NOT FOUND OR NOT v_enabled THEN
    RETURN false;
  END IF;

  RETURN COALESCE(v_modules->p_module, 'false')::TEXT::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
