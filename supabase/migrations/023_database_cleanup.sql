-- Migration: 023_database_cleanup.sql
-- Purpose: Clean up unused database tables identified in the table audit
-- This migration removes truly unused tables and archives superseded tables

-- =============================================================================
-- Phase 1: Archive superseded tables (rename with _deprecated suffix)
-- These tables have 0 rows and no code references, but may have historical value
-- =============================================================================

-- vendor_dora_evidence: Superseded by generic evidence tables
ALTER TABLE IF EXISTS vendor_dora_evidence RENAME TO vendor_dora_evidence_deprecated;
COMMENT ON TABLE vendor_dora_evidence_deprecated IS 'DEPRECATED: This table was superseded by evidence_locations. Archived on 2026-01-21.';

-- dora_assessments: Superseded by vendor_control_assessments
ALTER TABLE IF EXISTS dora_assessments RENAME TO dora_assessments_deprecated;
COMMENT ON TABLE dora_assessments_deprecated IS 'DEPRECATED: This table was superseded by vendor_control_assessments. Archived on 2026-01-21.';

-- roi_data_history: Superseded by activity_log
ALTER TABLE IF EXISTS roi_data_history RENAME TO roi_data_history_deprecated;
COMMENT ON TABLE roi_data_history_deprecated IS 'DEPRECATED: This table was superseded by activity_log. Archived on 2026-01-21.';

-- =============================================================================
-- Phase 2: Delete truly unused tables (0 rows AND no code references)
-- =============================================================================

-- dora_requirement_criteria: Never implemented - testable criteria feature abandoned
DROP TABLE IF EXISTS dora_requirement_criteria CASCADE;

-- dora_article_mappings: Superseded by dora_control_mappings
DROP TABLE IF EXISTS dora_article_mappings CASCADE;

-- dora_remediation_tasks: Never implemented - remediation tracking not used
DROP TABLE IF EXISTS dora_remediation_tasks CASCADE;

-- framework_requirements: Superseded by dora_requirements
DROP TABLE IF EXISTS framework_requirements CASCADE;

-- framework_requirement_mappings: Never used - generic framework mapping abandoned
DROP TABLE IF EXISTS framework_requirement_mappings CASCADE;

-- organization_frameworks: Never used - framework assignment not implemented
DROP TABLE IF EXISTS organization_frameworks CASCADE;

-- organization_responsible_persons: RoI B_01.03 - no UI implemented
DROP TABLE IF EXISTS organization_responsible_persons CASCADE;

-- vendor_requirement_assessments: Superseded by vendor_control_assessments
DROP TABLE IF EXISTS vendor_requirement_assessments CASCADE;

-- vendor_entities: RoI B_02.03 - no UI implemented, code references removed
DROP TABLE IF EXISTS vendor_entities CASCADE;

-- vendor_enrichment_cache: Cache table - never populated
DROP TABLE IF EXISTS vendor_enrichment_cache CASCADE;

-- control_mappings: Superseded by specific soc2_to_dora_mapping
DROP TABLE IF EXISTS control_mappings CASCADE;

-- =============================================================================
-- Phase 3: Fix non-existent table references in migration 013
-- Remove indexes that reference vendor_subcontractors (table never created)
-- =============================================================================

DROP INDEX IF EXISTS idx_vendor_subcontractors_active;

-- =============================================================================
-- Summary:
-- - Archived: 3 tables (renamed to *_deprecated)
-- - Deleted: 11 tables
-- - Tables still active but with 0 rows (kept for future use):
--   * vendor_dora_compliance (code references exist)
--   * vendor_gap_analysis (code references exist)
--   * dora_evidence (code references exist)
-- =============================================================================
