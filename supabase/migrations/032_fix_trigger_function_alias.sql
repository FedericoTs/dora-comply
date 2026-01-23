-- Migration: 032_fix_trigger_function_alias.sql
-- Purpose: Create alias for update_updated_at_column() function
--
-- Issue: Several migrations reference update_updated_at_column() but only
-- update_updated_at() was defined in 001_initial_schema.sql
-- This creates the missing function to ensure migrations work on fresh databases.

-- =============================================================================
-- Create the update_updated_at_column function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.update_updated_at_column() IS
  'Trigger function to update updated_at timestamp. Alias for update_updated_at().';

-- =============================================================================
-- Summary:
-- - Created: update_updated_at_column() function
-- - This fixes migrations 011, 019, 020, and vendor_certifications that
--   reference this function
-- =============================================================================
