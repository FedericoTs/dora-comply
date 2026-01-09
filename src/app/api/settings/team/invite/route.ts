/**
 * Team Invitation API
 *
 * POST: Create invitation to join organization
 * GET: List pending invitations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const roleValues = ['admin', 'analyst', 'viewer'] as const;
const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(roleValues, {
    message: 'Invalid role. Must be admin, analyst, or viewer',
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

    // Get current user's organization from users table
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

    // Check if current user has permission to invite
    if (!['owner', 'admin'].includes(currentUser.role)) {
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
        { error: { message: validation.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { email, role } = validation.data;
    const normalizedEmail = email.toLowerCase();

    // Admins cannot invite other admins
    if (currentUser.role === 'admin' && role === 'admin') {
      return NextResponse.json(
        { error: { message: 'Admins cannot invite other admins' } },
        { status: 403 }
      );
    }

    // Check if email is already a member in this organization
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('organization_id', currentUser.organization_id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: { message: 'User is already a member of this organization' } },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await supabase
      .from('organization_invitations')
      .select('id, created_at')
      .eq('organization_id', currentUser.organization_id)
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: { message: 'An invitation has already been sent to this email' } },
        { status: 400 }
      );
    }

    // Create the invitation
    const { data: invitation, error: insertError } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: currentUser.organization_id,
        email: normalizedEmail,
        role,
        invited_by: user.id,
      })
      .select('id, email, role, created_at, expires_at')
      .single();

    if (insertError) {
      console.error('Invitation insert error:', insertError);
      return NextResponse.json(
        { error: { message: 'Failed to create invitation' } },
        { status: 500 }
      );
    }

    // Get organization name for the response
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', currentUser.organization_id)
      .single();

    // TODO: Send invitation email via Resend/SendGrid
    // For now, just return success - email integration pending

    return NextResponse.json({
      data: {
        ...invitation,
        organization: organization?.name,
      },
      message: 'Invitation created successfully',
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

    // Get current user's organization from users table
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

    // Get pending invitations with inviter info
    const { data: invitations, error: fetchError } = await supabase
      .from('organization_invitations')
      .select(`
        id,
        email,
        role,
        status,
        created_at,
        expires_at,
        invited_by
      `)
      .eq('organization_id', currentUser.organization_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Invitations fetch error:', fetchError);
      return NextResponse.json(
        { error: { message: 'Failed to fetch invitations' } },
        { status: 500 }
      );
    }

    // Get inviter names
    const inviterIds = [...new Set(invitations?.map((i) => i.invited_by) || [])];
    const { data: inviters } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', inviterIds);

    const inviterMap = new Map(inviters?.map((i) => [i.id, i]) || []);

    // Enrich invitations with inviter info
    const enrichedInvitations = invitations?.map((inv) => {
      const inviter = inviterMap.get(inv.invited_by);
      return {
        ...inv,
        invitedBy: inviter?.full_name || inviter?.email || 'Unknown',
        isExpired: new Date(inv.expires_at) < new Date(),
      };
    });

    return NextResponse.json({ data: enrichedInvitations || [] });
  } catch (error) {
    console.error('Invitations GET error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
