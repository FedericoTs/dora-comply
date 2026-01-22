/**
 * Accept Invitation API
 *
 * POST /api/invite/[token]/accept - Accept the invitation and join organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity/queries';

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { message: 'You must be logged in to accept this invitation' } },
        { status: 401 }
      );
    }

    // Get the invitation by token
    const { data: invitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: { message: 'Invitation not found' } },
        { status: 404 }
      );
    }

    // Verify invitation is still valid
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: { message: `Invitation has already been ${invitation.status}` } },
        { status: 400 }
      );
    }

    const isExpired = new Date(invitation.expires_at) < new Date();
    if (isExpired) {
      // Update status to expired
      await supabase
        .from('organization_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: { message: 'This invitation has expired' } },
        { status: 400 }
      );
    }

    // Verify email matches (case-insensitive)
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: {
            message: `This invitation was sent to ${invitation.email}. Please sign in with that email address.`,
          },
        },
        { status: 403 }
      );
    }

    // Check if user is already a member of this organization
    const { data: existingMember } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .eq('organization_id', invitation.organization_id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: { message: 'You are already a member of this organization' } },
        { status: 400 }
      );
    }

    // Check if user exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('id', user.id)
      .single();

    if (existingUser) {
      // User exists - update their organization
      const { error: updateError } = await supabase
        .from('users')
        .update({
          organization_id: invitation.organization_id,
          role: invitation.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('User update error:', updateError);
        return NextResponse.json(
          { error: { message: 'Failed to join organization' } },
          { status: 500 }
        );
      }
    } else {
      // Create user record
      const { error: insertError } = await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Team Member',
        organization_id: invitation.organization_id,
        role: invitation.role,
      });

      if (insertError) {
        console.error('User insert error:', insertError);
        return NextResponse.json(
          { error: { message: 'Failed to create user record' } },
          { status: 500 }
        );
      }
    }

    // Mark invitation as accepted
    const { error: acceptError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (acceptError) {
      console.error('Invitation accept error:', acceptError);
      return NextResponse.json(
        { error: { message: 'Failed to accept invitation' } },
        { status: 500 }
      );
    }

    // Get organization name for activity log
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', invitation.organization_id)
      .single();

    // Log activity
    await logActivity(
      'invitation_accepted',
      'user',
      user.id,
      user.email || 'Unknown',
      {
        role: invitation.role,
        organizationName: organization?.name,
      }
    );

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      organizationId: invitation.organization_id,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to accept invitation' } },
      { status: 500 }
    );
  }
}
