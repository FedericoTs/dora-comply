/**
 * Organization Settings API
 *
 * GET: Retrieve current organization settings
 * PATCH: Update organization settings
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Get user's organization membership from users table
    const { data: member, error: memberError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: { message: 'No organization found' } },
        { status: 404 }
      );
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', member.organization_id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: { message: 'Organization not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: organization.id,
        name: organization.name,
        lei: organization.lei,
        entity_type: organization.entity_type,
        jurisdiction: organization.jurisdiction,
        data_region: organization.data_region,
        settings: organization.settings,
        created_at: organization.created_at,
        updated_at: organization.updated_at,
      },
    });
  } catch (error) {
    console.error('Organization GET error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Get user's organization membership from users table
    const { data: member, error: memberError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: { message: 'No organization found' } },
        { status: 404 }
      );
    }

    // Check if user has permission to update organization
    if (!['owner', 'admin'].includes(member.role)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, lei, entity_type, jurisdiction } = body;

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (lei !== undefined) updates.lei = lei;
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
      return NextResponse.json(
        { error: { message: 'Failed to update organization' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: organization.id,
        name: organization.name,
        lei: organization.lei,
        entity_type: organization.entity_type,
        jurisdiction: organization.jurisdiction,
        data_region: organization.data_region,
        settings: organization.settings,
        created_at: organization.created_at,
        updated_at: organization.updated_at,
      },
    });
  } catch (error) {
    console.error('Organization PATCH error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
