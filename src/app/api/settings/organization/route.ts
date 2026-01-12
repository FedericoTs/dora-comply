/**
 * Organization Settings API
 *
 * GET: Retrieve current organization settings
 * PATCH: Update organization settings
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  parseAndSanitizeBody,
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  badRequestResponse,
  internalErrorResponse,
  sanitizeLei,
} from '@/lib/api';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse();
    }

    // Get user's organization membership from users table
    const { data: member, error: memberError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (memberError || !member) {
      return notFoundResponse('No organization found');
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', member.organization_id)
      .single();

    if (orgError || !organization) {
      return notFoundResponse('Organization not found');
    }

    return successResponse({
      id: organization.id,
      name: organization.name,
      lei: organization.lei,
      entity_type: organization.entity_type,
      jurisdiction: organization.jurisdiction,
      data_region: organization.data_region,
      settings: organization.settings,
      created_at: organization.created_at,
      updated_at: organization.updated_at,
    });
  } catch (error) {
    console.error('Organization GET error:', error);
    return internalErrorResponse();
  }
}

// Schema for organization update - sanitization is handled by parseAndSanitizeBody
const updateOrgSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  lei: z.string().max(20).optional().nullable(),
  entity_type: z.string().max(100).optional().nullable(),
  jurisdiction: z.string().max(100).optional().nullable(),
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse();
    }

    // Get user's organization membership from users table
    const { data: member, error: memberError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (memberError || !member) {
      return notFoundResponse('No organization found');
    }

    // Check if user has permission to update organization
    if (!['owner', 'admin'].includes(member.role)) {
      return forbiddenResponse('Insufficient permissions');
    }

    // Parse and sanitize request body
    const parsed = await parseAndSanitizeBody(request, updateOrgSchema);

    if (!parsed.success) {
      return badRequestResponse(parsed.error.message, parsed.error.details);
    }

    const { name, lei, entity_type, jurisdiction } = parsed.data;

    // Build update object with additional field-specific sanitization
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (lei !== undefined) {
      // Apply LEI-specific sanitization (uppercase, alphanumeric only)
      updates.lei = lei ? sanitizeLei(lei) : null;
    }
    if (entity_type !== undefined) updates.entity_type = entity_type;
    if (jurisdiction !== undefined) updates.jurisdiction = jurisdiction;

    // Update organization
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', member.organization_id)
      .select()
      .single();

    if (updateError) {
      console.error('Organization update error:', updateError);
      return internalErrorResponse('Failed to update organization');
    }

    return successResponse({
      id: organization.id,
      name: organization.name,
      lei: organization.lei,
      entity_type: organization.entity_type,
      jurisdiction: organization.jurisdiction,
      data_region: organization.data_region,
      settings: organization.settings,
      created_at: organization.created_at,
      updated_at: organization.updated_at,
    });
  } catch (error) {
    console.error('Organization PATCH error:', error);
    return internalErrorResponse();
  }
}
