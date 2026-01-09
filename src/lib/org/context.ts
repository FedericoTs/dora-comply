/**
 * Organization Context Helper
 *
 * Server-side utilities for fetching organization data
 * and computing entity classification for the current user.
 */

import { createClient } from '@/lib/supabase/server';
import type { Organization, EntityType } from '@/lib/auth/types';
import {
  classifyEntity,
  type EntityClassification,
} from '@/lib/compliance/entity-classification';

// ============================================================================
// Types
// ============================================================================

export interface OrganizationContext {
  organization: Organization;
  classification: EntityClassification;
}

// ============================================================================
// Fetch Organization
// ============================================================================

/**
 * Get the current user's organization from the database
 */
export async function getOrganization(): Promise<Organization | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's organization_id
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    return null;
  }

  // Get organization details
  const { data: orgData, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', userData.organization_id)
    .single();

  if (error || !orgData) {
    console.error('Error fetching organization:', error);
    return null;
  }

  // Map snake_case database fields to camelCase interface
  return {
    id: orgData.id,
    name: orgData.name,
    lei: orgData.lei,
    entityType: orgData.entity_type as EntityType,
    jurisdiction: orgData.jurisdiction,
    dataRegion: orgData.data_region as 'eu' | 'us',
    settings: orgData.settings || {
      mfaRequired: false,
      sessionTimeoutMinutes: 60,
      allowedDomains: [],
      defaultRole: 'analyst',
    },
    isSignificant: orgData.is_significant ?? false,
    significanceRationale: orgData.significance_rationale,
    simplifiedFrameworkEligible: orgData.simplified_framework_eligible ?? false,
    totalAssetsEur: orgData.total_assets_eur,
    annualGrossPremiumEur: orgData.annual_gross_premium_eur,
    employeeCount: orgData.employee_count,
    createdAt: orgData.created_at,
    updatedAt: orgData.updated_at,
  };
}

/**
 * Get organization context with classification for the current user
 */
export async function getOrganizationContext(): Promise<OrganizationContext | null> {
  const organization = await getOrganization();

  if (!organization) {
    return null;
  }

  const classification = classifyEntity(organization);

  return {
    organization,
    classification,
  };
}

/**
 * Update organization entity classification settings
 */
export async function updateOrganizationClassification(params: {
  isSignificant: boolean;
  significanceRationale?: string;
  simplifiedFrameworkEligible: boolean;
  totalAssetsEur?: number | null;
  annualGrossPremiumEur?: number | null;
  employeeCount?: number | null;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get user's organization_id
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: 'No organization found' };
  }

  // Update organization
  const { error } = await supabase
    .from('organizations')
    .update({
      is_significant: params.isSignificant,
      significance_rationale: params.significanceRationale || null,
      simplified_framework_eligible: params.simplifiedFrameworkEligible,
      total_assets_eur: params.totalAssetsEur ?? null,
      annual_gross_premium_eur: params.annualGrossPremiumEur ?? null,
      employee_count: params.employeeCount ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userData.organization_id);

  if (error) {
    console.error('Error updating organization classification:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
