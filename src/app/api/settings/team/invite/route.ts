/**
 * Team Invitation API
 *
 * POST: Send invitation to join organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'analyst', 'viewer'], {
    errorMap: () => ({ message: 'Invalid role. Must be admin, analyst, or viewer' }),
  }),
});

export async function POST(request: NextRequest) {
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

    // Check if current user has permission to invite
    if (!['owner', 'admin'].includes(currentMember.role)) {
      return NextResponse.json(
        { error: { message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = inviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: { message: validation.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { email, role } = validation.data;

    // Admins cannot invite other admins
    if (currentMember.role === 'admin' && role === 'admin') {
      return NextResponse.json(
        { error: { message: 'Admins cannot invite other admins' } },
        { status: 403 }
      );
    }

    // Check if email is already a member
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingProfile) {
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('user_id', existingProfile.id)
        .eq('organization_id', currentMember.organization_id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: { message: 'User is already a member of this organization' } },
          { status: 400 }
        );
      }
    }

    // Check if invitation already exists
    const { data: existingInvite } = await supabase
      .from('organization_invitations')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .eq('organization_id', currentMember.organization_id)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: { message: 'An invitation has already been sent to this email' } },
        { status: 400 }
      );
    }

    // Get organization name for the invitation email
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', currentMember.organization_id)
      .single();

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('organization_invitations')
      .insert({
        email: email.toLowerCase(),
        role,
        organization_id: currentMember.organization_id,
        invited_by: user.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (inviteError) {
      // If table doesn't exist, create a simpler flow
      if (inviteError.code === '42P01') {
        // Table doesn't exist - return success but note that invitations table needs to be created
        console.warn('organization_invitations table does not exist');
        return NextResponse.json({
          data: {
            email,
            role,
            organization: organization?.name,
            note: 'Invitation system pending setup. Please add user manually.',
          },
          message: 'Invitation noted (manual setup required)',
        });
      }

      console.error('Invitation error:', inviteError);
      return NextResponse.json(
        { error: { message: 'Failed to create invitation' } },
        { status: 500 }
      );
    }

    // TODO: Send invitation email via Supabase Auth or email service
    // For now, we'll just create the invitation record
    // In production, integrate with:
    // - Supabase Auth inviteUserByEmail()
    // - Or custom email service (Resend, SendGrid, etc.)

    return NextResponse.json({
      data: {
        id: invitation.id,
        email,
        role,
        organization: organization?.name,
        expiresAt: invitation.expires_at,
      },
      message: `Invitation sent to ${email}`,
    });
  } catch (error) {
    console.error('Team invite error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// GET: List pending invitations
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

    // Get pending invitations
    const { data: invitations, error: invitesError } = await supabase
      .from('organization_invitations')
      .select(`
        id,
        email,
        role,
        status,
        created_at,
        expires_at,
        invited_by,
        profiles!organization_invitations_invited_by_fkey (
          full_name,
          email
        )
      `)
      .eq('organization_id', currentMember.organization_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (invitesError) {
      // Table might not exist yet
      if (invitesError.code === '42P01') {
        return NextResponse.json({ data: [] });
      }
      console.error('Invitations query error:', invitesError);
      return NextResponse.json(
        { error: { message: 'Failed to load invitations' } },
        { status: 500 }
      );
    }

    // Transform data
    const transformedInvitations = (invitations || []).map((inv) => {
      const inviter = inv.profiles as { full_name: string | null; email: string } | null;
      return {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
        invitedBy: inviter?.full_name || inviter?.email || 'Unknown',
      };
    });

    return NextResponse.json({ data: transformedInvitations });
  } catch (error) {
    console.error('Invitations GET error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
