'use server';

/**
 * Organization Branding Server Actions
 * Manages branding settings for vendor portal customization
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization } from '@/lib/auth/organization';
import {
  type OrganizationBranding,
  type BrandingFormData,
  DEFAULT_BRANDING,
  brandingSchema,
} from './branding-types';

// ============================================================================
// Get Branding
// ============================================================================

export async function getOrganizationBranding(): Promise<{
  success: boolean;
  data?: OrganizationBranding;
  error?: string;
}> {
  try {
    const organizationId = await getCurrentUserOrganization();
    if (!organizationId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        logo_url,
        primary_color,
        accent_color,
        portal_welcome_title,
        portal_welcome_message,
        portal_footer_text,
        portal_support_email,
        portal_logo_position
      `)
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching branding:', error);
      return { success: false, error: 'Failed to load branding settings' };
    }

    const branding: OrganizationBranding = {
      logoUrl: data.logo_url || null,
      primaryColor: data.primary_color || DEFAULT_BRANDING.primaryColor,
      accentColor: data.accent_color || DEFAULT_BRANDING.accentColor,
      portalWelcomeTitle: data.portal_welcome_title || DEFAULT_BRANDING.portalWelcomeTitle,
      portalWelcomeMessage: data.portal_welcome_message || DEFAULT_BRANDING.portalWelcomeMessage,
      portalFooterText: data.portal_footer_text || null,
      portalSupportEmail: data.portal_support_email || null,
      portalLogoPosition: data.portal_logo_position || DEFAULT_BRANDING.portalLogoPosition,
    };

    return { success: true, data: branding };
  } catch (error) {
    console.error('Error in getOrganizationBranding:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Update Branding
// ============================================================================

export async function updateOrganizationBranding(
  formData: BrandingFormData
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const organizationId = await getCurrentUserOrganization();
    if (!organizationId) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate input
    const parsed = brandingSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('organizations')
      .update({
        primary_color: parsed.data.primaryColor,
        accent_color: parsed.data.accentColor,
        portal_welcome_title: parsed.data.portalWelcomeTitle,
        portal_welcome_message: parsed.data.portalWelcomeMessage,
        portal_footer_text: parsed.data.portalFooterText || null,
        portal_support_email: parsed.data.portalSupportEmail || null,
        portal_logo_position: parsed.data.portalLogoPosition,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (error) {
      console.error('Error updating branding:', error);
      return { success: false, error: 'Failed to update branding settings' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateOrganizationBranding:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Upload Logo
// ============================================================================

export async function uploadOrganizationLogo(
  formData: FormData
): Promise<{
  success: boolean;
  logoUrl?: string;
  error?: string;
}> {
  try {
    const organizationId = await getCurrentUserOrganization();
    if (!organizationId) {
      return { success: false, error: 'Not authenticated' };
    }

    const file = formData.get('logo') as File | null;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Use PNG, JPEG, SVG, or WebP.' };
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size is 2MB.' };
    }

    const supabase = await createClient();

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${organizationId}/logo-${Date.now()}.${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: 'Failed to upload logo' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('organization-logos')
      .getPublicUrl(filename);

    const logoUrl = urlData.publicUrl;

    // Update organization with logo URL
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error updating logo URL:', updateError);
      return { success: false, error: 'Failed to save logo reference' };
    }

    return { success: true, logoUrl };
  } catch (error) {
    console.error('Error in uploadOrganizationLogo:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Delete Logo
// ============================================================================

export async function deleteOrganizationLogo(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const organizationId = await getCurrentUserOrganization();
    if (!organizationId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Get current logo URL to delete from storage
    const { data: org } = await supabase
      .from('organizations')
      .select('logo_url')
      .eq('id', organizationId)
      .single();

    if (org?.logo_url) {
      // Extract path from URL
      const url = new URL(org.logo_url);
      const pathParts = url.pathname.split('/');
      const storagePath = pathParts.slice(pathParts.indexOf('organization-logos') + 1).join('/');

      if (storagePath) {
        await supabase.storage
          .from('organization-logos')
          .remove([storagePath]);
      }
    }

    // Clear logo URL in organization
    const { error } = await supabase
      .from('organizations')
      .update({
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (error) {
      console.error('Error clearing logo URL:', error);
      return { success: false, error: 'Failed to remove logo' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteOrganizationLogo:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Get Branding by Organization ID (for vendor portal - no auth required)
// ============================================================================

export async function getPublicOrganizationBranding(
  organizationId: string
): Promise<{
  success: boolean;
  data?: OrganizationBranding & { organizationName: string };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        name,
        logo_url,
        primary_color,
        accent_color,
        portal_welcome_title,
        portal_welcome_message,
        portal_footer_text,
        portal_support_email,
        portal_logo_position
      `)
      .eq('id', organizationId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Organization not found' };
    }

    const branding = {
      organizationName: data.name,
      logoUrl: data.logo_url || null,
      primaryColor: data.primary_color || DEFAULT_BRANDING.primaryColor,
      accentColor: data.accent_color || DEFAULT_BRANDING.accentColor,
      portalWelcomeTitle: data.portal_welcome_title || DEFAULT_BRANDING.portalWelcomeTitle,
      portalWelcomeMessage: data.portal_welcome_message || DEFAULT_BRANDING.portalWelcomeMessage,
      portalFooterText: data.portal_footer_text || null,
      portalSupportEmail: data.portal_support_email || null,
      portalLogoPosition: data.portal_logo_position || DEFAULT_BRANDING.portalLogoPosition,
    };

    return { success: true, data: branding };
  } catch (error) {
    console.error('Error in getPublicOrganizationBranding:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Get Branding by Questionnaire Token (for vendor portal)
// ============================================================================

export async function getBrandingByQuestionnaireToken(
  token: string
): Promise<{
  success: boolean;
  data?: OrganizationBranding & { organizationName: string };
  error?: string;
}> {
  try {
    // Import service role client for public access
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
    const supabase = createServiceRoleClient();

    // First get the organization_id from the questionnaire
    const { data: questionnaire, error: qError } = await supabase
      .from('nis2_vendor_questionnaires')
      .select('organization_id')
      .eq('access_token', token)
      .single();

    if (qError || !questionnaire?.organization_id) {
      return { success: false, error: 'Invalid questionnaire token' };
    }

    // Now fetch the organization branding
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        name,
        logo_url,
        primary_color,
        accent_color,
        portal_welcome_title,
        portal_welcome_message,
        portal_footer_text,
        portal_support_email,
        portal_logo_position
      `)
      .eq('id', questionnaire.organization_id)
      .single();

    if (error || !data) {
      return { success: false, error: 'Organization not found' };
    }

    const branding = {
      organizationName: data.name,
      logoUrl: data.logo_url || null,
      primaryColor: data.primary_color || DEFAULT_BRANDING.primaryColor,
      accentColor: data.accent_color || DEFAULT_BRANDING.accentColor,
      portalWelcomeTitle: data.portal_welcome_title || DEFAULT_BRANDING.portalWelcomeTitle,
      portalWelcomeMessage: data.portal_welcome_message || DEFAULT_BRANDING.portalWelcomeMessage,
      portalFooterText: data.portal_footer_text || null,
      portalSupportEmail: data.portal_support_email || null,
      portalLogoPosition: data.portal_logo_position || DEFAULT_BRANDING.portalLogoPosition,
    };

    return { success: true, data: branding };
  } catch (error) {
    console.error('Error in getBrandingByQuestionnaireToken:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
