-- Migration: 040_remediation_workflow
-- Description: Remediation Plans and Actions for gap closure
-- Created: 2026-01-23

-- ============================================
-- REMEDIATION PLANS
-- ============================================

CREATE TABLE IF NOT EXISTS remediation_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Plan identification
  plan_ref TEXT NOT NULL, -- e.g., "REM-2026-001"
  title TEXT NOT NULL,
  description TEXT,

  -- Source/trigger of the plan
  source_type TEXT NOT NULL CHECK (source_type IN (
    'vendor_assessment', 'nis2_risk', 'dora_gap', 'audit_finding',
    'questionnaire', 'incident', 'manual'
  )),
  source_id UUID, -- Reference to the source entity

  -- Vendor association (optional - for vendor-specific plans)
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- Framework association
  framework TEXT CHECK (framework IN ('nis2', 'dora', 'iso27001', 'soc2', 'gdpr', 'general')),

  -- Status and workflow
  status TEXT NOT NULL CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'in_progress',
    'on_hold', 'completed', 'cancelled'
  )) DEFAULT 'draft',

  -- Priority and risk
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  -- Timeline
  target_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Ownership
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- Progress tracking
  total_actions INTEGER DEFAULT 0,
  completed_actions INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,

  -- Budget tracking (optional)
  estimated_cost DECIMAL(18,2),
  actual_cost DECIMAL(18,2),
  cost_currency TEXT DEFAULT 'EUR',

  -- Metadata
  tags TEXT[],
  notes TEXT,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_remediation_plans_org ON remediation_plans(organization_id);
CREATE INDEX idx_remediation_plans_vendor ON remediation_plans(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_remediation_plans_status ON remediation_plans(status);
CREATE INDEX idx_remediation_plans_priority ON remediation_plans(priority) WHERE priority IN ('high', 'critical');
CREATE INDEX idx_remediation_plans_owner ON remediation_plans(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_remediation_plans_source ON remediation_plans(source_type, source_id);
CREATE UNIQUE INDEX idx_remediation_plans_ref ON remediation_plans(organization_id, plan_ref);

-- ============================================
-- REMEDIATION ACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS remediation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES remediation_plans(id) ON DELETE CASCADE,

  -- Action identification
  action_ref TEXT NOT NULL, -- e.g., "REM-2026-001-A01"
  title TEXT NOT NULL,
  description TEXT,

  -- Categorization
  action_type TEXT NOT NULL CHECK (action_type IN (
    'policy_update', 'technical_control', 'process_change', 'training',
    'documentation', 'vendor_engagement', 'audit', 'assessment',
    'procurement', 'configuration', 'monitoring', 'other'
  )),

  -- Status and workflow (Kanban states)
  status TEXT NOT NULL CHECK (status IN (
    'backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'completed', 'cancelled'
  )) DEFAULT 'backlog',
  blocked_reason TEXT,

  -- Priority and ordering
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  sort_order INTEGER DEFAULT 0,

  -- Timeline
  due_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),

  -- Assignment
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Verification
  requires_evidence BOOLEAN DEFAULT FALSE,
  evidence_description TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_notes TEXT,

  -- Control/requirement mapping
  control_id UUID, -- Reference to dora_controls or nis2_controls
  requirement_reference TEXT, -- e.g., "DORA Art. 5(2)(a)"

  -- Dependencies
  depends_on UUID[], -- Array of action IDs this depends on

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_remediation_actions_org ON remediation_actions(organization_id);
CREATE INDEX idx_remediation_actions_plan ON remediation_actions(plan_id);
CREATE INDEX idx_remediation_actions_status ON remediation_actions(status);
CREATE INDEX idx_remediation_actions_assignee ON remediation_actions(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_remediation_actions_due ON remediation_actions(due_date) WHERE due_date IS NOT NULL;
CREATE UNIQUE INDEX idx_remediation_actions_ref ON remediation_actions(organization_id, action_ref);

-- ============================================
-- REMEDIATION ACTION COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS remediation_action_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL REFERENCES remediation_actions(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  comment_type TEXT CHECK (comment_type IN ('comment', 'status_change', 'assignment', 'system')) DEFAULT 'comment',

  -- For status changes
  old_status TEXT,
  new_status TEXT,

  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_remediation_comments_action ON remediation_action_comments(action_id);

-- ============================================
-- REMEDIATION EVIDENCE LINKS
-- ============================================

CREATE TABLE IF NOT EXISTS remediation_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES remediation_actions(id) ON DELETE CASCADE,

  -- Evidence source
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'document', 'screenshot', 'url', 'attestation', 'report', 'other'
  )),

  -- For document evidence
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

  -- For URL/external evidence
  external_url TEXT,

  -- For attestation/manual evidence
  attestation_text TEXT,

  -- Metadata
  title TEXT NOT NULL,
  description TEXT,

  -- Verification
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,

  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_remediation_evidence_action ON remediation_evidence(action_id);
CREATE INDEX idx_remediation_evidence_document ON remediation_evidence(document_id) WHERE document_id IS NOT NULL;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update plan progress when actions change
CREATE OR REPLACE FUNCTION update_plan_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_progress DECIMAL(5,2);
BEGIN
  -- Get action counts for the plan
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total, v_completed
  FROM remediation_actions
  WHERE plan_id = COALESCE(NEW.plan_id, OLD.plan_id);

  -- Calculate progress
  IF v_total > 0 THEN
    v_progress := (v_completed::DECIMAL / v_total) * 100;
  ELSE
    v_progress := 0;
  END IF;

  -- Update the plan
  UPDATE remediation_plans
  SET
    total_actions = v_total,
    completed_actions = v_completed,
    progress_percentage = v_progress,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.plan_id, OLD.plan_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_plan_progress
AFTER INSERT OR UPDATE OR DELETE ON remediation_actions
FOR EACH ROW EXECUTE FUNCTION update_plan_progress();

-- Auto-update timestamps
CREATE TRIGGER trg_remediation_plans_updated
BEFORE UPDATE ON remediation_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_remediation_actions_updated
BEFORE UPDATE ON remediation_actions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE remediation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_action_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_evidence ENABLE ROW LEVEL SECURITY;

-- Remediation Plans Policies
CREATE POLICY "Users can view remediation plans in their organization"
  ON remediation_plans FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create remediation plans in their organization"
  ON remediation_plans FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update remediation plans in their organization"
  ON remediation_plans FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete remediation plans in their organization"
  ON remediation_plans FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Remediation Actions Policies
CREATE POLICY "Users can view remediation actions in their organization"
  ON remediation_actions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create remediation actions in their organization"
  ON remediation_actions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update remediation actions in their organization"
  ON remediation_actions FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete remediation actions in their organization"
  ON remediation_actions FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Comments Policies
CREATE POLICY "Users can view comments on actions in their organization"
  ON remediation_action_comments FOR SELECT
  USING (
    action_id IN (
      SELECT id FROM remediation_actions WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments on actions in their organization"
  ON remediation_action_comments FOR INSERT
  WITH CHECK (
    action_id IN (
      SELECT id FROM remediation_actions WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Evidence Policies
CREATE POLICY "Users can view evidence in their organization"
  ON remediation_evidence FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create evidence in their organization"
  ON remediation_evidence FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update evidence in their organization"
  ON remediation_evidence FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete evidence in their organization"
  ON remediation_evidence FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate next plan reference
CREATE OR REPLACE FUNCTION generate_plan_ref(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COUNT(*) + 1 INTO v_count
  FROM remediation_plans
  WHERE organization_id = p_org_id
    AND plan_ref LIKE 'REM-' || v_year || '-%';

  RETURN 'REM-' || v_year || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate next action reference
CREATE OR REPLACE FUNCTION generate_action_ref(p_plan_ref TEXT, p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM remediation_actions ra
  JOIN remediation_plans rp ON ra.plan_id = rp.id
  WHERE rp.plan_ref = p_plan_ref
    AND rp.organization_id = p_org_id;

  RETURN p_plan_ref || '-A' || LPAD(v_count::TEXT, 2, '0');
END;
$$ LANGUAGE plpgsql;
