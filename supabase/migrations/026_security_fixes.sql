-- Migration: 026_security_fixes.sql
-- Purpose: Fix security issues identified by database advisor
-- Fixes:
--   1. Enable RLS on login_attempts table (ERROR)
--   2. Convert 8 SECURITY DEFINER views to SECURITY INVOKER (ERROR)

-- =============================================================================
-- Fix 1: Enable RLS on login_attempts table
-- =============================================================================
-- This table tracks login attempts for rate limiting
-- Service role needs insert/select access, users should have no access

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Service role can insert login attempts (used by record_login_attempt function)
CREATE POLICY "Service role can insert login attempts"
  ON login_attempts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can read login attempts (used by check_login_rate_limit function)
CREATE POLICY "Service role can read login attempts"
  ON login_attempts
  FOR SELECT
  TO service_role
  USING (true);

-- Service role can delete old login attempts (for cleanup)
CREATE POLICY "Service role can delete login attempts"
  ON login_attempts
  FOR DELETE
  TO service_role
  USING (true);

-- =============================================================================
-- Fix 2: Convert SECURITY DEFINER views to SECURITY INVOKER
-- =============================================================================
-- SECURITY DEFINER views execute with the permissions of the view creator,
-- bypassing RLS of the querying user. SECURITY INVOKER (default) is safer
-- as it respects the caller's permissions.

-- Drop and recreate views with explicit SECURITY INVOKER

-- 2.1 nis2_questionnaire_summary
DROP VIEW IF EXISTS nis2_questionnaire_summary;
CREATE VIEW nis2_questionnaire_summary
WITH (security_invoker = true)
AS
SELECT q.id,
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
    v.name AS vendor_company_name,
    t.name AS template_name,
    CASE
        WHEN (q.status = 'submitted'::nis2_questionnaire_status) THEN 'Pending Review'::text
        WHEN ((q.due_date IS NOT NULL) AND (q.due_date < CURRENT_DATE) AND (q.status <> ALL (ARRAY['approved'::nis2_questionnaire_status, 'submitted'::nis2_questionnaire_status]))) THEN 'Overdue'::text
        WHEN ((q.due_date IS NOT NULL) AND (q.due_date <= (CURRENT_DATE + '7 days'::interval)) AND (q.status <> ALL (ARRAY['approved'::nis2_questionnaire_status, 'submitted'::nis2_questionnaire_status]))) THEN 'Due Soon'::text
        ELSE NULL::text
    END AS alert_status
FROM ((nis2_vendor_questionnaires q
    LEFT JOIN vendors v ON ((v.id = q.vendor_id)))
    LEFT JOIN nis2_questionnaire_templates t ON ((t.id = q.template_id)));

-- 2.2 nis2_questionnaire_stats
DROP VIEW IF EXISTS nis2_questionnaire_stats;
CREATE VIEW nis2_questionnaire_stats
WITH (security_invoker = true)
AS
SELECT organization_id,
    count(*) AS total_questionnaires,
    count(*) FILTER (WHERE (status = 'draft'::nis2_questionnaire_status)) AS draft_count,
    count(*) FILTER (WHERE (status = 'sent'::nis2_questionnaire_status)) AS sent_count,
    count(*) FILTER (WHERE (status = 'in_progress'::nis2_questionnaire_status)) AS in_progress_count,
    count(*) FILTER (WHERE (status = 'submitted'::nis2_questionnaire_status)) AS submitted_count,
    count(*) FILTER (WHERE (status = 'approved'::nis2_questionnaire_status)) AS approved_count,
    count(*) FILTER (WHERE (status = 'rejected'::nis2_questionnaire_status)) AS rejected_count,
    count(*) FILTER (WHERE (status = 'expired'::nis2_questionnaire_status)) AS expired_count,
    avg(progress_percentage) FILTER (WHERE (status = 'in_progress'::nis2_questionnaire_status)) AS avg_progress,
    avg((((questions_ai_filled)::numeric / (NULLIF(questions_total, 0))::numeric) * (100)::numeric)) FILTER (WHERE ((questions_total > 0) AND (status <> 'draft'::nis2_questionnaire_status))) AS avg_ai_fill_rate
FROM nis2_vendor_questionnaires
GROUP BY organization_id;

-- 2.3 nis2_risks_with_controls
DROP VIEW IF EXISTS nis2_risks_with_controls;
CREATE VIEW nis2_risks_with_controls
WITH (security_invoker = true)
AS
SELECT r.id,
    r.organization_id,
    r.reference_code,
    r.title,
    r.description,
    r.category,
    r.likelihood_score,
    r.impact_score,
    r.inherent_risk_score,
    r.inherent_risk_level,
    r.residual_likelihood,
    r.residual_impact,
    r.residual_risk_score,
    r.residual_risk_level,
    r.combined_control_effectiveness,
    r.treatment_strategy,
    r.treatment_plan,
    r.treatment_due_date,
    r.treatment_owner_id,
    r.status,
    r.review_date,
    r.last_assessed_at,
    r.is_within_tolerance,
    r.tolerance_threshold,
    r.owner_id,
    r.created_by,
    r.created_at,
    r.updated_at,
    r.deleted_at,
    COALESCE(rc.control_count, (0)::bigint) AS control_count,
    COALESCE(rc.avg_effectiveness, (0)::numeric) AS avg_control_effectiveness
FROM (nis2_risks r
    LEFT JOIN ( SELECT nis2_risk_controls.risk_id,
        count(*) AS control_count,
        avg(nis2_risk_controls.effectiveness_score) AS avg_effectiveness
       FROM nis2_risk_controls
      GROUP BY nis2_risk_controls.risk_id) rc ON ((rc.risk_id = r.id)))
WHERE (r.deleted_at IS NULL);

-- 2.4 nis2_controls_with_risks
DROP VIEW IF EXISTS nis2_controls_with_risks;
CREATE VIEW nis2_controls_with_risks
WITH (security_invoker = true)
AS
SELECT c.id,
    c.organization_id,
    c.reference_code,
    c.title,
    c.description,
    c.category,
    c.control_type,
    c.implementation_status,
    c.design_effectiveness,
    c.operational_effectiveness,
    c.overall_effectiveness,
    c.evidence_requirements,
    c.last_evidence_date,
    c.next_review_date,
    c.owner_id,
    c.created_by,
    c.created_at,
    c.updated_at,
    c.deleted_at,
    COALESCE(rc.risk_count, (0)::bigint) AS linked_risk_count
FROM (nis2_controls c
    LEFT JOIN ( SELECT nis2_risk_controls.control_id,
        count(*) AS risk_count
       FROM nis2_risk_controls
      GROUP BY nis2_risk_controls.control_id) rc ON ((rc.control_id = c.id)))
WHERE (c.deleted_at IS NULL);

-- 2.5 nis2_org_risk_summary
DROP VIEW IF EXISTS nis2_org_risk_summary;
CREATE VIEW nis2_org_risk_summary
WITH (security_invoker = true)
AS
SELECT organization_id,
    count(*) AS total_risks,
    count(*) FILTER (WHERE (inherent_risk_level = 'critical'::nis2_risk_level)) AS critical_inherent,
    count(*) FILTER (WHERE (inherent_risk_level = 'high'::nis2_risk_level)) AS high_inherent,
    count(*) FILTER (WHERE (inherent_risk_level = 'medium'::nis2_risk_level)) AS medium_inherent,
    count(*) FILTER (WHERE (inherent_risk_level = 'low'::nis2_risk_level)) AS low_inherent,
    count(*) FILTER (WHERE (residual_risk_level = 'critical'::nis2_risk_level)) AS critical_residual,
    count(*) FILTER (WHERE (residual_risk_level = 'high'::nis2_risk_level)) AS high_residual,
    count(*) FILTER (WHERE (residual_risk_level = 'medium'::nis2_risk_level)) AS medium_residual,
    count(*) FILTER (WHERE (residual_risk_level = 'low'::nis2_risk_level)) AS low_residual,
    count(*) FILTER (WHERE (residual_risk_level IS NULL)) AS not_assessed,
    avg(inherent_risk_score) AS avg_inherent_score,
    avg(residual_risk_score) AS avg_residual_score,
    avg(combined_control_effectiveness) AS avg_control_effectiveness
FROM nis2_risks
WHERE (deleted_at IS NULL)
GROUP BY organization_id;

-- 2.6 testing_programme_stats
DROP VIEW IF EXISTS testing_programme_stats;
CREATE VIEW testing_programme_stats
WITH (security_invoker = true)
AS
SELECT tp.id AS programme_id,
    tp.organization_id,
    tp.programme_ref,
    tp.name,
    tp.year,
    tp.status,
    count(rt.id) AS total_tests,
    count(rt.id) FILTER (WHERE (rt.status = 'completed'::text)) AS completed_tests,
    count(rt.id) FILTER (WHERE (rt.status = ANY (ARRAY['planned'::text, 'scheduled'::text]))) AS planned_tests,
    count(rt.id) FILTER (WHERE (rt.status = 'in_progress'::text)) AS in_progress_tests,
    sum(rt.findings_count) AS total_findings,
    sum(rt.critical_findings_count) AS total_critical_findings,
    sum(rt.actual_cost) AS total_cost_spent
FROM (testing_programmes tp
    LEFT JOIN resilience_tests rt ON ((rt.programme_id = tp.id)))
GROUP BY tp.id;

-- 2.7 tlpt_compliance_status
DROP VIEW IF EXISTS tlpt_compliance_status;
CREATE VIEW tlpt_compliance_status
WITH (security_invoker = true)
AS
SELECT organization_id,
    tlpt_ref,
    name,
    status,
    next_tlpt_due,
    CASE
        WHEN (next_tlpt_due IS NULL) THEN 'not_scheduled'::text
        WHEN (next_tlpt_due < CURRENT_DATE) THEN 'overdue'::text
        WHEN (next_tlpt_due < (CURRENT_DATE + '6 mons'::interval)) THEN 'due_soon'::text
        ELSE 'compliant'::text
    END AS compliance_status,
    (next_tlpt_due - CURRENT_DATE) AS days_until_due
FROM tlpt_engagements
WHERE (status <> 'cancelled'::text);

-- 2.8 open_findings_summary
DROP VIEW IF EXISTS open_findings_summary;
CREATE VIEW open_findings_summary
WITH (security_invoker = true)
AS
SELECT rt.organization_id,
    tf.severity,
    count(*) AS finding_count,
    count(*) FILTER (WHERE (tf.remediation_deadline < CURRENT_DATE)) AS overdue_count
FROM (test_findings tf
    JOIN resilience_tests rt ON ((rt.id = tf.test_id)))
WHERE (tf.status = ANY (ARRAY['open'::text, 'in_remediation'::text]))
GROUP BY rt.organization_id, tf.severity;

-- =============================================================================
-- Summary:
-- - Enabled RLS on login_attempts table with service_role policies
-- - Converted 8 views from SECURITY DEFINER to SECURITY INVOKER
-- =============================================================================
