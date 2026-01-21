-- Migration: Fix validate_questionnaire_token to exclude draft status
-- Draft questionnaires should not be accessible via the vendor portal

CREATE OR REPLACE FUNCTION validate_questionnaire_token(token UUID)
RETURNS TABLE (
  questionnaire_id UUID,
  organization_name TEXT,
  vendor_name TEXT,
  template_name TEXT,
  status nis2_questionnaire_status,
  is_valid BOOLEAN,
  message TEXT
) AS $$
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
      WHEN q.status IN ('draft', 'approved', 'rejected', 'expired') THEN false
      ELSE true
    END as is_valid,
    CASE
      WHEN q.id IS NULL THEN 'Invalid or expired access link'
      WHEN q.token_expires_at < NOW() THEN 'This questionnaire link has expired'
      WHEN q.status = 'draft' THEN 'This questionnaire has not been sent yet'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_questionnaire_token IS
  'Validates questionnaire access token. Draft questionnaires are not accessible via vendor portal.';
