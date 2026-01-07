/**
 * Team Invitation API
 *
 * POST: Send invitation to join organization
 * GET: List pending invitations
 *
 * Note: This is a placeholder implementation. The organization_invitations table
 * doesn't exist yet. Full invitation workflow would require:
 * 1. Creating organization_invitations table
 * 2. Email service integration (Resend, SendGrid, etc.)
 * 3. Invitation acceptance flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const roleValues = ['admin', 'member', 'viewer'] as const;
const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(roleValues, {
    message: 'Invalid role. Must be admin, member, or viewer',
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
      .eq('email', email.toLowerCase())
      .eq('organization_id', currentUser.organization_id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: { message: 'User is already a member of this organization' } },
        { status: 400 }
      );
    }

    // Get organization name for the response
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', currentUser.organization_id)
      .single();

    // Note: Full invitation system requires organization_invitations table
    // For now, return a placeholder response indicating manual setup is needed
    return NextResponse.json({
      data: {
        email,
        role,
        organization: organization?.name,
        note: 'Invitation system pending setup. Please add user manually via Supabase dashboard.',
      },
      message: 'Invitation noted (manual setup required)',
    });
  } catch (error) {
    console.error('Team invite error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// GET: List pending invitations (placeholder - returns empty for now)
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

    // Note: Full invitation system requires organization_invitations table
    // Return empty list for now
    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error('Invitations GET error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
