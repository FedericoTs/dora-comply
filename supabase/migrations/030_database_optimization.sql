-- =============================================================================
-- Migration: 030_database_optimization
-- Description: Remove unused tables, views, and functions to optimize database
-- Date: 2026-01-22
--
-- Analysis Summary:
-- - 6 tables with 0 rows AND 0 code references
-- - 4 views with 0 code references
-- - 2 standalone functions with 0 code references
-- =============================================================================

-- =============================================================================
-- Phase 1: Drop unused tables (6 tables, all have 0 rows)
-- =============================================================================

-- nis2_control_evidence: Created in migration 019, never integrated
-- No code references, no data
DROP TABLE IF EXISTS nis2_control_evidence CASCADE;

-- risk_scores: Created in migration 009, superseded by vendor_score_history
-- No code references, no data
DROP TABLE IF EXISTS risk_scores CASCADE;

-- roi_entries: Original RoI entry table from migration 003
-- Superseded by roi_submissions, no code references
DROP TABLE IF EXISTS roi_entries CASCADE;

-- roi_exports: Export tracking from migration 003
-- Never implemented, no code references
DROP TABLE IF EXISTS roi_exports CASCADE;

-- roi_population_log: Population logging from migration 012
-- Never integrated, no code references
DROP TABLE IF EXISTS roi_population_log CASCADE;

-- roi_progress_history: Progress history from migration 003
-- Superseded by activity_log, no code references
DROP TABLE IF EXISTS roi_progress_history CASCADE;

-- =============================================================================
-- Phase 2: Drop unused views (4 views)
-- =============================================================================

-- incident_stats: Statistics computed in application code instead
DROP VIEW IF EXISTS incident_stats CASCADE;

-- incidents_with_overdue_reports: Deadline checking done in application code
DROP VIEW IF EXISTS incidents_with_overdue_reports CASCADE;

-- nis2_controls_with_risks: Created in migration 019, never integrated into UI
DROP VIEW IF EXISTS nis2_controls_with_risks CASCADE;

-- nis2_risks_with_controls: Created in migration 019, never integrated into UI
DROP VIEW IF EXISTS nis2_risks_with_controls CASCADE;

-- =============================================================================
-- Phase 3: Drop unused standalone functions (2 functions)
-- These are not triggers and have no code references
-- =============================================================================

-- get_soc2_roi_mapping_stats: Query function, never called from code
DROP FUNCTION IF EXISTS get_soc2_roi_mapping_stats() CASCADE;

-- record_roi_progress_snapshot: Snapshot function, never called from code
DROP FUNCTION IF EXISTS record_roi_progress_snapshot() CASCADE;

-- =============================================================================
-- Phase 4: Add comments documenting cleanup
-- =============================================================================

COMMENT ON SCHEMA public IS 'Main application schema. Optimized on 2026-01-22: removed 6 unused tables, 4 unused views, 2 unused functions.';
