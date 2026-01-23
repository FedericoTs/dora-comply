-- Migration: 033_fix_rls_policies.sql
-- Purpose: Fix overly permissive RLS policies flagged by security advisor

-- =============================================================================
-- Fix vendors UPDATE policy
-- The WITH CHECK should match USING to prevent org_id changes
-- =============================================================================

DROP POLICY IF EXISTS "Users can update org vendors" ON public.vendors;

CREATE POLICY "Users can update org vendors" ON public.vendors
  FOR UPDATE
  TO authenticated
  USING (organization_id = public.get_user_organization_id())
  WITH CHECK (organization_id = public.get_user_organization_id());

-- =============================================================================
-- Fix contact_requests policies
-- UPDATE should be restricted (contact requests are typically managed by admins)
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated users can update contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Authenticated users can view contact requests" ON public.contact_requests;

-- Only allow viewing/updating contact requests for users in an organization
-- (This is a simple fix - a more robust solution would use an admin role)
CREATE POLICY "Org users can view contact requests" ON public.contact_requests
  FOR SELECT
  TO authenticated
  USING (public.get_user_organization_id() IS NOT NULL);

CREATE POLICY "Org users can update contact requests" ON public.contact_requests
  FOR UPDATE
  TO authenticated
  USING (public.get_user_organization_id() IS NOT NULL)
  WITH CHECK (public.get_user_organization_id() IS NOT NULL);

-- =============================================================================
-- Summary:
-- - Fixed vendors UPDATE policy to enforce org_id constraint on WITH CHECK
-- - Restricted contact_requests to users who belong to an organization
-- =============================================================================
