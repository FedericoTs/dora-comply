-- Migration: 025_cleanup_remaining_tables.sql
-- Purpose: Clean up the final 3 unused tables that previously had code references
-- Code references have been removed, these tables can now be safely deleted

-- =============================================================================
-- Delete remaining unused tables (0 rows, code references removed)
-- =============================================================================

-- vendor_dora_compliance: Superseded by vendor_framework_compliance
-- Was used for DORA maturity tracking but never populated
-- Code updated to use null values for DORA maturity data
DROP TABLE IF EXISTS vendor_dora_compliance CASCADE;

-- vendor_gap_analysis: Superseded by vendor_framework_compliance.category_scores
-- Was used for framework-based vendor filtering but never populated
-- Code updated to skip framework filtering (returns all vendors)
DROP TABLE IF EXISTS vendor_gap_analysis CASCADE;

-- dora_evidence: Superseded by evidence_locations
-- Was used for manual DORA evidence tracking but never populated
-- UI updated to show "coming soon" message
DROP TABLE IF EXISTS dora_evidence CASCADE;

-- =============================================================================
-- Summary:
-- - Deleted: 3 tables (vendor_dora_compliance, vendor_gap_analysis, dora_evidence)
-- - Total tables cleaned up in 023 + 025: 14 deleted, 3 archived
-- =============================================================================
