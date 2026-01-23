-- Migration: 035_score_history_trigger.sql
-- Description: Automatically populate vendor_score_history when scores change
-- This ensures score history is captured regardless of how the score is updated

-- =============================================================================
-- TRIGGER FUNCTION: Record score history on vendor score changes
-- =============================================================================

CREATE OR REPLACE FUNCTION record_vendor_score_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only record if external_risk_score changed and has a value
  IF NEW.external_risk_score IS NOT NULL
     AND (OLD.external_risk_score IS DISTINCT FROM NEW.external_risk_score) THEN

    -- Check if we already have a record for this vendor today (avoid duplicates)
    IF NOT EXISTS (
      SELECT 1 FROM vendor_score_history
      WHERE vendor_id = NEW.id
        AND DATE(recorded_at) = CURRENT_DATE
    ) THEN
      INSERT INTO vendor_score_history (
        organization_id,
        vendor_id,
        score,
        grade,
        provider,
        factors,
        recorded_at
      ) VALUES (
        NEW.organization_id,
        NEW.id,
        NEW.external_risk_score,
        COALESCE(NEW.external_risk_grade, calculate_security_grade(NEW.external_risk_score)),
        COALESCE(NEW.external_score_provider, 'securityscorecard'),
        COALESCE(NEW.external_score_factors, '[]'::jsonb),
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_record_vendor_score_history ON vendors;
CREATE TRIGGER trigger_record_vendor_score_history
  AFTER INSERT OR UPDATE OF external_risk_score ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION record_vendor_score_history();

-- =============================================================================
-- BACKFILL: Populate history for existing vendors with scores
-- =============================================================================

-- Insert historical records for vendors that have scores but no history
INSERT INTO vendor_score_history (
  organization_id,
  vendor_id,
  score,
  grade,
  provider,
  factors,
  recorded_at
)
SELECT
  v.organization_id,
  v.id,
  v.external_risk_score,
  COALESCE(v.external_risk_grade, calculate_security_grade(v.external_risk_score)),
  COALESCE(v.external_score_provider, 'securityscorecard'),
  COALESCE(v.external_score_factors, '[]'::jsonb),
  COALESCE(v.external_score_updated_at, v.updated_at, NOW())
FROM vendors v
WHERE v.external_risk_score IS NOT NULL
  AND v.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM vendor_score_history h
    WHERE h.vendor_id = v.id
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION record_vendor_score_history IS
  'Automatically records score changes to vendor_score_history table for trend tracking. Prevents duplicate entries on the same day.';

COMMENT ON TRIGGER trigger_record_vendor_score_history ON vendors IS
  'Captures vendor score changes for historical trend analysis.';
