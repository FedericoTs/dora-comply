-- Migration: Fix questionnaire progress stats calculation
-- Issue: questions_ai_filled counts all AI-sourced answers regardless of content,
-- but questions_answered only counts answers with content, causing inconsistent stats.
-- Fix: Make questions_ai_filled only count AI answers that also have content.

-- ============================================================================
-- FIX: Update the progress calculation trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_questionnaire_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE nis2_vendor_questionnaires
  SET
    -- Count answers that have actual content (text or JSON)
    questions_answered = (
      SELECT COUNT(*) FROM nis2_questionnaire_answers
      WHERE questionnaire_id = NEW.questionnaire_id
      AND (
        (answer_text IS NOT NULL AND answer_text != '')
        OR answer_json IS NOT NULL
      )
    ),
    -- Count AI-filled answers that also have content
    -- This ensures questions_ai_filled <= questions_answered
    questions_ai_filled = (
      SELECT COUNT(*) FROM nis2_questionnaire_answers
      WHERE questionnaire_id = NEW.questionnaire_id
      AND source IN ('ai_extracted', 'ai_confirmed', 'ai_modified')
      AND (
        (answer_text IS NOT NULL AND answer_text != '')
        OR answer_json IS NOT NULL
      )
    ),
    -- Calculate progress percentage
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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Recalculate stats for existing questionnaires
-- ============================================================================

-- Update all questionnaires to recalculate their stats
UPDATE nis2_vendor_questionnaires q
SET
  questions_answered = COALESCE((
    SELECT COUNT(*) FROM nis2_questionnaire_answers a
    WHERE a.questionnaire_id = q.id
    AND (
      (a.answer_text IS NOT NULL AND a.answer_text != '')
      OR a.answer_json IS NOT NULL
    )
  ), 0),
  questions_ai_filled = COALESCE((
    SELECT COUNT(*) FROM nis2_questionnaire_answers a
    WHERE a.questionnaire_id = q.id
    AND a.source IN ('ai_extracted', 'ai_confirmed', 'ai_modified')
    AND (
      (a.answer_text IS NOT NULL AND a.answer_text != '')
      OR a.answer_json IS NOT NULL
    )
  ), 0),
  progress_percentage = CASE
    WHEN q.questions_total = 0 THEN 0
    ELSE ROUND(
      COALESCE((
        SELECT COUNT(*) FROM nis2_questionnaire_answers a
        WHERE a.questionnaire_id = q.id
        AND (
          (a.answer_text IS NOT NULL AND a.answer_text != '')
          OR a.answer_json IS NOT NULL
        )
      ), 0)::NUMERIC / q.questions_total * 100
    )
  END;

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON FUNCTION update_questionnaire_progress() IS
  'Updates questionnaire progress stats. Fixed to only count AI answers with content.';
