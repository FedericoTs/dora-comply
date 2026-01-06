-- Migration: 011_roi_ux_improvements
-- Description: Tables for RoI UX improvements (onboarding, progress tracking, submissions)
-- Date: 2026-01-06

-- ============================================================================
-- Onboarding Progress Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS roi_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Current step in the wizard (1-5)
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),

  -- Array of completed step numbers
  completed_steps INTEGER[] DEFAULT '{}',

  -- Wizard completion status
  is_complete BOOLEAN DEFAULT FALSE,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id)
);

-- RLS for onboarding progress
ALTER TABLE roi_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org onboarding progress"
  ON roi_onboarding_progress
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their org onboarding progress"
  ON roi_onboarding_progress
  FOR ALL
  USING (organization_id = get_user_organization_id());

-- Index for performance
CREATE INDEX idx_roi_onboarding_org ON roi_onboarding_progress(organization_id);

-- ============================================================================
-- Progress History Table (for pace analysis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS roi_progress_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Snapshot timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Overall metrics
  total_fields INTEGER NOT NULL DEFAULT 0,
  completed_fields INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,

  -- Per-template breakdown (JSON for flexibility)
  template_breakdown JSONB NOT NULL DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for progress history
ALTER TABLE roi_progress_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org progress history"
  ON roi_progress_history
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert their org progress history"
  ON roi_progress_history
  FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- Indexes for progress history
CREATE INDEX idx_roi_progress_org ON roi_progress_history(organization_id);
CREATE INDEX idx_roi_progress_recorded ON roi_progress_history(organization_id, recorded_at DESC);

-- ============================================================================
-- Submissions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS roi_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Submission metadata
  submission_name VARCHAR(255),
  submission_type VARCHAR(50) DEFAULT 'draft' CHECK (submission_type IN ('draft', 'test', 'production')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'submitted', 'rejected', 'superseded')),

  -- Validation state at time of submission
  validation_errors INTEGER DEFAULT 0,
  validation_warnings INTEGER DEFAULT 0,
  validation_score FLOAT,
  validation_report JSONB,

  -- Package information
  package_url TEXT,
  package_size_bytes BIGINT,
  package_checksum VARCHAR(64),

  -- ESA submission tracking
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  esa_confirmation_number VARCHAR(100),
  esa_response JSONB,

  -- Review workflow
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Notes and metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for submissions
ALTER TABLE roi_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org submissions"
  ON roi_submissions
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage their org submissions"
  ON roi_submissions
  FOR ALL
  USING (organization_id = get_user_organization_id());

-- Indexes for submissions
CREATE INDEX idx_roi_submissions_org ON roi_submissions(organization_id);
CREATE INDEX idx_roi_submissions_status ON roi_submissions(organization_id, status);
CREATE INDEX idx_roi_submissions_created ON roi_submissions(organization_id, created_at DESC);

-- ============================================================================
-- Submission Comments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS roi_submission_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES roi_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Comment content
  comment TEXT NOT NULL,

  -- Comment type for filtering
  comment_type VARCHAR(20) DEFAULT 'general' CHECK (comment_type IN ('general', 'approval', 'rejection', 'revision', 'question')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for submission comments (inherit from parent submission)
ALTER TABLE roi_submission_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their org submissions"
  ON roi_submission_comments
  FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM roi_submissions WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can add comments to their org submissions"
  ON roi_submission_comments
  FOR INSERT
  WITH CHECK (
    submission_id IN (
      SELECT id FROM roi_submissions WHERE organization_id = get_user_organization_id()
    )
  );

-- Index for comments
CREATE INDEX idx_roi_submission_comments ON roi_submission_comments(submission_id, created_at DESC);

-- ============================================================================
-- Update triggers
-- ============================================================================

-- Update timestamps trigger for onboarding
CREATE OR REPLACE FUNCTION update_roi_onboarding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_roi_onboarding_updated
  BEFORE UPDATE ON roi_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_roi_onboarding_timestamp();

-- Update timestamp for submissions
CREATE TRIGGER trigger_roi_submissions_updated
  BEFORE UPDATE ON roi_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper function to get or create onboarding progress
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_roi_onboarding(p_organization_id UUID)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Try to get existing
  SELECT id INTO v_id
  FROM roi_onboarding_progress
  WHERE organization_id = p_organization_id;

  -- Create if not exists
  IF v_id IS NULL THEN
    INSERT INTO roi_onboarding_progress (organization_id)
    VALUES (p_organization_id)
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to record progress snapshot
-- ============================================================================

CREATE OR REPLACE FUNCTION record_roi_progress_snapshot(
  p_organization_id UUID,
  p_total_fields INTEGER,
  p_completed_fields INTEGER,
  p_error_count INTEGER,
  p_warning_count INTEGER,
  p_template_breakdown JSONB
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO roi_progress_history (
    organization_id,
    total_fields,
    completed_fields,
    error_count,
    warning_count,
    template_breakdown
  )
  VALUES (
    p_organization_id,
    p_total_fields,
    p_completed_fields,
    p_error_count,
    p_warning_count,
    p_template_breakdown
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_or_create_roi_onboarding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_roi_progress_snapshot(UUID, INTEGER, INTEGER, INTEGER, INTEGER, JSONB) TO authenticated;
