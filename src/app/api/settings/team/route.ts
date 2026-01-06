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

    // Get user's organization membership
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

    // Get all members of the organization
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select(`
        user_id,
        role,
        created_at,
        profiles!inner (
          id,
          email,
          full_name,
          avatar_url,
          updated_at
        )
      `)
      .eq('organization_id', currentMember.organization_id)
      .order('created_at', { ascending: true });

    if (membersError) {
      console.error('Members query error:', membersError);
      return NextResponse.json(
        { error: { message: 'Failed to load team members' } },
        { status: 500 }
      );
    }

    // Transform data
    const teamMembers = (members || []).map((m) => {
      const profile = m.profiles as { id: string; email: string; full_name: string | null; avatar_url: string | null; updated_at: string } | null;
      return {
        id: m.user_id,
        email: profile?.email || '',
        fullName: profile?.full_name,
        avatarUrl: profile?.avatar_url,
        role: m.role,
        joinedAt: m.created_at,
        lastActiveAt: profile?.updated_at,
        isCurrent: m.user_id === user.id,
      };
    });

    return NextResponse.json({ data: teamMembers });
  } catch (error) {
    console.error('Team GET error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
