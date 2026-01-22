/**
 * Individual Invitation API
 *
 * PATCH: Resend invitation (regenerates token and extends expiry)
 * DELETE: Revoke invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity/queries';
import { sendEmail, generateTeamInviteEmail } from '@/lib/email';

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

    // Generate new token
    const newToken = crypto.randomUUID();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Update the invitation with new token and expiry
    const { data: updated, error: updateError } = await supabase
      .from('organization_invitations')
      .update({
        token: newToken,
        expires_at: newExpiresAt,
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

    // Get organization name
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', currentUser.organization_id)
      .single();

    // Get inviter's name
    const { data: inviterProfile } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const inviterName = inviterProfile?.full_name || inviterProfile?.email || 'Team Admin';

    // Log activity for invitation resend
    await logActivity(
      'invitation_resent',
      'user',
      inviteId,
      invitation.email,
      { role: invitation.role }
    );

    // Send invitation email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nis2comply.io';
    const { subject, html } = generateTeamInviteEmail({
      email: updated.email,
      organizationName: organization?.name || 'Your Organization',
      role: updated.role,
      inviterName,
      token: newToken,
      baseUrl,
      expiresAt: newExpiresAt,
    });

    const emailResult = await sendEmail({
      to: updated.email,
      subject,
      html,
    });

    if (!emailResult.success && !emailResult.skipped) {
      console.error('Failed to send invitation email:', emailResult.error);
    }

    return NextResponse.json({
      data: {
        ...updated,
        emailSent: emailResult.success || emailResult.skipped,
      },
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

    // Get invitation email before revoking for logging
    const { data: invitationDetails } = await supabase
      .from('organization_invitations')
      .select('email, role')
      .eq('id', inviteId)
      .single();

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

    // Log activity for invitation revocation
    await logActivity(
      'invitation_revoked',
      'user',
      inviteId,
      invitationDetails?.email || 'Unknown',
      { role: invitationDetails?.role }
    );

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
