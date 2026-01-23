-- Migration: 034_notification_triggers.sql
-- Description: Add database triggers for automatic notification creation
-- This enables real-time notifications when key events occur

-- =============================================================================
-- NOTIFICATION HELPER FUNCTION
-- =============================================================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_organization_id UUID,
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_href TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    organization_id,
    user_id,
    type,
    title,
    message,
    href
  ) VALUES (
    p_organization_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_href
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- =============================================================================
-- INCIDENT NOTIFICATIONS
-- =============================================================================

-- Notify when a new incident is created
CREATE OR REPLACE FUNCTION notify_on_incident_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create notification for all org users (user_id = NULL means org-wide)
  PERFORM create_notification(
    NEW.organization_id,
    NULL,
    'incident',
    'New Incident Reported: ' || COALESCE(NEW.reference, 'INC-???'),
    'A new ' || COALESCE(NEW.severity, 'unknown') || ' severity incident has been reported. Classification: ' || COALESCE(NEW.classification, 'pending') || '.',
    '/incidents/' || NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_incident_created ON incidents;
CREATE TRIGGER trigger_notify_incident_created
  AFTER INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_incident_created();

-- Notify when incident status changes to resolved
CREATE OR REPLACE FUNCTION notify_on_incident_resolved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'resolved' AND (OLD.status IS DISTINCT FROM 'resolved') THEN
    PERFORM create_notification(
      NEW.organization_id,
      NULL,
      'incident',
      'Incident Resolved: ' || COALESCE(NEW.reference, 'INC-???'),
      'The incident "' || COALESCE(NEW.title, 'Untitled') || '" has been resolved.',
      '/incidents/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_incident_resolved ON incidents;
CREATE TRIGGER trigger_notify_incident_resolved
  AFTER UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_incident_resolved();

-- =============================================================================
-- VENDOR NOTIFICATIONS
-- =============================================================================

-- Notify when a new vendor is created
CREATE OR REPLACE FUNCTION notify_on_vendor_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_notification(
    NEW.organization_id,
    NULL,
    'vendor',
    'New Vendor Added: ' || COALESCE(NEW.name, 'Unnamed'),
    'A new ' || COALESCE(NEW.tier, 'unclassified') || ' tier vendor has been added to your vendor register.',
    '/vendors/' || NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_vendor_created ON vendors;
CREATE TRIGGER trigger_notify_vendor_created
  AFTER INSERT ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_vendor_created();

-- Notify when vendor risk tier changes
CREATE OR REPLACE FUNCTION notify_on_vendor_tier_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tier IS DISTINCT FROM OLD.tier AND NEW.tier IS NOT NULL THEN
    PERFORM create_notification(
      NEW.organization_id,
      NULL,
      'vendor',
      'Vendor Risk Tier Changed: ' || COALESCE(NEW.name, 'Unnamed'),
      'Vendor tier changed from ' || COALESCE(OLD.tier, 'unassigned') || ' to ' || NEW.tier || '.',
      '/vendors/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_vendor_tier_change ON vendors;
CREATE TRIGGER trigger_notify_vendor_tier_change
  AFTER UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_vendor_tier_change();

-- =============================================================================
-- QUESTIONNAIRE NOTIFICATIONS
-- =============================================================================

-- Notify when a questionnaire is submitted by vendor
CREATE OR REPLACE FUNCTION notify_on_questionnaire_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_name TEXT;
BEGIN
  IF NEW.status = 'submitted' AND (OLD.status IS DISTINCT FROM 'submitted') THEN
    -- Get vendor name
    SELECT name INTO v_vendor_name
    FROM vendors
    WHERE id = NEW.vendor_id;

    PERFORM create_notification(
      NEW.organization_id,
      NULL,
      'compliance',
      'Questionnaire Submitted',
      'Vendor "' || COALESCE(v_vendor_name, 'Unknown') || '" has submitted their questionnaire response. Please review.',
      '/questionnaires/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_questionnaire_submitted ON nis2_vendor_questionnaires;
CREATE TRIGGER trigger_notify_questionnaire_submitted
  AFTER UPDATE ON nis2_vendor_questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_questionnaire_submitted();

-- =============================================================================
-- DOCUMENT NOTIFICATIONS
-- =============================================================================

-- Notify when document parsing completes
CREATE OR REPLACE FUNCTION notify_on_document_parsed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'parsed' AND (OLD.status IS DISTINCT FROM 'parsed') THEN
    PERFORM create_notification(
      NEW.organization_id,
      NEW.uploaded_by,
      'compliance',
      'Document Analysis Complete',
      'Your document "' || COALESCE(NEW.original_filename, 'document') || '" has been analyzed and is ready for review.',
      '/documents/' || NEW.id
    );
  ELSIF NEW.status = 'error' AND (OLD.status IS DISTINCT FROM 'error') THEN
    PERFORM create_notification(
      NEW.organization_id,
      NEW.uploaded_by,
      'compliance',
      'Document Analysis Failed',
      'Analysis of "' || COALESCE(NEW.original_filename, 'document') || '" failed. Please try uploading again.',
      '/documents/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_document_parsed ON documents;
CREATE TRIGGER trigger_notify_document_parsed
  AFTER UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_document_parsed();

-- =============================================================================
-- CONTRACT EXPIRY NOTIFICATIONS (scheduled via cron or edge function)
-- =============================================================================

-- Function to check for expiring contracts and create notifications
-- This should be called by a scheduled job (Supabase cron or edge function)
CREATE OR REPLACE FUNCTION check_expiring_contracts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Find contracts expiring in the next 30 days that haven't been notified
  FOR v_contract IN
    SELECT
      vc.id,
      vc.organization_id,
      vc.vendor_id,
      vc.contract_name,
      vc.end_date,
      v.name as vendor_name
    FROM vendor_contracts vc
    JOIN vendors v ON v.id = vc.vendor_id
    WHERE vc.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      AND vc.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.organization_id = vc.organization_id
          AND n.type = 'vendor'
          AND n.title LIKE '%Contract Expiring%'
          AND n.href = '/vendors/' || vc.vendor_id || '?tab=contracts'
          AND n.created_at > CURRENT_DATE - INTERVAL '7 days'
      )
  LOOP
    PERFORM create_notification(
      v_contract.organization_id,
      NULL,
      'vendor',
      'Contract Expiring: ' || COALESCE(v_contract.contract_name, 'Unnamed'),
      'Contract with "' || v_contract.vendor_name || '" expires on ' ||
        to_char(v_contract.end_date, 'DD Mon YYYY') || '. Please review renewal options.',
      '/vendors/' || v_contract.vendor_id || '?tab=contracts'
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- =============================================================================
-- MONITORING ALERT NOTIFICATIONS
-- =============================================================================

-- Notify when a monitoring alert is created
CREATE OR REPLACE FUNCTION notify_on_monitoring_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_name TEXT;
BEGIN
  -- Get vendor name
  SELECT name INTO v_vendor_name
  FROM vendors
  WHERE id = NEW.vendor_id;

  -- Only notify for high/critical severity
  IF NEW.severity IN ('high', 'critical') THEN
    PERFORM create_notification(
      NEW.organization_id,
      NULL,
      'security',
      'Monitoring Alert: ' || COALESCE(v_vendor_name, 'Unknown Vendor'),
      NEW.severity || ' severity alert: ' || COALESCE(NEW.message, 'Security issue detected') || '.',
      '/vendors/' || NEW.vendor_id || '?tab=monitoring'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_monitoring_alert ON monitoring_alerts;
CREATE TRIGGER trigger_notify_monitoring_alert
  AFTER INSERT ON monitoring_alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_monitoring_alert();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION create_notification IS
  'Helper function to create notifications. Used by triggers and scheduled jobs.';

COMMENT ON FUNCTION notify_on_incident_created IS
  'Creates a notification when a new incident is reported.';

COMMENT ON FUNCTION notify_on_incident_resolved IS
  'Creates a notification when an incident is resolved.';

COMMENT ON FUNCTION notify_on_vendor_created IS
  'Creates a notification when a new vendor is added.';

COMMENT ON FUNCTION notify_on_vendor_tier_change IS
  'Creates a notification when a vendor risk tier changes.';

COMMENT ON FUNCTION notify_on_questionnaire_submitted IS
  'Creates a notification when a vendor submits their questionnaire.';

COMMENT ON FUNCTION notify_on_document_parsed IS
  'Creates a notification when document parsing completes or fails.';

COMMENT ON FUNCTION check_expiring_contracts IS
  'Checks for contracts expiring in 30 days and creates notifications. Should be called by a scheduled job.';

COMMENT ON FUNCTION notify_on_monitoring_alert IS
  'Creates a notification for high/critical monitoring alerts.';
