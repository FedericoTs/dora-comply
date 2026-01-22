-- Migration: 027_fix_function_search_path.sql
-- Purpose: Fix mutable search_path warnings on all 30 functions
-- Security: SET search_path = public prevents search_path injection attacks

-- =============================================================================
-- 1. Simple trigger functions (update timestamp)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_extraction_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_soc2_roi_mappings_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_roi_onboarding_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_monitoring_alert_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- =============================================================================
-- 2. Reference code generators (triggers)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_testing_programme_ref()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.programme_ref := 'TP-' || NEW.year || '-' ||
    LPAD(CAST((
      SELECT COUNT(*) + 1 FROM testing_programmes
      WHERE organization_id = NEW.organization_id
      AND year = NEW.year
    ) AS TEXT), 3, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_resilience_test_ref()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  prefix TEXT;
BEGIN
  CASE NEW.test_type
    WHEN 'vulnerability_assessment' THEN prefix := 'VA';
    WHEN 'open_source_analysis' THEN prefix := 'OSA';
    WHEN 'network_security_assessment' THEN prefix := 'NSA';
    WHEN 'gap_analysis' THEN prefix := 'GA';
    WHEN 'physical_security_review' THEN prefix := 'PSR';
    WHEN 'source_code_review' THEN prefix := 'SCR';
    WHEN 'scenario_based_test' THEN prefix := 'SBT';
    WHEN 'compatibility_test' THEN prefix := 'CT';
    WHEN 'performance_test' THEN prefix := 'PT';
    WHEN 'penetration_test' THEN prefix := 'PEN';
    ELSE prefix := 'TST';
  END CASE;

  NEW.test_ref := prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(CAST((
      SELECT COUNT(*) + 1 FROM resilience_tests
      WHERE organization_id = NEW.organization_id
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    ) AS TEXT), 4, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_test_finding_ref()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  test_ref TEXT;
BEGIN
  SELECT rt.test_ref INTO test_ref FROM resilience_tests rt WHERE rt.id = NEW.test_id;
  NEW.finding_ref := test_ref || '-F' ||
    LPAD(CAST((
      SELECT COUNT(*) + 1 FROM test_findings
      WHERE test_id = NEW.test_id
    ) AS TEXT), 3, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_tlpt_ref()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.tlpt_ref := 'TLPT-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(CAST((
      SELECT COUNT(*) + 1 FROM tlpt_engagements
      WHERE organization_id = NEW.organization_id
    ) AS TEXT), 3, '0');
  RETURN NEW;
END;
$function$;

-- =============================================================================
-- 3. NIS2 code generators (regular functions)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_nis2_risk_code(org_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  next_num INTEGER;
  code TEXT;
BEGIN
  SELECT COALESCE(MAX(
    CASE
      WHEN reference_code ~ '^NIS2-RISK-[0-9]+$'
      THEN CAST(SUBSTRING(reference_code FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM nis2_risks
  WHERE organization_id = org_id;

  code := 'NIS2-RISK-' || LPAD(next_num::TEXT, 4, '0');
  RETURN code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_nis2_control_code(org_id uuid, ctrl_type text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  next_num INTEGER;
  prefix TEXT;
  code TEXT;
BEGIN
  prefix := CASE ctrl_type
    WHEN 'preventive' THEN 'CTRL-PRV'
    WHEN 'detective' THEN 'CTRL-DET'
    WHEN 'corrective' THEN 'CTRL-COR'
    ELSE 'CTRL-GEN'
  END;

  SELECT COALESCE(MAX(
    CASE
      WHEN reference_code ~ ('^' || prefix || '-[0-9]+$')
      THEN CAST(SUBSTRING(reference_code FROM '[0-9]+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM nis2_controls
  WHERE organization_id = org_id;

  code := prefix || '-' || LPAD(next_num::TEXT, 3, '0');
  RETURN code;
END;
$function$;

-- =============================================================================
-- 4. IMMUTABLE helper functions
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_nis2_risk_level(score integer)
RETURNS nis2_risk_level
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  IF score >= 16 THEN RETURN 'critical';
  ELSIF score >= 10 THEN RETURN 'high';
  ELSIF score >= 5 THEN RETURN 'medium';
  ELSE RETURN 'low';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.classify_service_type(p_components text[])
RETURNS character varying
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
DECLARE
  v_components_lower TEXT;
  v_service_type VARCHAR(50);
BEGIN
  v_components_lower := LOWER(array_to_string(p_components, ' '));

  IF v_components_lower ~ '(payment|stripe|adyen|checkout)' THEN
    v_service_type := 'payment_services';
  ELSIF v_components_lower ~ '(security|auth|okta|firewall|siem)' THEN
    v_service_type := 'security_services';
  ELSIF v_components_lower ~ '(analytics|bigquery|snowflake|databricks|looker)' THEN
    v_service_type := 'data_analytics';
  ELSIF v_components_lower ~ '(database|redis|mongodb|postgres|mysql|elasticsearch)' THEN
    v_service_type := 'data_management';
  ELSIF v_components_lower ~ '(cdn|cloudflare|akamai|fastly|network)' THEN
    v_service_type := 'network_services';
  ELSIF v_components_lower ~ '(kubernetes|k8s|container|docker|heroku|ecs)' THEN
    v_service_type := 'platform_as_service';
  ELSIF v_components_lower ~ '(ec2|compute|vm|virtual|infrastructure|storage|s3)' THEN
    v_service_type := 'infrastructure_as_service';
  ELSIF v_components_lower ~ '(saas|software|application|platform|api)' THEN
    v_service_type := 'software_as_service';
  ELSIF v_components_lower ~ '(cloud|aws|azure|gcp|google cloud)' THEN
    v_service_type := 'cloud_computing';
  ELSE
    v_service_type := 'other';
  END IF;

  RETURN v_service_type;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_security_grade(score integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  IF score >= 90 THEN RETURN 'A';
  ELSIF score >= 80 THEN RETURN 'B';
  ELSIF score >= 70 THEN RETURN 'C';
  ELSIF score >= 60 THEN RETURN 'D';
  ELSE RETURN 'F';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_alert_severity(old_score integer, new_score integer, old_grade text, new_grade text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
DECLARE
  score_drop INTEGER;
  grade_levels TEXT[] := ARRAY['A', 'B', 'C', 'D', 'F'];
  old_level INTEGER;
  new_level INTEGER;
BEGIN
  score_drop := old_score - new_score;
  old_level := array_position(grade_levels, old_grade);
  new_level := array_position(grade_levels, new_grade);

  IF (new_level - old_level >= 2) OR (score_drop >= 20) THEN
    RETURN 'critical';
  ELSIF (new_level > old_level) OR (score_drop >= 15) THEN
    RETURN 'high';
  ELSIF score_drop >= 10 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_maturity_label(level integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  RETURN CASE level
    WHEN 0 THEN 'L0 - Not Performed'
    WHEN 1 THEN 'L1 - Informal'
    WHEN 2 THEN 'L2 - Planned & Tracked'
    WHEN 3 THEN 'L3 - Well-Defined'
    WHEN 4 THEN 'L4 - Quantitatively Managed'
    ELSE 'Unknown'
  END;
END;
$function$;

-- =============================================================================
-- 5. SECURITY DEFINER functions (need search_path most)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_module_access(p_organization_id uuid, p_framework text, p_module text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_enabled BOOLEAN;
  v_modules JSONB;
BEGIN
  SELECT
    enabled,
    modules_enabled
  INTO v_enabled, v_modules
  FROM organization_framework_entitlements
  WHERE organization_id = p_organization_id
    AND framework = p_framework;

  IF NOT FOUND OR NOT v_enabled THEN
    RETURN false;
  END IF;

  RETURN COALESCE(v_modules->p_module, 'false')::TEXT::BOOLEAN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_evidence_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO evidence_audit_log (
      organization_id, evidence_type, evidence_id, source_document_id,
      action, new_value, changed_by
    ) VALUES (
      NEW.organization_id, NEW.evidence_type, NEW.evidence_id, NEW.source_document_id,
      'created', row_to_json(NEW), auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO evidence_audit_log (
      organization_id, evidence_type, evidence_id, source_document_id,
      action, old_value, new_value, changed_by
    ) VALUES (
      NEW.organization_id, NEW.evidence_type, NEW.evidence_id, NEW.source_document_id,
      'updated', row_to_json(OLD), row_to_json(NEW), auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO evidence_audit_log (
      organization_id, evidence_type, evidence_id, source_document_id,
      action, old_value, changed_by
    ) VALUES (
      OLD.organization_id, OLD.evidence_type, OLD.evidence_id, OLD.source_document_id,
      'deleted', row_to_json(OLD), auth.uid()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_soc2_roi_mapping_stats(p_document_id uuid)
RETURNS TABLE(has_mapping boolean, extraction_status character varying, is_confirmed boolean, extracted_vendor_name text, subcontractor_count integer, service_count integer, overall_confidence double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    TRUE as has_mapping,
    m.extraction_status,
    m.is_confirmed,
    v.name as extracted_vendor_name,
    COALESCE(array_length(m.extracted_subcontractor_ids, 1), 0) as subcontractor_count,
    COALESCE(array_length(m.extracted_service_ids, 1), 0) as service_count,
    m.extraction_confidence as overall_confidence
  FROM soc2_roi_mappings m
  LEFT JOIN vendors v ON v.id = m.extracted_vendor_id
  WHERE m.document_id = p_document_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE as has_mapping,
      NULL::VARCHAR as extraction_status,
      FALSE as is_confirmed,
      NULL::TEXT as extracted_vendor_name,
      0 as subcontractor_count,
      0 as service_count,
      NULL::FLOAT as overall_confidence;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_subcontractor_chain_json(p_vendor_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  WITH RECURSIVE chain AS (
    SELECT s.*, 1 as computed_depth
    FROM subcontractors s
    WHERE s.vendor_id = p_vendor_id
      AND s.parent_subcontractor_id IS NULL

    UNION ALL

    SELECT s.*, c.computed_depth + 1
    FROM subcontractors s
    JOIN chain c ON s.parent_subcontractor_id = c.id
    WHERE c.computed_depth < 10
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'vendor_id', vendor_id,
      'subcontractor_name', subcontractor_name,
      'subcontractor_lei', subcontractor_lei,
      'country_code', country_code,
      'tier_level', tier_level,
      'parent_subcontractor_id', parent_subcontractor_id,
      'service_description', service_description,
      'service_type', service_type,
      'supports_critical_function', supports_critical_function,
      'is_monitored', is_monitored,
      'risk_rating', risk_rating,
      'computed_depth', computed_depth
    ) ORDER BY computed_depth, subcontractor_name
  ), '[]'::jsonb)
  FROM chain;
$function$;

CREATE OR REPLACE FUNCTION public.get_or_create_roi_onboarding(p_organization_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM roi_onboarding_progress
  WHERE organization_id = p_organization_id;

  IF v_id IS NULL THEN
    INSERT INTO roi_onboarding_progress (organization_id)
    VALUES (p_organization_id)
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_roi_progress_snapshot(p_organization_id uuid, p_total_fields integer, p_completed_fields integer, p_error_count integer, p_warning_count integer, p_template_breakdown jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO roi_progress_history (
    organization_id,
    total_fields,
    completed_fields,
    error_count,
    warning_count,
    template_breakdown
  )
  VALUES (
    p_organization_id,
    p_total_fields,
    p_completed_fields,
    p_error_count,
    p_warning_count,
    p_template_breakdown
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_vendor_chain_depth(p_vendor_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COALESCE(MAX(tier_level), 0)
  FROM subcontractors
  WHERE vendor_id = p_vendor_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_org_chain_metrics(p_org_id uuid)
RETURNS TABLE(total_vendors integer, vendors_with_chains integer, total_subcontractors bigint, max_chain_depth integer, avg_chain_depth numeric, critical_at_depth bigint, unmonitored_count bigint, high_risk_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  WITH vendor_stats AS (
    SELECT
      v.id as vendor_id,
      COUNT(s.id) as sub_count,
      COALESCE(MAX(s.tier_level), 0) as max_depth,
      COALESCE(AVG(s.tier_level), 0) as avg_depth
    FROM vendors v
    LEFT JOIN subcontractors s ON s.vendor_id = v.id
    WHERE v.organization_id = p_org_id
      AND v.status = 'active'
    GROUP BY v.id
  ),
  sub_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE s.supports_critical_function AND s.tier_level > 2) as critical_deep,
      COUNT(*) FILTER (WHERE NOT s.is_monitored) as unmonitored,
      COUNT(*) FILTER (WHERE s.risk_rating = 'high') as high_risk,
      COUNT(*) as total_subs
    FROM subcontractors s
    JOIN vendors v ON s.vendor_id = v.id
    WHERE v.organization_id = p_org_id
      AND v.status = 'active'
  )
  SELECT
    (SELECT COUNT(*)::INTEGER FROM vendor_stats),
    (SELECT COUNT(*)::INTEGER FROM vendor_stats WHERE sub_count > 0),
    (SELECT total_subs FROM sub_stats),
    (SELECT COALESCE(MAX(max_depth), 0)::INTEGER FROM vendor_stats),
    (SELECT ROUND(AVG(avg_depth), 2) FROM vendor_stats WHERE sub_count > 0),
    (SELECT critical_deep FROM sub_stats),
    (SELECT unmonitored FROM sub_stats),
    (SELECT high_risk FROM sub_stats);
$function$;

CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email text, p_ip_address inet, p_max_attempts integer DEFAULT 5, p_window_minutes integer DEFAULT 15)
RETURNS TABLE(is_limited boolean, attempts_remaining integer, locked_until timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_failed_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_last_attempt TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  SELECT COUNT(*), MAX(attempted_at)
  INTO v_failed_count, v_last_attempt
  FROM login_attempts
  WHERE email = p_email
    AND attempted_at > v_window_start
    AND success = false;

  IF v_failed_count >= p_max_attempts THEN
    RETURN QUERY SELECT
      true::BOOLEAN,
      0::INTEGER,
      (v_last_attempt + (p_window_minutes || ' minutes')::INTERVAL)::TIMESTAMPTZ;
  ELSE
    RETURN QUERY SELECT
      false::BOOLEAN,
      (p_max_attempts - v_failed_count)::INTEGER,
      NULL::TIMESTAMPTZ;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_login_attempt(p_email text, p_ip_address inet, p_success boolean, p_user_agent text DEFAULT NULL::text, p_failure_reason text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO login_attempts (email, ip_address, success, user_agent, failure_reason)
  VALUES (p_email, p_ip_address, p_success, p_user_agent, p_failure_reason);

  DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_roi_data_change(p_template_id text, p_record_id uuid, p_field_name text, p_old_value jsonb, p_new_value jsonb, p_change_reason text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  v_org_id := get_user_organization_id();
  IF v_org_id IS NULL THEN
    RETURN;
  END IF;

  v_user_id := auth.uid();

  INSERT INTO roi_data_history (
    organization_id,
    template_id,
    record_id,
    field_name,
    old_value,
    new_value,
    changed_by,
    change_reason
  ) VALUES (
    v_org_id,
    p_template_id,
    p_record_id,
    p_field_name,
    p_old_value,
    p_new_value,
    v_user_id,
    p_change_reason
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_questionnaire_token(token uuid)
RETURNS TABLE(questionnaire_id uuid, organization_name text, vendor_name text, template_name text, status nis2_questionnaire_status, is_valid boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    q.id as questionnaire_id,
    o.name as organization_name,
    v.name as vendor_name,
    t.name as template_name,
    q.status,
    CASE
      WHEN q.id IS NULL THEN false
      WHEN q.token_expires_at < NOW() THEN false
      WHEN q.status IN ('approved', 'rejected', 'expired') THEN false
      ELSE true
    END as is_valid,
    CASE
      WHEN q.id IS NULL THEN 'Invalid or expired access link'
      WHEN q.token_expires_at < NOW() THEN 'This questionnaire link has expired'
      WHEN q.status = 'approved' THEN 'This questionnaire has already been approved'
      WHEN q.status = 'rejected' THEN 'This questionnaire was rejected and needs to be resent'
      WHEN q.status = 'expired' THEN 'This questionnaire has expired'
      ELSE 'Access granted'
    END as message
  FROM nis2_vendor_questionnaires q
  LEFT JOIN organizations o ON o.id = q.organization_id
  LEFT JOIN vendors v ON v.id = q.vendor_id
  LEFT JOIN nis2_questionnaire_templates t ON t.id = q.template_id
  WHERE q.access_token = token;
END;
$function$;

-- =============================================================================
-- 6. Other trigger functions
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_test_finding_counts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  target_test_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_test_id := OLD.test_id;
  ELSE
    target_test_id := NEW.test_id;
  END IF;

  UPDATE resilience_tests SET
    findings_count = (SELECT COUNT(*) FROM test_findings WHERE test_id = target_test_id),
    critical_findings_count = (SELECT COUNT(*) FROM test_findings WHERE test_id = target_test_id AND severity = 'critical'),
    high_findings_count = (SELECT COUNT(*) FROM test_findings WHERE test_id = target_test_id AND severity = 'high'),
    medium_findings_count = (SELECT COUNT(*) FROM test_findings WHERE test_id = target_test_id AND severity = 'medium'),
    low_findings_count = (SELECT COUNT(*) FROM test_findings WHERE test_id = target_test_id AND severity = 'low'),
    updated_at = NOW()
  WHERE id = target_test_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_template_usage()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE nis2_questionnaire_templates
  SET times_used = times_used + 1
  WHERE id = NEW.template_id;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_questionnaire_progress()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE nis2_vendor_questionnaires
  SET
    questions_answered = (
      SELECT COUNT(*) FROM nis2_questionnaire_answers
      WHERE questionnaire_id = NEW.questionnaire_id
      AND (
        (answer_text IS NOT NULL AND answer_text != '')
        OR answer_json IS NOT NULL
      )
    ),
    questions_ai_filled = (
      SELECT COUNT(*) FROM nis2_questionnaire_answers
      WHERE questionnaire_id = NEW.questionnaire_id
      AND source IN ('ai_extracted', 'ai_confirmed', 'ai_modified')
      AND (
        (answer_text IS NOT NULL AND answer_text != '')
        OR answer_json IS NOT NULL
      )
    ),
    progress_percentage = (
      SELECT CASE
        WHEN questions_total = 0 THEN 0
        ELSE ROUND(
          (SELECT COUNT(*) FROM nis2_questionnaire_answers
           WHERE questionnaire_id = NEW.questionnaire_id
           AND (
             (answer_text IS NOT NULL AND answer_text != '')
             OR answer_json IS NOT NULL
           ))::NUMERIC
          / questions_total * 100
        )
      END
      FROM nis2_vendor_questionnaires
      WHERE id = NEW.questionnaire_id
    )
  WHERE id = NEW.questionnaire_id;

  RETURN NEW;
END;
$function$;

-- =============================================================================
-- Summary:
-- Fixed search_path on 30 functions to prevent search_path injection attacks
-- =============================================================================
