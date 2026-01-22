-- Migration: 028_remove_deprecated_tables.sql
-- Purpose: Final cleanup - remove deprecated tables that have been archived since 2026-01-21
-- All tables have 0 rows and no code references

-- =============================================================================
-- Remove deprecated tables (formerly archived, now safe to delete)
-- =============================================================================

-- dora_assessments_deprecated: Superseded by vendor_control_assessments
DROP TABLE IF EXISTS dora_assessments_deprecated CASCADE;

-- vendor_dora_evidence_deprecated: Superseded by evidence_locations
DROP TABLE IF EXISTS vendor_dora_evidence_deprecated CASCADE;

-- roi_data_history_deprecated: Superseded by activity_log
DROP TABLE IF EXISTS roi_data_history_deprecated CASCADE;

-- =============================================================================
-- Summary:
-- - Deleted: 3 deprecated tables
-- - Total tables after this cleanup: 74 active tables
-- =============================================================================
