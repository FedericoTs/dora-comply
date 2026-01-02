/**
 * Vendor Certifications Queries
 *
 * Server-side queries for managing certifications
 */

import { createClient } from '@/lib/supabase/server';
import type {
  VendorCertification,
  CreateCertificationInput,
  UpdateCertificationInput,
} from './types';

/**
 * Get all certifications for a vendor
 */
export async function getVendorCertifications(
  vendorId: string
): Promise<{ data: VendorCertification[]; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('vendor_certifications')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('standard', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('[Certifications] Error fetching:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch certifications',
    };
  }
}

/**
 * Get a single certification by ID
 */
export async function getCertification(
  certificationId: string
): Promise<{ data: VendorCertification | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('vendor_certifications')
      .select('*')
      .eq('id', certificationId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('[Certifications] Error fetching:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch certification',
    };
  }
}

/**
 * Create a new certification
 */
export async function createCertification(
  input: CreateCertificationInput
): Promise<{ data: VendorCertification | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Get current user and organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) throw new Error('No organization found');

    const { data, error } = await supabase
      .from('vendor_certifications')
      .insert({
        ...input,
        organization_id: profile.organization_id,
        created_by: user.id,
        status: input.status || 'valid',
        verified: input.verified || false,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('[Certifications] Error creating:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create certification',
    };
  }
}

/**
 * Update an existing certification
 */
export async function updateCertification(
  certificationId: string,
  input: UpdateCertificationInput
): Promise<{ data: VendorCertification | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('vendor_certifications')
      .update(input)
      .eq('id', certificationId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('[Certifications] Error updating:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update certification',
    };
  }
}

/**
 * Delete a certification
 */
export async function deleteCertification(
  certificationId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('vendor_certifications')
      .delete()
      .eq('id', certificationId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('[Certifications] Error deleting:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to delete certification',
    };
  }
}

/**
 * Verify a certification
 */
export async function verifyCertification(
  certificationId: string,
  verificationMethod: string,
  notes?: string
): Promise<{ data: VendorCertification | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('vendor_certifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
        verification_method: verificationMethod,
        verification_notes: notes,
      })
      .eq('id', certificationId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('[Certifications] Error verifying:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to verify certification',
    };
  }
}

/**
 * Get expiring certifications across all vendors
 */
export async function getExpiringCertifications(
  daysThreshold = 30
): Promise<{ data: VendorCertification[]; error: string | null }> {
  try {
    const supabase = await createClient();

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from('vendor_certifications')
      .select('*')
      .eq('status', 'valid')
      .not('valid_until', 'is', null)
      .lte('valid_until', thresholdDate.toISOString().split('T')[0])
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .order('valid_until', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('[Certifications] Error fetching expiring:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch expiring certifications',
    };
  }
}

/**
 * Get certification statistics for dashboard
 */
export async function getCertificationStats(): Promise<{
  data: {
    total: number;
    valid: number;
    expiringSoon: number;
    expired: number;
    byStandard: Record<string, number>;
  } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data: certs, error } = await supabase
      .from('vendor_certifications')
      .select('*');

    if (error) throw error;

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const stats = {
      total: certs?.length || 0,
      valid: 0,
      expiringSoon: 0,
      expired: 0,
      byStandard: {} as Record<string, number>,
    };

    for (const cert of certs || []) {
      // Count by status
      if (cert.status === 'valid') {
        if (cert.valid_until) {
          const expiryDate = new Date(cert.valid_until);
          if (expiryDate < today) {
            stats.expired++;
          } else if (expiryDate <= thirtyDaysFromNow) {
            stats.expiringSoon++;
            stats.valid++;
          } else {
            stats.valid++;
          }
        } else {
          stats.valid++;
        }
      } else if (cert.status === 'expired') {
        stats.expired++;
      }

      // Count by standard
      const standard = cert.standard;
      stats.byStandard[standard] = (stats.byStandard[standard] || 0) + 1;
    }

    return { data: stats, error: null };
  } catch (error) {
    console.error('[Certifications] Error fetching stats:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch certification stats',
    };
  }
}
