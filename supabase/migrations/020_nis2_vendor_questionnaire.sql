-- ============================================================================
-- Migration: 020_nis2_vendor_questionnaire.sql
-- Description: NIS2 Vendor Questionnaire System
-- Date: January 2026
--
-- Creates tables for:
-- - Questionnaire Templates (nis2_questionnaire_templates)
-- - Template Questions (nis2_template_questions)
-- - Vendor Questionnaires (nis2_vendor_questionnaires)
-- - Questionnaire Answers (nis2_questionnaire_answers)
-- - Questionnaire Documents (nis2_questionnaire_documents)
-- - AI Extractions (nis2_ai_extractions)
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Questionnaire status enum
CREATE TYPE nis2_questionnaire_status AS ENUM (
  'draft',        -- Not yet sent
  'sent',         -- Sent to vendor, awaiting start
  'in_progress',  -- Vendor has started
  'submitted',    -- Vendor submitted responses
  'approved',     -- Company approved responses
  'rejected',     -- Company rejected, needs revision
  'expired'       -- Access token expired without submission
);

-- Answer source enum (tracks how answer was populated)
CREATE TYPE nis2_answer_source AS ENUM (
  'manual',           -- Vendor typed manually
  'ai_extracted',     -- AI filled, not yet confirmed
  'ai_confirmed',     -- AI filled, vendor confirmed
  'ai_modified'       -- AI filled, vendor modified
);

-- Question type enum
CREATE TYPE nis2_question_type AS ENUM (
  'text',             -- Short text input
  'textarea',         -- Long text input
  'select',           -- Single select dropdown
  'multiselect',      -- Multiple select
  'boolean',          -- Yes/No toggle
  'date',             -- Date picker
  'number',           -- Numeric input
  'file'              -- File upload
);

-- AI extraction status enum
CREATE TYPE nis2_extraction_status AS ENUM (
  'pending',          -- Queued for processing
  'processing',       -- Currently being processed
  'completed',        -- Successfully completed
  'failed'            -- Failed with error
);

-- ============================================================================
-- TABLE: nis2_questionnaire_templates (Reusable Templates)
-- ============================================================================

CREATE TABLE nis2_questionnaire_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,

  -- NIS2 Article 21 category mapping
  nis2_categories TEXT[] DEFAULT '{}',

  -- Template settings
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  estimated_completion_minutes INTEGER DEFAULT 30,

  -- Usage stats
  times_used INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(organization_id, name, version)
);

-- Indexes for templates
CREATE INDEX idx_nis2_questionnaire_templates_org ON nis2_questionnaire_templates(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nis2_questionnaire_templates_active ON nis2_questionnaire_templates(organization_id, is_active) WHERE deleted_at IS NULL;

-- ============================================================================
-- TABLE: nis2_template_questions (Questions within Templates)
-- ============================================================================

CREATE TABLE nis2_template_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES nis2_questionnaire_templates(id) ON DELETE CASCADE,

  -- Question details
  question_text TEXT NOT NULL,
  help_text TEXT,
  question_type nis2_question_type NOT NULL DEFAULT 'text',

  -- Question options (for select/multiselect types)
  options JSONB DEFAULT '[]', -- [{value: 'yes', label: 'Yes'}, ...]

  -- Validation
  is_required BOOLEAN DEFAULT true,
  validation_rules JSONB DEFAULT '{}', -- {minLength: 10, maxLength: 500, pattern: '^...'}

  -- AI extraction configuration
  ai_extraction_enabled BOOLEAN DEFAULT true,
  ai_extraction_keywords TEXT[] DEFAULT '{}', -- Keywords to look for in documents
  ai_extraction_prompt TEXT, -- Custom prompt for extraction
  ai_confidence_threshold NUMERIC(3,2) DEFAULT 0.60, -- Min confidence to auto-fill

  -- Categorization
  category TEXT NOT NULL, -- NIS2 Article 21 category
  subcategory TEXT,

  -- Ordering
  display_order INTEGER NOT NULL DEFAULT 0,
  section_title TEXT, -- Optional grouping header

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(template_id, display_order)
);

-- Indexes for template questions
CREATE INDEX idx_nis2_template_questions_template ON nis2_template_questions(template_id);
CREATE INDEX idx_nis2_template_questions_category ON nis2_template_questions(template_id, category);

-- ============================================================================
-- TABLE: nis2_vendor_questionnaires (Instances Sent to Vendors)
-- ============================================================================

CREATE TABLE nis2_vendor_questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES nis2_questionnaire_templates(id) ON DELETE RESTRICT,

  -- Access control (magic link)
  access_token UUID NOT NULL DEFAULT uuid_generate_v4(),
  token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

  -- Status tracking
  status nis2_questionnaire_status NOT NULL DEFAULT 'draft',

  -- Vendor contact
  vendor_email TEXT NOT NULL,
  vendor_name TEXT,
  vendor_contact_name TEXT,

  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  questions_total INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  questions_ai_filled INTEGER DEFAULT 0,

  -- Dates
  sent_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,

  -- Review
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,

  -- Due date
  due_date DATE,

  -- Reminders
  last_reminder_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(access_token)
);

-- Indexes for vendor questionnaires
CREATE INDEX idx_nis2_vendor_questionnaires_org ON nis2_vendor_questionnaires(organization_id);
CREATE INDEX idx_nis2_vendor_questionnaires_vendor ON nis2_vendor_questionnaires(vendor_id);
CREATE INDEX idx_nis2_vendor_questionnaires_status ON nis2_vendor_questionnaires(organization_id, status);
CREATE INDEX idx_nis2_vendor_questionnaires_token ON nis2_vendor_questionnaires(access_token) WHERE status NOT IN ('approved', 'rejected', 'expired');
CREATE INDEX idx_nis2_vendor_questionnaires_due ON nis2_vendor_questionnaires(organization_id, due_date) WHERE status NOT IN ('approved', 'rejected', 'expired');

-- ============================================================================
-- TABLE: nis2_questionnaire_answers (Vendor Responses)
-- ============================================================================

CREATE TABLE nis2_questionnaire_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES nis2_vendor_questionnaires(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES nis2_template_questions(id) ON DELETE CASCADE,

  -- Answer content
  answer_text TEXT,
  answer_json JSONB, -- For complex types (multiselect, structured data)

  -- Source tracking
  source nis2_answer_source NOT NULL DEFAULT 'manual',

  -- AI extraction metadata
  ai_confidence NUMERIC(3,2) CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
  ai_citation TEXT, -- Page/section reference
  ai_extraction_id UUID, -- Link to extraction job

  -- Vendor confirmation
  vendor_confirmed BOOLEAN DEFAULT false,
  vendor_confirmed_at TIMESTAMPTZ,

  -- Original AI value (if vendor modified)
  original_ai_answer TEXT,

  -- Review status (by company)
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(questionnaire_id, question_id)
);

-- Indexes for questionnaire answers
CREATE INDEX idx_nis2_questionnaire_answers_questionnaire ON nis2_questionnaire_answers(questionnaire_id);
CREATE INDEX idx_nis2_questionnaire_answers_source ON nis2_questionnaire_answers(questionnaire_id, source);
CREATE INDEX idx_nis2_questionnaire_answers_flagged ON nis2_questionnaire_answers(questionnaire_id, is_flagged) WHERE is_flagged = true;

-- ============================================================================
-- TABLE: nis2_questionnaire_documents (Vendor Uploaded Documents)
-- ============================================================================

CREATE TABLE nis2_questionnaire_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES nis2_vendor_questionnaires(id) ON DELETE CASCADE,

  -- Document reference
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

  -- Document metadata (stored separately for vendor portal access)
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,

  -- Document type classification
  document_type TEXT NOT NULL, -- 'soc2', 'iso27001', 'policy', 'certificate', 'other'
  document_type_other TEXT, -- If type is 'other'

  -- AI processing status
  ai_processed BOOLEAN DEFAULT false,
  ai_processed_at TIMESTAMPTZ,
  ai_extraction_id UUID,

  -- Metadata
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for questionnaire documents
CREATE INDEX idx_nis2_questionnaire_documents_questionnaire ON nis2_questionnaire_documents(questionnaire_id);
CREATE INDEX idx_nis2_questionnaire_documents_type ON nis2_questionnaire_documents(questionnaire_id, document_type);

-- ============================================================================
-- TABLE: nis2_ai_extractions (AI Extraction Jobs)
-- ============================================================================

CREATE TABLE nis2_ai_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES nis2_vendor_questionnaires(id) ON DELETE CASCADE,
  document_id UUID REFERENCES nis2_questionnaire_documents(id) ON DELETE SET NULL,

  -- Job status
  status nis2_extraction_status NOT NULL DEFAULT 'pending',

  -- Processing metadata
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- AI model info
  model_name TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  model_version TEXT,

  -- Results
  extracted_answers JSONB DEFAULT '[]', -- [{question_id, answer, confidence, citation}]
  extraction_summary JSONB DEFAULT '{}', -- {total_extracted, high_confidence_count, ...}

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for AI extractions
CREATE INDEX idx_nis2_ai_extractions_questionnaire ON nis2_ai_extractions(questionnaire_id);
CREATE INDEX idx_nis2_ai_extractions_status ON nis2_ai_extractions(status) WHERE status IN ('pending', 'processing');

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE nis2_questionnaire_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_template_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_vendor_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_questionnaire_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_questionnaire_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE nis2_ai_extractions ENABLE ROW LEVEL SECURITY;

-- nis2_questionnaire_templates policies
CREATE POLICY "Users can view their organization's templates"
  ON nis2_questionnaire_templates FOR SELECT
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Users can insert templates for their organization"
  ON nis2_questionnaire_templates FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their organization's templates"
  ON nis2_questionnaire_templates FOR UPDATE
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Users can delete their organization's templates"
  ON nis2_questionnaire_templates FOR DELETE
  USING (organization_id = get_user_organization_id());

-- nis2_template_questions policies (via template ownership)
CREATE POLICY "Users can view questions for their org templates"
  ON nis2_template_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nis2_questionnaire_templates t
      WHERE t.id = template_id
      AND t.organization_id = get_user_organization_id()
      AND t.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can insert questions for their org templates"
  ON nis2_template_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nis2_questionnaire_templates t
      WHERE t.id = template_id
      AND t.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can update questions for their org templates"
  ON nis2_template_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM nis2_questionnaire_templates t
      WHERE t.id = template_id
      AND t.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete questions for their org templates"
  ON nis2_template_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM nis2_questionnaire_templates t
      WHERE t.id = template_id
      AND t.organization_id = get_user_organization_id()
    )
  );

-- nis2_vendor_questionnaires policies
CREATE POLICY "Users can view their organization's questionnaires"
  ON nis2_vendor_questionnaires FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert questionnaires for their organization"
  ON nis2_vendor_questionnaires FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their organization's questionnaires"
  ON nis2_vendor_questionnaires FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete their organization's questionnaires"
  ON nis2_vendor_questionnaires FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Service role full access for vendor portal API routes
CREATE POLICY "Service role full access vendor questionnaires"
  ON nis2_vendor_questionnaires FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- nis2_questionnaire_answers policies (via questionnaire ownership)
CREATE POLICY "Users can view answers for their org questionnaires"
  ON nis2_questionnaire_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nis2_vendor_questionnaires q
      WHERE q.id = questionnaire_id
      AND q.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can manage answers for their org questionnaires"
  ON nis2_questionnaire_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM nis2_vendor_questionnaires q
      WHERE q.id = questionnaire_id
      AND q.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Service role full access questionnaire answers"
  ON nis2_questionnaire_answers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- nis2_questionnaire_documents policies (via questionnaire ownership)
CREATE POLICY "Users can view documents for their org questionnaires"
  ON nis2_questionnaire_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nis2_vendor_questionnaires q
      WHERE q.id = questionnaire_id
      AND q.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can manage documents for their org questionnaires"
  ON nis2_questionnaire_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM nis2_vendor_questionnaires q
      WHERE q.id = questionnaire_id
      AND q.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Service role full access questionnaire documents"
  ON nis2_questionnaire_documents FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- nis2_ai_extractions policies (via questionnaire ownership)
CREATE POLICY "Users can view extractions for their org questionnaires"
  ON nis2_ai_extractions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nis2_vendor_questionnaires q
      WHERE q.id = questionnaire_id
      AND q.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Service role full access ai extractions"
  ON nis2_ai_extractions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

CREATE TRIGGER update_nis2_questionnaire_templates_updated_at
  BEFORE UPDATE ON nis2_questionnaire_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nis2_template_questions_updated_at
  BEFORE UPDATE ON nis2_template_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nis2_vendor_questionnaires_updated_at
  BEFORE UPDATE ON nis2_vendor_questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nis2_questionnaire_answers_updated_at
  BEFORE UPDATE ON nis2_questionnaire_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nis2_ai_extractions_updated_at
  BEFORE UPDATE ON nis2_ai_extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update questionnaire progress
CREATE OR REPLACE FUNCTION update_questionnaire_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE nis2_vendor_questionnaires
  SET
    questions_answered = (
      SELECT COUNT(*) FROM nis2_questionnaire_answers
      WHERE questionnaire_id = NEW.questionnaire_id
      AND (answer_text IS NOT NULL OR answer_json IS NOT NULL)
    ),
    questions_ai_filled = (
      SELECT COUNT(*) FROM nis2_questionnaire_answers
      WHERE questionnaire_id = NEW.questionnaire_id
      AND source IN ('ai_extracted', 'ai_confirmed', 'ai_modified')
    ),
    progress_percentage = (
      SELECT CASE
        WHEN questions_total = 0 THEN 0
        ELSE ROUND(
          (SELECT COUNT(*) FROM nis2_questionnaire_answers
           WHERE questionnaire_id = NEW.questionnaire_id
           AND (answer_text IS NOT NULL OR answer_json IS NOT NULL))::NUMERIC
          / questions_total * 100
        )
      END
      FROM nis2_vendor_questionnaires
      WHERE id = NEW.questionnaire_id
    )
  WHERE id = NEW.questionnaire_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_questionnaire_progress
  AFTER INSERT OR UPDATE ON nis2_questionnaire_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_questionnaire_progress();

-- Function to validate access token
CREATE OR REPLACE FUNCTION validate_questionnaire_token(token UUID)
RETURNS TABLE (
  questionnaire_id UUID,
  organization_name TEXT,
  vendor_name TEXT,
  template_name TEXT,
  status nis2_questionnaire_status,
  is_valid BOOLEAN,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id as questionnaire_id,
    o.name as organization_name,
    v.name as vendor_name,
    t.name as template_name,
    q.status,
    CASE
      WHEN q.id IS NULL THEN false
      WHEN q.token_expires_at < NOW() THEN false
      WHEN q.status IN ('approved', 'rejected', 'expired') THEN false
      ELSE true
    END as is_valid,
    CASE
      WHEN q.id IS NULL THEN 'Invalid or expired access link'
      WHEN q.token_expires_at < NOW() THEN 'This questionnaire link has expired'
      WHEN q.status = 'approved' THEN 'This questionnaire has already been approved'
      WHEN q.status = 'rejected' THEN 'This questionnaire was rejected and needs to be resent'
      WHEN q.status = 'expired' THEN 'This questionnaire has expired'
      ELSE 'Access granted'
    END as message
  FROM nis2_vendor_questionnaires q
  LEFT JOIN organizations o ON o.id = q.organization_id
  LEFT JOIN vendors v ON v.id = q.vendor_id
  LEFT JOIN nis2_questionnaire_templates t ON t.id = q.template_id
  WHERE q.access_token = token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE nis2_questionnaire_templates
  SET times_used = times_used + 1
  WHERE id = NEW.template_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_template_usage
  AFTER INSERT ON nis2_vendor_questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_usage();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Questionnaire summary with progress
CREATE OR REPLACE VIEW nis2_questionnaire_summary AS
SELECT
  q.id,
  q.organization_id,
  q.vendor_id,
  q.template_id,
  q.status,
  q.vendor_email,
  q.vendor_name,
  q.progress_percentage,
  q.questions_total,
  q.questions_answered,
  q.questions_ai_filled,
  q.due_date,
  q.sent_at,
  q.submitted_at,
  q.created_at,
  v.name as vendor_company_name,
  t.name as template_name,
  CASE
    WHEN q.status = 'submitted' THEN 'Pending Review'
    WHEN q.due_date IS NOT NULL AND q.due_date < CURRENT_DATE AND q.status NOT IN ('approved', 'submitted') THEN 'Overdue'
    WHEN q.due_date IS NOT NULL AND q.due_date <= CURRENT_DATE + INTERVAL '7 days' AND q.status NOT IN ('approved', 'submitted') THEN 'Due Soon'
    ELSE NULL
  END as alert_status
FROM nis2_vendor_questionnaires q
LEFT JOIN vendors v ON v.id = q.vendor_id
LEFT JOIN nis2_questionnaire_templates t ON t.id = q.template_id;

-- View: Organization questionnaire stats
CREATE OR REPLACE VIEW nis2_questionnaire_stats AS
SELECT
  organization_id,
  COUNT(*) as total_questionnaires,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'submitted') as submitted_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
  AVG(progress_percentage) FILTER (WHERE status = 'in_progress') as avg_progress,
  AVG(questions_ai_filled::NUMERIC / NULLIF(questions_total, 0) * 100) FILTER (WHERE questions_total > 0) as avg_ai_fill_rate
FROM nis2_vendor_questionnaires
GROUP BY organization_id;

-- Grant access to views
GRANT SELECT ON nis2_questionnaire_summary TO authenticated;
GRANT SELECT ON nis2_questionnaire_stats TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE nis2_questionnaire_templates IS 'Reusable NIS2 questionnaire templates';
COMMENT ON TABLE nis2_template_questions IS 'Questions within questionnaire templates with AI extraction config';
COMMENT ON TABLE nis2_vendor_questionnaires IS 'Questionnaire instances sent to vendors via magic link';
COMMENT ON TABLE nis2_questionnaire_answers IS 'Vendor responses with source tracking (manual vs AI)';
COMMENT ON TABLE nis2_questionnaire_documents IS 'Documents uploaded by vendors for AI parsing';
COMMENT ON TABLE nis2_ai_extractions IS 'AI extraction jobs for document parsing';

COMMENT ON COLUMN nis2_vendor_questionnaires.access_token IS 'UUID token for magic link access (30-day default expiry)';
COMMENT ON COLUMN nis2_questionnaire_answers.ai_confidence IS 'AI confidence score 0-1, threshold 0.6 for auto-fill';
COMMENT ON COLUMN nis2_questionnaire_answers.ai_citation IS 'Page/section reference for AI-extracted answer';
COMMENT ON COLUMN nis2_template_questions.ai_extraction_keywords IS 'Keywords to search for in documents during AI extraction';
COMMENT ON COLUMN nis2_template_questions.ai_confidence_threshold IS 'Minimum confidence (0-1) required to auto-fill answer';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on enums
GRANT USAGE ON TYPE nis2_questionnaire_status TO authenticated;
GRANT USAGE ON TYPE nis2_answer_source TO authenticated;
GRANT USAGE ON TYPE nis2_question_type TO authenticated;
GRANT USAGE ON TYPE nis2_extraction_status TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION validate_questionnaire_token TO authenticated, anon;
