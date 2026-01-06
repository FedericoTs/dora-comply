/**
 * Team Member Management API
 *
 * PATCH: Update member role
 * DELETE: Remove member from organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Valid roles aligned with DORA compliance responsibilities
const VALID_ROLES = ['admin', 'analyst', 'viewer'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
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

    // Get current user's organization membership
    const { data: currentMember, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !currentMember) {
      return NextResponse.json(
        { error: { message: 'No organization found' } },
        { status: 404 }
      );
    }

    // Check if current user has permission to update roles
    if (!['owner', 'admin'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Get target member
    const { data: targetMember, error: targetError } = await supabase
      .from('organization_members')
      .select('user_id, role, organization_id')
      .eq('user_id', memberId)
      .eq('organization_id', currentMember.organization_id)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: { message: 'Member not found' } },
        { status: 404 }
      );
    }

    // Cannot modify owner role
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: { message: 'Cannot modify owner role' } },
        { status: 403 }
      );
    }

    // Cannot modify your own role
    if (targetMember.user_id === user.id) {
      return NextResponse.json(
        { error: { message: 'Cannot modify your own role' } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { role } = body;

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: { message: 'Invalid role. Must be admin, analyst, or viewer' } },
        { status: 400 }
      );
    }

    // Update member role
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', memberId)
      .eq('organization_id', currentMember.organization_id);

    if (updateError) {
      console.error('Role update error:', updateError);
      return NextResponse.json(
        { error: { message: 'Failed to update role' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { memberId, role },
      message: 'Role updated successfully',
    });
  } catch (error) {
    console.error('Team PATCH error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
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

    // Get current user's organization membership
    const { data: currentMember, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !currentMember) {
      return NextResponse.json(
        { error: { message: 'No organization found' } },
        { status: 404 }
      );
    }

    // Check if current user has permission to remove members
    if (!['owner', 'admin'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Get target member
    const { data: targetMember, error: targetError } = await supabase
      .from('organization_members')
      .select('user_id, role, organization_id')
      .eq('user_id', memberId)
      .eq('organization_id', currentMember.organization_id)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: { message: 'Member not found' } },
        { status: 404 }
      );
    }

    // Cannot remove owner
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: { message: 'Cannot remove organization owner' } },
        { status: 403 }
      );
    }

    // Cannot remove yourself
    if (targetMember.user_id === user.id) {
      return NextResponse.json(
        { error: { message: 'Cannot remove yourself' } },
        { status: 403 }
      );
    }

    // Admins can only remove analysts and viewers, not other admins
    if (currentMember.role === 'admin' && targetMember.role === 'admin') {
      return NextResponse.json(
        { error: { message: 'Admins cannot remove other admins' } },
        { status: 403 }
      );
    }

    // Delete member from organization
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('user_id', memberId)
      .eq('organization_id', currentMember.organization_id);

    if (deleteError) {
      console.error('Member delete error:', deleteError);
      return NextResponse.json(
        { error: { message: 'Failed to remove member' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { memberId },
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Team DELETE error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
