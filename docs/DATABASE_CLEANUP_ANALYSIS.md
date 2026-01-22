# Database Cleanup Analysis Report

**Date:** January 22, 2026
**Current Tables:** 75
**Current Views:** 10
**Current Functions:** 60

---

## Executive Summary

After comprehensive analysis of the database schema and codebase cross-references:

| Category | Count | Action |
|----------|-------|--------|
| Tables to DELETE | 6 | Zero code refs, zero rows |
| Views to DELETE | 4 | Zero code refs |
| Functions to DELETE | 5 | Zero code refs (triggers only) |
| Tables to KEEP (with data) | 46 | Actively used |
| Tables to KEEP (empty, feature-ready) | 23 | Have code references |

**Net Result:** 75 → 69 tables (8% reduction)

---

## Tables Analysis

### TIER 1: DELETE - Zero Code References & Zero Rows (6 tables)

| Table | Rows | Code Refs | Migration | Notes |
|-------|------|-----------|-----------|-------|
| `nis2_control_evidence` | 0 | 0 | 019 | Created for NIS2 control evidence, never integrated |
| `risk_scores` | 0 | 0 | 009 | Superseded by vendor_score_history |
| `roi_entries` | 0 | 0 | 003 | Original RoI entry table, never used |
| `roi_exports` | 0 | 0 | 003 | Export tracking, never implemented |
| `roi_population_log` | 0 | 0 | 012 | Population logging, never integrated |
| `roi_progress_history` | 0 | 0 | 003 | Progress history, superseded by activity_log |

**Impact:** ZERO - No code dependencies, no data loss

---

### TIER 2: KEEP - Empty but Feature-Ready (23 tables)

These tables have code references and support existing or planned features:

| Table | Code Refs | Feature |
|-------|-----------|---------|
| `api_keys` | 5 | API key management |
| `contact_requests` | 1 | Contact form submissions |
| `intra_group_arrangements` | 1 | RoI B_07.01 template |
| `monitoring_alerts` | 9 | Vendor monitoring alerts |
| `nis2_controls` | 8 | NIS2 control library |
| `nis2_risk_assessments` | 2 | NIS2 risk assessments |
| `nis2_risk_controls` | 7 | Risk-control mappings |
| `nis2_risks` | 9 | NIS2 risk register |
| `organization_framework_entitlements` | 2 | Framework licensing |
| `organization_invitations` | 13 | Team invitations |
| `parsed_iso27001` | 3 | ISO 27001 parsing |
| `roi_onboarding_progress` | 7 | RoI wizard progress |
| `roi_submission_comments` | 2 | RoI submission feedback |
| `roi_submissions` | 13 | RoI submissions |
| `soc2_roi_extracted_fields` | 1 | SOC2→RoI field extraction |
| `test_findings` | 7 | Resilience test findings |
| `testing_documents` | 3 | Test documentation |
| `testing_programmes` | 8 | Testing programs |
| `vendor_certifications` | 15 | Vendor certifications |
| `vendor_framework_compliance` | 3 | Framework compliance |
| `webhook_configs` | 11 | Webhook management |
| `webhook_deliveries` | 7 | Webhook delivery logs |

---

### TIER 3: KEEP - Tables With Data (46 tables)

All actively used with row counts:

| Table | Rows | Purpose |
|-------|------|---------|
| `activity_log` | 67 | Central audit trail |
| `auth_audit_log` | 41 | Auth events |
| `contract_contacts` | 4 | RoI contract contacts |
| `contracts` | 3 | Vendor contracts |
| `critical_functions` | 11 | Critical business functions |
| `documents` | 9 | Uploaded documents |
| `dora_control_mappings` | 33 | DORA article mappings |
| `dora_requirements` | 20 | DORA requirements |
| `evidence_audit_log` | 1236 | Evidence changes |
| `evidence_locations` | 172 | Evidence tracking |
| `extraction_jobs` | 1 | AI extraction jobs |
| `framework_controls` | 21 | Framework controls |
| `framework_modules` | 24 | Framework modules |
| `frameworks` | 6 | Compliance frameworks |
| `function_service_mapping` | 13 | RoI function-service mapping |
| `ict_services` | 7 | ICT service inventory |
| `incident_events` | 6 | Incident timeline |
| `incident_reports` | 9 | Regulatory reports |
| `incidents` | 3 | ICT incidents |
| `login_attempts` | 2 | Rate limiting |
| `maturity_change_log` | 4 | Maturity history |
| `maturity_snapshot_settings` | 1 | Snapshot config |
| `maturity_snapshots` | 8 | Maturity snapshots |
| `nis2_ai_extractions` | 7 | AI extractions |
| `nis2_assessments` | 21 | NIS2 assessments |
| `nis2_questionnaire_answers` | 29 | Questionnaire responses |
| `nis2_questionnaire_documents` | 5 | Uploaded questionnaire docs |
| `nis2_questionnaire_templates` | 2 | Question templates |
| `nis2_template_questions` | 114 | Template questions |
| `nis2_vendor_questionnaires` | 2 | Vendor questionnaires |
| `notifications` | 4 | User notifications |
| `organization_branches` | 3 | Org branches |
| `organizations` | 1 | Organizations |
| `parsed_contracts` | 1 | Parsed contract data |
| `parsed_soc2` | 1 | Parsed SOC2 data |
| `resilience_tests` | 3 | Resilience tests |
| `service_data_locations` | 10 | Data locations (RoI) |
| `soc2_roi_mappings` | 1 | SOC2→RoI mappings |
| `soc2_to_dora_mapping` | 17 | SOC2→DORA mappings |
| `subcontractors` | 6 | Vendor subcontractors |
| `tlpt_engagements` | 2 | TLPT tracking |
| `users` | 3 | User profiles |
| `vendor_audit_log` | 5 | Vendor changes |
| `vendor_contacts` | 5 | Vendor contacts |
| `vendor_control_assessments` | 6 | Control assessments |
| `vendor_score_history` | 1 | Score history |
| `vendors` | 17 | Vendors |

---

## Views Analysis

### DELETE - Zero Code References (4 views)

| View | Code Refs | Notes |
|------|-----------|-------|
| `incident_stats` | 0 | Statistics computed in code instead |
| `incidents_with_overdue_reports` | 0 | Not used, check done in code |
| `nis2_controls_with_risks` | 0 | Never integrated into UI |
| `nis2_risks_with_controls` | 0 | Never integrated into UI |

### KEEP - Used Views (6 views)

| View | Code Refs | Purpose |
|------|-----------|---------|
| `nis2_org_risk_summary` | 1 | Risk dashboard |
| `nis2_questionnaire_stats` | 1 | Questionnaire metrics |
| `nis2_questionnaire_summary` | 2 | Questionnaire overview |
| `open_findings_summary` | 2 | Test findings summary |
| `testing_programme_stats` | 2 | Testing statistics |
| `tlpt_compliance_status` | 1 | TLPT status |

---

## Functions Analysis

### Potentially Unused Functions (5 functions)

These have zero code references but may be used as triggers:

| Function | Code Refs | Type | Notes |
|----------|-----------|------|-------|
| `mark_gap_analysis_stale` | 0 | Trigger | Gap analysis marking |
| `log_roi_data_change` | 0 | Trigger | RoI change logging |
| `record_roi_progress_snapshot` | 0 | Trigger | Progress snapshots |
| `get_soc2_roi_mapping_stats` | 0 | Query | Mapping statistics |
| `update_vendor_enrichment_updated_at` | 0 | Trigger | Timestamp update |

**Recommendation:** Keep triggers, review standalone functions

---

## Consolidation Opportunities

### 1. Audit Log Tables (5 tables → Consider 1)

Current:
- `activity_log` (67 rows) - General events
- `auth_audit_log` (41 rows) - Auth events
- `evidence_audit_log` (1236 rows) - Evidence changes
- `vendor_audit_log` (5 rows) - Vendor changes
- `maturity_change_log` (4 rows) - Maturity changes

**Analysis:** These serve different purposes with different schemas. `activity_log` is the central audit trail. Others track specific entity changes. **Consolidation not recommended** due to different structures and query patterns.

### 2. ROI Tables (7 tables → 4)

Current empty/unused:
- `roi_entries` (0 rows, 0 refs) → DELETE
- `roi_exports` (0 rows, 0 refs) → DELETE
- `roi_population_log` (0 rows, 0 refs) → DELETE
- `roi_progress_history` (0 rows, 0 refs) → DELETE

Keep:
- `roi_onboarding_progress` (7 refs)
- `roi_submission_comments` (2 refs)
- `roi_submissions` (13 refs)

### 3. Score Tables

- `risk_scores` (0 rows, 0 refs) → DELETE
- `vendor_score_history` (1 row, 6 refs) → KEEP

---

## Cleanup Migration Plan

```sql
-- Migration: 030_database_optimization.sql

-- =============================================================================
-- Phase 1: Drop unused tables (6 tables)
-- =============================================================================

DROP TABLE IF EXISTS nis2_control_evidence CASCADE;
DROP TABLE IF EXISTS risk_scores CASCADE;
DROP TABLE IF EXISTS roi_entries CASCADE;
DROP TABLE IF EXISTS roi_exports CASCADE;
DROP TABLE IF EXISTS roi_population_log CASCADE;
DROP TABLE IF EXISTS roi_progress_history CASCADE;

-- =============================================================================
-- Phase 2: Drop unused views (4 views)
-- =============================================================================

DROP VIEW IF EXISTS incident_stats CASCADE;
DROP VIEW IF EXISTS incidents_with_overdue_reports CASCADE;
DROP VIEW IF EXISTS nis2_controls_with_risks CASCADE;
DROP VIEW IF EXISTS nis2_risks_with_controls CASCADE;

-- =============================================================================
-- Phase 3: Drop unused functions (2 standalone functions)
-- =============================================================================

DROP FUNCTION IF EXISTS get_soc2_roi_mapping_stats() CASCADE;
DROP FUNCTION IF EXISTS record_roi_progress_snapshot() CASCADE;
```

---

## Final Recommendations

1. **Execute cleanup migration** to remove 6 unused tables, 4 unused views
2. **Keep all feature-ready tables** - they support planned functionality
3. **Do not consolidate audit tables** - different purposes, different schemas
4. **Monitor webhook_* tables** - if webhooks feature not launched, consider removal
5. **Review NIS2 risk tables** - empty but have active code, decide on feature priority

**Post-cleanup table count:** 75 - 6 = **69 tables**
