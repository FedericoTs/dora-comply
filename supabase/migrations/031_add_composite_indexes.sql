-- =============================================================================
-- Migration: 031_add_composite_indexes
-- Description: Add composite indexes for common query patterns
-- Date: 2026-01-22
--
-- Analysis: Identified 122+ query patterns filtering by organization_id combined
-- with other columns. These indexes target the most frequently used patterns.
-- =============================================================================

-- =============================================================================
-- Vendors table - Most common queries filter by org + tier + status
-- Used in: vendor listing, dashboard stats, compliance views
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_vendors_org_tier_status
ON vendors(organization_id, tier, status)
WHERE deleted_at IS NULL;

-- Vendor name search with organization scope
CREATE INDEX IF NOT EXISTS idx_vendors_org_name
ON vendors(organization_id, name)
WHERE deleted_at IS NULL;

-- =============================================================================
-- Documents table - Filtered by vendor and type
-- Used in: vendor detail page, document listing, compliance checks
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_org_vendor_type
ON documents(organization_id, vendor_id, type)
WHERE deleted_at IS NULL;

-- =============================================================================
-- Incidents table - Dashboard and reporting queries
-- Used in: incident dashboard, stats, NIS2 reporting
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_incidents_org_status_classification
ON incidents(organization_id, status, classification);

-- Incident timeline queries
CREATE INDEX IF NOT EXISTS idx_incidents_org_detection
ON incidents(organization_id, detection_datetime DESC);

-- =============================================================================
-- Contracts table - Expiry monitoring and vendor contract lookup
-- Used in: contract expiry alerts, vendor detail, RoI
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_contracts_org_vendor_status
ON contracts(organization_id, vendor_id, status)
WHERE deleted_at IS NULL;

-- Contract expiry monitoring
CREATE INDEX IF NOT EXISTS idx_contracts_org_expiry_date
ON contracts(organization_id, expiry_date)
WHERE deleted_at IS NULL AND expiry_date IS NOT NULL;

-- =============================================================================
-- NIS2 Questionnaires - Portal access and progress tracking
-- Used in: questionnaire listing, vendor portal, progress reports
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_nis2_questionnaires_org_status
ON nis2_vendor_questionnaires(organization_id, status);

-- Token lookup for vendor portal
CREATE INDEX IF NOT EXISTS idx_nis2_questionnaires_token
ON nis2_vendor_questionnaires(access_token)
WHERE access_token IS NOT NULL;

-- =============================================================================
-- Activity Log - Audit trail queries
-- Used in: activity timeline, audit reports, change tracking
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_log_org_entity
ON activity_log(organization_id, entity_type, entity_id);

-- Recent activity queries
CREATE INDEX IF NOT EXISTS idx_activity_log_org_created
ON activity_log(organization_id, created_at DESC);

-- =============================================================================
-- Evidence Locations - Compliance evidence lookup
-- Used in: gap analysis, compliance reports, control mapping
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_evidence_org_doc_type
ON evidence_locations(organization_id, source_document_id, evidence_type);

-- =============================================================================
-- Add comments documenting index purposes
-- =============================================================================

COMMENT ON INDEX idx_vendors_org_tier_status IS 'Optimizes vendor listing queries with tier/status filters';
COMMENT ON INDEX idx_documents_org_vendor_type IS 'Optimizes vendor document queries';
COMMENT ON INDEX idx_incidents_org_status_classification IS 'Optimizes incident dashboard queries';
COMMENT ON INDEX idx_contracts_org_expiry_date IS 'Optimizes contract expiry monitoring';
COMMENT ON INDEX idx_nis2_questionnaires_token IS 'Optimizes vendor portal token lookup';
COMMENT ON INDEX idx_activity_log_org_created IS 'Optimizes activity timeline queries';
