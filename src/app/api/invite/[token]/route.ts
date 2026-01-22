/**
 * Invitation Validation API
 *
 * GET /api/invite/[token] - Validate invitation token and return details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const supabase = await createClient();

    // Get the invitation by token
    const { data: invitation, error: fetchError } = await supabase
      .from('organization_invitations')
      .select(`
        id,
        email,
        role,
        status,
        expires_at,
        organization_id,
        invited_by
      `)
      .eq('token', token)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: { message: 'Invitation not found' } },
        { status: 404 }
      );
    }

    // Check if expired
    const isExpired = new Date(invitation.expires_at) < new Date();
    if (isExpired && invitation.status === 'pending') {
      // Update status to expired
      await supabase
        .from('organization_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
    }

    // Get organization name
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', invitation.organization_id)
      .single();

    // Get inviter name
    const { data: inviter } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', invitation.invited_by)
      .single();

    // Check if current user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const effectiveStatus = isExpired ? 'expired' : invitation.status;

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        organizationName: organization?.name || 'Unknown Organization',
        inviterName: inviter?.full_name || inviter?.email || 'Team Admin',
        expiresAt: invitation.expires_at,
        status: effectiveStatus,
      },
      isLoggedIn: !!user,
    });
  } catch (error) {
    console.error('Invitation validation error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to validate invitation' } },
      { status: 500 }
    );
  }
}
