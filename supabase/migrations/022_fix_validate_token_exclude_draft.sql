-- Migration: Allow draft questionnaires in vendor portal
-- Draft status is allowed for internal testing before send workflow is implemented

-- No changes needed to validate_questionnaire_token - it already allows drafts
-- This migration documents the decision to allow drafts in vendor portal

-- Update documents API validation to also allow drafts
-- (Done in code: src/app/api/vendor-portal/[token]/documents/route.ts)

COMMENT ON FUNCTION validate_questionnaire_token IS
  'Validates questionnaire access token. Allows draft, sent, in_progress, submitted statuses.';
