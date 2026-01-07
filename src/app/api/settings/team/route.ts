/**
 * Team Members API
 *
 * GET: List all team members in the organization
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

    // Get all members of the organization from users table
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, role, created_at, updated_at')
      .eq('organization_id', currentUser.organization_id)
      .order('created_at', { ascending: true });

    if (membersError) {
      console.error('Members query error:', membersError);
      return NextResponse.json(
        { error: { message: 'Failed to load team members' } },
        { status: 500 }
      );
    }

    // Transform data
    const teamMembers = (members || []).map((m) => ({
      id: m.id,
      email: m.email || '',
      fullName: m.full_name,
      avatarUrl: m.avatar_url,
      role: m.role,
      joinedAt: m.created_at,
      lastActiveAt: m.updated_at,
      isCurrent: m.id === user.id,
    }));

    return NextResponse.json({ data: teamMembers });
  } catch (error) {
    console.error('Team GET error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
