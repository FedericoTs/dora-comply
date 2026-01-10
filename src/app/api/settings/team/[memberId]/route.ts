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

    // Get current user's organization from users table
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: { message: 'No organization found' } },
        { status: 404 }
      );
    }

    // Check if current user has permission to update roles
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Get target member from users table
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, role, organization_id')
      .eq('id', memberId)
      .eq('organization_id', currentUser.organization_id)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: { message: 'Member not found' } },
        { status: 404 }
      );
    }

    // Cannot modify owner role
    if (targetUser.role === 'owner') {
      return NextResponse.json(
        { error: { message: 'Cannot modify owner role' } },
        { status: 403 }
      );
    }

    // Cannot modify your own role
    if (targetUser.id === user.id) {
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

    // Update member role in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('organization_id', currentUser.organization_id);

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

    // Get current user's organization from users table
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: { message: 'No organization found' } },
        { status: 404 }
      );
    }

    // Check if current user has permission to remove members
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Get target member from users table
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, role, organization_id')
      .eq('id', memberId)
      .eq('organization_id', currentUser.organization_id)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: { message: 'Member not found' } },
        { status: 404 }
      );
    }

    // Cannot remove owner
    if (targetUser.role === 'owner') {
      return NextResponse.json(
        { error: { message: 'Cannot remove organization owner' } },
        { status: 403 }
      );
    }

    // Cannot remove yourself
    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: { message: 'Cannot remove yourself' } },
        { status: 403 }
      );
    }

    // Admins can only remove members and viewers, not other admins
    if (currentUser.role === 'admin' && targetUser.role === 'admin') {
      return NextResponse.json(
        { error: { message: 'Admins cannot remove other admins' } },
        { status: 403 }
      );
    }

    // Delete member from users table (this removes them from the organization)
    // Note: In production, you might want to soft delete or move to a different organization
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', currentUser.organization_id);

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
