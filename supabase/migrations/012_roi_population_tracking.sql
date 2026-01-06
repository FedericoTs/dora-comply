-- RoI Population Tracking
-- Track which documents have been used to populate RoI templates

-- Create population log table
CREATE TABLE IF NOT EXISTS roi_population_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL, -- e.g., 'B_05.01'
  populated_at TIMESTAMPTZ DEFAULT NOW(),
  populated_by UUID REFERENCES users(id),
  fields_populated INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',

  -- Unique constraint per document/org/template
  UNIQUE(document_id, organization_id, template_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_roi_population_log_document ON roi_population_log(document_id);
CREATE INDEX IF NOT EXISTS idx_roi_population_log_org ON roi_population_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_roi_population_log_template ON roi_population_log(template_id);
CREATE INDEX IF NOT EXISTS idx_roi_population_log_populated_at ON roi_population_log(populated_at DESC);

-- Enable RLS
ALTER TABLE roi_population_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their organization's population logs"
  ON roi_population_log
  FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert population logs for their organization"
  ON roi_population_log
  FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their organization's population logs"
  ON roi_population_log
  FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Add soft delete support to key tables if not exists
-- Check and add deleted_at to vendors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE vendors ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_vendors_deleted_at ON vendors(deleted_at) WHERE deleted_at IS NULL;
  END IF;
END $$;

-- Check and add deleted_at to contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_contracts_deleted_at ON contracts(deleted_at) WHERE deleted_at IS NULL;
  END IF;
END $$;

-- Check and add deleted_at to ict_services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ict_services' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE ict_services ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_ict_services_deleted_at ON ict_services(deleted_at) WHERE deleted_at IS NULL;
  END IF;
END $$;

-- Check and add deleted_at to critical_functions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'critical_functions' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE critical_functions ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_critical_functions_deleted_at ON critical_functions(deleted_at) WHERE deleted_at IS NULL;
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE roi_population_log IS 'Tracks which documents have been used to populate RoI templates, preventing duplicate population';
