'use server';

/**
 * API Keys Management
 * Server actions for managing API keys for programmatic access
 */

import { createClient } from '@/lib/supabase/server';
import { randomBytes, createHash } from 'crypto';
import { logSecurityEvent, logActivity } from '@/lib/activity/queries';

// ============================================================================
// Types
// ============================================================================

export type ApiKeyScope = 'read' | 'write' | 'admin';

export interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  rateLimitPerMinute: number;
  usageCount: number;
}

export interface CreateApiKeyInput {
  name: string;
  description?: string;
  scopes: ApiKeyScope[];
  expiresAt?: string;
  rateLimitPerMinute?: number;
}

export interface ApiKeyWithSecret extends ApiKey {
  secret: string; // Full API key, only shown once upon creation
}

// ============================================================================
// Generate API Key
// ============================================================================

function generateApiKey(): { key: string; hash: string; prefix: string } {
  // Generate a secure random key
  const randomPart = randomBytes(32).toString('base64url');
  const key = `dk_live_${randomPart}`;

  // Create hash for storage
  const hash = createHash('sha256').update(key).digest('hex');

  // Create prefix for display (first 12 chars after dk_live_)
  const prefix = `dk_live_${randomPart.slice(0, 8)}...`;

  return { key, hash, prefix };
}

// ============================================================================
// List API Keys
// ============================================================================

export async function listApiKeys(): Promise<{
  success: boolean;
  data?: ApiKey[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching API keys:', error);
    return { success: false, error: error.message };
  }

  const keys: ApiKey[] = data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    keyPrefix: row.key_prefix,
    scopes: row.scopes as ApiKeyScope[],
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    rateLimitPerMinute: row.rate_limit_per_minute,
    usageCount: row.usage_count,
  }));

  return { success: true, data: keys };
}

// ============================================================================
// Create API Key
// ============================================================================

export async function createApiKey(
  input: CreateApiKeyInput
): Promise<{
  success: boolean;
  data?: ApiKeyWithSecret;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: 'Organization not found' };
  }

  // Check if user has admin permissions
  if (!['owner', 'admin'].includes(userData.role)) {
    return { success: false, error: 'Insufficient permissions. Admin or Owner role required.' };
  }

  // Generate the API key
  const { key, hash, prefix } = generateApiKey();

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      organization_id: userData.organization_id,
      name: input.name,
      description: input.description || null,
      key_hash: hash,
      key_prefix: prefix,
      scopes: input.scopes,
      created_by: user.id,
      expires_at: input.expiresAt || null,
      rate_limit_per_minute: input.rateLimitPerMinute || 60,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating API key:', error);
    return { success: false, error: error.message };
  }

  // Log security event for API key creation
  await logSecurityEvent('api_key_created', {
    keyId: data.id,
    keyName: data.name,
    scopes: data.scopes,
    expiresAt: data.expires_at,
  });

  return {
    success: true,
    data: {
      id: data.id,
      name: data.name,
      description: data.description,
      keyPrefix: data.key_prefix,
      scopes: data.scopes as ApiKeyScope[],
      createdAt: data.created_at,
      lastUsedAt: data.last_used_at,
      expiresAt: data.expires_at,
      isActive: data.is_active,
      rateLimitPerMinute: data.rate_limit_per_minute,
      usageCount: data.usage_count,
      secret: key, // Only returned once!
    },
  };
}

// ============================================================================
// Revoke API Key
// ============================================================================

export async function revokeApiKey(
  keyId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId);

  if (error) {
    console.error('Error revoking API key:', error);
    return { success: false, error: error.message };
  }

  // Log security event for API key revocation
  await logSecurityEvent('api_key_revoked', {
    keyId,
    action: 'revoked',
  });

  return { success: true };
}

// ============================================================================
// Delete API Key
// ============================================================================

export async function deleteApiKey(
  keyId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId);

  if (error) {
    console.error('Error deleting API key:', error);
    return { success: false, error: error.message };
  }

  // Log activity for API key deletion
  await logActivity('api_key_deleted', 'auth', keyId, 'API Key');

  return { success: true };
}

// ============================================================================
// Update API Key
// ============================================================================

export async function updateApiKey(
  keyId: string,
  updates: {
    name?: string;
    description?: string;
    scopes?: ApiKeyScope[];
    isActive?: boolean;
    rateLimitPerMinute?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.scopes !== undefined) updateData.scopes = updates.scopes;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  if (updates.rateLimitPerMinute !== undefined) updateData.rate_limit_per_minute = updates.rateLimitPerMinute;

  const { error } = await supabase
    .from('api_keys')
    .update(updateData)
    .eq('id', keyId);

  if (error) {
    console.error('Error updating API key:', error);
    return { success: false, error: error.message };
  }

  // Log activity for API key update
  await logActivity('api_key_updated', 'auth', keyId, updates.name || 'API Key', {
    updatedFields: Object.keys(updateData),
  });

  return { success: true };
}
