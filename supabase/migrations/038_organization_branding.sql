-- =============================================================================
-- Migration: 038_organization_branding.sql
-- Description: Add branding fields to organizations for vendor portal customization
-- Phase 2.4 of MASTERPLAN: Branded Vendor Portal
-- =============================================================================

-- Add branding columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS primary_color varchar(7) DEFAULT '#059669',
ADD COLUMN IF NOT EXISTS accent_color varchar(7) DEFAULT '#10B981',
ADD COLUMN IF NOT EXISTS portal_welcome_title text DEFAULT 'Welcome to our Vendor Portal',
ADD COLUMN IF NOT EXISTS portal_welcome_message text DEFAULT 'Please complete the requested questionnaire to help us assess compliance and security.',
ADD COLUMN IF NOT EXISTS portal_footer_text text,
ADD COLUMN IF NOT EXISTS portal_support_email text,
ADD COLUMN IF NOT EXISTS portal_logo_position varchar(20) DEFAULT 'left' CHECK (portal_logo_position IN ('left', 'center', 'right'));

-- Add comments for documentation
COMMENT ON COLUMN organizations.logo_url IS 'URL to organization logo for branding (stored in Supabase storage)';
COMMENT ON COLUMN organizations.primary_color IS 'Primary brand color in hex format (e.g., #059669)';
COMMENT ON COLUMN organizations.accent_color IS 'Accent/secondary brand color in hex format';
COMMENT ON COLUMN organizations.portal_welcome_title IS 'Custom title shown on vendor portal landing';
COMMENT ON COLUMN organizations.portal_welcome_message IS 'Custom welcome message for vendor portal';
COMMENT ON COLUMN organizations.portal_footer_text IS 'Custom footer text for vendor portal';
COMMENT ON COLUMN organizations.portal_support_email IS 'Support email shown in vendor portal';
COMMENT ON COLUMN organizations.portal_logo_position IS 'Logo alignment in portal header';

-- Create storage bucket for organization logos if it doesn't exist
-- Note: This needs to be done via Supabase dashboard or API, not SQL
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('organization-logos', 'organization-logos', true)
-- ON CONFLICT (id) DO NOTHING;

-- Index for faster queries when loading portal branding
CREATE INDEX IF NOT EXISTS idx_organizations_branding ON organizations (id)
WHERE logo_url IS NOT NULL OR primary_color != '#059669';
