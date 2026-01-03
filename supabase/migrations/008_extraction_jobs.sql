-- ============================================
-- Migration 008: Create extraction_jobs table for async parsing
-- ============================================
-- This table tracks SOC 2 document parsing jobs that run asynchronously
-- on Modal.com, enabling real-time progress updates via Supabase Realtime.

-- Create extraction_jobs table
CREATE TABLE IF NOT EXISTS extraction_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'analyzing', 'extracting', 'verifying', 'mapping', 'complete', 'failed')),
  progress_percentage INTEGER NOT NULL DEFAULT 0
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

  -- Phase details for UI display
  current_phase TEXT,
  current_message TEXT,

  -- Extraction statistics
  expected_controls INTEGER,
  extracted_controls INTEGER,
  chunks_total INTEGER,
  chunks_completed INTEGER,

  -- Strategy used (for analytics)
  extraction_strategy TEXT CHECK (extraction_strategy IN ('single_pass', 'two_pass', 'parallel')),
  api_calls_count INTEGER DEFAULT 0,

  -- Results
  parsed_soc2_id UUID REFERENCES parsed_soc2(id) ON DELETE SET NULL,
  error_message TEXT,

  -- Token usage tracking (for cost analysis)
  token_usage JSONB DEFAULT '{}',
  -- Structure: { "input": 13000, "output": 6500, "cached": 0 }

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate active jobs for same document
  UNIQUE(document_id, started_at)
);

-- Indexes for efficient querying
CREATE INDEX idx_extraction_jobs_document ON extraction_jobs(document_id);
CREATE INDEX idx_extraction_jobs_status ON extraction_jobs(status);
CREATE INDEX idx_extraction_jobs_org ON extraction_jobs(organization_id);
CREATE INDEX idx_extraction_jobs_active ON extraction_jobs(document_id, status)
  WHERE status NOT IN ('complete', 'failed');

-- Auto-update timestamp trigger
CREATE TRIGGER update_extraction_jobs_updated_at
  BEFORE UPDATE ON extraction_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view extraction jobs for documents in their organization
CREATE POLICY "Users can view org extraction jobs"
  ON extraction_jobs FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Users can create extraction jobs for documents in their organization
CREATE POLICY "Users can create org extraction jobs"
  ON extraction_jobs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- Service role can do everything (for Modal backend)
-- Note: Service role bypasses RLS by default, but explicit policy for clarity
CREATE POLICY "Service role full access"
  ON extraction_jobs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for live progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE extraction_jobs;

-- Add helpful comments
COMMENT ON TABLE extraction_jobs IS 'Tracks async SOC 2 document parsing jobs running on Modal.com';
COMMENT ON COLUMN extraction_jobs.status IS 'Job status: pending → analyzing → extracting → verifying → mapping → complete/failed';
COMMENT ON COLUMN extraction_jobs.extraction_strategy IS 'Strategy used: single_pass (1 API call), two_pass (cached), parallel (3-4 calls)';
COMMENT ON COLUMN extraction_jobs.token_usage IS 'Gemini API token usage for cost tracking';
