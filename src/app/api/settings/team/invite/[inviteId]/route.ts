/**
 * Individual Invitation API
 *
 * PATCH: Resend invitation (regenerates token and extends expiry)
 * DELETE: Revoke invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ inviteId: string }>;
}

// PATCH: Resend invitation
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { inviteId } = await context.params;
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

    // Get current user's organization and role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: { message: 'No organization found' } },
        { status: 404 }
      );
    }

    // Check permissions
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('id', inviteId)
      .eq('organization_id', currentUser.organization_id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: { message: 'Invitation not found' } },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: { message: 'Can only resend pending invitations' } },
        { status: 400 }
      );
    }

    // Update the invitation with new token and expiry
    const { data: updated, error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', inviteId)
      .select('id, email, role, expires_at')
      .single();

    if (updateError) {
      console.error('Resend invitation error:', updateError);
      return NextResponse.json(
        { error: { message: 'Failed to resend invitation' } },
        { status: 500 }
      );
    }

    // TODO: Send invitation email via Resend/SendGrid

    return NextResponse.json({
      data: updated,
      message: 'Invitation resent successfully',
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// DELETE: Revoke invitation
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { inviteId } = await context.params;
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

    // Get current user's organization and role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: { message: 'No organization found' } },
        { status: 404 }
      );
    }

    // Check permissions
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Verify invitation belongs to this org
    const { data: invitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select('id, status')
      .eq('id', inviteId)
      .eq('organization_id', currentUser.organization_id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: { message: 'Invitation not found' } },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: { message: 'Can only revoke pending invitations' } },
        { status: 400 }
      );
    }

    // Update status to revoked
    const { error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', inviteId);

    if (updateError) {
      console.error('Revoke invitation error:', updateError);
      return NextResponse.json(
        { error: { message: 'Failed to revoke invitation' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { id: inviteId },
      message: 'Invitation revoked successfully',
    });
  } catch (error) {
    console.error('Revoke invitation error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
