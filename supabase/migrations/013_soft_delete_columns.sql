-- Migration: 013_soft_delete_columns.sql
-- Purpose: Add deleted_at columns for soft delete functionality
-- This ensures all tables that support row deletion have the deleted_at column
-- Note: Uses simple ALTER TABLE statements that are idempotent via IF NOT EXISTS pattern

-- ============================================================================
-- Add deleted_at columns to tables that support row operations
-- ============================================================================

-- organization_branches
ALTER TABLE organization_branches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ict_services
ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- vendors
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- vendor_subcontractors (if it exists)
ALTER TABLE vendor_subcontractors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- subcontractors (used by B_05.02 query)
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- critical_functions
ALTER TABLE critical_functions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================================
-- Create partial indexes for efficient queries (only non-deleted rows)
-- ============================================================================

-- Drop existing indexes if they exist (to make migration idempotent)
DROP INDEX IF EXISTS idx_organization_branches_active;
DROP INDEX IF EXISTS idx_contracts_active;
DROP INDEX IF EXISTS idx_ict_services_active;
DROP INDEX IF EXISTS idx_vendors_active;
DROP INDEX IF EXISTS idx_vendor_subcontractors_active;
DROP INDEX IF EXISTS idx_subcontractors_active;
DROP INDEX IF EXISTS idx_critical_functions_active;

-- Create partial indexes for non-deleted rows (commonly queried)
CREATE INDEX idx_organization_branches_active ON organization_branches(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_active ON contracts(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ict_services_active ON ict_services(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vendors_active ON vendors(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vendor_subcontractors_active ON vendor_subcontractors(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_subcontractors_active ON subcontractors(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_critical_functions_active ON critical_functions(organization_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- Comment: RLS policies already allow UPDATE via "Users can manage org X" policies
-- No additional RLS changes needed - the update({ deleted_at: ... }) will work
-- ============================================================================
