/**
 * Organization Utilities
 * Server-side helpers for organization context in multi-tenant operations
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface UserContext {
  userId: string;
  organizationId: string;
  email: string;
  role?: string;
}

export interface OrganizationContext {
  organizationId: string;
  organizationName?: string;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Gets the current authenticated user's organization ID
 * This is the primary function used across all server actions for multi-tenant isolation
 *
 * @returns Organization ID or null if not authenticated
 */
export async function getCurrentUserOrganization(): Promise<string | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  return userData?.organization_id || null;
}

/**
 * Gets the current authenticated user's ID
 *
 * @returns User ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Gets full user context including organization
 * Useful when you need both user ID and organization ID
 *
 * @returns UserContext object or null if not authenticated
 */
export async function getCurrentUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) return null;

  return {
    userId: user.id,
    organizationId: userData.organization_id,
    email: user.email,
    role: userData.role,
  };
}

/**
 * Gets organization context with name
 * Useful for display purposes
 *
 * @returns OrganizationContext or null if not authenticated
 */
export async function getCurrentOrganizationContext(): Promise<OrganizationContext | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) return null;

  // Fetch organization name separately for type safety
  const { data: orgData } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', userData.organization_id)
    .single();

  return {
    organizationId: userData.organization_id,
    organizationName: orgData?.name,
  };
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates that user is authenticated and has an organization
 * Throws an error if not - useful for protecting server actions
 *
 * @throws Error if not authenticated
 * @returns Organization ID (guaranteed non-null)
 */
export async function requireOrganization(): Promise<string> {
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    throw new Error('Authentication required');
  }
  return organizationId;
}

/**
 * Validates that user is authenticated and returns full context
 * Throws an error if not - useful for protected server actions
 *
 * @throws Error if not authenticated
 * @returns UserContext (guaranteed non-null)
 */
export async function requireUserContext(): Promise<UserContext> {
  const context = await getCurrentUserContext();
  if (!context) {
    throw new Error('Authentication required');
  }
  return context;
}
